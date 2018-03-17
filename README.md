# mycn-sqlite3

This package is the connector for [mycn](https://github.com/paleo/mycn) to the driver [sqlite3](https://github.com/mapbox/node-sqlite3).

## Install

```
npm install mycn mycn-sqlite3
```

## Usage

How to create a connection:

```
import { createDatabaseConnection } from "mycn"
import { sqlite3ConnectionProvider } from "mycn-sqlite3"

let cn
async function getConnection() {
  if (!cn) {
    cn = await createDatabaseConnection({
      provider: sqlite3ConnectionProvider({ fileName: `${__dirname}/mydb.sqlite` }),
      init: async cn => {
        await cn.exec("PRAGMA foreign_keys = ON")
      }
    })
  }
  return cn
}
```
