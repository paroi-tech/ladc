import createPool from "./createPool"
import { DatabaseConnection, LadcOptions } from "./exported-definitions"
import makeDbConnection from "./factories/DatabaseConnection"

export function createDatabaseConnection(options: LadcOptions): DatabaseConnection {
  let provider = async () => {
    let cn = await options.provider()
    if (options.afterOpen)
      await options.afterOpen(cn)
    return cn
  }
  let pool = createPool(provider, options)
  return makeDbConnection({ options, pool })
}

export * from "./driver-definitions"
export * from "./exported-definitions"