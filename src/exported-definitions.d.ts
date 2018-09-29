export interface MycnPgOptions {
  getAutoincrementedIdColumnName?(tableName: string): string | undefined
}