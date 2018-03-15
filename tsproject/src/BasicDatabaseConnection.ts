import { BasicDatabaseConnection, BasicExecResult, BasicPreparedStatement } from "mycn"
import { RunResult, Database, Statement } from "./promisifySqlite3"
import { SqlParameters } from "mycn"

export function toBasicDatabaseConnection(db: Database): BasicDatabaseConnection {
  let cursor: InMemoryCursor | undefined
  return {
    exec: async (sql: string, params?: SqlParameters) => toBasicExecResult(await db.run(sql, params)),
    all: (sql: string, params?: SqlParameters) => db.all(sql, params),
    prepare: async (sql: string, params?: SqlParameters) => toBasicPreparedStatement(await db.prepare(sql, params)),
    execScript: async (sql: string) => {
      await db.exec(sql)
    },
    close: async () => {
      cursor = undefined
      await db.close()
    }
  }
}

function toBasicExecResult(st: RunResult): BasicExecResult {
  return {
    affectedRows: st.changes,
    insertedId: st.lastID
  }
}

function toBasicPreparedStatement(st: Statement): BasicPreparedStatement {
  let manualBound = false
  let curParams: SqlParameters | undefined
  let cursor: InMemoryCursor | undefined
  return {
    exec: async (params?: SqlParameters) => {
      if (params) {
        manualBound = false
        curParams = params
      }
      return toBasicExecResult(await st.run(curParams))
    },
    all: (params?: SqlParameters) => {
      if (params) {
        manualBound = false
        curParams = params
      }
      return st.all(curParams)
    },
    fetch: async () => {
      if (!cursor)
        cursor = makeInMemoryCursor(await st.all(curParams))
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
    finalize: () => st.finalize()
  }
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