import { MainConnection, ExecResult, PreparedStatement, Connection, ResultRow, TransactionConnection } from "ladc"
import { Statement as SqlBricksQuery, SelectStatement as SqlBricksSelect } from "sql-bricks"

export interface SBModifierOptions {
  toParamsOptions?: {
    [key: string]: any
    placeholder?: string
  }
  trace?(action: string, sqlBricks: SqlBricksQuery): void
}

export type SBConnection = Connection & {
  prepare<R extends ResultRow = ResultRow>(sqlBricks: SqlBricksQuery): Promise<PreparedStatement<R>>
  exec(sqlBricks: SqlBricksQuery): Promise<ExecResult>
  all<R extends ResultRow = ResultRow>(sqlBricks: SqlBricksSelect): Promise<R[]>
  singleRow<R extends ResultRow = ResultRow>(sqlBricks: SqlBricksSelect): Promise<R | undefined>
  singleValue<V = unknown>(sqlBricks: SqlBricksSelect): Promise<V | undefined | null>
  cursor<R extends ResultRow = ResultRow>(sqlBricks: SqlBricksSelect): Promise<AsyncIterableIterator<R>>
}

interface SBMainConnectionTx extends MainConnection {
  // This method replaces the parent one
  beginTransaction(): Promise<SBTransactionConnection>
}

export type SBMainConnection = SBMainConnectionTx & SBConnection
export type SBTransactionConnection = TransactionConnection & SBConnection