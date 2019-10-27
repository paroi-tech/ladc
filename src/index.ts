import { LadcAdapter } from "ladc"
import * as sqlite3 from "sqlite3"
import { toAConnection } from "./AConnection"
import { Sqlite3ConnectionOptions } from "./exported-definitions"
import { createSqlite3Connection } from "./promisifySqlite3"

export default function sqlite3Adapter(options: Sqlite3ConnectionOptions): LadcAdapter {
  if (options.verbose)
    sqlite3.verbose()
  return {
    createConnection: async () => {
      const db = await createSqlite3Connection(options)
      return toAConnection(db)
    },
    capabilities: {
      cursors: true,
      namedParameters: true,
      preparedStatements: true,
    }
  }
}

export * from "./exported-definitions"