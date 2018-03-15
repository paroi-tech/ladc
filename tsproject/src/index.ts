import { createPool } from "./Pool"
import { BasicDatabaseConnection } from "./driver-definitions"
import { PoolOptions, DatabaseConnection, PreparedStatement, MycnOptions } from "./exported-definitions"
import { toDatabaseConnection } from "./DatabaseConnection"

export async function createDatabaseConnection(options: MycnOptions): Promise<DatabaseConnection> {
  let pool = await createPool(options.provider, options.poolOptions)
  return await toDatabaseConnection(options, pool.singleUse, pool)
}

export * from "./driver-definitions"
export * from "./exported-definitions"