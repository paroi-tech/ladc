# @ladc/pg

The [LADC](https://github.com/paleo/ladc) adapter to the driver [pg](https://github.com/brianc/node-postgres) (Postgresql).

## Install

```
npm install ladc @ladc/pg
```

## Usage

How to create a connection:

```
import { createDatabaseConnection } from "ladc"
import { pgConnectionProvider } from "@ladc/pg"

let cn = createDatabaseConnection({
  provider: pgConnectionProvider({
    host: "-my-server-",
    database: "-my-database-",
    user: "-my-user-",
    password: "-my-password-"
  })
})
```

# Get the Postgresql autoincrement inserted ID

By default, when an `insert` query is recognized by the adapter, it automatically appends `returning *` at the end of the query. Then, when the method `getLastInsertId()` is called, the adapter searchs for a column named `id` or `theTableName_id` and returns its value.

It is possible to optimize this behaviour. The option `getAutoincrementedIdColumnName` can be set with a function that returns the autoincremented column name of a given table:

```js
const autoincColumns = {
  "myprefix_category": "category_id",
  "myprefix_post": "post_id",
}

pgConnectionProvider({ /* credentials */ }, {
  getAutoincrementedIdColumnName: tableName => autoincColumns[tableName]
})
```

Or, it is still possible to manually write the `returning` statement then to get it:

```js
let result = await cn.exec("insert into message(message) values ('Hi there!') returning message_id") // Postgres only
let newId = result.getInsertedId("message_id")
```