import { Database } from "sqlite"
import { PoolOptions } from "./common-definitions"

export interface Pool {
  readonly singleUse: Database
  grab(): Promise<Database>
  release(db: Database)
  close(): Promise<void>
}

interface PoolItem {
  db: Database
  releaseTime: number
}

export async function createPool(openSqliteConnection: () => Promise<Database>, options: PoolOptions): Promise<Pool> {
  if (!options.logError)
    options.logError = console.log
  if (!options.connectionTtl)
    options.connectionTtl = 60
  let closed = false
  let singleUse = await openSqliteConnection()
  let available = [] as PoolItem[]
  let cleaning: any | null = null

  return {
    get singleUse() {
      if (closed)
        throw new Error(`Cannot use the main connection, the pool is closed`)
      return singleUse
    },
    grab: async () => {
      if (closed)
        throw new Error(`Invalid call to "grab", the pool is closed`)
      let pi = available.pop()
      if (pi)
        return pi.db
      return openSqliteConnection()
    },
    release: (db: Database) => {
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
      await singleUse.close()
    }
  }

  function startCleaning() {
    if (cleaning !== null)
      return
    cleaning = setInterval(() => {
      cleanOldConnections()
      if (available.length === 0) {
        clearInterval(cleaning)
        cleaning = null
      }
    }, 20000) // 20 seconds
  }

  function cleanOldConnections(force = false) {
    let olderThanTime = Date.now() - 1000 * options.connectionTtl!
    let index: number
    for (index = 0; index < available.length; ++index) {
      if (!force && available[index].releaseTime > olderThanTime)
        break
      available[index].db.close().catch(options.logError)
    }
    if (index > 0)
      available = available.slice(index)
  }
}
