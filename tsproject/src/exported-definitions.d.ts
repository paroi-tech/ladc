import { BasicDatabaseConnection } from "./driver-definitions"

export interface MycnOptions {
  provider: () => Promise<BasicDatabaseConnection>
  init?(cn: DatabaseConnection): void | Promise<void>
  modifyDatabaseConnection?(cn: DatabaseConnection): DatabaseConnection | Promise<DatabaseConnection>
  modifyPreparedStatement?(ps: PreparedStatement): PreparedStatement | Promise<PreparedStatement>
  poolOptions?: PoolOptions
  insertedIdCanBeUndefined?: boolean
  /**
   * If the option is `false` or `undefined`, then the method `ExecResult.getInsertedId()` returns a string.
   */
  insertedIdCanBeAny?: boolean
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
  /**
   * This method always returns a `string` unless the option `insertedIdCanBeAny` is used.
   *
   * This method doesn't return `undefined`. An exception is thrown when there is no value, unless the option `insertedIdCanBeUndefined` is set to `true`.
   *
   * @param seqName For PostgreSQL, give here the column name of the autoincremented primary key
   */
  getInsertedId<T = string>(seqName?: string): T
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
