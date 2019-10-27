import { LadcAdapter } from "ladc"
import { createPgConnection, toAConnection } from "./AConnection"
import { LadcPgOptions } from "./exported-definitions"

export default function pgAdapter(options: LadcPgOptions): LadcAdapter {
  return {
    createConnection: async () => {
      const db = await createPgConnection(options.pgConfig)
      return toAConnection(db, options)
    },
    capabilities: {
      cursors: true,
      namedParameters: false,
      preparedStatements: true,
    }
  }
}