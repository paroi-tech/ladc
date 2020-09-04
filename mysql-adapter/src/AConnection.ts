import { AConnection, ACreateConnectionOptions, AExecResult, APreparedStatement } from "ladc"
import { createPromisifiedConnection, PromisifiedConnection, UnderlyingExecResult } from "./promisifyMysql"

export function createMysqlConnection(
  mysqlConfig: any,
  createOptions?: ACreateConnectionOptions
): Promise<PromisifiedConnection> {
  if (createOptions && createOptions.enableScript) {
    mysqlConfig = {
      ...mysqlConfig,
      multipleStatements: true
    }
  }
  return createPromisifiedConnection(mysqlConfig)
}

export function toAConnection(mc: PromisifiedConnection): AConnection { // , options: LadcMysqlOptions
  return {
    prepare: async (sql: string) => Promise.resolve(makeAPreparedStatement(mc, sql)),
    exec: async (sql: string, params?: unknown[]) => {
      const result = await mc.exec(sql, params)
      return toAExecResult(result)
    },
    all: async (sql: string, params?: unknown[]) => await mc.query(sql, params),
    cursor: (sql: string, params?: unknown[]) => createACursor({ mc, sql, params }),
    script: async (sql: string) => {
      await mc.query(sql)
    },
    close: async () => {
      await mc.end()
    }
  }
}

function toAExecResult(result: UnderlyingExecResult): AExecResult {
  if (result.affectedRows === undefined)
    throw new Error("Missing affected rows")
  return {
    affectedRows: result.affectedRows,
    getInsertedId: () => result.insertId
  }
}

function makeAPreparedStatement(mc: PromisifiedConnection, sql: string): APreparedStatement<any> {
  const obj: APreparedStatement<any> = {
    exec: async (params?: unknown[]) => {
      const result = await mc.exec(sql, params)
      return toAExecResult(result)
    },
    all: async (params?: unknown[]) => await mc.query(sql, params),
    cursor: async (params?: unknown[]) => createACursor({ mc, sql, params }),
    close: async () => {
      // Nothing to do.
    }
  }
  return obj
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createACursor({ mc, sql, params, statement }: {
  mc: PromisifiedConnection
  sql: string
  params: unknown[] | undefined
  statement?: any
}): Promise<AsyncIterableIterator<any>> {
  throw new Error("Not implemented")
  // return new Promise((resolve, reject) => {
  //   const stream = mc.query(sql, params)
  //   stream.on("error", reject)
  //   stream.on("result", (row: unknown[]) => {
  //     mc.pause()
  //     mc.resume()
  //   })
  //   stream.on("end", () => {
  //   })

  //   const obj: AsyncIterableIterator<any> = {
  //     [Symbol.asyncIterator]: () => obj,
  //     next: async () => {
  //       mc.resume()

  //       if (!rows)
  //         return { done: true, value: undefined }
  //       const value = rows[++currentIndex]
  //       if (!value)
  //         rows = undefined
  //       return { done: !rows, value }
  //     },
  //     return: async () => {
  //       rows = undefined
  //       return { done: true, value: undefined }
  //     },
  //     throw: async err => {
  //       rows = undefined
  //       throw err
  //     }
  //   }
  //   return obj
  // })
}
