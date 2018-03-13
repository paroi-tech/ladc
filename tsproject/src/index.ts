import { createPool } from "./Pool"
import { BasicDatabaseConnection } from "./driver-definitions"
import { PoolOptions, DatabaseConnection, PreparedStatement } from "./transactions-definitions"
import { toDatabaseConnection } from "./DatabaseConnection"

export interface DbcOptions {
  poolOptions?: PoolOptions
  initDatabaseConnection?(db: DatabaseConnection): void | Promise<void>
  modifyDatabaseConnection?(db: DatabaseConnection): DatabaseConnection | Promise<DatabaseConnection>
  modifyPreparedStatement?(db: PreparedStatement): PreparedStatement | Promise<PreparedStatement>
}

export async function createConnection(newCn: () => Promise<BasicDatabaseConnection>, options: DbcOptions = {})
  : Promise<DatabaseConnection> {
  let pool = await createPool(newCn, options.poolOptions)
  return await toDatabaseConnection(options, pool.singleUse, pool)
}

export { BasicDatabaseConnection, BasicPreparedStatement, BasicExecResult } from "./driver-definitions"
export { DatabaseConnection, ExecResult, PoolOptions, PreparedStatement } from "./transactions-definitions"