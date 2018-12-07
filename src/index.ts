import { LadcAdapter } from "ladc"
import { createPgConnection, toBasicMainConnection } from "./BasicMainConnection"
import { LadcPgOptions } from "./exported-definitions"

export default function pgAdapter(options: LadcPgOptions): LadcAdapter {
  return {
    createConnection: async () => {
      let db = await createPgConnection(options.pgConfig)
      return toBasicMainConnection(db, options)
    }
  }
}