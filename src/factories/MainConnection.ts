import { Pool } from "../createPool"
import { LadcOptions, MainConnection, SqlParameters } from "../exported-definitions"
import { toSingleRow, toSingleValue } from "../helpers"
import { CursorProvider } from "./Cursor"
import { toExecResult } from "./ExecResult"
import { PsProvider } from "./PreparedStatement"
import { TxProvider } from "./TransactionConnection"

export interface Context {
  pool: Pool
  options: LadcOptions
}

export default function makeDbConnection(context: Context): MainConnection {
  let { pool } = context
  let psProvider = new PsProvider({
    context,
    canCreateCursor: () => true
  })
  let txProvider = new TxProvider(context)
  let cursorProvider = new CursorProvider(context)

  let closed = false

  let obj: MainConnection = {
    async prepare(sql: string, params?: SqlParameters) {
      if (closed)
        throw new Error(`Invalid call to 'prepare', the connection is closed`)
      return await psProvider.prepare(sql, params)
    },
    async exec(sql: string, params?: SqlParameters) {
      if (closed)
        throw new Error(`Invalid call to 'exec', the connection is closed`)
      let cn = await pool.grab()
      try {
        let res = await cn.exec(sql, params)
        return toExecResult(context, res)
      } finally {
        pool.release(cn)
      }
    },
    all: cnBasicCallback("all"),
    async singleRow(sql: string, params?: SqlParameters) {
      return toSingleRow(await this.all(sql, params))
    },
    async singleValue(sql: string, params?: SqlParameters) {
      return toSingleValue(await this.singleRow(sql, params))
    },
    async cursor(sql: string, params?: SqlParameters) {
      if (closed)
        throw new Error(`Invalid call to 'cursor', the connection is closed`)
      return await cursorProvider.open(sql, params)
    },
    script: cnBasicCallback("script"),

    beginTransaction: async () => {
      if (closed)
        throw new Error(`Invalid call to 'beginTransaction', the connection is closed`)
      return await txProvider.create()
    },
    close: async () => {
      if (closed)
        throw new Error(`Invalid call to 'close', the connection is already closed`)
      closed = true
      await Promise.all([
        psProvider.closeAll(),
        cursorProvider.closeAll(),
        txProvider.closeAll()
      ])
      await pool.close()
    }
  }

  if (context.options.modifier && context.options.modifier.modifyConnection)
    obj = context.options.modifier.modifyConnection(obj)

  return obj

  function cnBasicCallback(method: string) {
    return async (...args) => {
      if (closed)
        throw new Error(`Invalid call to '${method}', the connection is closed`)
      let cn = await pool.grab()
      try {
        return await cn[method](...args)
      } finally {
        pool.release(cn)
      }
    }
  }
}
