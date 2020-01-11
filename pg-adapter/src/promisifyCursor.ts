export interface PromisifiedCursor {
  read(rowCount: number): Promise<unknown[]>
  close(): Promise<void>
}

export function promisifyCursor(innerCursor: any): PromisifiedCursor {
  return {
    read(rowCount) {
      return new Promise<unknown[]>((resolve, reject) => {
        innerCursor.read(rowCount, (err: any, rows: unknown[]) => {
          if (err)
            reject(err)
          else
            resolve(rows)
        })
      })
    },
    close() {
      return new Promise<void>((resolve, reject) => {
        innerCursor.close((err: any) => {
          if (err)
            reject(err)
          else
            resolve()
        })
      })
    }
  }
}