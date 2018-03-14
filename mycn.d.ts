import { BasicDatabaseConnection } from "./driver-definitions";
import { DatabaseConnection, MycnOptions } from "./exported-definitions";
export declare function createDatabaseConnection(cnProvider: () => Promise<BasicDatabaseConnection>, options?: MycnOptions): Promise<DatabaseConnection>;
export { BasicDatabaseConnection, BasicPreparedStatement, BasicExecResult } from "./driver-definitions";
export { DatabaseConnection, ExecResult, PoolOptions, PreparedStatement, MycnOptions, SqlParameters } from "./exported-definitions";