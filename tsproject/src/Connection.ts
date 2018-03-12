import { Database } from "sqlite"
import { Pool } from "./Pool"
import { Connection, InTransactionConnection } from "./common-definitions"

const METHODS = ["run", "get", "all", "exec", "each", "prepare", "migrate"] // all methods except 'close'

export async function doCreateConnection(pool: Pool, transactionDb?: Database): Promise<Connection | InTransactionConnection> {
  let thisObj: Partial<InTransactionConnection> = {}
  let isRoot = !transactionDb,
    closed = false

  for (let method of METHODS) {
    thisObj[method] = async (...args: any[]) => {
      if (closed)
        throw new Error(`Invalid call to "${method}", the connection is closed`)
      return (transactionDb || pool.singleUse)[method](...args)
    }
  }

  thisObj.singleRow = async (sql: string, mode?: "acceptMissingRow") => {
    let rs = await thisObj.all!(sql)
    if (rs.length !== 1) {
      if (mode === "acceptMissingRow" && rs.length === 0)
        return
      throw new Error(`Cannot fetch one value, row count: ${rs.length}`)
    }
    return rs[0]
  }

  thisObj.singleValue = async (sql: string, mode?: "acceptMissingRow") => {
    let row = await thisObj.singleRow!(sql, mode as any)
    if (mode === "acceptMissingRow" && row === undefined)
      return
    let columns = Object.keys(row)
    if (columns.length !== 1)
      throw new Error(`Cannot fetch one value, column count: ${columns.length}`)
    return row[columns[0]]
  }

  let transactionDepth: number,
    rollbacked = false
  if (transactionDb) {
    transactionDepth = 1
    await transactionDb.exec("begin")
    for (let method of ["commit", "rollback"]) {
      thisObj[method] = async () => {
        if (closed)
          throw new Error(`Invalid call to "${method}", the connection is closed`)
        if (transactionDepth === 0)
          throw new Error(`Cannot ${method}, not in a transaction`)
        --transactionDepth
        if (transactionDepth === 0) {
          let cancelCommit = rollbacked && method === "commit"
          await transactionDb!.exec(cancelCommit ? "rollback" : method)
          pool.release(transactionDb!)
          transactionDb = undefined
          if (cancelCommit)
            throw new Error(`Invalid call to "commit", because an inner transaction has been rollbacked`)
        } else if (method === "rollback")
          rollbacked = true
      }
    }
  } else
    transactionDepth = 0

  thisObj.beginTransaction = async (force = false) => {
    if (closed)
      throw new Error(`Invalid call to "beginTransaction", the connection is closed`)
    if (transactionDepth > 0)
      throw new Error('Cannot open a transaction in a transaction')
    // if (!force && transactionDepth > 0) {
    //   ++transactionDepth
    //   return thisObj as InTransactionConnection
    // }
    return await doCreateConnection(pool, await pool.grab()) as InTransactionConnection
  }

  thisObj.close = async () => {
    if (closed)
      throw new Error(`Invalid call to "close", the connection is already closed`)
    let promise: Promise<void> | undefined
    if (transactionDb)
      promise = (thisObj as InTransactionConnection).rollback()
    closed = true
    if (promise)
      await promise
    if (isRoot)
      await pool.close()
  }

  Object.defineProperties(thisObj, {
    inTransaction: {
      configurable: false,
      enumerable: true,
      get: function () {
        return transactionDepth > 0
      }
    }
  })

  return thisObj as Connection | InTransactionConnection
}
