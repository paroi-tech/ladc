# @ladc/sqlite3-adapter

The [LADC](https://github.com/paleo/ladc) adapter to the driver [sqlite3](https://github.com/mapbox/node-sqlite3) (SQLite).

## Install

```
npm install ladc @ladc/sqlite3-adapter
```

## Usage

How to create a connection:

```
import { createMainConnection } from "ladc"
import { sqlite3ConnectionProvider } from "@ladc/sqlite3-adapter"

let cn = createMainConnection({
  provider: sqlite3ConnectionProvider({ fileName: `${__dirname}/mydb.sqlite` }),
  init: async cn => {
    await cn.exec("PRAGMA foreign_keys = ON")
  }
})
```
