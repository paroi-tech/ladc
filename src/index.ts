import { ClientConfig } from "pg";
import { BasicDatabaseConnection } from "mycn";
import { createPgConnection, toBasicDatabaseConnection } from "./BasicDatabaseConnection";

export function pgConnectionProvider(config: string | ClientConfig): () => Promise<BasicDatabaseConnection> {
  return async () => {
    let db = await createPgConnection(config)
    return toBasicDatabaseConnection(db)
  }
}