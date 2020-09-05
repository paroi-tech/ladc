import { AConnection, ACreateConnectionOptions, AdapterCapabilities, AdapterHooks } from "../adapter-definitions"
import { Pool } from "../createPool"
import { LadcOptions, MainConnection, SqlParameters } from "../exported-definitions"
import { formatError, toSingleRow, toSingleValue } from "../helpers"
import { CursorProvider } from "./Cursor"
import { toExecResult } from "./ExecResult"
import { PsProvider } from "./PreparedStatement"
import { TxProvider } from "./TransactionConnection"

export interface Context {
  pool: Pool
  provider: (createOptions?: ACreateConnectionOptions) => Promise<AConnection>
  options: LadcOptions
  capabilities: AdapterCapabilities
  hooks: AdapterHooks
  check: {
    [K in keyof AdapterCapabilities]-?: () => void
  } & {
    parameters(params: SqlParameters | undefined): void
  }
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
    async prepare(sql: string) {
      context.check.preparedStatements()
      if (closed)
        throw new Error("Invalid call to 'prepare', the connection is closed")
      return await psProvider.prepare(sql)
    },
    async exec(sql: string, params?: SqlParameters) {
      context.check.parameters(params)
      if (closed)
        throw new Error("Invalid call to 'exec', the connection is closed")
      const cn = await pool.grab()
      try {
        const res = await cn.exec(sql, params)
        return toExecResult(res)
      } finally {
        pool.release(cn)
      }
    },
    async all(sql: string, params?: SqlParameters) {
      context.check.parameters(params)
      if (closed)
        throw new Error("Invalid call to 'all', the connection is closed")
      const cn = await pool.grab()
      try {
        return await cn.all(sql, params)
      } catch (err) {
        throw formatError(err)
      } finally {
        pool.release(cn)
      }
    },
    async singleRow(sql: string, params?: SqlParameters) {
      return toSingleRow(await this.all(sql, params))
    },
    async singleValue(sql: string, params?: SqlParameters) {
      return toSingleValue(await this.singleRow(sql, params))
    },
    async cursor(sql: string, params?: SqlParameters) {
      context.check.cursors()
      context.check.parameters(params)
      if (closed)
        throw new Error("Invalid call to 'cursor', the connection is closed")
      return await cursorProvider.open(sql, params)
    },
    async script(sql: string) {
      context.check.script()
      if (closed)
        throw new Error("Invalid call to 'script', the connection is closed")
      if (context.capabilities.script === "onASeparateConnection") {
        const cn = await context.provider({ enableScript: true })
        try {
          return await cn.script(sql)
        } catch (err) {
          throw formatError(err)
        } finally {
          await cn.close()
        }
      } else {
        const cn = await pool.grab()
        try {
          return await cn.script(sql)
        } catch (err) {
          throw formatError(err)
        } finally {
          pool.release(cn)
        }
      }
    },

    beginTransaction: async () => {
      if (closed)
        throw new Error("Invalid call to 'beginTransaction', the connection is closed")
      return await txProvider.create()
    },
    close: async () => {
      if (closed)
        throw new Error("Invalid call to 'close', the connection is already closed")
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
}
