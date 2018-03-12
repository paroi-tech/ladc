# sqlite-with-transactions

A wrapper library based on \"sqlite\" (which is based on \"sqlite3\") that adds a pool of connections for non-blocking transactions

## Context

1. The package [sqlite3](https://github.com/mapbox/node-sqlite3/) provides a connector to SQLite;
2. The package [sqlite](https://github.com/kriasoft/node-sqlite) is a wrapper to promisify the package _sqlite3_;
3. This package **sqlite-with-transactions** is a wrapper that adds transactions over the package _sqlite_.

Notice: A package [sqlite3-transactions](https://github.com/Strix-CZ/sqlite3-transactions) exists but it locks the whole database during each transaction. Here we prefer to use a non-blocking solution with a pool of connections.

## Principle

The package _sqlite-with-transactions_ implements a pool of connections. Each transaction has its own connection.

## Install

```
npm install sqlite sqlite-with-transactions
```

## Usage

How to create a connection:

```
import { open } from "sqlite"
import { sqliteConnection } from "./sqlite-with-transactions"

async function makeMyConnection() {
  let cn = await sqliteConnection(async () => {
    let db = await open("/path/to/my-db.sqlite")
    await db.run("PRAGMA foreign_keys = ON")
    return db
  })
  return cn
}
```

Then, use the connection:

```
async function useMyConnection() {
  let cn = await makeMyConnection()
  let transCn = await cn.beginTransaction()
  try {
    await transCn.run("... insert 1 ...")
    await transCn.run("... insert 2 ...")
    await transCn.commit()
  } finally {
    if (transCn.inTransaction)
      await transCn.rollback()
  }
  cn.close()
}
```

## Notes

The wrapper adds two useful methods:

* `cn.singleRow(sql)` fetches with `cn.all(sql)` and returns the single row;
* `cn.singleValue(sql)` fetches with `cn.all(sql)` and returns the single value of the single row.

The method `cn.beginTransaction()` returns an object of type `InTransactionConnection`. An `InTransactionConnection` implements all the connection methods and adds the following members:

* `transCn.rollback()`
* `transCn.commit()`
* `transCn.inTransaction` is a boolean

It isn't required to `close` an `InTransactionConnection`. A `submit` or a `rollback` will release the underlying connection.

When an `InTransactionConnection` is closed, the transaction is rollbacked. Notice: The underlying connection of an `InTransactionConnection` is never closed but released to the pool.

The case of a transaction in a transaction: when the method `beginTransaction()` is called on a connection of type `InTransactionConnection`, the default behaviour is to return the same instance and not to open another connection.

To stop the connection pool, close the root connection.
