import { LadcAdapter } from "ladc"
import { createPgConnection, toBasicDatabaseConnection } from "./BasicDatabaseConnection"
import { LadcPgOptions } from "./exported-definitions"

export default function pgAdapter(options: LadcPgOptions): LadcAdapter {
  return {
    createConnection: async () => {
      let db = await createPgConnection(options.pgConfig)
      return toBasicDatabaseConnection(db, options)
    }
  }
}