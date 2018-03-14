
export interface Sqlite3ConnectionOptions {
  fileName: string
  mode?: number
  verbose?: boolean
  initCallback?(db: any): void | Promise<void>
}
