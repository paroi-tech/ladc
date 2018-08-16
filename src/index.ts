import { createPool } from "./Pool"
import { DatabaseConnection, MycnOptions } from "./exported-definitions"
import { makeDbConnection } from "./makeDbConnection"

export function createDatabaseConnection(options: MycnOptions): DatabaseConnection {
  let provider = async () => {
    let cn = await options.provider()
    if (options.init)
      await options.init(cn)
    return cn
  }
  return makeDbConnection(options, createPool(provider, options.poolOptions))
}

export * from "./driver-definitions"
export * from "./exported-definitions"