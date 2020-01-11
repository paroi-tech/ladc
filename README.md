# Monorepo for LADC

[![Build Status](https://travis-ci.com/paleo/ladc.svg?branch=master)](https://travis-ci.com/paleo/ladc)

LADC is a common API on top of relational database (SQL) connectors. It can connect to Postgresql, MariaDB / MySQL, SQLite. The API is inspired from PDO and JDBC. It’s named LADC for “a Layer Above Database Connectors”.

## Projects

* [ladc](https://github.com/paleo/ladc/tree/master/ladc);
* [@ladc/pg-adapter](https://github.com/paleo/ladc/tree/master/pg-adapter) for **Postgresql**, using the _pg_ connector;
* [@ladc/mysql2-adapter](https://github.com/paleo/ladc/tree/master/mysql2-adapter) for **MariaDB** and **MySQL**, using the _mysql2_ connector;
* [@ladc/sqlite3-adapter](https://github.com/paleo/ladc/tree/master/sqlite3-adapter) for **SQLite**, using the _sqlite3_ connector.
