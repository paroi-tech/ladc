import { MycnOptions, PreparedStatement, SqlParameters } from "./exported-definitions"
import { BasicPreparedStatement, BasicDatabaseConnection } from "./driver-definitions"
import { toExecResult, toSingleRow, toSingleValue } from "./helpers"
import { Pool } from "./createPool"

export interface PsProviderOptions {
  pool?: Pool<BasicDatabaseConnection>
  cn?: BasicDatabaseConnection
}

export default class PsProvider {
  psSet = new Set<PreparedStatement>()

  constructor(private opt: PsProviderOptions) {
  }

  async make(options: MycnOptions, sql: string, params?: SqlParameters) {
    let inst = await toPreparedStatement(options, this, sql, params)
    this.psSet.add(inst)
    return inst
  }

  async closeAll() {
    await Array.from(this.psSet).map(inst => inst.close())
  }

  async getCn() {
    if (this.opt.cn) {
      return {
        cn: this.opt.cn,
        releaseCn: () => {}
      }
    } else {
      let cn = await this.opt.pool!.grab()
      return {
        cn,
        releaseCn: () => this.opt.pool!.release(cn)
      }
    }
  }
}

async function toPreparedStatement(options: MycnOptions, provider: PsProvider, sql: string, params?: SqlParameters): Promise<PreparedStatement> {
  let { cn, releaseCn } = await provider.getCn()
  let ps: BasicPreparedStatement | undefined = await cn.prepare(sql, params)
  let thisObj = {
    exec: async (params?: SqlParameters) => {
      check("exec")
      return toExecResult(options, await ps!.exec(params))
    },
    all: async (params?: SqlParameters) => {
      check("all")
      return await ps!.all(params)
    },
    singleRow: async (params?: SqlParameters) => toSingleRow(await thisObj.all(params)),
    singleValue: async (params?: SqlParameters) => toSingleValue(await thisObj.singleRow(params)),
    fetch: async () => {
      check("fetch")
      return await ps!.fetch()
    },
    bind: async (key: number | string, value: any) => {
      check("bind")
      return await ps!.bind(key, value)
    },
    unbindAll: async () => {
      check("unbindAll")
      return await ps!.unbindAll()
    },
    close: async () => {
      if (!ps)
        throw new Error(`Prepared statement is already closed`)
      provider.psSet.delete(thisObj)
      let copy = ps
      ps = undefined
      await copy.close()
      releaseCn()
    }
  }
  if (options.modifyPreparedStatement)
    thisObj = await options.modifyPreparedStatement(thisObj)
  return thisObj

  function check(method: string) {
    if (!ps)
      throw new Error(`Invalid call to '${method}', the prepared statement is closed`)
  }
}