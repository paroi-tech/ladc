import { BasicDatabaseConnection } from "./driver-definitions"
import { DebugEvent, MycnOptions } from "./exported-definitions"

export interface Pool {
  /**
   * @param exclusive Default value is `false`.
   */
  grab(exclusive?: boolean): Promise<BasicDatabaseConnection>
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
  const logMonitoring = poolOptions.logMonitoring || (() => { })
  const keepOneConnection = !!poolOptions.keepOneConnection
  // tslint:disable-next-line:no-console
  const logError = options.logError || (err => console.error(err))
  const logDebug = options.logDebug

  if (logDebug)
    provider = debugWrapProvider(provider, logDebug)

  let closed = false
  let available: PoolItem[] = []
  let nonExclusiveDb: BasicDatabaseConnection | undefined
  let nonExclusiveCount = 0
  let cleaning: any | undefined

  let counter = 0
  let identifiers = new WeakMap<BasicDatabaseConnection, number>()

  return {
    grab: async (exclusive = false) => {
      if (closed)
        throw new Error(`Invalid call to "grab", the pool is closed`)

      if (!exclusive && nonExclusiveDb) {
        ++nonExclusiveCount
        return nonExclusiveDb
      }

      let item = available.pop()
      let db: BasicDatabaseConnection
      if (item)
        db = item.db
      else {
        db = await provider()
        let id = ++counter
        if (logDebug)
          db = debugWrapAsyncMethods(db, id, logDebug)
        identifiers.set(db, id)
        logMonitoring({ event: "open", cn: db, id: identifiers.get(db) })
      }

      if (!exclusive) {
        ++nonExclusiveCount
        nonExclusiveDb = db
      }

      logMonitoring({ event: "grab", cn: db, id: identifiers.get(db) || -123 })
      return db
    },
    release: (db: BasicDatabaseConnection) => {
      logMonitoring({ event: "release", cn: db, id: identifiers.get(db) })
      if (db === nonExclusiveDb) {
        if (--nonExclusiveCount === 0) {
          nonExclusiveDb = undefined
          available.push({ db, releaseTime: Date.now() })
        }
      } else
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
      let closeAll = available.map(item => {
        logMonitoring({ event: "close", cn: item.db, id: identifiers.get(item.db) })
        return item.db.close()
      })
      available = []
      await Promise.all(closeAll)
      if (cleaning)
        clearInterval(cleaning)
    }
  }

  function startCleaning() {
    if (cleaning)
      return
    let stopCount = 0
    cleaning = setInterval(() => {
      cleanOldConnections()
      if (available.length > 0)
        stopCount = 0
      else if (++stopCount >= 10) {
        clearInterval(cleaning)
        cleaning = undefined
      }
    }, 1000)
    cleaning.unref()
  }

  function cleanOldConnections(force = false) {
    let olderThanTime = Date.now() - 1000 * connectionTtl
    let index: number
    let lastIndex = available.length - 1
    for (index = 0; index <= lastIndex; ++index) {
      if (!force) {
        let tooOld = available[index].releaseTime > olderThanTime
        let keepThisOne = keepOneConnection && !nonExclusiveDb && index === lastIndex
        if (tooOld || keepThisOne)
          break
      }
      let db = available[index].db
      logMonitoring({ event: "close", cn: db, id: identifiers.get(db) })
      db.close().catch(err => logError(err))
    }
    if (index > 0)
      available = available.slice(index)
  }

  function debugWrapProvider(provider: () => Promise<BasicDatabaseConnection>, logDebug: (debug: DebugEvent) => void): () => Promise<BasicDatabaseConnection> {
    return async () => {
      try {
        let result = await provider()
        logDebug({ result })
        return result
      } catch (error) {
        logDebug({ error })
        throw error
      }
    }
  }

  function debugWrapAsyncMethods(db: BasicDatabaseConnection, idInPool: number, logDebug: (debug: DebugEvent) => void): BasicDatabaseConnection {
    let inTransactions = new WeakSet<any>()
    let wrap: any = {}
    for (let name of Object.keys(db)) {
      wrap[name] = async (...args) => {
        if (name === "exec" && args.length === 1 && args[0] === "begin")
          inTransactions.add(wrap)
        try {
          let result = await db[name](...args)
          logDebug({
            callingContext: {
              connection: db,
              method: name,
              args,
              inTransaction: inTransactions.has(wrap),
              idInPool,
            },
            result
          })
          return result
        } catch (error) {
          logDebug({
            callingContext: {
              connection: db,
              method: name,
              args,
              inTransaction: inTransactions.has(wrap),
              idInPool
            },
            error
          })
          throw error
        }
      }
    }
    return wrap
  }
}
