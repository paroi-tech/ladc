import { SqlParameters } from "ladc"
import * as sqlite3 from "sqlite3"
import { Sqlite3ConnectionOptions } from "./exported-definitions"

export interface Database {
  run(sql: string, params?: SqlParameters): Promise<RunResult>
  all(sql: string, params?: SqlParameters): Promise<any[]>
  exec(sql: string): Promise<void>
  prepare(sql: string, params?: SqlParameters): Promise<Statement>
  close(): Promise<void>
}

export interface Statement {
  bind(...params: any[]): void
  run(params?: SqlParameters): Promise<RunResult>
  all(params?: SqlParameters): Promise<any[]>
  get(params?: SqlParameters): Promise<any>
  finalize(): Promise<void>
}

export interface RunResult {
  readonly lastID: number
  readonly changes: number
}

export async function createSqlite3Connection(options: Sqlite3ConnectionOptions): Promise<Database> {
  const maxAttempts = options.maxAttempts ?? 3
  let curAttempt = 1
  let delayAfterError = 50
  let firstError: unknown
  const db = await new Promise<sqlite3.Database>((resolve, reject) => {
    let innerDb: sqlite3.Database | undefined
    const cb = (err: unknown) => {
      if (err) {
        if (curAttempt >= maxAttempts)
          reject(firstError ?? err)
        else {
          if (!firstError)
            firstError = err
          setTimeout(
            () => { innerDb = create() },
            delayAfterError
          ).unref()
          ++curAttempt
          delayAfterError *= 2
        }
      } else
        resolve(innerDb)
    }
    const create = () => {
      if (options.mode !== undefined)
        return new sqlite3.Database(options.fileName, options.mode, cb)
      else
        return new sqlite3.Database(options.fileName, cb)
    }
    innerDb = create()
  })
  if (curAttempt > 1 && options.logWarning)
    options.logWarning(`SQLite connexion was successfully opened after ${curAttempt} attempts, first error was: ${firstError}`)
  if (options.init)
    await options.init(db)
  return promisifyDatabase(db)
}

function promisifyDatabase(db: sqlite3.Database): Database {
  return {
    run: (sql: string, params = []) => {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function (this: RunResult, err: any) {
          if (err)
            reject(err)
          else
            resolve(this) // Here, 'this' is the 'RunResult'
        })
      })
    },
    all: (sql: string, params = []) => {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err: any, rows: unknown[]) => {
          if (err)
            reject(err)
          else
            resolve(rows)
        })
      })
    },
    exec: (sql: string) => {
      return new Promise((resolve, reject) => {
        db.exec(sql, (err: any) => {
          if (err)
            reject(err)
          else
            resolve()
        })
      })
    },
    prepare: (sql: string, params = []) => {
      let st: sqlite3.Statement
      return new Promise((resolve, reject) => {
        st = db.prepare(sql, params, (err: any) => {
          if (err)
            reject(err)
          else
            resolve()
        })
      }).then(() => promisifyStatement(st))
    },
    close: () => {
      return new Promise((resolve, reject) => {
        db.close((err: any) => {
          if (err)
            reject(err)
          else
            resolve()
        })
      })
    }
  }
}

function promisifyStatement(st: sqlite3.Statement): Statement {
  return {
    bind: (...params: any[]) => {
      return new Promise((resolve, reject) => {
        st.bind(...params, function (err: any) {
          if (err)
            reject(err)
          else
            resolve()
        })
      })
    },
    run: (params = []) => {
      return new Promise((resolve, reject) => {
        st.run(params, function (this: RunResult, err: any) {
          if (err)
            reject(err)
          else
            resolve(this) // Here, 'this' is the 'RunResult'
        })
      })
    },
    all: (params = []) => {
      return new Promise((resolve, reject) => {
        st.all(params, (err: any, rows: unknown[]) => {
          if (err)
            reject(err)
          else
            resolve(rows)
        })
      })
    },
    get: (params = []) => {
      return new Promise((resolve, reject) => {
        st.get(params, (err: any, row: unknown[]) => {
          if (err)
            reject(err)
          else
            resolve(row)
        })
      })
    },
    finalize: () => {
      return new Promise((resolve, reject) => {
        st.finalize((err: any) => {
          if (err)
            reject(err)
          else
            resolve()
        })
      })
    }
  }
}