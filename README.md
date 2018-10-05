# LADC

A Layer Above Database Connectors, for Node.js.

_LADC_ provides a common API inspired from PDO and JDBC. It is built on top of relational database (SQL) connectors for Node.js.

1. A common way to access to relational databases;
1. A pool of connections in order to allow transactions in an asynchronous context;
1. A way to augment your connector with your SQL query builder.

## Install for SQLite (driver [sqlite3](https://github.com/mapbox/node-sqlite3))

```
npm install ladc @ladc/sqlite3-adapter
```

## Install for PostgreSQL (driver [pg](https://github.com/brianc/node-postgres))

```
npm install ladc @ladc/pg-adapter
```

## Usage

How to create a connection (here with SQLite):

```
import ladc from "ladc"
import sqlite3Adapter from "@ladc/sqlite3-adapter"

let cn = ladc({
  provider: sqlite3Adapter({ fileName: `${__dirname}/mydb.sqlite` }),
  init: async cn => {
    await cn.exec("PRAGMA foreign_keys = ON")
  }
})
```

Then, use the connection:

```
async function useMyConnection(cn) {
  let tx = await cn.beginTransaction()
  try {
    let newId = (await tx.exec("... insert 1 ...")).getInsertedId()
    await tx.exec("... insert 2 ...")
    await tx.commit() // A commit releases the underlying connection
  } finally {
    if (tx.inTransaction)
      await tx.rollback() // A rollback releases the underlying connection
  }
}
```

## The Complete API

### Members of a `DatabaseConnection`

Common methods between `DatabaseConnection` and `TransactionConnection`:

* `cn.prepare(sql, params)` returns a promise of a `PreparedStatement`;
* `cn.exec(sql, params)` executes the query and returns a promise of an `ExecResult`;
* `cn.all(sql, params)` executes the select query and returns a promise of an array of rows;
* `cn.singleRow(sql, params)` fetches with `cn.all(sql)` and returns the single row;
* `cn.singleValue(sql, params)` fetches with `cn.all(sql)` and returns the single value of the single row;
* `cn.cursor(sql, params)` opens a cursor and returns a promise of a `AsyncIterableIterator`.

Members that are specific to a `DatabaseConnection`:

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

Common methods between `DatabaseConnection` and `TransactionConnection`:

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

The package [@ladc/sql-bricks-modifier](https://github.com/paleo/ladc-sql-bricks-modifier) adds methods for [SQL Bricks](https://github.com/CSNW/sql-bricks) to the connections (`DatabaseConnection`, `TransactionConnection`).
