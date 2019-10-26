import { AConnection, APreparedStatement } from "../adapter-definitions"
import { PreparedStatement, SqlParameters } from "../exported-definitions"
import { toSingleRow, toSingleValue } from "../helpers"
import { CursorItem } from "./Cursor"
import { toExecResult } from "./ExecResult"
import { Context } from "./MainConnection"

export interface PsProviderContext {
  exclusiveCn?: AConnection
  context: Context
  canCreateCursor(): boolean
}

export class PsProvider {
  private items = new Set<PsItem>()

  constructor(private ppContext: PsProviderContext) {
  }

  async prepare(sql: string): Promise<PreparedStatement<any>> {
    const item = await PsItem.create(await this.createPsContext(), sql)
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
  cn: AConnection
  end: (item: PsItem) => void
  canCreateCursor(): boolean
}

class PsItem {
  static async create(psContext: PsItemContext, sql: string): Promise<PsItem> {
    const aps = await psContext.cn.prepare(sql)
    return new PsItem(psContext, aps)
  }

  ps: PreparedStatement<any>
  private cursorItem?: CursorItem
  private boundParams?: SqlParameters

  constructor(itemContext: PsItemContext, aps: APreparedStatement) {
    this.ps = this.toPs(itemContext, aps)
  }

  hasCursor() {
    return !!this.cursorItem
  }

  private toPs(itemContext: PsItemContext, aps: APreparedStatement | undefined) {
    let obj: PreparedStatement<any> = {
      exec: async (params?: SqlParameters) => {
        itemContext.context.check.parameters(params)
        check("exec")
        return toExecResult(await aps!.exec(mergeParameters(this.boundParams, params)))
      },
      all: async (params?: SqlParameters) => {
        itemContext.context.check.parameters(params)
        check("all")
        return await aps!.all(mergeParameters(this.boundParams, params))
      },
      singleRow: async (params?: SqlParameters) => toSingleRow(await obj.all(params)),
      singleValue: async (params?: SqlParameters) => toSingleValue(await obj.singleRow(params)),
      cursor: async (params?: SqlParameters) => {
        itemContext.context.check.parameters(params)
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
        }, await aps!.cursor(mergeParameters(this.boundParams, params)))
        return this.cursorItem.cursor
      },
      bind: async (paramsOrIndexOrKey: SqlParameters | number | string, value?: any) => {
        check("bind")
        if (typeof paramsOrIndexOrKey === "object") {
          itemContext.context.check.parameters(paramsOrIndexOrKey)
          this.boundParams = mergeParameters(this.boundParams, paramsOrIndexOrKey)
        } else {
          if (typeof paramsOrIndexOrKey === "string") {
            itemContext.context.check.namedParameters()
          }
          (this.boundParams as any)[paramsOrIndexOrKey] = value
        }
      },
      unbind: async (indexOrKey?: number | string) => {
        check("unbind")
        if (indexOrKey === undefined)
          this.boundParams = undefined
        else {
          if (typeof indexOrKey === "string") {
            itemContext.context.check.namedParameters()
          }
          (this.boundParams as any)[indexOrKey] = undefined
        }
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

function mergeParameters(
  params1: SqlParameters | undefined,
  params2: SqlParameters | undefined
): SqlParameters | undefined {
  if (!params1)
    return params2
  if (!params2)
    return params1
  const isArr = Array.isArray(params1)
  if (isArr !== Array.isArray(params2))
    throw new Error("Cannot merge named parameters with positioned parameters")
  if (isArr) {
    const result = [...(params1 as any[])]
    const p2 = params2 as any[]
    p2.forEach((val, index) => result[index] = val)
    return result
  }
  return {
    ...params1,
    ...params2
  }
}