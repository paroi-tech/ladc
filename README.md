# @ladc/sqlite3

The [LADC](https://github.com/paleo/ladc) adapter to the driver [sqlite3](https://github.com/mapbox/node-sqlite3) (SQLite).

## Install

```
npm install ladc @ladc/sqlite3
```

## Usage

How to create a connection:

```
import { createDatabaseConnection } from "ladc"
import { sqlite3ConnectionProvider } from "@ladc/sqlite3"

let cn = createDatabaseConnection({
  provider: sqlite3ConnectionProvider({ fileName: `${__dirname}/mydb.sqlite` }),
  init: async cn => {
    await cn.exec("PRAGMA foreign_keys = ON")
  }
})
```
