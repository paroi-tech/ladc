export interface BasicDatabaseConnection {
  exec(sql: string, params?: any[]): Promise<BasicExecResult>
  prepare<ROW extends Array<any> = any>(sql: string, params?: any[]): Promise<BasicPreparedStatement<ROW>>
  all<ROW extends Array<any> = any>(sql: string, params?: any[]): Promise<ROW[]>
  execScript(sql: string): Promise<void>
  close(): Promise<void>
}

export interface BasicExecResult {
  readonly insertedId: number
  readonly affectedRows: number
}

export interface BasicPreparedStatement<PS extends Array<any> = any> {
  exec(params?: any[]): Promise<BasicExecResult>
  all<ROW = PS>(params?: any[]): Promise<ROW[]>
  fetch<ROW = PS>(): Promise<ROW | undefined>
  bind(nb: number, value: any): Promise<void>
  unbindAll(): Promise<void>
  finalize(): Promise<void>
}