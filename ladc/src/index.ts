import { ACreateConnectionOptions, AdapterCapabilities } from "./adapter-definitions"
import createPool from "./createPool"
import { LadcOptions, MainConnection, SqlParameters } from "./exported-definitions"
import makeMainConnection, { Context } from "./factories/MainConnection"

export default function ladc(options: LadcOptions): MainConnection {
  const provider = async (createOptions?: ACreateConnectionOptions) => {
    const cn = await options.adapter.createConnection(createOptions)
    if (options.initConnection)
      await options.initConnection(cn)
    return cn
  }
  return makeMainConnection({
    options,
    pool: createPool(provider, options),
    provider,
    capabilities: options.adapter.capabilities,
    hooks: options.adapter.hooks ?? {},
    check: makeCheckers(options.adapter.capabilities)
  })
}

export * from "./adapter-definitions"
export * from "./exported-definitions"

function makeCheckers(capabilities: AdapterCapabilities): Context["check"] {
  return {
    cursors() {
      if (!capabilities.cursors)
        throw new Error(`Cursors are not available with this adapter.`)
    },
    namedParameters() {
      if (!capabilities.namedParameters)
        throw new Error(`Named parameters are not available with this adapter.`)
    },
    preparedStatements() {
      if (!capabilities.preparedStatements)
        throw new Error(`Prepared statements are not available with this adapter.`)
    },
    script() {
      if (!capabilities.script)
        throw new Error(`Scripts are not available with this adapter.`)
    },
    parameters(params: SqlParameters | undefined) {
      if (params && !Array.isArray(params) && !capabilities.namedParameters)
        throw new Error(`Named parameters are not available with this adapter.`)
    }
  }
}