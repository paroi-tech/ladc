import { AdapterConnection, AdapterExecResult, AdapterPreparedStatement, SqlParameters } from "ladc"
import { Database, RunResult, Statement } from "./promisifySqlite3"

export function toAdapterConnection(db: Database): AdapterConnection {
  return {
    prepare: async (sql: string, params?: SqlParameters) => toAdapterPreparedStatement(await db.prepare(sql, params), params),
    exec: async (sql: string, params?: SqlParameters) => toAdapterExecResult(await db.run(sql, params)),
    all: (sql: string, params?: SqlParameters) => db.all(sql, params),
    cursor: (sql: string, params?: SqlParameters) => createAdapterCursor(db, sql, params),
    script: async (sql: string) => {
      await db.exec(sql)
    },
    close: async () => {
      await db.close()
    }
  }
}

function toAdapterExecResult(st: RunResult): AdapterExecResult {
  return {
    affectedRows: st.changes,
    getInsertedId: () => st.lastID
  }
}

function toAdapterPreparedStatement(st: Statement, initialParams?: SqlParameters): AdapterPreparedStatement<any> {
  let boundParams = initialParams
  return {
    bind: async (key: number | string, value: any) => {
      if (!boundParams)
        boundParams = typeof key === "number" ? [] : {}
      if (typeof key === "number")
        (boundParams as any)[key - 1] = value
      else
        (boundParams as any)[key] = value
    },
    unbind: async (key: number | string) => {
      if (boundParams)
        (boundParams as any)[key] = undefined
    },
    exec: async (params?: SqlParameters) => toAdapterExecResult(await st.run(mergeParams(boundParams, params))),
    all: (params?: SqlParameters) => st.all(mergeParams(boundParams, params)),
    cursor: async (params?: SqlParameters) => statementToAdapterCursor(st, params),
    close: () => st.finalize()
  }
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

function statementToAdapterCursor(st: Statement, params?: SqlParameters): AsyncIterableIterator<any> {
  let done = false
  const obj: AsyncIterableIterator<any> = {
    [Symbol.asyncIterator]: () => obj,
    next: async () => {
      if (done)
        return { done, value: undefined }
      const copy = params
      params = undefined
      const value = await st.get(copy)
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

async function createAdapterCursor(db: Database, sql: string, params?: SqlParameters): Promise<AsyncIterableIterator<any>> {
  const st = await db.prepare(sql, params)
  let done = false
  const closeCursor = async () => {
    done = true
    await st.finalize()
  }
  const obj: AsyncIterableIterator<any> = {
    [Symbol.asyncIterator]: () => obj,
    next: async () => {
      if (done)
        return { done, value: undefined }
      const value = await st.get()
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
