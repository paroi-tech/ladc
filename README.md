# @ladc/mysql2-adapter

The [LADC](https://github.com/paleo/ladc) adapter for the driver [mysql2](https://github.com/brianc/node-postgres) (MySQL).

## Install

```
npm install ladc @ladc/mysql2-adapter
```

## Usage

How to create a connection:

```
import ladc from "ladc"
import mysql2Adapter from "@ladc/mysql2-adapter"

let cn = ladc({
  adapter: mysql2Adapter({
    mysqlConfig: {
      host: "-my-server-",
      database: "-my-database-",
      user: "-my-user-",
      password: "-my-password-"
    }
  })
})
```

# Get the MySQL autoincrement inserted identifier

Set the option `autoincMapping` to map the autoincremented column name of each table that has one:

```js
const autoincMapping = {
  "category": "category_id",
  "post": "post_id",
}

mysql2Adapter({
  mysqlConfig: { /* credentials */ },
  autoincMapping
})
```

Or, it is still possible to manually write the `returning` statement then to get it:

```js
let result = await cn.exec("insert into message(message) values ('Hi there!') returning message_id") // Postgres only
let newId = result.getInsertedId("message_id")
```