import { ResultRow, SqlParameters } from "./exported-definitions";

export interface LadcAdapter {
  createConnection: (createOptions?: ACreateConnectionOptions) => Promise<AConnection>
  capabilities: AdapterCapabilities
}

export interface ACreateConnectionOptions {
  enableScript?: boolean
}

export interface AdapterCapabilities {
  namedParameters?: boolean
  preparedStatements?: boolean
  cursors?: boolean
  script?: boolean | "onASeparateConnection"
}

export interface AConnection {
  prepare<R extends ResultRow = ResultRow>(sql: string): Promise<APreparedStatement<R>>
  exec(sql: string, params?: SqlParameters): Promise<AExecResult>
  all<R extends ResultRow = ResultRow>(sql: string, params?: SqlParameters): Promise<R[]>
  cursor<R extends ResultRow = ResultRow>(sql: string, params?: SqlParameters): Promise<AsyncIterableIterator<R>>
  script(sql: string): Promise<void>
  close(): Promise<void>
}

export interface AExecResult {
  readonly affectedRows: number
  /**
   * NB: This method can return `undefined` if there is no value.
   */
  getInsertedId(options?: unknown): unknown
}

export interface APreparedStatement<R extends ResultRow = ResultRow> {
  exec(params?: SqlParameters): Promise<AExecResult>
  all(params?: SqlParameters): Promise<R[]>
  cursor(params?: SqlParameters): Promise<AsyncIterableIterator<R>>
  close(): Promise<void>
}