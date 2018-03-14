import { Sqlite3ConnectionOptions } from "./exported-definitions";
import { BasicDatabaseConnection } from "mycn";
export declare function sqlite3ConnectionProvider(options: Sqlite3ConnectionOptions): () => Promise<BasicDatabaseConnection>;
export { Sqlite3ConnectionOptions } from "./exported-definitions";