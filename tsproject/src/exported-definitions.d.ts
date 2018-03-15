import { BasicDatabaseConnection } from "./driver-definitions"

export interface MycnOptions {
  provider: () => Promise<BasicDatabaseConnection>
  init?(cn: DatabaseConnection): void | Promise<void>
  modifyDatabaseConnection?(cn: DatabaseConnection): DatabaseConnection | Promise<DatabaseConnection>
  modifyPreparedStatement?(ps: PreparedStatement): PreparedStatement | Promise<PreparedStatement>
  poolOptions?: PoolOptions
}

export interface PoolOptions {
  /**
   * In seconds. Default value is: 60.
   */
  connectionTtl?: number
  logError?(reason: any): void
}

export type SqlParameters = any[] | { [key: string]: any }
export type ResultRow = {}

export interface DatabaseConnection {
  prepare<ROW extends ResultRow = any>(sql: string, params?: SqlParameters): Promise<PreparedStatement<ROW>>
  exec(sql: string, params?: SqlParameters): Promise<ExecResult>

  all<ROW extends ResultRow = any>(sql: string, params?: SqlParameters): Promise<ROW[]>
  singleRow<ROW extends ResultRow = any>(sql: string, params?: SqlParameters): Promise<ROW | undefined>
  singleValue<VAL = any>(sql: string, params?: SqlParameters): Promise<VAL | undefined | null>

  execScript(sql: string): Promise<void>
  close(): Promise<void>

  readonly inTransaction: boolean
  beginTransaction(): Promise<DatabaseConnection>
  commit(): Promise<void>
  rollback(): Promise<void>
}

export interface ExecResult {
  readonly insertedId: number
  readonly affectedRows: number
}

export interface PreparedStatement<PS extends ResultRow = any> {
  exec(params?: SqlParameters): Promise<ExecResult>

  all<ROW = PS>(params?: SqlParameters): Promise<ROW[]>
  singleRow<ROW = PS>(params?: SqlParameters): Promise<ROW | undefined>
  singleValue<VAL>(params?: SqlParameters): Promise<VAL | undefined | null>

  fetch<ROW = PS>(): Promise<ROW | undefined>
  bind(key: number | string, value: any): Promise<void>
  unbindAll(): Promise<void>
  finalize(): Promise<void>
}
