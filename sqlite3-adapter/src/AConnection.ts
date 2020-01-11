import { AConnection, AExecResult, APreparedStatement, SqlParameters } from "ladc"
import { Database, RunResult, Statement } from "./promisifySqlite3"

export function toAConnection(db: Database): AConnection {
  return {
    prepare: async (sql: string) => toAPreparedStatement(await db.prepare(sql)),
    exec: async (sql: string, params?: SqlParameters) => toAExecResult(await db.run(sql, params)),
    all: (sql: string, params?: SqlParameters) => db.all(sql, params),
    cursor: (sql: string, params?: SqlParameters) => createACursor(db, sql, params),
    script: async (sql: string) => {
      await db.exec(sql)
    },
    close: async () => {
      await db.close()
    }
  }
}

function toAExecResult(st: RunResult): AExecResult {
  return {
    affectedRows: st.changes,
    getInsertedId: () => st.lastID
  }
}

function toAPreparedStatement(st: Statement): APreparedStatement<any> {
  return {
    exec: async (params?: SqlParameters) => toAExecResult(await st.run(params)),
    all: (params?: SqlParameters) => st.all(params),
    cursor: async (params?: SqlParameters) => statementToACursor(st, params),
    close: () => st.finalize()
  }
}

function statementToACursor(st: Statement, params?: SqlParameters): AsyncIterableIterator<any> {
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

async function createACursor(db: Database, sql: string, params?: SqlParameters): Promise<AsyncIterableIterator<any>> {
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
