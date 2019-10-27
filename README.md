# @ladc/mysql2-adapter

The [LADC](https://github.com/paleo/ladc) adapter for the driver [mysql2](https://github.com/sidorares/node-mysql2) (MySQL).

## Install

```
npm install ladc @ladc/mysql2-adapter
```

## Usage

How to create a connection:

```js
import ladc from "ladc"
import mysql2Adapter from "@ladc/mysql2-adapter"

const cn = ladc({
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