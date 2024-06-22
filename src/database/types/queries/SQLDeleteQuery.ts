import type { SQLQueryInput } from "database/types/SQLQueryInput"
import type { SQLQueryRange } from "database/types/SQLQueryRange"
import type { SealedSQLDatabase } from "database/types/SealedSQLDatabase"
import type { DeleteStatementOptions } from "database/types/queries/options/DeleteStatementOptions"

////////////////////////////////////////////////////////////////////////////////

export interface SQLDeleteQuery {
  /**
   * Use different database then default.
   */
  with(db: SealedSQLDatabase): SQLDeleteQuery

  /**
   * Set query variables.
   */
  query(params: SQLQueryInput): SQLDeleteQuery

  /**
   * Change execution configuration
   */
  config(options: Partial<DeleteStatementOptions>): SQLDeleteQuery

  /**
   * Run query.
   */
  delete(expectedRange?: SQLQueryRange): Promise<{ affectedRows: number }>
}
