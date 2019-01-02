import { ClientConfig } from "pg"

export interface LadcPgOptions {
  pgConfig: string | ClientConfig,
  autoincMapping?: { [tableName: string]: string | undefined }
  useReturningAll?: boolean
  inMemoryCursor?: boolean
}