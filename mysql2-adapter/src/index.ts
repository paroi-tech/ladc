import { AConnection, ACreateConnectionOptions, LadcAdapter } from "ladc"
import { createMysqlConnection, toAConnection } from "./AConnection"
import { LadcMysql2Options } from "./exported-definitions"

const connections = new WeakMap<AConnection, any>()

export default function mysql2Adapter(options: LadcMysql2Options): LadcAdapter {
  return {
    createConnection: async (createOptions?: ACreateConnectionOptions) => {
      const mc = await createMysqlConnection(options.mysql2Config, createOptions)
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
        if (mc) {
          await mc.beginTransaction()
          await mc.end()
        } else
          await cn.exec("start transaction")
      },
      async commit(cn: AConnection): Promise<void> {
        const mc = connections.get(cn)
        if (mc) {
          await mc.commit()
          await mc.end()
        } else
          await cn.exec("commit")
      },
      async rollback(cn: AConnection): Promise<void> {
        const mc = connections.get(cn)
        if (mc) {
          await mc.rollback()
          await mc.end()
        } else
          await cn.exec("rollback")
      },
    }
  }
}