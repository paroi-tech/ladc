import { SqlParameters, ResultRow } from "./exported-definitions"

export interface LadcAdapter {
  createConnection: () => Promise<AdapterConnection>
  capabilities?: AdapterCapabilities
}

export interface AdapterCapabilities {
  namedParameters?: boolean
  preparedStatements?: boolean
  cursors?: boolean
}

export interface AdapterConnection {
  prepare<R extends ResultRow = ResultRow>(sql: string, params?: SqlParameters): Promise<AdapterPreparedStatement<R>>
  exec(sql: string, params?: SqlParameters): Promise<AdapterExecResult>
  all<R extends ResultRow = ResultRow>(sql: string, params?: SqlParameters): Promise<R[]>
  cursor<R extends ResultRow = ResultRow>(sql: string, params?: SqlParameters): Promise<AsyncIterableIterator<R>>
  script(sql: string): Promise<void>
  close(): Promise<void>
}

export interface AdapterExecResult {
  /**
   * NB: This method can return `undefined` if there is no value.
   */
  getInsertedId(options?: unknown): unknown
  readonly affectedRows: number
}

export interface AdapterPreparedStatement<R extends ResultRow = ResultRow> {
  bind(nbOrKey: number | string, value: unknown): void
  unbind(nbOrKey: number | string): void

  exec(params?: SqlParameters): Promise<AdapterExecResult>

  all(params?: SqlParameters): Promise<R[]>
  cursor<R extends ResultRow = ResultRow>(params?: SqlParameters): Promise<AsyncIterableIterator<R>>

  close(): Promise<void>
}