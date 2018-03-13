import { createPool } from "./Pool"
import { BasicDatabaseConnection } from "./driver-definitions"
import { PoolOptions, DatabaseConnection, PreparedStatement } from "./common-definitions"
import { toDatabaseConnection } from "./DatabaseConnection"

export interface DbcOptions {
  initDatabaseConnection?(cn: DatabaseConnection): void | Promise<void>
  modifyDatabaseConnection?(cn: DatabaseConnection): DatabaseConnection | Promise<DatabaseConnection>
  modifyPreparedStatement?(ps: PreparedStatement): PreparedStatement | Promise<PreparedStatement>
  poolOptions?: PoolOptions
}

export async function createConnection(cnProvider: () => Promise<BasicDatabaseConnection>, options: DbcOptions = {})
  : Promise<DatabaseConnection> {
  let pool = await createPool(cnProvider, options.poolOptions)
  return await toDatabaseConnection(options, pool.singleUse, pool)
}

export { BasicDatabaseConnection, BasicPreparedStatement, BasicExecResult } from "./driver-definitions"
export { DatabaseConnection, ExecResult, PoolOptions, PreparedStatement } from "./common-definitions"