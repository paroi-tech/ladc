import { DatabaseConnection, ResultRow, PreparedStatement, ExecResult } from "mycn"

export interface DatabaseConnectionWithSqlBricks extends DatabaseConnection {
  prepareSqlBricks<ROW extends ResultRow = any>(sqlBricks): Promise<PreparedStatement<ROW>>
  execSqlBricks(sqlBricks): Promise<ExecResult>
  allSqlBricks<ROW extends ResultRow = any>(sqlBricks): Promise<ROW[]>
  singleRowSqlBricks<ROW extends ResultRow = any>(sqlBricks): Promise<ROW | undefined>
  singleValueSqlBricks<VAL = any>(sqlBricks): Promise<VAL | undefined | null>
}

export interface WithSqlBricksOptions {
  toParamsOptions?: {
    [key: string]: any
    placeholder?: string
  }
}
