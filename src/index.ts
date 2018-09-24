import createPool from "./createPool"
import { DatabaseConnection, MycnOptions } from "./exported-definitions"
import makeDbConnection from "./makeDbConnection"

export function createDatabaseConnection(options: MycnOptions): DatabaseConnection {
  let provider = async () => {
    let cn = await options.provider()
    if (options.afterOpen)
      await options.afterOpen(cn)
    return cn
  }
  return makeDbConnection(options, createPool(provider, options))
}

export * from "./driver-definitions"
export * from "./exported-definitions"