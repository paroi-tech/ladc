import { AdapterCapabilities } from "../adapter-definitions"
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
  capabilities: AdapterCapabilities
}

export default function makeMainConnection(context: Context): MainConnection {
  const { pool } = context
  const psProvider = new PsProvider({
    context,
    canCreateCursor: () => true
  })
  const txProvider = new TxProvider(context)
  const cursorProvider = new CursorProvider(context)

  let closed = false

  let obj: MainConnection = {
    async prepare(sql: string, params?: SqlParameters) {
      if (!context.capabilities.preparedStatements)
        throw new Error(`Prepared statements are not available with this adapter`)
      if (closed)
        throw new Error(`Invalid call to 'prepare', the connection is closed`)
      return await psProvider.prepare(sql, params)
    },
    async exec(sql: string, params?: SqlParameters) {
      if (closed)
        throw new Error(`Invalid call to 'exec', the connection is closed`)
      const cn = await pool.grab()
      try {
        const res = await cn.exec(sql, params)
        return toExecResult(res)
      } finally {
        pool.release(cn)
      }
    },
    all: cnAdapterCallback("all"),
    async singleRow(sql: string, params?: SqlParameters) {
      return toSingleRow(await this.all(sql, params))
    },
    async singleValue(sql: string, params?: SqlParameters) {
      return toSingleValue(await this.singleRow(sql, params))
    },
    async cursor(sql: string, params?: SqlParameters) {
      if (!context.capabilities.cursors)
        throw new Error(`Cursors are not available with this adapter`)
      if (closed)
        throw new Error(`Invalid call to 'cursor', the connection is closed`)
      return await cursorProvider.open(sql, params)
    },
    script: cnAdapterCallback("script"),

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

  function cnAdapterCallback(method: string) {
    return async (...args: any[]) => {
      if (closed)
        throw new Error(`Invalid call to '${method}', the connection is closed`)
      const cn = await pool.grab()
      try {
        return await (cn as any)[method](...args)
      } finally {
        pool.release(cn)
      }
    }
  }
}
