import { Pool } from "./Pool"
import { BasicDatabaseConnection } from "./driver-definitions"
import { MycnOptions, SqlParameters, TransactionConnection } from "./exported-definitions"
import { toExecResult, toPreparedStatement, toSingleRow, toSingleValue } from "./helpers"

export async function makeTransactionConnection(options: MycnOptions, pool: Pool<BasicDatabaseConnection>): Promise<TransactionConnection> {
  let cn: BasicDatabaseConnection | undefined = await pool.grab()
  await cn.exec("begin")
  let prepareCb = cnBasicCallback("prepare")
  let obj: TransactionConnection = {
    async prepare(sql: string, params?: SqlParameters) {
      return await toPreparedStatement(options, await prepareCb(sql, params))
    },
    async exec(sql: string, params?: SqlParameters) {
      if (!cn)
        throw new Error(`Invalid call to 'exec', not in a transaction`)
      return toExecResult(options, await cn.exec(sql, params))
    },
    all: cnBasicCallback("all"),
    async singleRow(sql: string, params?: SqlParameters) {
      return toSingleRow(await this.all(sql, params))
    },
    async singleValue(sql: string, params?: SqlParameters) {
      return toSingleValue(await this.singleRow(sql, params))
    },
    execScript: cnBasicCallback("execScript"),

    get inTransaction() {
      return !!cn
    },
    commit: () => endOfTransaction("commit"),
    rollback: () => endOfTransaction("rollback")
  }
  if (options.modifyConnection)
    obj = await options.modifyConnection(obj)
  return obj

  async function endOfTransaction(method: "commit" | "rollback") {
    if (!cn)
      throw new Error(`Invalid call to '${method}', not in a transaction`)
    let copy = cn
    cn = undefined
    await copy.exec(method)
    pool.release(copy)
  }

  function cnBasicCallback(method: string) {
    return (...args) => {
      if (!cn)
        throw new Error(`Invalid call to '${method}', not in a transaction`)
      return cn[method](...args)
    }
  }
}