import { Client, ClientConfig, QueryResult } from "pg"
import { BasicDatabaseConnection, BasicExecResult, BasicPreparedStatement, SqlParameters } from "mycn"
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
    prepare: async (sql: string, params?: SqlParameters) => makeBasicPreparedStatement(options, client, sql, params),
    execScript: async (sql: string) => {
      await client.query(sql)
    },
    close: async () => {
      await client.end()
    }
  }
}

function toPositionalParameters(params?: SqlParameters): string[] | undefined {
  if (params === undefined || Array.isArray(params))
    return params
  throw new Error('Named parameters are not implemented')
}

function toRows(result: QueryResult) {
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

function makeBasicPreparedStatement(options: MycnPgOptions, client: Client, sql: string, psParams?: SqlParameters): BasicPreparedStatement {
  let psName = `mycn-ps-${++psSequence}`
  let manualBound = false
  let curParams: SqlParameters | undefined = psParams
  let cursor: InMemoryCursor | undefined
  let thisObj = {
    exec: async (params?: SqlParameters) => {
      let { sql: text, insertTable, idColumnName } = addReturningToInsert(sql, options)
      if (params) {
        manualBound = false
        curParams = {
          ...psParams,
          ...params
        }
      }
      return toBasicExecResult(await client.query({
        name: psName,
        text,
        values: toPositionalParameters(curParams)
      }), insertTable, idColumnName)
    },
    all: async (params?: SqlParameters) => {
      if (params) {
        manualBound = false
        curParams = {
          ...psParams,
          ...params
        }
      }
      return toRows(await client.query({
        name: psName,
        text: sql,
        values: toPositionalParameters(curParams)
      }))
    },
    fetch: async () => {
      if (!cursor)
        cursor = makeInMemoryCursor(await thisObj.all(curParams))
      return cursor.fetch()
    },
    bind: async (key: number | string, value: any) => {
      if (!manualBound) {
        manualBound = true
        curParams = typeof key === "number" ? [] : {}
      } else if (!curParams)
        curParams = typeof key === "number" ? [] : {}
      if (typeof key === "number")
        curParams[key - 1] = value
      else
        curParams[key] = value
    },
    unbindAll: async () => {
      manualBound = false
      curParams = undefined
    },
    close: async () => { }
  }
  return thisObj
}

interface InMemoryCursor {
  fetch(): any | undefined
}

function makeInMemoryCursor(rows: any[]): InMemoryCursor {
  let currentIndex = -1
  return {
    fetch: () => rows[++currentIndex]
  }
}