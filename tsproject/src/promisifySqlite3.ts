import sqlite3 from "sqlite3"
import { Sqlite3ConnectionOptions } from "./exported-definitions"
import { SqlParameters } from "mycn";

export interface Database {
  run(sql: string, params?: SqlParameters): Promise<RunResult>
  all(sql: string, params?: SqlParameters): Promise<any[]>
  exec(sql: string): Promise<void>
  prepare(sql: string, params?: SqlParameters): Promise<Statement>
  close(): Promise<void>
}

export interface Statement {
  run(params?: SqlParameters): Promise<RunResult>
  all(params?: SqlParameters): Promise<any[]>
  finalize(): Promise<void>
}

export interface RunResult {
  readonly lastID: number
  readonly changes: number
}

export async function createSqlite3Connection(options: Sqlite3ConnectionOptions): Promise<Database> {
  let db
  await new Promise((resolve, reject) => {
    if (options.mode !== undefined) {
      db = new sqlite3.Database(options.fileName, options.mode, err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    } else {
      db = new sqlite3.Database(options.fileName, err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    }
  })
  if (options.initCallback)
    await options.initCallback(db)
  return promisifyDatabase(db)
}

function promisifyDatabase(db): Database {
  return {
    run: (sql: string, params = []) => {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
          if (err)
            reject(err)
          else
            resolve(this) // Here, 'this' is the 'RunResult'
        })
      })
    },
    all: (sql: string, params = []) => {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err)
            reject(err)
          else
            resolve(rows)
        })
      })
    },
    exec: (sql: string) => {
      return new Promise((resolve, reject) => {
        db.exec(sql, err => {
          if (err)
            reject(err)
          else
            resolve()
        })
      })
    },
    prepare: (sql: string, params = []) => {
      let st
      return new Promise((resolve, reject) => {
        st = db.prepare(sql, params, function (err) {
          if (err)
            reject(err)
          else
            resolve() // Here, 'this' is the 'RunResult'
        })
      }).then(() => promisifyStatement(st))
    },
    close: () => {
      return new Promise((resolve, reject) => {
        db.close(err => {
          if (err)
            reject(err)
          else
            resolve()
        })
      })
    }
  }
}

function promisifyStatement(st): Statement {
  return {
    run: (params = []) => {
      return new Promise((resolve, reject) => {
        st.run(params, function (err) {
          if (err)
            reject(err)
          else
            resolve(this) // Here, 'this' is the 'RunResult'
        })
      })
    },
    all: (params = []) => {
      return new Promise((resolve, reject) => {
        st.all(params, (err, rows) => {
          if (err)
            reject(err)
          else
            resolve(rows)
        })
      })
    },
    finalize: () => {
      return new Promise((resolve, reject) => {
        st.finalize(err => {
          if (err)
            reject(err)
          else
            resolve()
        })
      })
    }
  }
}