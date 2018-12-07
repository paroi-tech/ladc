# @ladc/sql-bricks-modifier

This package integrates the query builder [SQL Bricks](https://github.com/CSNW/sql-bricks) to [LADC](https://github.com/paleo/ladc).

## Additional API

This package overloads the following methods to the LADC objects `MainConnection` and `TransactionConnection`:

* `prepare(sqlBricksQuery)`
* `exec(sqlBricksQuery)`
* `all(sqlBricksSelectStatement)`
* `singleRow(sqlBricksSelectStatement)`
* `singleValue(sqlBricksSelectStatement)`
* `cursor(sqlBricksSelectStatement)`

## Usage

Install with LADC and a connector (here is an example with SQLite):

```
npm install ladc @ladc/sqlite3-adapter sql-bricks @ladc/sql-bricks-modifier
```

Here is how to create a connection:

```
const ladc = require("ladc")
const sqlite3Adapter = require("@ladc/sqlite3-adapter")
const sqlBricksModifier = require("@ladc/sql-bricks-modifier")

let sqlite3Cn = ladc({
  adapter: sqlite3Adapter({ fileName: `${__dirname}/testdb.sqlite` })
  modifier: sqlBricksModifier({
    toParamsOptions: { placeholder: "?%d" } // SQLite requires parameter placeholders with '?'
  })
})
```

Then, use it:

```
import { select } from "sql-bricks"

async function test(cn) {
  let sql = select("col1, col2").from("table1")
  let rows = await cn.all(sql)
  console.log(rows)
}
```
