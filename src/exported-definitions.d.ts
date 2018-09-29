import { DatabaseConnection, ExecResult, PreparedStatement, QueryRunner, ResultRow, TransactionConnection, Cursor } from "mycn"
import { Statement as SqlBricksQuery, SelectStatement as SqlBricksSelect } from "sql-bricks"

export interface WithSqlBricksOptions {
  toParamsOptions?: {
    [key: string]: any
    placeholder?: string
  }
  trace?(action: string, sqlBricks: SqlBricksQuery): void
}

export type QueryRunnerWithSqlBricks = QueryRunner & {
  prepare<R extends ResultRow = ResultRow>(sqlBricks: SqlBricksQuery): Promise<PreparedStatement<R>>
  exec(sqlBricks: SqlBricksQuery): Promise<ExecResult>
  all<R extends ResultRow = ResultRow>(sqlBricks: SqlBricksSelect): Promise<R[]>
  singleRow<R extends ResultRow = ResultRow>(sqlBricks: SqlBricksSelect): Promise<R | undefined>
  singleValue<V = unknown>(sqlBricks: SqlBricksSelect): Promise<V | undefined | null>
  cursor<R extends ResultRow = ResultRow>(sqlBricks: SqlBricksSelect): Promise<Cursor<R>>
}

interface DatabaseConnectionWithSqlBricksTx extends DatabaseConnection {
  // This method replaces the parent one
  beginTransaction(): Promise<TransactionConnectionWithSqlBricks>
}

export type DatabaseConnectionWithSqlBricks = DatabaseConnectionWithSqlBricksTx & QueryRunnerWithSqlBricks
export type TransactionConnectionWithSqlBricks = TransactionConnection & QueryRunnerWithSqlBricks