import { SqlParameters, ResultRow } from "./exported-definitions"

export interface BasicDatabaseConnection {
  prepare<R extends ResultRow = ResultRow>(sql: string, params?: SqlParameters): Promise<BasicPreparedStatement<R>>
  exec(sql: string, params?: SqlParameters): Promise<BasicExecResult>
  all<R extends ResultRow = ResultRow>(sql: string, params?: SqlParameters): Promise<R[]>
  cursor<R extends ResultRow = ResultRow>(sql: string, params?: SqlParameters): Promise<BasicCursor<R>>
  execScript(sql: string): Promise<void>
  close(): Promise<void>
}

export interface BasicExecResult {
  /**
   * NB: This method can return `undefined` if there is no value.
   */
  getInsertedId(idColumnName?: string): any
  readonly affectedRows: number
}

export interface BasicPreparedStatement<R extends ResultRow = ResultRow> {
  bind(nbOrKey: number | string, value: any): void
  unbind(nbOrKey: number | string): void

  exec(params?: SqlParameters): Promise<BasicExecResult>

  all(params?: SqlParameters): Promise<R[]>
  cursor<R extends ResultRow = ResultRow>(params?: SqlParameters): Promise<BasicCursor<R>>

  close(): Promise<void>
}

export interface BasicCursor<R extends ResultRow = ResultRow> {
  fetch(): Promise<R | undefined>
  close(): Promise<void>
}