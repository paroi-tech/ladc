import { LadcAsyncIterableIterator } from "../exported-definitions"
import { Context } from "./DatabaseConnection"

export class CursorProvider {
  private items = new Set<CursorItem>()

  constructor(private context: Context) {
  }

  async open(sql, params): Promise<LadcAsyncIterableIterator<any>> {
    let { pool } = this.context
    let cn = await pool.grab()
    let inst = new CursorItem(
      {
        context: this.context,
        end: (item: CursorItem) => {
          this.items.delete(item)
          pool.release(cn)
        }
      },
      await cn.cursor(sql, params)
    )
    this.items.add(inst)
    return inst.cursor
  }

  async closeAll() {
    await Promise.all(Array.from(this.items).map(item => item.close()))
  }
}

interface CursorItemContext {
  context: Context
  end: (item: CursorItem) => void
}

export class CursorItem {
  cursor: LadcAsyncIterableIterator<any>

  constructor(itemContext: CursorItemContext, basic: LadcAsyncIterableIterator<any>) {
    this.cursor = this.toCursor(itemContext, basic)
  }

  async close(): Promise<void> {
    if (this.cursor.return)
      await this.cursor.return()
  }

  private toCursor(itemContext: CursorItemContext, basic: LadcAsyncIterableIterator<any> | undefined) {
    let obj: LadcAsyncIterableIterator<any> = {
      [Symbol.asyncIterator]: () => obj,
      next: async () => {
        if (!basic)
          return { done: true, value: undefined }
        let result = await basic.next()
        if (result.done) {
          basic = undefined
          itemContext.end(this)
        }
        return result
      },
      return: async () => {
        if (!basic)
          return { done: true, value: undefined }
        itemContext.end(this)
        let returnCb = basic.return
        basic = undefined
        if (returnCb)
          return await returnCb()
        return { done: true, value: undefined }
      },
      throw: async err => {
        if (!basic)
          throw err
        itemContext.end(this)
        let throwCb = basic.return
        basic = undefined
        if (throwCb)
          await throwCb(err)
        throw err
      }
    }
    return obj
  }
}
