import { BasicDatabaseConnection } from "ladc"
import { ClientConfig } from "pg"
import { createPgConnection, toBasicDatabaseConnection } from "./BasicDatabaseConnection"
import { LadcPgOptions } from "./exported-definitions"

export function pgConnectionProvider(config: string | ClientConfig, ladcPgOptions: LadcPgOptions = {}): () => Promise<BasicDatabaseConnection> {
  return async () => {
    let db = await createPgConnection(config)
    return toBasicDatabaseConnection(db, ladcPgOptions)
  }
}