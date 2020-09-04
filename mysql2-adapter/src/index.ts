import { AConnection, ACreateConnectionOptions, LadcAdapter } from "ladc"
import { createMysqlConnection, toAConnection } from "./AConnection"
import { LadcMysql2Options } from "./exported-definitions"

export default function mysql2Adapter(options: LadcMysql2Options): LadcAdapter {
  return {
    createConnection: async (createOptions?: ACreateConnectionOptions) => {
      const mc = await createMysqlConnection(options.mysql2Config, createOptions)
      return toAConnection(mc)
    },
    capabilities: {
      cursors: false,
      namedParameters: false,
      preparedStatements: true,
      script: "onASeparateConnection"
    },
    hooks: {
      async beginTransaction(cn: AConnection): Promise<void> {
        // await cn.exec("start transaction")
        await (cn as any).beginTransaction()
      },
      async commit(cn: AConnection): Promise<void> {
        // await cn.exec("start transaction")
        await (cn as any).commit()
        await (cn as any).end()
      },
      async rollback(cn: AConnection): Promise<void> {
        // await cn.exec("start transaction")
        await (cn as any).rollback()
        await (cn as any).end()
      },
    }
  }
}