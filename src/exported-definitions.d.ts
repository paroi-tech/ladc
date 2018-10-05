import { ClientConfig } from "pg"

export interface LadcPgOptions {
  pgConfig: string | ClientConfig,
  getAutoincrementedIdColumnName?(tableName: string): string | undefined
  useReturningAll?: boolean
}