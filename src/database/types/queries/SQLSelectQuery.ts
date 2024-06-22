import type { SQLQueryInput } from "database/types/SQLQueryInput"
import type { SQLQueryRange } from "database/types/SQLQueryRange"
import type { SealedSQLDatabase } from "database/types/SealedSQLDatabase"
import type { SelectStatementOptions } from "database/types/queries/options/SelectStatementOptions"

////////////////////////////////////////////////////////////////////////////////

export interface SQLSelectQuery {
  /**
   * Use different database then default.
   */
  with(db: SealedSQLDatabase): SQLSelectQuery

  /**
   * Set query variables.
   */
  query(params: SQLQueryInput): SQLSelectQuery

  /**
   * Change execution configuration
   */
  config(options: Partial<SelectStatementOptions>): SQLSelectQuery

  /**
   * Run query and retrieve all entries.
   */
  entries<T>(expectedRange?: SQLQueryRange): Promise<T[]>

  /**
   * Run query and retrieve first entry or null if no entry matched.
   */
  maybeEntry<T>(): Promise<T | null>

  /**
   * Run query and retrieve first entry or throw error if entry doesn't exist.
   */
  entry<T>(expectedRange?: SQLQueryRange): Promise<T>

  /**
   * Retrieve the first entry and key specified.
   *
   * Recommended for use with COUNT queries or other pure data queries.
   */
  data<T = number>(key?: string): Promise<T>
}
