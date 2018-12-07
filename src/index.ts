import createPool from "./createPool"
import { MainConnection, LadcOptions } from "./exported-definitions"
import makeDbConnection from "./factories/MainConnection"

export default function ladc(options: LadcOptions): MainConnection {
  let provider = async () => {
    let cn = await options.adapter.createConnection()
    if (options.initConnection)
      await options.initConnection(cn)
    return cn
  }
  let pool = createPool(provider, options)
  return makeDbConnection({ options, pool })
}

export * from "./driver-definitions"
export * from "./exported-definitions"