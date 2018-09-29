import { BasicCursor, BasicDatabaseConnection, BasicExecResult, BasicPreparedStatement, SqlParameters } from "mycn"
import { Database, RunResult, Statement } from "./promisifySqlite3"

export function toBasicDatabaseConnection(db: Database): BasicDatabaseConnection {
  return {
    prepare: async (sql: string, params?: SqlParameters) => toBasicPreparedStatement(await db.prepare(sql, params), params),
    exec: async (sql: string, params?: SqlParameters) => toBasicExecResult(await db.run(sql, params)),
    all: (sql: string, params?: SqlParameters) => db.all(sql, params),
    cursor: (sql: string, params?: SqlParameters) => createBasicCursor(db, sql, params),
    script: async (sql: string) => {
      await db.exec(sql)
    },
    close: async () => {
      await db.close()
    }
  }
}

function toBasicExecResult(st: RunResult): BasicExecResult {
  return {
    affectedRows: st.changes,
    getInsertedId: () => st.lastID
  }
}

function toBasicPreparedStatement(st: Statement, initialParams?: SqlParameters): BasicPreparedStatement<any> {
  let boundParams = initialParams
  return {
    bind: async (key: number | string, value: any) => {
      if (!boundParams)
        boundParams = typeof key === "number" ? [] : {}
      if (typeof key === "number")
        boundParams[key - 1] = value
      else
        boundParams[key] = value
    },
    unbind: async (key: number | string) => {
      if (boundParams)
        boundParams[key] = undefined
    },
    exec: async (params?: SqlParameters) => toBasicExecResult(await st.run(mergeParams(boundParams, params))),
    all: (params?: SqlParameters) => st.all(mergeParams(boundParams, params)),
    cursor: async (params?: SqlParameters) => statementToBasicCursor(st, params),
    close: () => st.finalize()
  }
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
    let p2 = params2 as string[]
    p2.forEach((val, index) => result[index] = val)
    return result
  }
  return {
    ...params1,
    ...params2
  }
}

function statementToBasicCursor(st: Statement, params?: SqlParameters): BasicCursor<any> {
  let closed = false
  return {
    fetch: async () => {
      if (closed)
        return undefined
      let copy = params
      params = undefined
      return await st.get(copy)
    },
    close: async () => {
      closed = true
    }
  }
}

async function createBasicCursor(db: Database, sql: string, params?: SqlParameters): Promise<BasicCursor<any>> {
  let st = await db.prepare(sql, params)
  let closed = false
  return {
    fetch: async () => closed ? undefined : await st.get(),
    close: async () => {
      closed = true
      await st.finalize()
    }
  }
}
