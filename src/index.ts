import { createDatabaseConnection, DatabaseConnection, LadcOptions } from "ladc"
import { SelectStatement as SqlBricksSelect, Statement as SqlBricksQuery } from "sql-bricks"
import { DatabaseConnectionWithSqlBricks, WithSqlBricksOptions } from "./exported-definitions"

export function createDatabaseConnectionWithSqlBricks(ladcOptions: LadcOptions, sbOptions: WithSqlBricksOptions = {}): DatabaseConnectionWithSqlBricks {
  return createDatabaseConnection({
    ...ladcOptions,
    modifyConnection: cn => modifyConnection(cn, ladcOptions, sbOptions),
  }) as DatabaseConnectionWithSqlBricks
}

function modifyConnection(parent: DatabaseConnection, ladcOptions: LadcOptions, sbOptions: WithSqlBricksOptions) {
  let modified = Object.create(parent)

  modified.prepare = (sql: string | SqlBricksQuery, params?) => {
    if (forParent(sql))
      return parent.prepare(sql, params)
    if (sbOptions.trace)
      sbOptions.trace("prepare", sql)
    let { text, values } = sql.toParams(sbOptions.toParamsOptions as any)
    return parent.prepare(text, values)
  }
  modified.exec = (sql: string | SqlBricksQuery, params?) => {
    if (forParent(sql))
      return parent.exec(sql, params)
    if (sbOptions.trace)
      sbOptions.trace("exec", sql)
    let { text, values } = sql.toParams(sbOptions.toParamsOptions as any)
    return parent.exec(text, values)
  }
  modified.all = (sql: string | SqlBricksSelect, params?) => {
    if (forParent(sql))
      return parent.all(sql, params)
    if (sbOptions.trace)
      sbOptions.trace("all", sql)
    let { text, values } = sql.toParams(sbOptions.toParamsOptions as any)
    return parent.all(text, values)
  }
  modified.singleRow = (sql: string | SqlBricksSelect, params?) => {
    if (forParent(sql))
      return parent.singleRow(sql, params)
    if (sbOptions.trace)
      sbOptions.trace("singleRow", sql)
    let { text, values } = sql.toParams(sbOptions.toParamsOptions as any)
    return parent.singleRow(text, values)
  }
  modified.singleValue = (sql: string | SqlBricksSelect, params?) => {
    if (forParent(sql))
      return parent.singleValue(sql, params)
    if (sbOptions.trace)
      sbOptions.trace("singleValue", sql)
    let { text, values } = sql.toParams(sbOptions.toParamsOptions as any)
    return parent.singleValue(text, values)
  }
  modified.cursor = (sql: string | SqlBricksSelect, params?) => {
    if (forParent(sql))
      return parent.cursor(sql, params)
    if (sbOptions.trace)
      sbOptions.trace("cursor", sql)
    let { text, values } = sql.toParams(sbOptions.toParamsOptions as any)
    return parent.cursor(text, values)
  }

  if (ladcOptions.modifyConnection)
    modified = ladcOptions.modifyConnection(modified)

  return modified
}

function forParent(sql: string | SqlBricksQuery): sql is string {
  return typeof sql === "string"
}