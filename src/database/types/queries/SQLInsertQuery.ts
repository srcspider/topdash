import type { SQLQueryInput } from "database/types/SQLQueryInput"
import type { SQLQueryRange } from "database/types/SQLQueryRange"
import type { SealedSQLDatabase } from "database/types/SealedSQLDatabase"
import type { InsertStatementOptions } from "database/types/queries/options/InsertStatementOptions"

////////////////////////////////////////////////////////////////////////////////

export interface SQLInsertQuery {
  /**
   * Use different database then default.
   */
  with(db: SealedSQLDatabase): SQLInsertQuery

  /**
   * Set query variables.
   */
  query(params: SQLQueryInput): SQLInsertQuery

  /**
   * Change execution configuration
   */
  config(options: Partial<InsertStatementOptions>): SQLInsertQuery

  /**
   * Run query.
   */
  insert(expectedRange?: SQLQueryRange): Promise<{ insertId: number }>
}
