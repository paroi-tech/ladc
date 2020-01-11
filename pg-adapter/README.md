# @ladc/pg-adapter

<!-- [![Dependencies Status](https://david-dm.org/paleo/ladc-pg-adapter/status.svg)](https://david-dm.org/paleo/ladc-pg-adapter)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/af6b0c42452d449086625891b86f478c)](https://www.codacy.com/manual/paleo/ladc-pg-adapter?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=paleo/ladc-pg-adapter&amp;utm_campaign=Badge_Grade) -->
[![Build Status](https://travis-ci.com/paleo/ladc.svg?branch=master)](https://travis-ci.com/paleo/ladc)
[![npm](https://img.shields.io/npm/dm/@ladc/pg-adapter)](https://www.npmjs.com/package/@ladc/pg-adapter)
![Type definitions](https://img.shields.io/npm/types/@ladc/pg-adapter)
[![GitHub](https://img.shields.io/github/license/paleo/ladc)](https://github.com/paleo/ladc)

[LADC](https://github.com/paleo/ladc/tree/master/ladc) is a common API on top of relational database (SQL) connectors. It can connect to Postgresql, MariaDB / MySQL, SQLite. The API is inspired from PDO and JDBC. It’s named LADC for “a Layer Above Database Connectors”.

This package is a plugin for LADC. It is an adapter for Postgresql, using the connector [pg](https://github.com/brianc/node-postgres).

## Install

```sh
npm install @ladc/pg-adapter ladc
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

## How to Retrieve the Last Inserted Identifier with Postgresql

Postgresql has a gotcha regarding autoincremented identifiers. The insert query must end with a non-standard returning statement. Then, the name of the autoincremented column is required to obtain its last inserted value.

The LADC adapter for Postgresql provides the `autoincMapping` option. It allows to provide a mapping of autoincremented column name for each table that has one. Here is an example:

```js
const autoincMapping = {
  "test": "test_id",
}

const cn = ladc({
  adapter: pgAdapter({
    pgConfig: {
      /* credentials */
    },
    autoincMapping
  })
})

// The adapter will append 'returning test_id'
const result = await cn.exec("insert into test (message) values ('Hello, World!')")

// Returns the value of 'test_id'
const newId = result.getInsertedId()
```

Or, it is still possible to manually write the `returning` statement then to get it:

```js
const result = await cn.exec(
  "insert into test(message) values ('Hi there!') returning test_id" // Postgres only
)
const newId = result.getInsertedId("test_id")
```

## Contribute

With VS Code, our recommanded plugin is:

* **TSLint** from Microsoft (`ms-vscode.vscode-typescript-tslint-plugin`)
