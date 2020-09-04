import { AConnection } from "../adapter-definitions"
import { SqlParameters, TransactionConnection } from "../exported-definitions"
import { toSingleRow, toSingleValue } from "../helpers"
import { CursorItem } from "./Cursor"
import { toExecResult } from "./ExecResult"
import { Context } from "./MainConnection"
import { PsProvider } from "./PreparedStatement"

export class TxProvider {
  private items = new Set<TxItem>()

  constructor(private context: Context) {
  }

  async create(): Promise<TransactionConnection> {
    const item = await TxItem.create({
      context: this.context,
      end: (item: TxItem) => {
        this.items.delete(item)
      }
    })
    this.items.add(item)
    return item.tx
  }

  async closeAll() {
    await Promise.all(Array.from(this.items).map(item => item.tx.rollback()))
  }
}

interface TxItemContext {
  context: Context
  end: (item: TxItem) => void
}

class TxItem {
  static async create(txContext: TxItemContext): Promise<TxItem> {
    const acn: AConnection = await txContext.context.pool.grab(true)
    if (txContext.context.hooks.beginTransaction)
      await txContext.context.hooks.beginTransaction(acn)
    else
      await acn.exec("begin")
    return new TxItem(txContext, acn)
  }

  tx: TransactionConnection
  private psProvider?: PsProvider
  private cursorItem?: CursorItem

  constructor(itemContext: TxItemContext, acn: AConnection) {
    this.tx = this.toTx(itemContext, acn)
  }

  hasCursor() {
    return !!this.cursorItem
  }

  private canCreateCursor(): boolean {
    return !this.cursorItem && (!this.psProvider || !this.psProvider.hasCursor())
  }

  private async closeDependencies() {
    const promises: Promise<void>[] = []
    if (this.cursorItem)
      promises.push(this.cursorItem.close())
    if (this.psProvider)
      promises.push(this.psProvider.closeAll())
    await Promise.all(promises)
  }

  private toTx(itemContext: TxItemContext, acn: AConnection | undefined): TransactionConnection {
    const endOfTransaction = async (method: "commit" | "rollback", item: TxItem) => {
      if (!acn)
        throw new Error(`Invalid call to '${method}', not in a transaction`)
      const copy = acn
      acn = undefined
      itemContext.end(item)
      try {
        await item.closeDependencies()
        const hook = itemContext.context.hooks[method]
        if (hook)
          await hook(copy)
        else
          await copy.exec(method)
        itemContext.context.pool.release(copy)
      } catch (err) {
        itemContext.context.pool.abandon(copy)
        throw err
      }
    }

    let obj: TransactionConnection = {
      prepare: async (sql: string) => {
        itemContext.context.check.preparedStatements()
        if (!acn)
          throw new Error("Invalid call to 'prepare', the connection is closed")
        if (!this.psProvider) {
          this.psProvider = new PsProvider({
            context: itemContext.context,
            exclusiveCn: acn,
            canCreateCursor: () => this.canCreateCursor()
          })
        }
        return await this.psProvider.prepare(sql)
      },
      async exec(sql: string, params?: SqlParameters) {
        itemContext.context.check.parameters(params)
        if (!acn)
          throw new Error("Invalid call to 'exec', not in a transaction")
        return toExecResult(await acn.exec(sql, params))
      },
      async all(sql: string, params?: SqlParameters) {
        itemContext.context.check.parameters(params)
        if (!acn)
          throw new Error("Invalid call to 'all', not in a transaction")
        return acn.all(sql, params)
      },
      singleRow: async (sql: string, params?: SqlParameters) => toSingleRow(await obj.all(sql, params)),
      singleValue: async (sql: string, params?: SqlParameters) => toSingleValue(await obj.singleRow(sql, params)),
      cursor: async (sql: string, params?: SqlParameters) => {
        itemContext.context.check.cursors()
        itemContext.context.check.parameters(params)
        if (!acn)
          throw new Error("Invalid call to 'cursor', not in a transaction")
        if (!this.canCreateCursor())
          throw new Error("Only one cursor is allowed by underlying transaction")
        this.cursorItem = new CursorItem({
          context: itemContext.context,
          end: () => {
            this.cursorItem = undefined
          }
        }, await acn.cursor(sql, params))
        return this.cursorItem.cursor
      },
      async script(sql: string) {
        itemContext.context.check.script()
        if (itemContext.context.capabilities.script === "onASeparateConnection")
          throw new Error("Scripts are available only on the main connection with this adapter.")
        if (!acn)
          throw new Error("Invalid call to 'script', not in a transaction")
        return acn.script(sql)
      },
      get inTransaction() {
        return !!acn
      },
      commit: () => endOfTransaction("commit", this),
      rollback: () => endOfTransaction("rollback", this)
    }

    if (itemContext.context.options.modifier && itemContext.context.options.modifier.modifyConnection)
      obj = itemContext.context.options.modifier.modifyConnection(obj)

    return obj
  }
}
