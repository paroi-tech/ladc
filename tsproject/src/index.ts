import { createPool } from "./Pool"
import { BasicDatabaseConnection } from "./driver-definitions"
import { PoolOptions, DatabaseConnection, PreparedStatement, DbcOptions } from "./common-definitions"
import { toDatabaseConnection } from "./DatabaseConnection"

export async function createConnection(cnProvider: () => Promise<BasicDatabaseConnection>, options: DbcOptions = {})
  : Promise<DatabaseConnection> {
  let pool = await createPool(cnProvider, options.poolOptions)
  return await toDatabaseConnection(options, pool.singleUse, pool)
}

export { BasicDatabaseConnection, BasicPreparedStatement, BasicExecResult } from "./driver-definitions"
export { DatabaseConnection, ExecResult, PoolOptions, PreparedStatement } from "./common-definitions"