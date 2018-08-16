import { BasicDatabaseConnection } from "./driver-definitions"

export interface MycnOptions {
  /**
   * Provided by a _mycn_ plugin.
   */
  provider: () => Promise<BasicDatabaseConnection>
  /**
   * This callback will be executed for each new `DatabaseConnection` when it has a new underlying connection created by the pool. It is a right place to update the underlying connection with `PRAGMA` orders.
   */
  init?(cn: BasicDatabaseConnection): void | Promise<void>
  /**
   * This callback will be executed for each new `DatabaseConnection` object. It returns the same or another object that will be used as the `DatabaseConnection`.
   */
  modifyConnection?<T extends DatabaseConnection | TransactionConnection>(cn: T): T
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
}

export interface PoolMonitoring {
  event: "open" | "close" | "grab" | "release"
  cn: any
  id?: number
}

export interface PoolOptions {
  /**
   * In seconds. Default value is: 60.
   */
  connectionTtl?: number
  /**
   * By default, unhandled errors will be logged with `console.log`.
   */
  logError?(reason: any): void
  logMonitoring?(monitoring: PoolMonitoring): void
}

export type SqlParameters = any[] | { [key: string]: any }
export type ResultRow = {}

export interface QueryRunner {
  prepare<ROW extends ResultRow = any>(sql: string, params?: SqlParameters): Promise<PreparedStatement<ROW>>
  exec(sql: string, params?: SqlParameters): Promise<ExecResult>

  all<ROW extends ResultRow = any>(sql: string, params?: SqlParameters): Promise<ROW[]>
  singleRow<ROW extends ResultRow = any>(sql: string, params?: SqlParameters): Promise<ROW | undefined>
  singleValue<VAL = any>(sql: string, params?: SqlParameters): Promise<VAL | undefined | null>

  execScript(sql: string): Promise<void>
}

export interface DatabaseConnection extends QueryRunner {
  beginTransaction(): Promise<TransactionConnection>
  close(): Promise<void>
}

export interface TransactionConnection extends QueryRunner {
  readonly inTransaction: boolean
  commit(): Promise<void>
  rollback(): Promise<void>
}

export interface ExecResult {
  /**
   * When the ID is `undefined`, an exception is thrown, unless the option `insertedIdCanBeUndefined` is set to `true`.
   *
   * @param seqName For PostgreSQL, give here the column name of the autoincremented primary key
   */
  getInsertedId(seqName?: string): any
  /**
   * When the ID is `undefined`, an exception is thrown, unless the option `insertedIdCanBeUndefined` is set to `true`.
   *
   * @param seqName For PostgreSQL, give here the column name of the autoincremented primary key
   */
  getInsertedIdString(seqName?: string): string
  /**
   * When the ID is `undefined`, an exception is thrown, unless the option `insertedIdCanBeUndefined` is set to `true`.
   *
   * @param seqName For PostgreSQL, give here the column name of the autoincremented primary key
   */
  getInsertedIdNumber(seqName?: string): number
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
  close(): Promise<void>
}