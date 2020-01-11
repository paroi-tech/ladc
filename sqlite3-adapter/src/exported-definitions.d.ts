import * as sqlite3 from "sqlite3"

export interface Sqlite3ConnectionOptions {
  fileName: string
  mode?: number
  verbose?: boolean
  init?(db: sqlite3.Database): void | Promise<void>
  /**
   * Default value is `3`
   */
  maxAttempts?: number
  logWarning?: (error: string) => {}
}