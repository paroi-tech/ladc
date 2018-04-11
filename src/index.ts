import { DatabaseConnectionWithSqlBricks, WithSqlBricksOptions } from "./exported-definitions"
import { createDatabaseConnection, MycnOptions } from "mycn"

export async function createDatabaseConnectionWithSqlBricks(mycnOptions: MycnOptions, sbOptions: WithSqlBricksOptions = {}): Promise<DatabaseConnectionWithSqlBricks> {
  return await createDatabaseConnection({
    ...mycnOptions,
    modifyDatabaseConnection: async (cn: DatabaseConnectionWithSqlBricks) => {
      cn.prepareSqlBricks = sqlBricks => {
        let params = sqlBricks.toParams(sbOptions.toParamsOptions)
        return cn.prepare(params.text, params.values)
      }
      cn.execSqlBricks = sqlBricks => {
        let params = sqlBricks.toParams(sbOptions.toParamsOptions)
        return cn.exec(params.text, params.values)
      }
      cn.allSqlBricks = sqlBricks => {
        let params = sqlBricks.toParams(sbOptions.toParamsOptions)
        return cn.all(params.text, params.values)
      }
      cn.singleRowSqlBricks = sqlBricks => {
        let params = sqlBricks.toParams(sbOptions.toParamsOptions)
        return cn.singleRow(params.text, params.values)
      }
      cn.singleValueSqlBricks = sqlBricks => {
        let params = sqlBricks.toParams(sbOptions.toParamsOptions)
        return cn.singleValue(params.text, params.values)
      }
      if (mycnOptions.modifyDatabaseConnection)
        cn = await mycnOptions.modifyDatabaseConnection(cn) as any
      return cn
    }
  }) as DatabaseConnectionWithSqlBricks
}