import { SqlParameters, ResultRow } from "./exported-definitions"

export interface BasicDatabaseConnection {
  exec(sql: string, params?: SqlParameters): Promise<BasicExecResult>
  prepare<ROW extends ResultRow = any>(sql: string, params?: SqlParameters): Promise<BasicPreparedStatement<ROW>>
  all<ROW extends ResultRow = any>(sql: string, params?: SqlParameters): Promise<ROW[]>
  execScript(sql: string): Promise<void>
  close(): Promise<void>
}

export interface BasicExecResult {
  readonly insertedId: number
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
