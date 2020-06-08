# @ladc/sql-bricks-modifier

<!-- [![Dependencies Status](https://david-dm.org/paroi-tech/ladc-sql-bricks-modifier/status.svg)](https://david-dm.org/paroi-tech/ladc-sql-bricks-modifier)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/395c5ccd121545f4860c1bd05740de7e)](https://www.codacy.com/manual/paroi-tech/ladc-sql-bricks-modifier?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=paroi-tech/ladc-sql-bricks-modifier&amp;utm_campaign=Badge_Grade) -->

[![Build Status](https://travis-ci.com/paroi-tech/ladc.svg?branch=master)](https://travis-ci.com/paroi-tech/ladc)
[![npm](https://img.shields.io/npm/dm/@ladc/sql-bricks-modifier)](https://www.npmjs.com/package/@ladc/sql-bricks-modifier)
![Type definitions](https://img.shields.io/npm/types/@ladc/sql-bricks-modifier)
[![GitHub](https://img.shields.io/github/license/paroi-tech/ladc)](https://github.com/paroi-tech/ladc)

[LADC](https://github.com/paroi-tech/ladc/tree/master/ladc) is a common API on top of relational database (SQL) connectors. It can connect to Postgresql, MariaDB / MySQL, SQLite. The API is inspired from PDO and JDBC. It’s named LADC for “a Layer Above Database Connectors”.

This package is a plugin for LADC. It integrates the query builder [SQL Bricks](https://github.com/CSNW/sql-bricks) to LADC.

## Additional API

This package overloads the following methods of the LADC objects `MainConnection` and `TransactionConnection`:

- `prepare(sqlBricksQuery)`
- `exec(sqlBricksQuery)`
- `all(sqlBricksSelectStatement)`
- `singleRow(sqlBricksSelectStatement)`
- `singleValue(sqlBricksSelectStatement)`
- `cursor(sqlBricksSelectStatement)`

## How to use SQL Bricks with LADC (example with SQLite)

Install with LADC and a connector (here is an example with SQLite):

```
npm install ladc @ladc/sqlite3-adapter sql-bricks @ladc/sql-bricks-modifier
```

Here is how to create a connection:

```js
import ladc from "ladc";
import sqlite3Adapter from "@ladc/sqlite3-adapter";
import sqlBricksModifier from "@ladc/sql-bricks-modifier";

const cn = ladc({
  adapter: sqlite3Adapter({ fileName: `${__dirname}/mydb.sqlite` }),
  modifier: sqlBricksModifier(),
});
```

Then, use it:

```js
import { select } from "sql-bricks";

async function test(cn) {
  const q = select("col1, col2").from("table1");
  const rows = await cn.all(q);
  console.log(rows);
}
```

## How to use SQL Bricks with LADC: The case of MySQL

MySQL requires a specific `placeholder` option for SQL Bricks:

```js
import ladc from "ladc";
import mysql2Adapter from "@ladc/mysql2-adapter";
import sqlBricksModifier from "@ladc/sql-bricks-modifier";

const cn = ladc({
  adapter: mysql2Adapter({
    mysql2Config: {
      host: "-my-server-",
      database: "-my-database-",
      user: "-my-user-",
      password: "-my-password-",
    },
  }),
  modifier: sqlBricksModifier({
    toParamsOptions: { placeholder: "?" }, // ← Specific to MySQL
  }),
});
```

Now, the API can be used as usual.

## Contribute

With VS Code, our recommanded plugin is:

- **TSLint** from Microsoft (`ms-vscode.vscode-typescript-tslint-plugin`)
