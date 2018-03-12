import { Database } from "sqlite";
import { PoolOptions, Connection } from "./common-definitions";
export declare function sqliteConnection(openSqliteConnection: () => Promise<Database>, poolOptions?: PoolOptions): Promise<Connection>;
export { Connection, InTransactionConnection, PoolOptions } from "./common-definitions";