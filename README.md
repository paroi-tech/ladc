# @ladc/sql-bricks-modifier

This package integrates the query builder [SQL Bricks](https://github.com/CSNW/sql-bricks) to [LADC](https://github.com/paleo/ladc).

## Additional API

This package overloads the following methods to the LADC objects `DatabaseConnection` and `TransactionConnection`:

* `prepare(sqlBricksQuery)`
* `exec(sqlBricksQuery)`
* `all(sqlBricksSelectStatement)`
* `singleRow(sqlBricksSelectStatement)`
* `singleValue(sqlBricksSelectStatement)`
* `cursor(sqlBricksSelectStatement)`

## Usage

Install with LADC and a connector (here is an example with SQLite):

```
npm install ladc @ladc/sqlite3-adapter @ladc/sql-bricks-modifier
```

Here is how to create a connection:

```
const { createDatabaseConnection } = require("ladc")
const { addSqlBricksToConnection } = require("@ladc/sql-bricks-modifier")
const { sqlite3ConnectionProvider } = require("@ladc/sqlite3-adapter")

let sqlite3Cn = createDatabaseConnection({
  provider: sqlite3ConnectionProvider({ fileName: `${__dirname}/testdb.sqlite` })
  modifyConnection: addSqlBricksToConnection({
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
