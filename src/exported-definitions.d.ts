import { BasicDatabaseConnection } from "./driver-definitions"

export interface MycnOptions {
  /**
   * Provided by a _mycn_ plugin.
   */
  provider: () => Promise<BasicDatabaseConnection>
  /**
   * This callback will be executed for each new `DatabaseConnection` when it has a new underlying connection created by the pool. It is a right place to update the underlying connection with `PRAGMA` orders.
   */
  init?(cn: DatabaseConnection): void | Promise<void>
  /**
   * This callback will be executed for each new `DatabaseConnection` object. It returns the same or another object that will be used as the `DatabaseConnection`.
   */
  modifyDatabaseConnection?(cn: DatabaseConnection): DatabaseConnection | Promise<DatabaseConnection>
  /**
   * This callback will be executed for each new `PreparedStatement` object. It returns the same or another object that will be used as the `PreparedStatement`.
   */
  modifyPreparedStatement?(ps: PreparedStatement): PreparedStatement | Promise<PreparedStatement>
  /**
   * The configuration of the connection pool.
   */
  poolOptions?: PoolOptions
  /**
   * If the option is `false` or `undefined`, then the method `ExecResult.getInsertedId()` throws an `Error` when the inserted ID is `undefined`.
   */
  insertedIdCanBeUndefined?: boolean
  /**
   * If the option is defined, then the method `ExecResult.getInsertedId()` always returns this type.
   */
  insertedIdType?: "string" | "number"
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

export interface DatabaseConnection<INSERT_ID extends string | number = any> {
  prepare<ROW extends ResultRow = any>(sql: string, params?: SqlParameters): Promise<PreparedStatement<ROW, INSERT_ID>>
  exec(sql: string, params?: SqlParameters): Promise<ExecResult<INSERT_ID>>

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

export interface ExecResult<INSERT_ID extends string | number = any> {
  /**
   * The returned type of this method can be configured with the option `insertedIdType`.
   *
   * This method doesn't return `undefined`. An exception is thrown when there is no value, unless the option `insertedIdCanBeUndefined` is set to `true`.
   *
   * @param seqName For PostgreSQL, give here the column name of the autoincremented primary key
   */
  getInsertedId(seqName?: string): INSERT_ID
  readonly affectedRows: number
}

export interface PreparedStatement<PS extends ResultRow = any, INSERT_ID extends string | number = any> {
  exec(params?: SqlParameters): Promise<ExecResult<INSERT_ID>>

  all<ROW = PS>(params?: SqlParameters): Promise<ROW[]>
  singleRow<ROW = PS>(params?: SqlParameters): Promise<ROW | undefined>
  singleValue<VAL>(params?: SqlParameters): Promise<VAL | undefined | null>

  fetch<ROW = PS>(): Promise<ROW | undefined>
  bind(key: number | string, value: any): Promise<void>
  unbindAll(): Promise<void>
  finalize(): Promise<void>
}
