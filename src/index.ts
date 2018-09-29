import { BasicDatabaseConnection } from "mycn"
import sqlite3 from "sqlite3"
import { toBasicDatabaseConnection } from "./BasicDatabaseConnection"
import { Sqlite3ConnectionOptions } from "./exported-definitions"
import { createSqlite3Connection } from "./promisifySqlite3"

export function sqlite3ConnectionProvider(options: Sqlite3ConnectionOptions): () => Promise<BasicDatabaseConnection> {
  if (options.verbose)
    sqlite3.verbose()
  return async () => {
    let db = await createSqlite3Connection(options)
    return toBasicDatabaseConnection(db)
  }
}

export * from "./exported-definitions"