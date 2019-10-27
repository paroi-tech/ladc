# @ladc/pg-adapter

The [LADC](https://github.com/paleo/ladc) adapter to the driver [pg](https://github.com/brianc/node-postgres) (Postgresql).

## Install

```
npm install ladc @ladc/pg-adapter
```

## Usage

How to create a connection:

```ts
import ladc from "ladc"
import pgAdapter from "@ladc/pg-adapter"

const cn = ladc({
  adapter: pgAdapter({
    pgConfig: {
      host: "-my-server-",
      database: "-my-database-",
      user: "-my-user-",
      password: "-my-password-"
    }
  })
})
```

# Get the Postgresql autoincrement inserted identifier

Set the option `autoincMapping` to map the autoincremented column name of each table that has one:

```js
const autoincMapping = {
  "category": "category_id",
  "post": "post_id",
}

pgAdapter({
  pgConfig: { /* credentials */ },
  autoincMapping
})
```

Or, it is still possible to manually write the `returning` statement then to get it:

```js
const result = await cn.exec("insert into message(message) values ('Hi there!') returning message_id") // Postgres only
const newId = result.getInsertedId("message_id")
```