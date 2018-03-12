import { Database } from "sqlite"
import { PoolOptions, Connection } from "./common-definitions"
import { doCreateConnection } from "./Connection"
import { createPool } from "./Pool"

export async function sqliteConnection(openSqliteConnection: () => Promise<Database>, poolOptions: PoolOptions = {})
  : Promise<Connection> {
  return await doCreateConnection(await createPool(openSqliteConnection, poolOptions)) as Connection
}

export { Connection, InTransactionConnection, PoolOptions } from "./common-definitions"