import { AdapterConnection, AdapterExecResult, AdapterPreparedStatement, SqlParameters } from "ladc"
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

export function toAdapterConnection(client: Client, options: LadcPgOptions): AdapterConnection {
  return {
    prepare: async (sql: string, params?: unknown[]) => makeAdapterPreparedStatement(options, client, sql, params),
    exec: async (sql: string, params?: SqlParameters) => {
      const { sql: text, insertTable, idColumnName } = addReturningToInsert(sql, options)
      return toAdapterExecResult(
        await client.query({
          text,
          values: toPositionalParameters(params)
        }),
        insertTable,
        idColumnName
      )
    },
    all: async (sql: string, params?: SqlParameters) => toRows(await client.query({
      text: sql,
      values: toPositionalParameters(params)
    })),
    cursor: async (sql: string, params?: SqlParameters) => createAdapterCursor({ client, sql, params }),
    script: async (sql: string) => {
      await client.query(sql)
    },
    close: async () => {
      await client.end()
    }
  }
}

function toPositionalParameters(params?: SqlParameters): unknown[] | undefined {
  if (params === undefined || Array.isArray(params))
    return params
  throw new Error("Named parameters are not implemented")
}

function toRows(result: QueryResult): any[] {
  return result.rows
}

function toAdapterExecResult(result: QueryResult, insertTable?: string, optIdCol?: string): AdapterExecResult {
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

function makeAdapterPreparedStatement(options: LadcPgOptions, client: Client, sql: string, initialParams?: unknown[]): AdapterPreparedStatement<any> {
  const psName = `ladc-ps-${++psSequence}`
  let boundParams = initialParams
  const obj: AdapterPreparedStatement<any> = {
    bind: async (num: number | string, value: any) => {
      if (typeof num === "string")
        throw new Error("Named parameters are not available")
      if (!boundParams)
        boundParams = []
      boundParams[num - 1] = value
    },
    unbind: async (num: number | string) => {
      if (typeof num === "string")
        throw new Error("Named parameters are not available")
      if (boundParams)
        boundParams[num] = undefined
    },
    exec: async (params?: SqlParameters) => {
      const { sql: text, insertTable, idColumnName } = addReturningToInsert(sql, options)
      return toAdapterExecResult(await client.query({
        name: psName,
        text,
        values: toPositionalParameters(mergeParams(boundParams, params))
      }), insertTable, idColumnName)
    },
    all: async (params?: SqlParameters) => {
      return toRows(await client.query({
        name: psName,
        text: sql,
        values: toPositionalParameters(mergeParams(boundParams, params))
      }))
    },
    cursor: async (params?: SqlParameters) => createAdapterCursor({ client, sql, params, psName }),
    close: async () => { }
  }
  return obj
}

function mergeParams(params1: SqlParameters | undefined, params2: SqlParameters | undefined): SqlParameters | undefined {
  if (!params1)
    return params2
  if (!params2)
    return params1
  const isArr = Array.isArray(params1)
  if (isArr !== Array.isArray(params2))
    throw new Error("Cannot merge named parameters with positioned parameters")
  if (isArr) {
    const result = [...(params1 as string[])]
    const p2 = params2 as string[]
    p2.forEach((val, index) => result[index] = val)
    return result
  }
  return {
    ...params1,
    ...params2
  }
}

async function createAdapterCursor({ client, sql, params, psName }: {
  client: Client
  sql: string
  params?: SqlParameters
  psName?: string
}): Promise<AsyncIterableIterator<any>> {
  const cursorObj = new Cursor(sql, toPositionalParameters(params))
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

// function makeInMemoryCursor(rows?: any[]): AsyncIterableIterator<any> {
//   let currentIndex = -1
//   const obj: AsyncIterableIterator<any> = {
//     [Symbol.asyncIterator]: () => obj,
//     next: async () => {
//       if (!rows)
//         return { done: true, value: undefined }
//       const value = rows[++currentIndex]
//       if (!value)
//         rows = undefined
//       return { done: !rows, value }
//     },
//     return: async () => {
//       rows = undefined
//       return { done: true, value: undefined }
//     },
//     throw: async err => {
//       rows = undefined
//       throw err
//     }
//   }
//   return obj
// }