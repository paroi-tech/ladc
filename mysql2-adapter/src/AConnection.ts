import { AConnection, ACreateConnectionOptions, AExecResult, APreparedStatement } from "ladc"
import { LadcMysql2Options } from "./exported-definitions"
const { createConnection } = require("mysql2/promise")

export async function createMysqlConnection(
  mysql2Config: any,
  createOptions?: ACreateConnectionOptions
): Promise<any> {
  if (createOptions && createOptions.enableScript) {
    mysql2Config = {
      ...mysql2Config,
      multipleStatements: true
    }
  }
  return await createConnection(mysql2Config)
}

export function toAConnection(mc: any, options: LadcMysql2Options): AConnection {
  return {
    prepare: async (sql: string) => makeAPreparedStatement(mc, sql),
    exec: async (sql: string, params?: unknown[]) => {
      const [result] = await mc.execute(sql, params)
      return toAExecResult(result)
    },
    all: async (sql: string, params?: unknown[]) => toRows(await mc.query(sql, params)),
    cursor: (sql: string, params?: unknown[]) => createACursor({ mc, sql, params }),
    script: async (sql: string) => {
      await mc.query(sql)
    },
    close: async () => {
      await mc.end()
    }
  }
}

function toRows([rows]: any): any[] {
  // console.log(">> result", result)
  return rows
}

function toAExecResult(result: any): AExecResult {
  return {
    affectedRows: result.affectedRows,
    getInsertedId: () => result.insertId
  }
}

async function makeAPreparedStatement(mc: any, sql: string): Promise<APreparedStatement<any>> {
  const statement = await mc.prepare(sql)
  const obj: APreparedStatement<any> = {
    exec: async (params?: unknown[]) => {
      const [result] = await statement.execute(params)
      return toAExecResult(result)
    },
    all: async (params?: unknown[]) => toRows(await statement.execute(params)),
    cursor: (params?: unknown[]) => createACursor({ mc, sql, params, statement }),
    close: async () => { statement.close() }
  }
  return obj
}

function createACursor({ mc, sql, params, statement }: {
  mc: any
  sql: string
  params: unknown[] | undefined,
  statement?: any
}): Promise<AsyncIterableIterator<any>> {
  throw new Error(`Not implemented`)
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
