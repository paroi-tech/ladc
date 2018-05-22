import { DatabaseConnection, ResultRow, PreparedStatement, ExecResult, TransactionConnection } from "mycn"

export interface WithSqlBricksMethods {
  prepareSqlBricks<ROW extends ResultRow = any>(sqlBricks): Promise<PreparedStatement<ROW>>
  execSqlBricks(sqlBricks): Promise<ExecResult>
  allSqlBricks<ROW extends ResultRow = any>(sqlBricks): Promise<ROW[]>
  singleRowSqlBricks<ROW extends ResultRow = any>(sqlBricks): Promise<ROW | undefined>
  singleValueSqlBricks<VAL = any>(sqlBricks): Promise<VAL | undefined | null>
}

export interface DatabaseConnectionWithSqlBricks extends DatabaseConnection, WithSqlBricksMethods {
  beginTransaction(): Promise<TransactionConnectionWithSqlBricks>
}

export interface TransactionConnectionWithSqlBricks extends TransactionConnection, WithSqlBricksMethods {
}

export interface WithSqlBricksOptions {
  toParamsOptions?: {
    [key: string]: any
    placeholder?: string
  }
  trace?(action: string, sqlBricks: any): void
}
