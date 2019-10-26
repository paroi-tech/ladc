# LADC

LADC, a Layer Above Database Connectors, provides a common API inspired from PDO and JDBC, for Node.js.

**Note: Read [this article](https://medium.com/@paleo.said/a-layer-above-database-connectors-that-provides-a-common-api-like-pdo-and-jdbc-but-for-node-js-cf7e47666c81) for a detailed presentation of LADC.**

## What it is

_LADC_ provides a common API inspired from PDO and JDBC. It is built on top of relational database (SQL) connectors for Node.js. It provides:

1. A common way to access to relational databases;
1. A pool of connections in order to allow transactions in an asynchronous context;
1. A way to augment your connector with your SQL query builder.

## Install

Install for SQLite (using the connector [sqlite3](https://github.com/mapbox/node-sqlite3)):

```
npm install ladc @ladc/sqlite3-adapter
```

Or, install for PostgreSQL (using the connector [pg](https://github.com/brianc/node-postgres)):

```
npm install ladc @ladc/pg-adapter
```

## Usage

How to create a connection (here with SQLite):

```ts
import ladc from "ladc"
import sqlite3Adapter from "@ladc/sqlite3-adapter"

let cn = ladc({
  adapter: sqlite3Adapter({ fileName: `${__dirname}/mydb.sqlite` }),
  initConnection: async cn => {
    await cn.exec("PRAGMA foreign_keys = ON")
  }
})
```

Then, use the connection:

```ts
async function example(cn) {
  let result = await cn.exec("insert into test (message) values ('Hello, World!')")
  let newId = result.getInsertedIdAsString()
  let row = await cn.singleRow("select message, ts from test where test_id = $1", [newId])
  console.log(`Inserted row ${newId}:`, row)
}
```

## The Complete API

### Members of a `MainConnection`

Common methods between `MainConnection` and `TransactionConnection`:

* `cn.prepare(sql, params)` returns a promise of a `PreparedStatement`;
* `cn.exec(sql, params)` executes the query and returns a promise of an `ExecResult`;
* `cn.all(sql, params)` executes the select query and returns a promise of an array of rows;
* `cn.singleRow(sql, params)` fetches with `cn.all(sql)` and returns the single row;
* `cn.singleValue(sql, params)` fetches with `cn.all(sql)` and returns the single value of the single row;
* `cn.cursor(sql, params)` opens a cursor and returns a promise of a `AsyncIterableIterator`.

Members that are specific to a `MainConnection`:

* `cn.beginTransaction()` starts a transaction and returns a promise of a `TransactionConnection`;
* `cn.script(sql)` executes a multi-line script;
* `cn.close()` closes the LADC connection, this includes closing the pool of underlying connections.

### Members of an `ExecResult`

* `result.affectedRows` is a readonly number;
* `result.getInsertedId()` returns the inserted identifier;
* `result.getInsertedIdAsNumber()` returns the inserted identifier as a `number`;
* `result.getInsertedIdAsString()` returns the inserted identifier as a `string`.

### Members of a `PreparedStatement`

* `ps.bind(nbOrKey, value)` binds a value to the specified parameter number;
* `ps.unbind(nbOrKey)` unbinds a value to the specified parameter number;
* `ps.bindAll(params)` binds a value to the specified parameter number;
* `ps.unbindAll()` unbinds all the bound values;
* `ps.exec(params?)` executes the query and returns a promise of an `ExecResult`;
* `ps.all(params?)` executes the select query and returns a promise of an array of rows;
* `ps.singleRow(params?)` fetches with `cn.all(sql)` and returns the single row;
* `ps.singleValue(params?)` fetches with `cn.all(sql)` and returns the single value of the single row;
* `ps.cursor(params?)` opens a cursor and returns a promise of a `AsyncIterableIterator`;
* `ps.close()` closes the prepared statement.

### Members of a `TransactionConnection`

Common methods between `MainConnection` and `TransactionConnection`:

* `tx.prepare(sql, params)` returns a promise of a `PreparedStatement`;
* `tx.exec(sql, params)` executes the query and returns a promise of an `ExecResult`;
* `tx.all(sql, params)` executes the select query and returns a promise of an array of rows;
* `tx.singleRow(sql, params)` fetches with `cn.all(sql)` and returns the single row;
* `tx.singleValue(sql, params)` fetches with `cn.all(sql)` and returns the single value of the single row;
* `tx.cursor(sql, params)` opens a cursor and returns a promise of a `AsyncIterableIterator`.

Members that are specific to a `TransactionConnection`:

* `tx.inTransaction` is a readonly boolean;
* `tx.rollback()` rollbacks the transaction, then releases the underlying connection to the pool;
* `tx.commit()` commits the transaction, then releases the underlying connection to the pool.

## How to integrate a query builder

The package [@ladc/sql-bricks-modifier](https://github.com/paleo/ladc-sql-bricks-modifier) adds methods for [SQL Bricks](https://github.com/CSNW/sql-bricks) to the connections (`MainConnection`, `TransactionConnection`).
