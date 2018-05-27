import { PoolOptions } from "./exported-definitions"

export interface Closable {
  close(): Promise<void>
}

export interface Pool<C extends Closable> {
  grab(): Promise<C>
  release(db: C): void
  close(): Promise<void>
}

interface PoolItem<C extends Closable> {
  db: C
  releaseTime: number
}

export async function createPool<C extends Closable>(provider: () => Promise<C>, options: PoolOptions = {}): Promise<Pool<C>> {
  let opt = {
    connectionTtl: options.connectionTtl || 60,
    logError: options.logError || (msg => console.log(msg)),
    logMonitoring: options.logMonitoring || (() => {})
  }
  let closed = false
  let available = [] as PoolItem<C>[]
  let cleaning: any | null = null

  let counter = 0
  let map = new WeakMap<C, number>()

  return {
    grab: async () => {
      if (closed)
        throw new Error(`Invalid call to "grab", the pool is closed`)
      let pi = available.pop()
      let db: C
      if (pi)
        db = pi.db
      else {
        db = await provider()
        map.set(db, ++counter)
        opt.logMonitoring({ event: "open", cn: db, id: map.get(db) })
      }
      opt.logMonitoring({ event: "grab", cn: db, id: map.get(db) })
      return db
    },
    release: (db: C) => {
      opt.logMonitoring({ event: "release", cn: db, id: map.get(db) })
      available.push({ db, releaseTime: Date.now() })
      if (closed)
        cleanOldConnections(true)
      else
        startCleaning()
    },
    close: async () => {
      if (closed)
        throw new Error(`Invalid call to "close", the pool is already closed`)
      closed = true
      for (let item of available) {
        opt.logMonitoring({ event: "close", cn: item.db, id: map.get(item.db) })
        await item.db.close()
      }
      available = []
    }
  }

  function startCleaning() {
    if (cleaning !== null)
      return
    let stopCount = 0
    cleaning = setInterval(() => {
      cleanOldConnections()
      if (available.length > 0)
        stopCount = 0
      else if (++stopCount >= 10) {
        clearInterval(cleaning)
        cleaning = null
      }
    }, 1000)
  }

  function cleanOldConnections(force = false) {
    let olderThanTime = Date.now() - 1000 * opt.connectionTtl
    let index: number
    for (index = 0; index < available.length; ++index) {
      if (!force && available[index].releaseTime > olderThanTime)
        break
      let db = available[index].db
      opt.logMonitoring({ event: "close", cn: db, id: map.get(db) })
      db.close().catch(opt.logError)
    }
    if (index > 0)
      available = available.slice(index)
  }
}
