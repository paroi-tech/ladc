import { BasicExecResult } from "../driver-definitions"
import { ExecResult } from "../exported-definitions"
import { Context } from "./DatabaseConnection"

export function toExecResult(context: Context, result: BasicExecResult): ExecResult {
  let obj: ExecResult = {
    get affectedRows() {
      return result.affectedRows
    },
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
          return val as string
        case "number":
          return (val as number).toString()
        default:
          throw new Error(`Unexpected inserted ID type: ${typeof val}`)
      }
    },
    getInsertedIdAsNumber: (idColumnName?: string): number => {
      let val = obj.getInsertedId(idColumnName)
      switch (typeof val) {
        case "string":
          return parseInt(val as string, 10)
        case "number":
          return val as number
        default:
          throw new Error(`Unexpected inserted ID type: ${typeof val}`)
      }
    }
  }
  return obj
}
