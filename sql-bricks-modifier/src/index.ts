import { LadcModifier, MainConnection, TransactionConnection } from "ladc"
import { Statement as SqlBricksQuery } from "sql-bricks"
import { SBModifierOptions } from "./exported-definitions"

export default function sqlBricksModifier(options: SBModifierOptions = {}): LadcModifier {
  return {
    modifyConnection: cn => modifyConnection(cn, options)
  }
}

const methodNames = ["prepare", "exec", "all", "singleRow", "singleValue", "cursor"]

function modifyConnection(parent: TransactionConnection | MainConnection, options: SBModifierOptions) {
  const modified = Object.create(parent)

  for (const method of methodNames) {
    modified[method] = (sql: string | SqlBricksQuery, params?: any[]) => {
      if (typeof sql === "string")
        return (parent as any)[method](sql, params)
      if (options.trace)
        options.trace(method, sql)
      const { text, values } = sql.toParams(options.toParamsOptions as any)
      return (parent as any)[method](text, values)
    }
  }

  return modified
}