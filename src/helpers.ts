import { BasicExecResult, BasicPreparedStatement } from "./driver-definitions"
import { ExecResult, MycnOptions, PreparedStatement, SqlParameters } from "./exported-definitions"

export function toExecResult(options: MycnOptions, result: BasicExecResult): ExecResult {
  let thisObj = {
    affectedRows: result.affectedRows,
    getInsertedId: (seqName?: string) => {
      let id = result.getInsertedId(seqName)
      if (id === undefined && !options.insertedIdCanBeUndefined)
        throw new Error(`Missing inserted ID`)
      return id
    },
    getInsertedIdString: (seqName?: string): string => {
      let val = thisObj.getInsertedId(seqName)
      switch (typeof val) {
        case "string":
          return val
        case "number":
          return val.toString()
        default:
          throw new Error(`Unexpected inserted ID type: ${typeof val}`)
      }
    },
    getInsertedIdNumber: (seqName?: string): number => {
      let val = thisObj.getInsertedId(seqName)
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