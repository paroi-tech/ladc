import { SqlParameters } from "../exported-definitions"
import { Context } from "./MainConnection"

export class CursorProvider {
  private items = new Set<CursorItem>()

  constructor(private context: Context) {
  }

  async open(sql: string, params?: SqlParameters): Promise<AsyncIterableIterator<any>> {
    const { pool } = this.context
    const cn = await pool.grab()
    const inst = new CursorItem(
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
  cursor: AsyncIterableIterator<any>

  constructor(itemContext: CursorItemContext, ac: AsyncIterableIterator<any>) {
    this.cursor = this.toCursor(itemContext, ac)
  }

  async close(): Promise<void> {
    if (this.cursor.return)
      await this.cursor.return()
  }

  private toCursor(itemContext: CursorItemContext, ac: AsyncIterableIterator<any> | undefined) {
    const obj: AsyncIterableIterator<any> = {
      [Symbol.asyncIterator]: () => obj,
      next: async () => {
        if (!ac)
          return { done: true, value: undefined }
        const result = await ac.next()
        if (result.done) {
          ac = undefined
          itemContext.end(this)
        }
        return result
      },
      return: async () => {
        if (!ac)
          return { done: true, value: undefined }
        itemContext.end(this)
        const returnCb = ac.return
        ac = undefined
        if (returnCb)
          return await returnCb()
        return { done: true, value: undefined }
      },
      throw: async err => {
        if (!ac)
          throw err
        itemContext.end(this)
        const throwCb = ac.return
        ac = undefined
        if (throwCb)
          await throwCb(err)
        throw err
      }
    }
    return obj
  }
}
