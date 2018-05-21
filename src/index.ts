import { createPool } from "./Pool"
import { DatabaseConnection, MycnOptions } from "./exported-definitions"
import { makeDbConnection } from "./makeDbConnection"

export async function createDatabaseConnection(options: MycnOptions): Promise<DatabaseConnection> {
  let provider = async () => {
    let cn = await options.provider()
    if (options.init)
      await options.init(cn)
    return cn
  }
  return await makeDbConnection(options, await createPool(provider, options.poolOptions))
}

export * from "./driver-definitions"
export * from "./exported-definitions"