import { BasicExecResult } from "../driver-definitions"
import { ExecResult } from "../exported-definitions"
import { Context } from "./DatabaseConnection"

export function toExecResult(context: Context, result: BasicExecResult): ExecResult {
  let obj: ExecResult = {
    affectedRows: result.affectedRows,
    getInsertedId: (idColumnName?: string) => {
      let id = result.getInsertedId(idColumnName)
      if (id === undefined && !context.options.insertedIdCanBeUndefined)
        throw new Error(`Missing inserted ID`)
      return id
    },
    getInsertedIdAsString: (idColumnName?: string): string => {
      let val = obj.getInsertedId(idColumnName)
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
      let val = obj.getInsertedId(idColumnName)
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
  return obj
}
