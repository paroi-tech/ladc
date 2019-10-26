import { AdapterConnection } from "./adapter-definitions"
import { DebugEvent, LadcOptions } from "./exported-definitions"

export interface Pool {
  /**
   * @param exclusive Default value is `false`.
   */
  grab(exclusive?: boolean): Promise<AdapterConnection>
  release(db: AdapterConnection): void
  abandon(db: AdapterConnection): void
  close(): Promise<void>
}

interface PoolItem {
  db: AdapterConnection
  releaseTime: number
}

export default function createPool(provider: () => Promise<AdapterConnection>, options: LadcOptions): Pool {
  const poolOptions = options.poolOptions || {}
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
  let nonExclusiveDb: AdapterConnection | undefined
  let nonExclusiveCount = 0
  let cleaning: any | undefined

  let counter = 0
  const identifiers = new WeakMap<AdapterConnection, number>()

  return {
    grab: async (exclusive = false) => {
      if (closed)
        throw new Error(`Invalid call to "grab", the pool is closed`)

      if (!exclusive && nonExclusiveDb) {
        ++nonExclusiveCount
        return nonExclusiveDb
      }

      const item = available.pop()
      let db: AdapterConnection
      if (item)
        db = item.db
      else {
        db = await provider()
        const id = ++counter
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
    release: (db: AdapterConnection) => {
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
    abandon: (db: AdapterConnection) => {
      logMonitoring({ event: "abandon", cn: db, id: identifiers.get(db) })
      if (db === nonExclusiveDb) {
        --nonExclusiveCount
        nonExclusiveDb = undefined
      }
      db.close().catch(err => logError(err))
    },
    close: async () => {
      if (closed)
        throw new Error(`Invalid call to "close", the pool is already closed`)
      closed = true
      const closeAll = available.map(item => {
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
    const olderThanTime = Date.now() - 1000 * connectionTtl
    let index: number
    const lastIndex = available.length - 1
    for (index = 0; index <= lastIndex; ++index) {
      if (!force) {
        const tooOld = available[index].releaseTime > olderThanTime
        const keepThisOne = keepOneConnection && !nonExclusiveDb && index === lastIndex
        if (tooOld || keepThisOne)
          break
      }
      const db = available[index].db
      logMonitoring({ event: "close", cn: db, id: identifiers.get(db) })
      db.close().catch(err => logError(err))
    }
    if (index > 0)
      available = available.slice(index)
  }

  function debugWrapProvider(provider: () => Promise<AdapterConnection>, logDebug: (debug: DebugEvent) => void): () => Promise<AdapterConnection> {
    return async () => {
      try {
        const result = await provider()
        logDebug({ result })
        return result
      } catch (error) {
        logDebug({ error })
        throw error
      }
    }
  }

  function debugWrapAsyncMethods(db: AdapterConnection, idInPool: number, logDebug: (debug: DebugEvent) => void): AdapterConnection {
    const inTransactions = new WeakSet<any>()
    const wrap: any = {}
    for (const name of Object.keys(db)) {
      wrap[name] = async (...args: any[]) => {
        if (name === "exec" && args.length === 1 && args[0] === "begin")
          inTransactions.add(wrap)
        try {
          const result = await (db as any)[name](...args)
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
