import { SqlParameters, ResultRow } from "./exported-definitions"

export interface BasicDatabaseConnection {
  prepare<R extends ResultRow = ResultRow>(sql: string, params?: SqlParameters): Promise<BasicPreparedStatement<R>>
  exec(sql: string, params?: SqlParameters): Promise<BasicExecResult>
  all<R extends ResultRow = ResultRow>(sql: string, params?: SqlParameters): Promise<R[]>
  cursor<R extends ResultRow = ResultRow>(sql: string, params?: SqlParameters): Promise<AsyncIterableIterator<R>>
  script(sql: string): Promise<void>
  close(): Promise<void>
}

export interface BasicExecResult {
  /**
   * NB: This method can return `undefined` if there is no value.
   */
  getInsertedId(idColumnName?: string): unknown
  readonly affectedRows: number
}

export interface BasicPreparedStatement<R extends ResultRow = ResultRow> {
  bind(nbOrKey: number | string, value: unknown): void
  unbind(nbOrKey: number | string): void

  exec(params?: SqlParameters): Promise<BasicExecResult>

  all(params?: SqlParameters): Promise<R[]>
  cursor<R extends ResultRow = ResultRow>(params?: SqlParameters): Promise<AsyncIterableIterator<R>>

  close(): Promise<void>
}