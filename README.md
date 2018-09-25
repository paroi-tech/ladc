# mycn-pg

This package is the connector for [mycn](https://github.com/paleo/mycn) to the driver [pg](https://github.com/brianc/node-postgres).

## Install

```
npm install mycn mycn-pg
```

## Usage

How to create a connection:

```
import { createDatabaseConnection } from "mycn"
import { pgConnectionProvider } from "mycn-pg"

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

If the primary key column name is `id` or `{table-name}_id`, just use the Mycn methods `getInsertedId()`, `getInsertedIdAsString()`, `getInsertedIdAsNumber()` as usual.

Otherwise, you have to provide the primary key column name as a parameter to these methods.