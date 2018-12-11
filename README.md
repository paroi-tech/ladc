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
import ladc from "ladc"
import sqlite3Adapter from "@ladc/sqlite3-adapter"
import sqlBricksModifier from "@ladc/sql-bricks-modifier"

let cn = ladc({
  adapter: sqlite3Adapter({ fileName: `${__dirname}/mydb.sqlite` }),
  modifier: sqlBricksModifier()
})
```

Then, use it:

```
import { select } from "sql-bricks"

async function test(cn) {
  let q = select("col1, col2").from("table1")
  let rows = await cn.all(q)
  console.log(rows)
}
```
