# @ladc/sqlite3-adapter

<!-- [![Dependencies Status](https://david-dm.org/paroi-tech/ladc-sqlite3-adapter/status.svg)](https://david-dm.org/paroi-tech/ladc-sqlite3-adapter)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/b1db8eb8f3754035854abce5758a2fab)](https://www.codacy.com/manual/paroi-tech/ladc-sqlite3-adapter?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=paroi-tech/ladc-sqlite3-adapter&amp;utm_campaign=Badge_Grade) -->

[![Build Status](https://travis-ci.com/paroi-tech/ladc.svg?branch=master)](https://travis-ci.com/paroi-tech/ladc)
[![npm](https://img.shields.io/npm/dm/@ladc/sqlite3-adapter)](https://www.npmjs.com/package/@ladc/sqlite3-adapter)
![Type definitions](https://img.shields.io/npm/types/@ladc/sqlite3-adapter)
[![GitHub](https://img.shields.io/github/license/paroi-tech/ladc)](https://github.com/paroi-tech/ladc)

[LADC](https://github.com/paroi-tech/ladc/tree/master/ladc) is a common API on top of relational database (SQL) connectors. It can connect to Postgresql, MariaDB / MySQL, SQLite. The API is inspired from PDO and JDBC. It’s named LADC for “a Layer Above Database Connectors”.

This package is a plugin for LADC. It is an adapter for SQLite, using the connector [sqlite3](https://github.com/mapbox/node-sqlite3) (SQLite).

## Install

```
npm install @ladc/sqlite3-adapter ladc
```

## Usage

How to create a connection:

```ts
import ladc from "ladc";
import sqlite3Adapter from "@ladc/sqlite3-adapter";

const cn = ladc({
  adapter: sqlite3Adapter({ fileName: `${__dirname}/mydb.sqlite` }),
  initConnection: async (cn) => {
    await cn.exec("PRAGMA foreign_keys = ON");
  },
});
```

## Contribute

With VS Code, our recommanded plugin is:

- **TSLint** from Microsoft (`ms-vscode.vscode-typescript-tslint-plugin`)
