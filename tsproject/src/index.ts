import { createPool } from "./Pool"
import { BasicDatabaseConnection } from "./driver-definitions"
import { PoolOptions, DatabaseConnection, PreparedStatement, MycnOptions } from "./exported-definitions"
import { toDatabaseConnection } from "./DatabaseConnection"

export async function createDatabaseConnection(cnProvider: () => Promise<BasicDatabaseConnection>, options: MycnOptions = {})
  : Promise<DatabaseConnection> {
  let pool = await createPool(cnProvider, options.poolOptions)
  return await toDatabaseConnection(options, pool.singleUse, pool)
}

export { BasicDatabaseConnection, BasicPreparedStatement, BasicExecResult } from "./driver-definitions"
export { DatabaseConnection, ExecResult, PoolOptions, PreparedStatement, MycnOptions, SqlParameters } from "./exported-definitions"