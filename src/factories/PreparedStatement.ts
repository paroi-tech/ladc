import { BasicMainConnection, BasicPreparedStatement } from "../driver-definitions"
import { PreparedStatement, SqlParameters } from "../exported-definitions"
import { toSingleRow, toSingleValue } from "../helpers"
import { CursorItem } from "./Cursor"
import { toExecResult } from "./ExecResult"
import { Context } from "./MainConnection"

export interface PsProviderContext {
  exclusiveCn?: BasicMainConnection
  context: Context
  canCreateCursor(): boolean
}

export class PsProvider {
  private items = new Set<PsItem>()

  constructor(private ppContext: PsProviderContext) {
  }

  async prepare(sql: string, params?: SqlParameters): Promise<PreparedStatement<any>> {
    let item = await PsItem.create(await this.createPsContext(), sql, params)
    this.items.add(item)
    return item.ps
  }

  async closeAll() {
    await Promise.all(Array.from(this.items).map(item => item.ps.close()))
  }

  hasCursor() {
    for (let item of this.items) {
      if (item.hasCursor())
        return true
    }
    return false
  }

  private async createPsContext(): Promise<PsItemContext> {
    let { exclusiveCn } = this.ppContext
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
    let { pool } = this.ppContext.context
    let cn = await pool.grab()
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
  cn: BasicMainConnection
  end: (item: PsItem) => void
  canCreateCursor(): boolean
}

class PsItem {
  static async create(psContext: PsItemContext, sql: string, params?: SqlParameters): Promise<PsItem> {
    let basic = await psContext.cn.prepare(sql, params)
    return new PsItem(psContext, basic, params)
  }

  ps: PreparedStatement<any>
  private cursorItem?: CursorItem
  private boundParameters: Set<number | string>

  constructor(itemContext: PsItemContext, basic: BasicPreparedStatement, initialParams?: SqlParameters) {
    this.boundParameters = paramNamesOf(initialParams)
    this.ps = this.toPs(itemContext, basic)
  }

  hasCursor() {
    return !!this.cursorItem
  }

  private toPs(itemContext: PsItemContext, basic: BasicPreparedStatement | undefined) {
    let obj: PreparedStatement<any> = {
      exec: async (params?: SqlParameters) => {
        check("exec")
        return toExecResult(itemContext.context, await basic!.exec(params))
      },
      all: async (params?: SqlParameters) => {
        check("all")
        return await basic!.all(params)
      },
      singleRow: async (params?: SqlParameters) => toSingleRow(await obj.all(params)),
      singleValue: async (params?: SqlParameters) => toSingleValue(await obj.singleRow(params)),
      cursor: async (params?: SqlParameters) => {
        check("cursor")
        if (!itemContext.canCreateCursor())
          throw new Error("Only one cursor is allowed by underlying transaction")
        this.cursorItem = new CursorItem({
          context: itemContext.context,
          end: () => {
            this.cursorItem = undefined
          }
        }, await basic!.cursor(params))
        return this.cursorItem.cursor
      },
      bind: async (nbOrKey: number | string, value: any) => {
        check("bind")
        this.boundParameters.add(nbOrKey)
        basic!.bind(nbOrKey, value)
      },
      unbind: async (nbOrKey: number | string) => {
        check("unbind")
        this.boundParameters.delete(nbOrKey)
        basic!.unbind(nbOrKey)
      },
      unbindAll: async () => {
        check("unbindAll")
        this.boundParameters.forEach(nbOrKey => basic!.unbind(nbOrKey))
        this.boundParameters.clear()
      },
      bindAll: async (params: SqlParameters) => {
        check("bindAll")
        this.boundParameters.forEach(nbOrKey => basic!.unbind(nbOrKey))
        this.boundParameters = paramNamesOf(params)
        if (Array.isArray(params))
          params.forEach((val, index) => basic!.bind(index + 1, val))
        else
          Object.entries(params).forEach(([key, val]) => basic!.bind(key, val))
      },
      close: async () => {
        if (!basic)
          throw new Error(`Prepared statement is already closed`)
        let copy = basic
        basic = undefined
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
      if (!basic)
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