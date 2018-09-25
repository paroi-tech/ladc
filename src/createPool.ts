import { BasicDatabaseConnection } from "./driver-definitions"
import { Debug, MycnOptions } from "./exported-definitions"

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
  const debugLog = options.debugLog

  if (debugLog)
    provider = wrapProvider(provider, debugLog)

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

      // await ready

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
        if (debugLog)
          db = wrapAsyncMethods(db, id, debugLog)
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
console.log('CLOSE POOL', typeof cleaning)
      if (cleaning)
        clearInterval(cleaning)
    }
  }

  // const ready = options.onInit ? pool.grab().then(cn => options.onInit!(cn)).catch(err => {
  //   logError(err)
  //   throw new Error('')
  // }) : Promise.resolve()

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

  function wrapProvider(provider: () => Promise<BasicDatabaseConnection>, debugLog: (debug: Debug) => void): () => Promise<BasicDatabaseConnection> {
    return async () => {
      try {
        let result = await provider()
        debugLog({ result })
        return result
      } catch (error) {
        debugLog({ error })
        throw error
      }
    }
  }

  function wrapAsyncMethods(db: BasicDatabaseConnection, idInPool: number, debugLog: (debug: Debug) => void): BasicDatabaseConnection {
    let inTransactions = new WeakSet<any>()
    let wrap: any = {}
    for (let name of Object.keys(db)) {
      wrap[name] = async (...args) => {
        if (name === "exec" && args.length === 1 && args[0] === "begin")
          inTransactions.add(wrap)
        try {
          let result = await db[name](...args)
          debugLog({
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
          debugLog({
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
