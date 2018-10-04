import { BasicDatabaseConnection } from "./driver-definitions"

export interface LadcAdapter {
  createConnection: () => Promise<BasicDatabaseConnection>
}

export interface LadcModifier {
  /**
   * This callback will be executed for each new `DatabaseConnection` object. It returns the same or another object that will be used as the `DatabaseConnection`.
   */
  modifyConnection?<C extends TransactionConnection | DatabaseConnection>(cn: C): C
  /**
   * This callback will be executed for each new `PreparedStatement` object. It returns the same or another object that will be used as the `PreparedStatement`.
   */
  modifyPreparedStatement?(ps: PreparedStatement): PreparedStatement
}

export interface LadcOptions {
  adapter: LadcAdapter
  modifier?: LadcModifier
  /**
   * This callback will be executed for each new `DatabaseConnection` when it has a new underlying connection created by the pool. It is a right place to update the underlying connection with `PRAGMA` orders.
   */
  initConnection?(cn: BasicDatabaseConnection): void | Promise<void>
  /**
   * The configuration of the connection pool.
   */
  poolOptions?: PoolOptions
  /**
   * By default, unhandled errors will be logged with `console.error`.
   */
  logError?(error: unknown): void
  /**
   * Activate development mode.
   */
  logDebug?(ev: DebugEvent): void
}

export interface DebugEventContext {
  connection: BasicDatabaseConnection
  method: string
  args: any[]
  inTransaction: boolean
  idInPool: number
}

export interface DebugEvent {
  callingContext?: DebugEventContext
  /**
   * Set when an error occured
   */
  error?: any
  /**
   * Maybe defined only when there is no error
   */
  result?: any
}

export interface PoolMonitoring {
  event: "open" | "close" | "grab" | "release" | "abandon"
  cn: BasicDatabaseConnection
  id?: number
}

export interface PoolOptions {
  /**
   * In seconds. Default value is: 60.
   */
  connectionTtl?: number
  logMonitoring?(monitoring: PoolMonitoring): void
  keepOneConnection?: boolean
}

export type SqlParameters = unknown[] | { [key: string]: unknown }

export interface ResultRow {
  [columnName: string]: unknown
}

export interface QueryRunner {
  prepare<R extends ResultRow = ResultRow>(sql: string, params?: SqlParameters): Promise<PreparedStatement<R>>
  exec(sql: string, params?: SqlParameters): Promise<ExecResult>

  all<R extends ResultRow = ResultRow>(sql: string, params?: SqlParameters): Promise<R[]>
  singleRow<R extends ResultRow = ResultRow>(sql: string, params?: SqlParameters): Promise<R | undefined>
  singleValue<V = unknown>(sql: string, params?: SqlParameters): Promise<V | null | undefined>
  cursor<R extends ResultRow = ResultRow>(sql: string, params?: SqlParameters): Promise<AsyncIterableIterator<R>>

  script(sql: string): Promise<void>
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
   * When the ID is `undefined`, an exception is thrown.
   *
   * @param idColumnName For PostgreSQL, give here the column name of the autoincremented primary key
   */
  getInsertedId(idColumnName?: string): unknown
  /**
   * When the ID is `undefined`, an exception is thrown.
   *
   * @param idColumnName For PostgreSQL, give here the column name of the autoincremented primary key
   */
  getInsertedIdAsString(idColumnName?: string): string
  /**
   * When the ID is `undefined`, an exception is thrown.
   *
   * @param idColumnName For PostgreSQL, give here the column name of the autoincremented primary key
   */
  getInsertedIdAsNumber(idColumnName?: string): number
  readonly affectedRows: number
}

export interface PreparedStatement<R extends ResultRow = ResultRow> {
  bind(nbOrKey: number | string, value: unknown): void
  unbind(nbOrKey: number | string): void
  /**
   * Unbind all previous parameters, then bind all new parameters
   */
  bindAll(params: SqlParameters): void
  unbindAll(): void

  exec(params?: SqlParameters): Promise<ExecResult>

  all(params?: SqlParameters): Promise<R[]>
  singleRow(params?: SqlParameters): Promise<R | undefined>
  singleValue<V>(params?: SqlParameters): Promise<V | null | undefined>
  cursor<R extends ResultRow = ResultRow>(params?: SqlParameters): Promise<AsyncIterableIterator<R>>

  close(): Promise<void>
}