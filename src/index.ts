import { MycnOptions, createDatabaseConnection } from "mycn"
import { DatabaseConnectionWithSqlBricks, WithSqlBricksOptions } from "./exported-definitions"

export async function createDatabaseConnectionWithSqlBricks(mycnOptions: MycnOptions, sbOptions: WithSqlBricksOptions = {}): Promise<DatabaseConnectionWithSqlBricks> {
  return await createDatabaseConnection({
    ...mycnOptions,
    modifyConnection: async (cn: any) => { // Use `any` because: https://github.com/Microsoft/TypeScript/issues/13995
      cn.prepareSqlBricks = sqlBricks => {
        if (sbOptions.trace)
          sbOptions.trace("prepare", sqlBricks)
        let params = sqlBricks.toParams(sbOptions.toParamsOptions)
        return cn.prepare(params.text, params.values)
      }
      cn.execSqlBricks = sqlBricks => {
        if (sbOptions.trace)
          sbOptions.trace("exec", sqlBricks)
        let params = sqlBricks.toParams(sbOptions.toParamsOptions)
        return cn.exec(params.text, params.values)
      }
      cn.allSqlBricks = sqlBricks => {
        if (sbOptions.trace)
          sbOptions.trace("all", sqlBricks)
        let params = sqlBricks.toParams(sbOptions.toParamsOptions)
        return cn.all(params.text, params.values)
      }
      cn.singleRowSqlBricks = sqlBricks => {
        if (sbOptions.trace)
          sbOptions.trace("singleRow", sqlBricks)
        let params = sqlBricks.toParams(sbOptions.toParamsOptions)
        return cn.singleRow(params.text, params.values)
      }
      cn.singleValueSqlBricks = sqlBricks => {
        if (sbOptions.trace)
          sbOptions.trace("singleValue", sqlBricks)
        let params = sqlBricks.toParams(sbOptions.toParamsOptions)
        return cn.singleValue(params.text, params.values)
      }
      if (mycnOptions.modifyConnection)
        cn = await mycnOptions.modifyConnection(cn)
      return cn
    }
  }) as DatabaseConnectionWithSqlBricks
}