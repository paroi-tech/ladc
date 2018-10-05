export interface LadcPgOptions {
  getAutoincrementedIdColumnName?(tableName: string): string | undefined
  useReturningAll?: boolean
}