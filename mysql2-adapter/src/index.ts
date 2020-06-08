import { AConnection, ACreateConnectionOptions, LadcAdapter } from "ladc"
import { createMysqlConnection, toAConnection } from "./AConnection"
import { LadcMysql2Options } from "./exported-definitions"

export default function mysql2Adapter(options: LadcMysql2Options): LadcAdapter {
  return {
    createConnection: async (createOptions?: ACreateConnectionOptions) => {
      const mc = await createMysqlConnection(options.mysql2Config, createOptions)
      return toAConnection(mc, options)
    },
    capabilities: {
      cursors: false,
      namedParameters: false,
      preparedStatements: true,
      script: "onASeparateConnection"
    },
    hooks: {
      async beginTransaction(cn: AConnection): Promise<void> {
        await cn.exec("start transaction")
      }
    }
  }
}