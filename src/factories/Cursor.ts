import { BasicCursor } from "../driver-definitions"
import { Cursor } from "../exported-definitions"
import { Context } from "./DatabaseConnection"

export class CursorProvider {
  private items = new Set<CursorItem>()

  constructor(private context: Context) {
  }

  async open(sql, params): Promise<Cursor<any>> {
    let { pool } = this.context
    let cn = await pool.grab()
    let inst = new CursorItem({
      context: this.context,
      end: (item: CursorItem) => {
        this.items.delete(item)
        pool.release(cn)
      }
    }, await cn.cursor(sql, params))
    this.items.add(inst)
    return inst.cursor
  }

  async closeAll() {
    await Promise.all(Array.from(this.items).map(item => item.cursor.close()))
  }
}

interface CursorItemContext {
  context: Context
  end: (item: CursorItem) => void
}

export class CursorItem {
  cursor: Cursor<any>

  constructor(itemContext: CursorItemContext, basic: BasicCursor) {
    this.cursor = this.toCursor(itemContext, basic)
  }

  private toCursor(itemContext: CursorItemContext, basic: BasicCursor | undefined) {
    return {
      fetch: async () => {
        if (!basic)
          throw new Error(`Invalid call to 'fetch', the cursor is closed`)
        let row = await basic.fetch()
        if (!row) {
          basic = undefined
          itemContext.end(this)
        }
        return row
      },
      close: async () => {
        if (!basic)
          throw new Error(`Cursor is already closed`)
        let copy = basic
        basic = undefined
        await copy.close()
        itemContext.end(this)
      }
    }
  }
}
