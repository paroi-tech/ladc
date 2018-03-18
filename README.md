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

let cn
async function getConnection() {
  if (!cn) {
    cn = await createDatabaseConnection({
      provider: pgConnectionProvider({
        host: "-my-server-",
        database: "-my-database-",
        user: "-my-user-",
        password: "-my-password-"
      })
    })
  }
  return cn
}
```