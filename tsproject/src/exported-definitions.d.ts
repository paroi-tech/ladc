
export interface Sqlite3ConnectionOptions {
  fileName: string
  mode?: number
  verbose?: boolean
  init?(db: any): void | Promise<void>
}
