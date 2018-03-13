import { createPool } from "./Pool"
import { BasicDatabaseConnection } from "./driver-definitions"
import { PoolOptions, DatabaseConnection } from "./transactions-definitions"
import { toDatabaseConnection } from "./DatabaseConnection"

export async function createConnection(newCn: () => Promise<BasicDatabaseConnection>, poolOptions: PoolOptions = {})
  : Promise<DatabaseConnection> {
  let pool = await createPool(newCn, poolOptions)
  return toDatabaseConnection(pool.singleUse, pool)
}

export { BasicDatabaseConnection, BasicPreparedStatement, BasicExecResult } from "./driver-definitions"
export { DatabaseConnection, ExecResult, PoolOptions, PreparedStatement } from "./transactions-definitions"