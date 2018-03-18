import { SqlParameters, ResultRow } from "./exported-definitions"

export interface BasicDatabaseConnection {
  prepare<ROW extends ResultRow = any>(sql: string, params?: SqlParameters): Promise<BasicPreparedStatement<ROW>>
  exec(sql: string, params?: SqlParameters): Promise<BasicExecResult>
  all<ROW extends ResultRow = any>(sql: string, params?: SqlParameters): Promise<ROW[]>
  execScript(sql: string): Promise<void>
  close(): Promise<void>
}

export interface BasicExecResult {
  /**
   * This method returns `undefined` if there is no value.
   */
  getInsertedId<T = any>(seqName?: string): T | undefined
  readonly affectedRows: number
}

export interface BasicPreparedStatement<PS extends ResultRow = any> {
  exec(params?: SqlParameters): Promise<BasicExecResult>
  all<ROW = PS>(params?: SqlParameters): Promise<ROW[]>
  fetch<ROW = PS>(): Promise<ROW | undefined>
  bind(key: number | string, value: any): Promise<void>
  unbindAll(): Promise<void>
  finalize(): Promise<void>
}
