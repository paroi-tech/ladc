# mycn

My Connector.

This is a layer above relational database (SQL) connectors for Node.js, inspired from PDO and JDBC:

1. A common way to access to relational databases;
1. A pool of connections in order to allow transactions in an asynchronous context;
1. A way to augment your connector with your SQL query builder.

## Install for SQLite (driver [sqlite3](https://github.com/mapbox/node-sqlite3))

```
npm install mycn mycn-sqlite3
```

## Install for PostgreSQL (driver [pg](https://github.com/brianc/node-postgres))

```
npm install mycn mycn-pg
```

## Usage

How to create a connection (here with SQLite):

```
import { createDatabaseConnection } from "mycn"
import { sqlite3ConnectionProvider } from "mycn-sqlite3"

let cn = createDatabaseConnection({
  provider: sqlite3ConnectionProvider({ fileName: `${__dirname}/mydb.sqlite` }),
  init: async cn => {
    await cn.exec("PRAGMA foreign_keys = ON")
  }
})
```

Then, use the connection:

```
async function useMyConnection() {
  let cn = await getConnection()
  let transCn = await cn.beginTransaction()
  try {
    let newId = (await transCn.exec("... insert 1 ...")).getInsertedId()
    await transCn.exec("... insert 2 ...")
    await transCn.commit() // A commit releases the underlying connection
  } finally {
    if (transCn.inTransaction)
      await transCn.rollback() // A rollback releases the underlying connection
  }
}
```

## The API

The methods of a `DatabaseConnection`:

* `prepare(sql, params)` returns a promise of an `PreparedStatement`;
* `exec(sql, params)` returns a promise of an `ExecResult`;
* `all(sql, params)` returns a promise of an array of rows;
* `singleRow(sql, params)` fetches with `cn.all(sql)` and returns the single row;
* `singleValue(sql, params)` fetches with `cn.all(sql)` and returns the single value of the single row;
* `execScript(sql)` execute a multilines script;
* `close()` close the connection (for the root connection) or release it in the pool.

The members of a `ExecResult`:

* `getInsertedId()` returns the inserted identifier;
* `getInsertedIdAsNumber()` returns the inserted identifier as `number`;
* `getInsertedIdAsString()` returns the inserted identifier as `string`;
* `affectedRows` is a readonly property with the number of affected rows.

The methods of a `PreparedStatement`:

* `exec(params)` returns a promise of an `ExecResult`;
* `all(params)` returns a promise of an array of rows;
* `singleRow(params)` fetches with `cn.all(sql)` and returns the single row;
* `singleValue(params)` fetches with `cn.all(sql)` and returns the single value of the single row;
* `fetch()` fetches the next row or returns `undefined` if the resultset is finished;
* `bind(nb, value)` binds a value to the specified parameter number;
* `unbindAll()` cancels all the bound values;
* `finalize()` closes the cursor (optional).

## The API related to transactions

The following members are provided for managing transactions:

* `beginTransaction()` starts the transaction and returns a connection `transCn` allocated to the transaction
* `transCn.inTransaction` is a readonly boolean
* `transCn.rollback()`
* `transCn.commit()`

It isn't required to `close` a connection allocated to a transaction, because a `submit` or a `rollback` will release the underlying connection.

When a transaction connection is closed, the transaction is rollbacked. Then the underlying connection is released to the pool.

To stop the connection pool, close the root connection.

## How to integrate a query builder

The package [mycn-with-sql-bricks](https://github.com/paleo/mycn-with-sql-bricks) adds methods for [SQL Bricks](https://github.com/CSNW/sql-bricks) to `DatabaseConnection`.
