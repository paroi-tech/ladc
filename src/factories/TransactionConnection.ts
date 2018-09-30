import { BasicDatabaseConnection } from "../driver-definitions"
import { SqlParameters, TransactionConnection } from "../exported-definitions"
import { toSingleRow, toSingleValue } from "../helpers"
import { CursorItem } from "./Cursor"
import { Context } from "./DatabaseConnection"
import { toExecResult } from "./ExecResult"
import { PsProvider } from "./PreparedStatement"

export class TxProvider {
  private items = new Set<TxItem>()

  constructor(private context: Context) {
  }

  async create(): Promise<TransactionConnection> {
    let item = await TxItem.create({
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
    let basic: BasicDatabaseConnection = await txContext.context.pool.grab(true)
    await basic.exec("begin")
    return new TxItem(txContext, basic)
  }

  tx: TransactionConnection
  private psProvider?: PsProvider
  private cursorItem?: CursorItem

  constructor(itemContext: TxItemContext, basic: BasicDatabaseConnection) {
    this.tx = this.toTx(itemContext, basic)
  }

  hasCursor() {
    return !!this.cursorItem
  }

  private canCreateCursor(): boolean {
    return !this.cursorItem && (!this.psProvider || !this.psProvider.hasCursor())
  }

  private async closeDependencies() {
    let promises: Array<Promise<void>> = []
    if (this.cursorItem)
      promises.push(this.cursorItem.close())
    if (this.psProvider)
      promises.push(this.psProvider.closeAll())
    await promises
  }

  private toTx(itemContext: TxItemContext, basic: BasicDatabaseConnection | undefined): TransactionConnection {
    let obj: TransactionConnection = {
      prepare: async (sql: string, params?: SqlParameters) => {
        if (closed)
          throw new Error(`Invalid call to 'prepare', the connection is closed`)
        if (!this.psProvider) {
          this.psProvider = new PsProvider({
            context: itemContext.context,
            exclusiveCn: basic,
            canCreateCursor: () => this.canCreateCursor()
          })
        }
        return await this.psProvider.prepare(sql, params)
      },
      async exec(sql: string, params?: SqlParameters) {
        if (!basic)
          throw new Error(`Invalid call to 'exec', not in a transaction`)
        return toExecResult(itemContext.context, await basic.exec(sql, params))
      },
      all: cnBasicCallback("all"),
      singleRow: async (sql: string, params?: SqlParameters) => toSingleRow(await obj.all(sql, params)),
      singleValue: async (sql: string, params?: SqlParameters) => toSingleValue(await obj.singleRow(sql, params)),
      cursor: async (sql: string, params?: SqlParameters) => {
        if (!basic)
          throw new Error(`Invalid call to 'cursor', not in a transaction`)
        if (!this.canCreateCursor())
          throw new Error("Only one cursor is allowed by underlying transaction")
        this.cursorItem = new CursorItem({
          context: itemContext.context,
          end: () => {
            this.cursorItem = undefined
          }
        }, await basic.cursor(sql, params))
        return this.cursorItem.cursor
      },
      script: cnBasicCallback("script"),

      get inTransaction() {
        return !!basic
      },
      commit: () => endOfTransaction("commit", () => this.closeDependencies()),
      rollback: () => endOfTransaction("rollback", () => this.closeDependencies())
    }
    if (itemContext.context.options.modifyConnection)
      obj = itemContext.context.options.modifyConnection(obj)
    return obj

    async function endOfTransaction(method: "commit" | "rollback", closeDependencies: () => Promise<void>) {
      if (!basic)
        throw new Error(`Invalid call to '${method}', not in a transaction`)
      let copy = basic
      basic = undefined
      try {
        await closeDependencies()
        await copy.exec(method)
        itemContext.context.pool.release(copy)
      } catch (err) {
        itemContext.context.pool.abandon(copy)
        throw err
      }
    }

    function cnBasicCallback(method: string) {
      return (...args) => {
        if (!basic)
          throw new Error(`Invalid call to '${method}', not in a transaction`)
        return basic[method](...args)
      }
    }
  }
}
