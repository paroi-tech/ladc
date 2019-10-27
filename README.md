# @ladc/sqlite3-adapter

The [LADC](https://github.com/paleo/ladc) adapter to the driver [sqlite3](https://github.com/mapbox/node-sqlite3) (SQLite).

## Install

```
npm install ladc @ladc/sqlite3-adapter
```

## Usage

How to create a connection:

```ts
import ladc from "ladc"
import sqlite3Adapter from "@ladc/sqlite3-adapter"

const cn = ladc({
  adapter: sqlite3Adapter({ fileName: `${__dirname}/mydb.sqlite` }),
  initConnection: async cn => {
    await cn.exec("PRAGMA foreign_keys = ON")
  }
})
```
