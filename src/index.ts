import createPool from "./createPool"
import { LadcOptions, MainConnection } from "./exported-definitions"
import makeMainConnection from "./factories/MainConnection"

export default function ladc(options: LadcOptions): MainConnection {
  const provider = async () => {
    const cn = await options.adapter.createConnection()
    if (options.initConnection)
      await options.initConnection(cn)
    return cn
  }
  return makeMainConnection({
    options,
    pool: createPool(provider, options),
    capabilities: options.adapter.capabilities || {}
  })
}

export * from "./adapter-definitions"
export * from "./exported-definitions"