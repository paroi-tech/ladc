import { AConnection, AExecResult, APreparedStatement } from "ladc"
import { Client, ClientConfig, QueryResult } from "pg"
const Cursor = require("pg-cursor")
import { LadcPgOptions } from "./exported-definitions"
import { promisifyCursor } from "./promisifyCursor"

export async function createPgConnection(config: string | ClientConfig): Promise<Client> {
  const client = new Client(config)
  client.connect()
  return client
}

const insertRegexp = /^\s*insert\s+into\s+([^\s\(]+)\s*(?:\([^)]+\))?\s*values\s*\([\s\S]*\)\s*$/i

function addReturningToInsert(sql: string, options: LadcPgOptions) {
  const matches = insertRegexp.exec(sql)
  if (!matches)
    return { sql }
  const insertTable = matches[1]
  const idColumnName = options.autoincMapping && options.autoincMapping[insertTable]
  if (idColumnName)
    sql = `${sql} returning ${idColumnName}`
  return { sql, insertTable, idColumnName }
}

export function toAConnection(client: Client, options: LadcPgOptions): AConnection {
  return {
    prepare: async (sql: string) => makeAPreparedStatement(options, client, sql),
    exec: async (sql: string, params?: unknown[]) => {
      const { sql: text, insertTable, idColumnName } = addReturningToInsert(sql, options)
      return toAExecResult(
        await client.query({
          text,
          values: params
        }),
        insertTable,
        idColumnName
      )
    },
    all: async (sql: string, params?: unknown[]) => toRows(await client.query({
      text: sql,
      values: params
    })),
    cursor: async (sql: string, params?: unknown[]) => createACursor({ client, sql, params }),
    script: async (sql: string) => {
      await client.query(sql)
    },
    close: async () => {
      await client.end()
    }
  }
}

function toRows(result: QueryResult): any[] {
  return result.rows
}

function toAExecResult(result: QueryResult, insertTable?: string, optIdCol?: string): AExecResult {
  return {
    affectedRows: result.rowCount,
    getInsertedId: (options?: { columnName?: string }) => {
      if (result.rows.length !== 1) {
        if (result.rows.length === 0)
          throw new Error(`Cannot get the inserted ID, please append 'returning your_column_id' to your query`)
        throw new Error(`Cannot get the inserted ID, there must be one result row (${result.rows.length})`)
      }
      const idColumnName = options && options.columnName
      const row = result.rows[0]
      let col: string | undefined
      if (idColumnName) {
        if (!row.hasOwnProperty(idColumnName))
          throw new Error(`Cannot get the inserted ID '${idColumnName}', available columns are: ${Object.keys(row).join(", ")}`)
        col = idColumnName
      } else if (optIdCol) {
        if (!row.hasOwnProperty(optIdCol))
          throw new Error(`Cannot get the inserted ID '${optIdCol}', available columns are: ${Object.keys(row).join(", ")}`)
        col = optIdCol
      } else if (insertTable) {
        if (row.hasOwnProperty("id"))
          col = "id"
        else {
          let composed = `${insertTable.toLowerCase()}_id`
          if (row.hasOwnProperty(composed))
            col = composed
          else {
            composed = composed.toUpperCase()
            if (row.hasOwnProperty(composed))
              col = composed
          }
        }
      }
      if (!col)
        throw new Error(`Cannot get the inserted ID, available columns are: ${Object.keys(row).join(", ")}`)
      return row[col]
    }
  }
}

let psSequence = 0

function makeAPreparedStatement(options: LadcPgOptions, client: Client, sql: string): APreparedStatement<any> {
  const psName = `ladc-ps-${++psSequence}`
  const obj: APreparedStatement<any> = {
    exec: async (params?: unknown[]) => {
      const { sql: text, insertTable, idColumnName } = addReturningToInsert(sql, options)
      return toAExecResult(await client.query({
        name: psName,
        text,
        values: params
      }), insertTable, idColumnName)
    },
    all: async (params?: unknown[]) => {
      return toRows(await client.query({
        name: psName,
        text: sql,
        values: params
      }))
    },
    cursor: async (params?: unknown[]) => createACursor({ client, sql, params, psName }),
    close: async () => { }
  }
  return obj
}

async function createACursor({ client, sql, params, psName }: {
  client: Client
  sql: string
  params?: unknown[]
  psName?: string
}): Promise<AsyncIterableIterator<any>> {
  const cursorObj = new Cursor(sql, params)
  if (psName)
    cursorObj.name = psName
  const innerCursor = promisifyCursor(client.query(cursorObj))

  let done = false
  const closeCursor = async () => {
    done = true
    await innerCursor.close()
  }
  const obj: AsyncIterableIterator<any> = {
    [Symbol.asyncIterator]: () => obj,
    next: async () => {
      if (done)
        return { done, value: undefined }
      const value = await innerCursor.read(1)
      if (!value)
        await closeCursor()
      return { done, value }
    },
    return: async () => {
      if (!done)
        await closeCursor()
      return { done, value: undefined }
    },
    throw: async err => {
      if (!done)
        await closeCursor()
      throw err
    }
  }
  return obj
}
