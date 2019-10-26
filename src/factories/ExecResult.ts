import { AdapterExecResult } from "../adapter-definitions"
import { ExecResult } from "../exported-definitions"

export function toExecResult(result: AdapterExecResult): ExecResult {
  const obj: ExecResult = {
    get affectedRows() {
      return result.affectedRows
    },
    getInsertedId(options?: unknown) {
      const id = result.getInsertedId(options)
      if (id === undefined)
        throw new Error(`Missing inserted ID`)
      return id
    },
    getInsertedIdAsString(options?: unknown): string {
      const val = obj.getInsertedId(options)
      switch (typeof val) {
        case "string":
          return val as string
        case "number":
          return (val as number).toString()
        default:
          throw new Error(`Unexpected inserted ID type: ${typeof val}`)
      }
    },
    getInsertedIdAsNumber(options?: unknown): number {
      const val = obj.getInsertedId(options)
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
