import { AConnection, LadcAdapter } from "./adapter-definitions"

export interface LadcModifier {
  /**
   * This callback will be executed for each new `MainConnection` object. It returns the same or another object that will be used as the `MainConnection`.
   */
  modifyConnection?<C extends TransactionConnection | MainConnection>(cn: C): C
  /**
   * This callback will be executed for each new `PreparedStatement` object. It returns the same or another object that will be used as the `PreparedStatement`.
   */
  modifyPreparedStatement?(ps: PreparedStatement): PreparedStatement
}

export interface LadcOptions {
  adapter: LadcAdapter
  modifier?: LadcModifier
  /**
   * This callback will be executed for each new `MainConnection` when it has a new underlying connection created by the pool. It is a right place to update the underlying connection with `PRAGMA` orders.
   */
  initConnection?(cn: AConnection): void | Promise<void>
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
  connection: AConnection
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
  cn: AConnection
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

export type SqlParameters = any[] | { [key: string]: any }

export interface ResultRow {
  [columnName: string]: unknown
}

export interface Connection {
  prepare<R extends ResultRow = ResultRow>(sql: string): Promise<PreparedStatement<R>>
  exec(sql: string, params?: SqlParameters): Promise<ExecResult>

  all<R extends ResultRow = ResultRow>(sql: string, params?: SqlParameters): Promise<R[]>
  singleRow<R extends ResultRow = ResultRow>(sql: string, params?: SqlParameters): Promise<R | undefined>
  singleValue<V = unknown>(sql: string, params?: SqlParameters): Promise<V | null | undefined>
  cursor<R extends ResultRow = ResultRow>(sql: string, params?: SqlParameters): Promise<AsyncIterableIterator<R>>

  script(sql: string): Promise<void>
}

export interface MainConnection extends Connection {
  beginTransaction(): Promise<TransactionConnection>
  close(): Promise<void>
}

export interface TransactionConnection extends Connection {
  readonly inTransaction: boolean
  commit(): Promise<void>
  rollback(): Promise<void>
}

export interface ExecResult {
  /**
   * When the ID is `undefined`, an exception is thrown.
   * @param options (optional) is specific for the underlying adapter.
   */
  getInsertedId(options?: unknown): unknown
  /**
   * When the ID is `undefined`, an exception is thrown.
   * @param options (optional) is specific for the underlying adapter.
   */
  getInsertedIdAsString(options?: unknown): string
  /**
   * When the ID is `undefined`, an exception is thrown.
   * @param options (optional) is specific for the underlying adapter.
   */
  getInsertedIdAsNumber(options?: unknown): number
  readonly affectedRows: number
}

export interface PreparedStatement<R extends ResultRow = ResultRow> {
  bind(params: SqlParameters): void
  bind(indexOrKey: number | string, value: unknown): void
  unbind(): void
  unbind(indexOrKey: number | string): void

  exec(params?: SqlParameters): Promise<ExecResult>

  all(params?: SqlParameters): Promise<R[]>
  singleRow(params?: SqlParameters): Promise<R | undefined>
  singleValue<V = unknown>(params?: SqlParameters): Promise<V | null | undefined>
  cursor(params?: SqlParameters): Promise<AsyncIterableIterator<R>>

  close(): Promise<void>
}