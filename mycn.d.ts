import { BasicDatabaseConnection } from "./driver-definitions";
import { DatabaseConnection, DbcOptions } from "./common-definitions";
export declare function createConnection(cnProvider: () => Promise<BasicDatabaseConnection>, options?: DbcOptions): Promise<DatabaseConnection>;
export { BasicDatabaseConnection, BasicPreparedStatement, BasicExecResult } from "./driver-definitions";
export { DatabaseConnection, ExecResult, PoolOptions, PreparedStatement } from "./common-definitions";