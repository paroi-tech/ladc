import createPool from "./createPool"
import { DatabaseConnection, LadcOptions } from "./exported-definitions"
import makeDbConnection from "./factories/DatabaseConnection"

export default function ladc(options: LadcOptions): DatabaseConnection {
  let provider = async () => {
    let cn = await options.adapter.openConnection()
    if (options.initConnection)
      await options.initConnection(cn)
    return cn
  }
  let pool = createPool(provider, options)
  return makeDbConnection({ options, pool })
}

export * from "./driver-definitions"
export * from "./exported-definitions"