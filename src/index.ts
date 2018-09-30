import { createDatabaseConnection, DatabaseConnection, LadcOptions } from "ladc"
import { SelectStatement as SqlBricksSelect, Statement as SqlBricksQuery } from "sql-bricks"
import { DatabaseConnectionWithSqlBricks, WithSqlBricksOptions } from "./exported-definitions"

export function createDatabaseConnectionWithSqlBricks(ladcOptions: LadcOptions, sbOptions: WithSqlBricksOptions = {}): DatabaseConnectionWithSqlBricks {
  return createDatabaseConnection({
    ...ladcOptions,
    modifyConnection: cn => modifyConnection(cn, ladcOptions, sbOptions),
  }) as DatabaseConnectionWithSqlBricks
}

const methodNames = ["prepare", "exec", "all", "singleRow", "singleValue", "cursor"]

function modifyConnection(parent: DatabaseConnection, ladcOptions: LadcOptions, sbOptions: WithSqlBricksOptions) {
  let modified = Object.create(parent)

  for (let method of methodNames) {
    modified[method] = (sql: string | SqlBricksQuery, params?) => {
      if (typeof sql === "string")
        return parent[method](sql, params)
      if (sbOptions.trace)
        sbOptions.trace(method, sql)
      let { text, values } = sql.toParams(sbOptions.toParamsOptions as any)
      return parent[method](text, values)
    }
  }

  if (ladcOptions.modifyConnection)
    modified = ladcOptions.modifyConnection(modified)

  return modified
}