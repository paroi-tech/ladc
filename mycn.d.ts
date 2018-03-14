import { BasicDatabaseConnection } from "./driver-definitions";
import { DatabaseConnection, DbcOptions } from "./exported-definitions";
export declare function createDatabaseConnection(cnProvider: () => Promise<BasicDatabaseConnection>, options?: DbcOptions): Promise<DatabaseConnection>;
export { BasicDatabaseConnection, BasicPreparedStatement, BasicExecResult } from "./driver-definitions";
export { DatabaseConnection, ExecResult, PoolOptions, PreparedStatement } from "./exported-definitions";