import { Database } from "sqlite"

export interface PoolOptions {
  /**
   * In seconds. Default value is: 60.
   */
  connectionTtl?: number
  logError?(reason: any): void
}

export interface Connection extends Database {
  beginTransaction(): Promise<InTransactionConnection>
  singleRow<T = any>(sql: string): Promise<T>
  singleRow<T = any>(sql: string, mode: "acceptMissingRow"): Promise<T | undefined>
  singleValue<T = any>(sql: string): Promise<T>
  singleValue<T = any>(sql: string, mode?: "acceptMissingRow"): Promise<T | undefined>
}

export interface InTransactionConnection extends Connection {
  // /*
  //  * @param force Force a new transaction on another connection, even if there is a current transaction
  //  */
  // beginTransaction(force?: boolean): Promise<InTransactionConnection>
  beginTransaction(): Promise<InTransactionConnection>
  readonly inTransaction: boolean
  commit(): Promise<void>
  rollback(): Promise<void>

}