import { BasicExecResult, BasicMainConnection, BasicPreparedStatement, SqlParameters } from "ladc"
import { Database, RunResult, Statement } from "./promisifySqlite3"

export function toBasicMainConnection(db: Database): BasicMainConnection {
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

function statementToBasicCursor(st: Statement, params?: SqlParameters): AsyncIterableIterator<any> {
  let done = false
  let obj: AsyncIterableIterator<any> = {
    [Symbol.asyncIterator]: () => obj,
    next: async () => {
      if (done)
        return { done, value: undefined }
      let copy = params
      params = undefined
      let value = await st.get(copy)
      if (!value)
        done = true
      return { done, value }
    },
    return: async () => {
      done = true
      return { done, value: undefined }
    },
    throw: async err => {
      done = true
      throw err
    }
  }
  return obj
}

async function createBasicCursor(db: Database, sql: string, params?: SqlParameters): Promise<AsyncIterableIterator<any>> {
  let st = await db.prepare(sql, params)
  let done = false
  const closeCursor = async () => {
    done = true
    await st.finalize()
  }
  let obj: AsyncIterableIterator<any> = {
    [Symbol.asyncIterator]: () => obj,
    next: async () => {
      if (done)
        return { done, value: undefined }
      let value = await st.get()
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
