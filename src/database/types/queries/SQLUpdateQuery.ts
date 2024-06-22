import type { SQLQueryInput } from "database/types/SQLQueryInput"
import type { SQLQueryRange } from "database/types/SQLQueryRange"
import type { SealedSQLDatabase } from "database/types/SealedSQLDatabase"
import type { UpdateStatementOptions } from "database/types/queries/options/UpdateStatementOptions"

////////////////////////////////////////////////////////////////////////////////

export interface SQLUpdateQuery {
  /**
   * Use different database then default.
   */
  with(db: SealedSQLDatabase): SQLUpdateQuery

  /**
   * Set query variables.
   */
  query(params: SQLQueryInput): SQLUpdateQuery

  /**
   * Change execution configuration
   */
  config(options: Partial<UpdateStatementOptions>): SQLUpdateQuery

  /**
   * Run query.
   */
  update(expectedRange?: SQLQueryRange): Promise<{ affectedRows: number }>
}
