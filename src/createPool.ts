import { BasicDatabaseConnection } from "./driver-definitions"
import { DebugError, MycnOptions } from "./exported-definitions"

export interface Pool {
  grab(): Promise<BasicDatabaseConnection>
  release(db: BasicDatabaseConnection): void
  close(): Promise<void>
}

interface PoolItem {
  db: BasicDatabaseConnection
  releaseTime: number
}

export default function createPool(provider: () => Promise<BasicDatabaseConnection>, options: MycnOptions): Pool {
  let poolOptions = options.poolOptions || {}
  const connectionTtl = poolOptions.connectionTtl || 60
  const logMonitoring = poolOptions.logMonitoring || (() => {})
  // tslint:disable-next-line:no-console
  const logError = options.logError || (err => console.error(err))
  const debugLog = options.debugLog

  let closed = false
  let available = [] as PoolItem[]
  let cleaning: any | null = null

  let counter = 0
  let identifiers = new WeakMap<BasicDatabaseConnection, number>()

  return {
    grab: async () => {
      if (closed)
        throw new Error(`Invalid call to "grab", the pool is closed`)
      let item = available.pop()
      let db: BasicDatabaseConnection
      if (item)
        db = item.db
      else {
        db = await provider()
        identifiers.set(db, ++counter)
        logMonitoring({ event: "open", cn: db, id: identifiers.get(db) })
      }
      logMonitoring({ event: "grab", cn: db, id: identifiers.get(db) })
      return debugLog ? wrapAsyncMethods(db, debugLog) : db
    },
    release: (db: BasicDatabaseConnection) => {
      logMonitoring({ event: "release", cn: db, id: identifiers.get(db) })
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
        logMonitoring({ event: "close", cn: item.db, id: identifiers.get(item.db) })
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
    let olderThanTime = Date.now() - 1000 * connectionTtl
    let index: number
    for (index = 0; index < available.length; ++index) {
      if (!force && available[index].releaseTime > olderThanTime)
        break
      let db = available[index].db
      logMonitoring({ event: "close", cn: db, id: identifiers.get(db) })
      db.close().catch(err => logError(err))
    }
    if (index > 0)
      available = available.slice(index)
  }

  function wrapAsyncMethods(db: BasicDatabaseConnection, debugLog: (err: DebugError) => void): BasicDatabaseConnection {
    let inTransactions = new WeakSet<any>()
    let wrap: any = {}
    for (let name of Object.keys(db)) {
      wrap[name] = (...args) => {
        if (name === "exec" && args.length === 1 && args[0] === "begin")
          inTransactions.add(wrap)
        try {
          return db[name](...args)
        } catch (err) {
          debugLog({
            connection: db,
            method: name,
            error: err,
            inTransaction: inTransactions.has(wrap),
            idInPool: identifiers.get(db)
          })
          throw err
        }
      }
    }
    return wrap
  }
}
