# mycn-with-sql-bricks

This package helps to use [mycn](https://github.com/paleo/mycn) with the query builder [SQL Bricks](https://github.com/CSNW/sql-bricks).

## Additional API

This package adds the following methods to the MyCn connector:

* `prepareSqlBricks(sqlBricks)`: converts the `sqlBricks` object to a SQL query, then call the MyCn `prepare` method (async);
* `execSqlBricks(sqlBricks)`: converts the `sqlBricks` object to a SQL query, then call the MyCn `exec` method (async);
* `allSqlBricks(sqlBricks)`: converts the `sqlBricks` object to a SQL query, then call the MyCn `all` method (async);
* `singleRowSqlBricks(sqlBricks)`: converts the `sqlBricks` object to a SQL query, then call the MyCn `singleRow` method (async);
* `singleValueSqlBricks(sqlBricks)`: converts the `sqlBricks` object to a SQL query, then call the MyCn `singleValue` method (async).

## Usage

Install with MyCn and a connector (here is an example with SQLite):

```
npm install mycn mycn-sqlite3 mycn-with-sql-bricks
```

Here is how to create a connection:

```
import { sqlite3ConnectionProvider } from "mycn-sqlite3"
import { createDatabaseConnectionWithSqlBricks } from "mycn-with-sql-bricks"

let cn
async function getConnection() {
  if (!cn) {
    cn = await createDatabaseConnectionWithSqlBricks({
      provider: sqlite3ConnectionProvider({ fileName: "path/to/db.sqlite" }),
      init: async cn => {
        await cn.exec("PRAGMA foreign_keys = ON")
      },
      poolOptions: {
        logError: err => console.log(err)
      }
    }, {
      toParamsOptions: { placeholder: "?%d" } // SQLite requires parameter placeholders with '?'
    })
  }
  return cn
}
```

Then, use it:

```
import { select } from "sql-bricks"

async function test() {
  let cn = await getConnection()
  let sb = select("col1, col2").from("table1")
  let rows = await cn.allSqlBricks(sb)
  console.log(rows)
}
```
