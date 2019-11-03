# LADC

[![Build Status](https://travis-ci.com/paleo/ladc.svg?branch=master)](https://travis-ci.com/paleo/ladc)
[![Dependencies Status](https://david-dm.org/paleo/ladc/status.svg)](https://david-dm.org/paleo/ladc)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/fcc70f036fb14a1abf1fc22a61ae81c1)](https://www.codacy.com/manual/paleo/ladc?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=paleo/ladc&amp;utm_campaign=Badge_Grade)
[![npm](https://img.shields.io/npm/dm/ladc)](https://www.npmjs.com/package/ladc)
![Type definitions](https://img.shields.io/npm/types/ladc)
[![GitHub](https://img.shields.io/github/license/paleo/ladc)](https://github.com/paleo/ladc)

LADC is a common API on top of relational database (SQL) connectors. It can connect to Postgresql, MariaDB / MySQL, SQLite. The API is inspired from PDO and JDBC. It’s named LADC for “a Layer Above Database Connectors”.

## Why a Common API Above DBMS connectors?

_Above_ connectors? Unlike PDO and JDBC, the purpose is not to replace DBMS drivers. This project is designed to remain a lightweight layer on top of the rock solid drivers we currently use in Node.js.

Why a common API? It brings to our programs an improved compatibility with various DBMS. It is also easier to learn.

## Let’s Stop Talking! Show Me Some Code!

Here is an example of code that uses a LADC connection:

```ts
async function showMeSomeCode(cn) {
  const result = await cn.exec(
    "insert into test (message) values ('Hello, World!')"
  )
  const newId = result.getInsertedIdAsString()

  const row = await cn.singleRow(
    "select message, ts from test where test_id = $1",
    [newId]
  )

  console.log(`Inserted row ${newId}:`, row)
}
```

## Tutorial: Getting Started with LADC

LADC works with Node 8 or above. Add it to a project:

```sh
npm install ladc
```

Then you'll need an adapter for the DBMS of your choice. Here are the available adapters:

* [@ladc/pg-adapter](https://github.com/paleo/ladc-pg-adapter) for **Postgresql**, using the _pg_ connector;
* [@ladc/mysql2-adapter](https://github.com/paleo/ladc-mysql2-adapter) for **MariaDB** and **MySQL**, using the _mysql2_ connector;
* [@ladc/sqlite3-adapter](https://github.com/paleo/ladc-sqlite3-adapter) for **SQLite**, using the _sqlite3_ connector.

Let's pick the SQLite's one:

```sh
npm install @ladc/sqlite3-adapter
```

The code below show how to connect to a SQLite database:

```ts
import ladc from "ladc"
import sqlite3Adapter from "@ladc/sqlite3-adapter"

function createConnection() {
  return ladc({
    adapter: sqlite3Adapter({ fileName: `${__dirname}/testdb.sqlite` }),
    initConnection: async cn => {
      await cn.exec("PRAGMA foreign_keys = ON")
    }
  })
}
```

The SQLite driver will create an empty database in a new `testdb.sqlite` file if it does not exist. We can then create a `test` table:

```ts
async function createSchema(cn) {
  await cn.script(`
create table if not exists test (
  test_id integer not null primary key autoincrement,
  message varchar(250) not null,
  ts timestamp not null default current_timestamp
);
  `)
}
```

Finally, here is how to execute all this stuff.

```ts
async function main() {
  const cn = createConnection()
  try {
    await createSchema(cn)
    await showMeSomeCode(cn)
  } finally {
    await cn.close()
  }
}

main().catch(console.log)
```

## The Particular Case of Transactions in Asynchronous Programming

In asynchronous programming, it is common to open once a connection to a database. But we shouldn’t use a common connection for transactions, because other queries from other callbacks could be unintentionally executed in the transaction.

LADC provides **a pool of connections**. Each transaction takes an exclusive underlying connection. When the transaction is committed or rolled back, the underlying connection is released into the pool. In addition, the mechanism is optimized so that, if no operation has taken place simultaneously outside the transaction, then the transaction will have simply used the main underlying connection without opening a second one.

Here is an example of code with a transaction:

```ts
async function transactionExample(cn) {
  // Get an exclusive underlying connection in 'tx'
  const tx = await cn.beginTransaction()
  try {
    // Use 'tx' to execute some queries
    const result = await tx.exec(
      "insert into test (message) values ($1)",
      ["Message 1 of the transaction"]
    )
    const newId = result.getInsertedId()
    await tx.exec(
      "insert into test (message) values ($1)",
      [`Message 2 related to ${newId}`]
    )
    // A commit releases the underlying connection
    await tx.commit()
  } finally {
    if (tx.inTransaction) {
      // A rollback releases the underlying connection, too
      await tx.rollback()
    }
  }
}
```

## Prepared Statements

Drivers for Node.js allow to start several prepared statements on the same connection. But the way to proceed is very different from a DBMS to another. The LADC API provides a common way to use prepared statements:

```ts
async function exampleWithPreparedStatement(cn, dialect) {
  const messages = ["Hello, World!", "Hi there!", "Hi!"]
  const ps = await cn.prepare(`insert into test (message) values ($1)`)
  for (const message of messages)
    await ps.exec([message])
  await ps.close()
}
```

## Cursors

A LADC cursor implements the interfaces `AsyncIterable` and `AsyncIterator`. Here is how to use a cursor with Node.js 10 and above:

```ts
async function exampleWithCursor(cn) {
  const cursor = await cn.cursor("select test_id, message from test")
  for await (let row of cursor)
    console.log(row)
}
```

Notice:

* There is a limitation of one cursor by underlying connection;
* The MySQL connector doesn't provide cursors.

## How to Integrate a Query Builder

LADC will integrate well with the query builder [SQL Bricks](https://csnw.github.io/sql-bricks/), using the package [@ladc/sql-bricks-modifier](https://github.com/paleo/ladc-sql-bricks-modifier).

Add the dependencies:

```sh
npm install sql-bricks @ladc/sql-bricks-modifier
```

And create the modified connection:

```ts
import sqlBricksModifier from "@ladc/sql-bricks-modifier"
import ladc from "ladc"

const cn = ladc({
  adapter: /* … adapter to your DBMS here … */,
  modifier: sqlBricksModifier()
}) // TypeScript users, append here: as SBMainConnection
```

Then, use it:

```ts
import { select, like } from "sql-bricks"

async function exampleWithSqlBricks(cn) {
  const q = select("test_id, message")
    .from("test")
    .where(like("message", "Hi%"))
  const rows = await cn.all(q)
  console.log(rows)
}
```

## Log Errors

Because LADC uses a pool of underlying connections, errors can occur independently of any query. By default, independant errors are logged with `console.error(message)`. But it is possible to log them where you want:

```ts
import ladc from "ladc"

const cn = ladc({
  // …
  logError: err => { /* Do something with the error. */ }
})
```

## The Complete API

### Members of a `MainConnection`

Common methods between `MainConnection` and `TransactionConnection`:

* `cn.prepare(sql)` returns a promise of a `PreparedStatement`;
* `cn.exec(sql, params?)` executes the query and returns a promise of an `ExecResult`;
* `cn.all(sql, params?)` executes the select query and returns a promise of an array of rows;
* `cn.singleRow(sql, params?)` fetches with `cn.all` and returns the single row;
* `cn.singleValue(sql, params?)` fetches with `cn.all` and returns the single value of the single row;
* `cn.cursor(sql, params?)` opens a cursor and returns a promise of a `AsyncIterableIterator`.

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

* `ps.bind(params)` binds values to the specified parameters;
* `ps.bind(indexOrKey, value)` binds a value to the specified parameter;
* `ps.unbind()` unbinds all the bound values;
* `ps.unbind(indexOrKey)` unbinds the value from the specified parameter;
* `ps.exec(params?)` executes the query and returns a promise of an `ExecResult`;
* `ps.all(params?)` executes the select query and returns a promise of an array of rows;
* `ps.singleRow(params?)` fetches with `ps.all` and returns the single row;
* `ps.singleValue(params?)` fetches with `ps.all` and returns the single value of the single row;
* `ps.cursor(params?)` opens a cursor and returns a promise of a `AsyncIterableIterator`;
* `ps.close()` closes the prepared statement.

### Members of a `TransactionConnection`

Common methods between `MainConnection` and `TransactionConnection`:

* `tx.prepare(sql)` returns a promise of a `PreparedStatement`;
* `tx.exec(sql, params?)` executes the query and returns a promise of an `ExecResult`;
* `tx.all(sql, params?)` executes the select query and returns a promise of an array of rows;
* `tx.singleRow(sql, params?)` fetches with `tx.all` and returns the single row;
* `tx.singleValue(sql, params?)` fetches with `tx.all` and returns the single value of the single row;
* `tx.cursor(sql, params?)` opens a cursor and returns a promise of a `AsyncIterableIterator`.

Members that are specific to a `TransactionConnection`:

* `tx.inTransaction` is a readonly boolean;
* `tx.rollback()` rollbacks the transaction, then releases the underlying connection to the pool;
* `tx.commit()` commits the transaction, then releases the underlying connection to the pool.

## Contribute

With VS Code, our recommanded plugin is:

* **TSLint** from Microsoft (`ms-vscode.vscode-typescript-tslint-plugin`)
