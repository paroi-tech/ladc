import { BasicCursor, BasicDatabaseConnection, BasicExecResult, BasicPreparedStatement, SqlParameters } from "mycn"
import { Client, ClientConfig, QueryResult } from "pg"
import { MycnPgOptions } from "./exported-definitions"

export async function createPgConnection(config: string | ClientConfig): Promise<Client> {
  let client = new Client(config)
  client.connect()
  return client
}

const insertRegexp = /^\s*insert\s+into\s+([^\s\(]+)\s*(?:\([^)]+\))?\s*values\s*\([\s\S]*\)\s*$/i

function addReturningToInsert(sql: string, options: MycnPgOptions) {
  let matches = insertRegexp.exec(sql)
  if (!matches)
    return { sql }
  let insertTable = matches[1]
  let idColumnName = options.getAutoincrementedIdColumnName && options.getAutoincrementedIdColumnName(insertTable)
  sql = idColumnName ? `${sql} returning ${idColumnName}` : `${sql} returning *`
  return { sql, insertTable, idColumnName }
}

export function toBasicDatabaseConnection(client: Client, options: MycnPgOptions): BasicDatabaseConnection {
  return {
    prepare: async (sql: string, params?: SqlParameters) => makeBasicPreparedStatement(options, client, sql, params),
    exec: async (sql: string, params?: SqlParameters) => {
      let { sql: text, insertTable, idColumnName } = addReturningToInsert(sql, options)
      return toBasicExecResult(
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
    cursor: async (sql: string, params?: SqlParameters) => {
      return makeInMemoryCursor(toRows(await client.query({
        text: sql,
        values: toPositionalParameters(params)
      })))
    },
    script: async (sql: string) => {
      await client.query(sql)
    },
    close: async () => {
      await client.end()
    }
  }
}

function toPositionalParameters(params?: SqlParameters): Array<unknown> | undefined {
  if (params === undefined || Array.isArray(params))
    return params
  throw new Error("Named parameters are not implemented")
}

function toRows(result: QueryResult): any[] {
  return result.rows
}

function toBasicExecResult(result: QueryResult, insertTable?: string, optIdCol?: string): BasicExecResult {
  return {
    affectedRows: result.rowCount,
    getInsertedId: (idColumnName?: string) => {
      if (result.rows.length !== 1) {
        if (result.rows.length === 0)
          throw new Error(`Cannot get the inserted ID, please append 'returning your_column_id' to your query`)
        throw new Error(`Cannot get the inserted ID, there must be one result row (${result.rows.length})`)
      }
      let row = result.rows[0]
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

function makeBasicPreparedStatement(options: MycnPgOptions, client: Client, sql: string, initialParams?: SqlParameters): BasicPreparedStatement<any> {
  let psName = `mycn-ps-${++psSequence}`
  let boundParams = initialParams
  let obj: BasicPreparedStatement<any> = {
    bind: async (key: number | string, value: any) => {
      if (typeof key === "string")
        throw new Error("Named parameters are not implemented")
      if (!boundParams)
        boundParams = []
      boundParams[key - 1] = value
    },
    unbind: async (key: number | string) => {
      if (boundParams)
        boundParams[key] = undefined
    },
    exec: async (params?: SqlParameters) => {
      let { sql: text, insertTable, idColumnName } = addReturningToInsert(sql, options)
      return toBasicExecResult(await client.query({
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
    cursor: async (params?: SqlParameters) => {
      return makeInMemoryCursor(toRows(await client.query({
        name: psName,
        text: sql,
        values: toPositionalParameters(mergeParams(boundParams, params))
      })))
    },
    close: async () => { }
  }
  return obj
}

function mergeParams(params1: SqlParameters | undefined, params2: SqlParameters | undefined): SqlParameters | undefined {
  if (!params1)
    return params2
  if (!params2)
    return params1
  let isArr = Array.isArray(params1)
  if (isArr !== Array.isArray(params2))
    throw new Error("Cannot merge named parameters with positioned parameters")
  if (isArr) {
    let result = [...(params1 as string[])]
      ; (params2 as string[]).forEach((val, index) => result[index] = val)
    return result
  }
  return {
    ...params1,
    ...params2
  }
}

function makeInMemoryCursor(rows: any[]): BasicCursor<any> {
  let currentIndex = -1
  let closed = false
  return {
    fetch: async () => closed ? undefined : rows[++currentIndex],
    close: async () => {
      closed = true
    }
  }
}