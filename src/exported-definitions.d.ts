import { ClientConfig } from "pg"

export interface LadcPgOptions {
  pg: string | ClientConfig,
  getAutoincrementedIdColumnName?(tableName: string): string | undefined
  useReturningAll?: boolean
}