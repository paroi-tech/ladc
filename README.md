# @ladc/mysql2-adapter

[![Build Status](https://travis-ci.com/paleo/ladc-mysql2-adapter.svg?branch=master)](https://travis-ci.com/paleo/ladc-mysql2-adapter)
[![Dependencies Status](https://david-dm.org/paleo/ladc-mysql2-adapter/status.svg)](https://david-dm.org/paleo/ladc-mysql2-adapter)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/732365855c7e452a893b389fa40262c1)](https://www.codacy.com/manual/paleo/ladc-mysql2-adapter?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=paleo/ladc-mysql2-adapter&amp;utm_campaign=Badge_Grade)
[![npm](https://img.shields.io/npm/dm/@ladc/mysql2-adapter)](https://www.npmjs.com/package/@ladc/mysql2-adapter)
![Type definitions](https://img.shields.io/npm/types/@ladc/mysql2-adapter)
[![GitHub](https://img.shields.io/github/license/paleo/ladc-mysql2-adapter)](https://github.com/paleo/ladc-mysql2-adapter)

[LADC](https://github.com/paleo/ladc) is a common API on top of relational database (SQL) connectors. It can connect to Postgresql, MariaDB / MySQL, SQLite. The API is inspired from PDO and JDBC. It’s named LADC for “a Layer Above Database Connectors”.

This package is a plugin for LADC. It is an adapter for MySQL and MariaDB, using the connector [mysql2](https://github.com/sidorares/node-mysql2).

## Install

```
npm install @ladc/mysql2-adapter ladc
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

## Contribute

With VS Code, our recommanded plugin is:

* **TSLint** from Microsoft (`ms-vscode.vscode-typescript-tslint-plugin`)
