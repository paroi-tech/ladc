import { BasicDatabaseConnection, BasicExecResult, BasicPreparedStatement } from "./driver-definitions";

export interface DbcOptions {
  initDatabaseConnection?(cn: DatabaseConnection): void | Promise<void>
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

export interface DatabaseConnection extends BasicDatabaseConnection {
  exec(sql: string, params?: any[]): Promise<ExecResult>
  prepare<ROW extends Array<any> = any>(sql: string, params?: any[]): Promise<PreparedStatement<ROW>>

  singleRow<ROW extends Array<any> = any>(sql: string, params?: any[]): Promise<ROW | undefined>
  singleValue<VAL = any>(sql: string, params?: any[]): Promise<VAL | undefined | null>

  readonly inTransaction: boolean
  beginTransaction(): Promise<DatabaseConnection>
  commit(): Promise<void>
  rollback(): Promise<void>
}

export interface ExecResult extends BasicExecResult {
}

export interface PreparedStatement<PS extends Array<any> = any> extends BasicPreparedStatement<PS> {
  exec(params?: any[]): Promise<ExecResult>

  singleRow<ROW = PS>(params?: any[]): Promise<ROW | undefined>
  singleValue<VAL>(params?: any[]): Promise<VAL | undefined | null>
}
