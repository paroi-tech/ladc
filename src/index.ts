import { LadcAdapter } from "ladc"
import { ClientConfig } from "pg"
import { createPgConnection, toBasicDatabaseConnection } from "./BasicDatabaseConnection"
import { LadcPgOptions } from "./exported-definitions"

export default function pgAdapter(config: string | ClientConfig, ladcPgOptions: LadcPgOptions = {}): LadcAdapter {
  return {
    createConnection: async () => {
      let db = await createPgConnection(config)
      return toBasicDatabaseConnection(db, ladcPgOptions)
    }
  }
}