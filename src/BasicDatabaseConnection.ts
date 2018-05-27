import { Client, ClientConfig, QueryResult } from "pg"
import { BasicDatabaseConnection, BasicExecResult, BasicPreparedStatement, SqlParameters } from "mycn"

export async function createPgConnection(config: string | ClientConfig): Promise<Client> {
  let client = new Client(config)
  client.connect()
  return client
}

export function toBasicDatabaseConnection(client: Client): BasicDatabaseConnection {
  return {
    exec: async (sql: string, params?: SqlParameters) => toBasicExecResult(await client.query({
      text: sql,
      values: toPositionalParameters(params)
    })),
    all: async (sql: string, params?: SqlParameters) => toRows(await client.query({
      text: sql,
      values: toPositionalParameters(params)
    })),
    prepare: async (sql: string, params?: SqlParameters) => makeBasicPreparedStatement(client, sql, params),
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

function toBasicExecResult(result: QueryResult): BasicExecResult {
  return {
    affectedRows: result.rowCount,
    getInsertedId: (idColumnName: string) => {
      if (!result.rows[0])
        throw new Error(`Unknown column name ${idColumnName}`)
      if (!result.rows[0].hasOwnProperty(idColumnName))
        throw new Error(`Unknown column name ${idColumnName}`)
      return result.rows[0][idColumnName]
    }
  }
}

let psSequence = 0

function makeBasicPreparedStatement(client: Client, sql: string, psParams?: SqlParameters): BasicPreparedStatement {
  let psName = `mycn-ps-${++psSequence}`
  let manualBound = false
  let curParams: SqlParameters | undefined = psParams
  let cursor: InMemoryCursor | undefined
  let thisObj = {
    exec: async (params?: SqlParameters) => {
      if (params) {
        manualBound = false
        curParams = {
          ...psParams,
          ...params
        }
      }
      return toBasicExecResult(await client.query({
        name: psName,
        text: sql,
        values: toPositionalParameters(curParams)
      }))
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
    close: async () => {}
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