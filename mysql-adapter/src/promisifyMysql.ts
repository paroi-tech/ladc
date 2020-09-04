import { SqlParameters } from "ladc"
import { Connection as UnderlyingConnection, createConnection } from "mysql"

export interface PromisifiedConnection {
  query(sql: string, params?: SqlParameters): Promise<any[]>
  exec(sql: string, params?: SqlParameters): Promise<UnderlyingExecResult>
  beginTransaction(): Promise<void>
  commit(): Promise<void>
  rollback(): Promise<void>
  end(): Promise<void>
}

export interface UnderlyingExecResult {
  readonly insertId?: number
  readonly affectedRows?: number
  readonly changedRows?: number
}

export async function createPromisifiedConnection(options: any): Promise<PromisifiedConnection> {
  const cn = createConnection(options)
  if (options.init)
    await options.init(cn)
  return promisifyDatabase(cn)
}

function promisifyDatabase(cn: UnderlyingConnection): PromisifiedConnection {
  return {
    query: (sql: string, params = []) => {
      return new Promise((resolve, reject) => {
        cn.query(sql, params, (err, result) => {
          if (err)
            reject(err)
          else
            resolve(result)
        })
      })
    },
    exec: (sql: string, params = []) => {
      return new Promise((resolve, reject) => {
        cn.query(sql, params, (err, result) => {
          if (err)
            reject(err)
          else {
            resolve(result)
          }
        })
      })
    },
    beginTransaction: () => {
      return new Promise((resolve, reject) => {
        cn.beginTransaction((err: any) => {
          if (err)
            reject(err)
          else
            resolve()
        })
      })
    },
    commit: () => {
      return new Promise((resolve, reject) => {
        cn.commit((err: any) => {
          if (err)
            reject(err)
          else
            resolve()
        })
      })
    },
    rollback: () => {
      return new Promise((resolve, reject) => {
        cn.rollback((err: any) => {
          if (err)
            reject(err)
          else
            resolve()
        })
      })
    },
    end: () => {
      return new Promise((resolve, reject) => {
        cn.end((err: any) => {
          if (err)
            reject(err)
          else
            resolve()
        })
      })
    },
  }
}
