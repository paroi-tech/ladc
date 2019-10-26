import { AdapterConnection, AdapterPreparedStatement } from "../adapter-definitions"
import { PreparedStatement, SqlParameters } from "../exported-definitions"
import { toSingleRow, toSingleValue } from "../helpers"
import { CursorItem } from "./Cursor"
import { toExecResult } from "./ExecResult"
import { Context } from "./MainConnection"

export interface PsProviderContext {
  exclusiveCn?: AdapterConnection
  context: Context
  canCreateCursor(): boolean
}

export class PsProvider {
  private items = new Set<PsItem>()

  constructor(private ppContext: PsProviderContext) {
  }

  async prepare(sql: string, params?: SqlParameters): Promise<PreparedStatement<any>> {
    const item = await PsItem.create(await this.createPsContext(), sql, params)
    this.items.add(item)
    return item.ps
  }

  async closeAll() {
    await Promise.all(Array.from(this.items).map(item => item.ps.close()))
  }

  hasCursor() {
    for (const item of this.items) {
      if (item.hasCursor())
        return true
    }
    return false
  }

  private async createPsContext(): Promise<PsItemContext> {
    const { exclusiveCn } = this.ppContext
    if (exclusiveCn) {
      return {
        context: this.ppContext.context,
        cn: exclusiveCn,
        end: (item: PsItem) => {
          this.items.delete(item)
        },
        canCreateCursor: () => this.ppContext.canCreateCursor()
      }
    }
    const { pool } = this.ppContext.context
    const cn = await pool.grab()
    return {
      context: this.ppContext.context,
      cn,
      end: (item: PsItem) => {
        this.items.delete(item)
        pool.release(cn)
      },
      canCreateCursor: () => this.ppContext.canCreateCursor()
    }
  }
}

interface PsItemContext {
  context: Context
  cn: AdapterConnection
  end: (item: PsItem) => void
  canCreateCursor(): boolean
}

class PsItem {
  static async create(psContext: PsItemContext, sql: string, params?: SqlParameters): Promise<PsItem> {
    const aps = await psContext.cn.prepare(sql, params)
    return new PsItem(psContext, aps, params)
  }

  ps: PreparedStatement<any>
  private cursorItem?: CursorItem
  private boundParameters: Set<number | string>

  constructor(itemContext: PsItemContext, aps: AdapterPreparedStatement, initialParams?: SqlParameters) {
    this.boundParameters = paramNamesOf(initialParams)
    this.ps = this.toPs(itemContext, aps)
  }

  hasCursor() {
    return !!this.cursorItem
  }

  private toPs(itemContext: PsItemContext, aps: AdapterPreparedStatement | undefined) {
    let obj: PreparedStatement<any> = {
      exec: async (params?: SqlParameters) => {
        check("exec")
        return toExecResult(await aps!.exec(params))
      },
      all: async (params?: SqlParameters) => {
        check("all")
        return await aps!.all(params)
      },
      singleRow: async (params?: SqlParameters) => toSingleRow(await obj.all(params)),
      singleValue: async (params?: SqlParameters) => toSingleValue(await obj.singleRow(params)),
      cursor: async (params?: SqlParameters) => {
        check("cursor")
        if (!itemContext.context.capabilities.cursors)
          throw new Error(`Cursors are not available with this adapter`)
        if (!itemContext.canCreateCursor())
          throw new Error("Only one cursor is allowed by underlying transaction")
        this.cursorItem = new CursorItem({
          context: itemContext.context,
          end: () => {
            this.cursorItem = undefined
          }
        }, await aps!.cursor(params))
        return this.cursorItem.cursor
      },
      bind: async (nbOrKey: number | string, value: any) => {
        check("bind")
        this.boundParameters.add(nbOrKey)
        aps!.bind(nbOrKey, value)
      },
      unbind: async (nbOrKey: number | string) => {
        check("unbind")
        this.boundParameters.delete(nbOrKey)
        aps!.unbind(nbOrKey)
      },
      unbindAll: async () => {
        check("unbindAll")
        this.boundParameters.forEach(nbOrKey => aps!.unbind(nbOrKey))
        this.boundParameters.clear()
      },
      bindAll: async (params: SqlParameters) => {
        check("bindAll")
        this.boundParameters.forEach(nbOrKey => aps!.unbind(nbOrKey))
        this.boundParameters = paramNamesOf(params)
        if (Array.isArray(params))
          params.forEach((val, index) => aps!.bind(index + 1, val))
        else
          Object.entries(params).forEach(([key, val]) => aps!.bind(key, val))
      },
      close: async () => {
        if (!aps)
          throw new Error(`Prepared statement is already closed`)
        const copy = aps
        aps = undefined
        if (this.cursorItem)
          await this.cursorItem.close()
        await copy.close()
        itemContext.end(this)
      }
    }

    if (itemContext.context.options.modifier && itemContext.context.options.modifier.modifyPreparedStatement)
      obj = itemContext.context.options.modifier.modifyPreparedStatement(obj)

    return obj

    function check(method: string) {
      if (!aps)
        throw new Error(`Invalid call to '${method}', the prepared statement is closed`)
    }
  }
}

function paramNamesOf(params?: SqlParameters): Set<number | string> {
  if (!params)
    return new Set()
  if (Array.isArray(params))
    return new Set(Object.keys(params).map(nb => parseInt(nb, 10)))
  return new Set(Object.keys(params))
}