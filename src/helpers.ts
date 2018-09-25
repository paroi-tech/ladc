import { BasicExecResult, BasicPreparedStatement } from "./driver-definitions"
import { ExecResult, MycnOptions, PreparedStatement, SqlParameters } from "./exported-definitions"

export function toExecResult(options: MycnOptions, result: BasicExecResult): ExecResult {
  let thisObj: ExecResult = {
    affectedRows: result.affectedRows,
    getInsertedId: (idColumnName?: string) => {
      let id = result.getInsertedId(idColumnName)
      if (id === undefined && !options.insertedIdCanBeUndefined)
        throw new Error(`Missing inserted ID`)
      return id
    },
    getInsertedIdAsString: (idColumnName?: string): string => {
      let val = thisObj.getInsertedId(idColumnName)
      switch (typeof val) {
        case "string":
          return val
        case "number":
          return val.toString()
        default:
          throw new Error(`Unexpected inserted ID type: ${typeof val}`)
      }
    },
    getInsertedIdAsNumber: (idColumnName?: string): number => {
      let val = thisObj.getInsertedId(idColumnName)
      switch (typeof val) {
        case "string":
          return parseInt(val, 10)
        case "number":
          return val
        default:
          throw new Error(`Unexpected inserted ID type: ${typeof val}`)
      }
    }
  }
  return thisObj
}

export function toSingleRow(rows: any[]) {
  if (rows.length !== 1) {
    if (rows.length === 0)
      return
    throw new Error(`Cannot fetch one row, row count: ${rows.length}`)
  }
  return rows[0]
}

export function toSingleValue(row: any) {
  if (row === undefined)
    return
  let columns = Object.keys(row)
  if (columns.length !== 1)
    throw new Error(`Cannot fetch one value, column count: ${columns.length}`)
  return row[columns[0]]
}