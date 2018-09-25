import { ClientConfig } from "pg"
import { BasicDatabaseConnection } from "mycn"
import { createPgConnection, toBasicDatabaseConnection } from "./BasicDatabaseConnection"
import { MycnPgOptions } from "./exported-definitions"

export function pgConnectionProvider(config: string | ClientConfig, mycnPgOptions: MycnPgOptions = {}): () => Promise<BasicDatabaseConnection> {
  return async () => {
    let db = await createPgConnection(config)
    return toBasicDatabaseConnection(db, mycnPgOptions)
  }
}