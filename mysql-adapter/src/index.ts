import { AConnection, ACreateConnectionOptions, LadcAdapter } from "ladc"
import { createMysqlConnection, toAConnection } from "./AConnection"
import { LadcMysqlOptions } from "./exported-definitions"
import { PromisifiedConnection } from "./promisifyMysql"

const connections = new WeakMap<AConnection, PromisifiedConnection>()

export default function mysqlAdapter(options: LadcMysqlOptions): LadcAdapter {
  return {
    createConnection: async (createOptions?: ACreateConnectionOptions) => {
      const mc = await createMysqlConnection(options.mysqlConfig, createOptions)
      const cn = toAConnection(mc)
      connections.set(cn, mc)
      return cn
    },
    capabilities: {
      cursors: false,
      namedParameters: false,
      preparedStatements: true,
      script: "onASeparateConnection"
    },
    hooks: {
      async beginTransaction(cn: AConnection): Promise<void> {
        const mc = connections.get(cn)
        if (mc)
          await mc.beginTransaction()
        else
          await cn.exec("start transaction")
      },
      async commit(cn: AConnection): Promise<void> {
        const mc = connections.get(cn)
        if (mc)
          await mc.commit()
        else
          await cn.exec("start transaction")
      },
      async rollback(cn: AConnection): Promise<void> {
        const mc = connections.get(cn)
        if (mc)
          await mc.rollback()
        else
          await cn.exec("start transaction")
      },
    }
  }
}