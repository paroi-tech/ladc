import createPool from "./createPool"
import { LadcOptions, MainConnection } from "./exported-definitions"
import makeMainConnection from "./factories/MainConnection"

export default function ladc(options: LadcOptions): MainConnection {
  let provider = async () => {
    let cn = await options.adapter.createConnection()
    if (options.initConnection)
      await options.initConnection(cn)
    return cn
  }
  let pool = createPool(provider, options)
  return makeMainConnection({ options, pool })
}

export * from "./driver-definitions"
export * from "./exported-definitions"