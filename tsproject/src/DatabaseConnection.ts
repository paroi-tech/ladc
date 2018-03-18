import { Pool } from "./Pool"
import { DatabaseConnection, PreparedStatement, MycnOptions, SqlParameters, ExecResult } from "./exported-definitions";
import { BasicDatabaseConnection, BasicPreparedStatement, BasicExecResult } from "./driver-definitions";

export async function toDatabaseConnection(options: MycnOptions, cn: BasicDatabaseConnection | undefined, pool: Pool<BasicDatabaseConnection>, inTrans = false): Promise<DatabaseConnection> {
  let endedTrans = false
  let prepareCb = cnBasicCallback("prepare")
  let thisObj: DatabaseConnection = {
    exec: async (sql: string, params?: SqlParameters) => {
      if (!cn)
        throw new Error(`Invalid call to 'exec', the connection is closed`)
      return toExecResult(options, await cn.exec(sql, params))
    },
    all: cnBasicCallback("all"),
    prepare: async (sql: string, params?: SqlParameters) => await toPreparedStatement(options, await prepareCb(sql, params)),
    execScript: (sql: string) => {
      if (!cn)
        throw new Error(`Invalid call to 'execScript', the connection is closed`)
      return cn.execScript(sql)
    },
    singleRow: async (sql: string, params?: SqlParameters) => toSingleRow(await thisObj.all(sql, params)),
    singleValue: async (sql: string, params?: SqlParameters) => toSingleValue(await thisObj.singleRow(sql, params)),
    get inTransaction() {
      return inTrans
    },
    commit: () => endOfTransaction("commit"),
    rollback: () => endOfTransaction("rollback"),
    beginTransaction: async (force = false) => {
      if (!cn)
        throw new Error(`Invalid call to 'beginTransaction', the connection is closed`)
      if (inTrans)
        throw new Error("Cannot open a transaction in a transaction")
      let newCn = await pool.grab()
      await newCn.exec("begin")
      return await toDatabaseConnection(options, newCn, pool, true)
    },
    close: async () => {
      if (!cn)
        throw new Error(`Invalid call to 'close', the connection is already closed`)
      let promise: Promise<void> | undefined
      if (inTrans)
        promise = thisObj.rollback()
      cn = undefined
      if (promise)
        await promise
      if (!endedTrans && pool.singleUse === cn)
        await pool.close()
    }
  }
  if (options.init)
    await options.init(thisObj)
  if (options.modifyDatabaseConnection)
    thisObj = await options.modifyDatabaseConnection(thisObj)
  return thisObj

  async function endOfTransaction(method) {
    if (!cn)
      throw new Error(`Invalid call to '${method}', the connection is closed`)
    if (!inTrans || cn === pool.singleUse)
      throw new Error(`Cannot '${method}', not in a transaction`)
    inTrans = false
    endedTrans = true
    await cn.exec(method)
    pool.release(cn)
    cn = pool.singleUse
  }

  function cnBasicCallback(method: string) {
    return (sql: string, params?: SqlParameters) => {
      if (!cn)
        throw new Error(`Invalid call to '${method}', the connection is closed`)
      return cn[method](sql, params)
    }
  }
}

async function toPreparedStatement(options: MycnOptions, ps: BasicPreparedStatement): Promise<PreparedStatement> {
  let thisObj = {
    exec: async (params?: SqlParameters) => toExecResult(options, await ps.exec(params)),
    all: (params?: SqlParameters) => ps.all(params),
    fetch: () => ps.fetch(),
    bind: (key: number | string, value: any) => ps.bind(key, value),
    unbindAll: () => ps.unbindAll(),
    finalize: () => ps.finalize(),
    singleRow: async (params?: SqlParameters) => toSingleRow(await thisObj.all(params)),
    singleValue: async (params?: SqlParameters) => toSingleValue(await thisObj.singleRow(params))
  }
  if (options.modifyPreparedStatement)
    thisObj = await options.modifyPreparedStatement(thisObj)
  return thisObj
}

function toExecResult(options: MycnOptions, result: BasicExecResult): ExecResult {
  return {
    affectedRows: result.affectedRows,
    getInsertedId: (seqName?: string) => {
      let id = result.getInsertedId(seqName)
      if (id === undefined && !options.insertedIdCanBeUndefined)
        throw new Error(`Missing inserted ID`)
      if (options.insertedIdCanBeAny)
        return id
      switch (typeof id) {
        case "string":
          return id
        case "number":
          return id.toString()
        default:
          throw new Error(`Unexpected type of inserted id: ${typeof id}`)
      }
    }
  }
}

function toSingleRow(rows: any[]) {
  if (rows.length !== 1) {
    if (rows.length === 0)
      return
    throw new Error(`Cannot fetch one row, row count: ${rows.length}`)
  }
  return rows[0]
}

function toSingleValue(row: any) {
  if (row === undefined)
    return
  let columns = Object.keys(row)
  if (columns.length !== 1)
    throw new Error(`Cannot fetch one value, column count: ${columns.length}`)
  return row[columns[0]]
}
