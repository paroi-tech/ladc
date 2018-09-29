export interface Sqlite3ConnectionOptions {
  fileName: string
  mode?: number
  verbose?: boolean
  init?(db: any): void | Promise<void>
  /**
   * Default value is `3`
   */
  maxAttempts?: number
  logWarning?: (error: string) => {}
}