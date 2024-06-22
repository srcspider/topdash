import type { SQLDeleteQuery } from "database/types/queries/SQLDeleteQuery"
import type { SQLInsertQuery } from "database/types/queries/SQLInsertQuery"
import type { SQLSelectQuery } from "database/types/queries/SQLSelectQuery"
import type { SQLUpdateQuery } from "database/types/queries/SQLUpdateQuery"

import type { nil } from "core/nil"

import type { SealedSQLStatement } from "database/sql"

////////////////////////////////////////////////////////////////////////////////

/**
 * A Sealed SQL Database is simply a database designed to work with Sealed SQL
 * Statements. Sealed SQL Statements are a special type created only by special
 * dedicated template literal functions (with some tricks to make it so only
 * they can make one). This ensures the relative safety and sanity of the
 * statement declared (ie. no injects, mixed statements, etc).
 *
 * ## Note on Name
 *
 * The "SQL" in the name is perfunctory and just refers loosly to the
 * expected language format (ie. "SELECT", "UPDATE", "DELETE"), it doesn't
 * matter if the database is actually classical relational or distributed
 * (ie. so called NoSQL) or if the keywords SELECT, UPDATE and DELETE aren't
 * used or if other keywords are used. As long as loosly the condition of
 * selecting, updating and deleting are seperate operations and the only
 * operations, virtually any database type can be implemented.
 *
 * It's simply a little bit clearer and easier to understand by leveraging SQL
 * as the default expectation and also falls in line with one of the goals of
 * having a safe, easy to use, extremely optimal, and universal, solution to
 * creating queries.
 */
export interface SealedSQLDatabase {
  // ===================
  // Query Sanity Checks
  // ===================

  /**
   * Sanity check raw SELECT statement.
   *
   * DISCLAIMER: this is only intended to validate against unintended misuse
   */
  sanityCheckSQLSelect(rawStmt: string): string[] | nil

  /**
   * Sanity check raw INSERT statement.
   *
   * DISCLAIMER: this is only intended to validate against unintended misuse
   */
  sanityCheckSQLInsert(rawStmt: string): string[] | nil

  /**
   * Sanity check raw UPDATE statement.
   *
   * DISCLAIMER: this is only intended to validate against unintended misuse
   */
  sanityCheckSQLUpdate(rawStmt: string): string[] | nil

  /**
   * Sanity check raw DELETE statement.
   *
   * DISCLAIMER: this is only intended to validate against unintended misuse
   */
  sanityCheckSQLDelete(rawStmt: string): string[] | nil

  // ==============
  // Query Builders
  // ==============

  /**
   * Create SELECT query.
   *
   * This query builder should never be invoked directly using the database
   * instance but instead indirectly via SQL template literals.
   */
  createSQLSelectQuery(stmt: SealedSQLStatement): SQLSelectQuery

  /**
   * Create INSERT query.
   * 
   * This query builder should never be invoked directly using the database
   * instance but instead indirectly via SQL template literals.

   */
  createSQLInsertQuery(stmt: SealedSQLStatement): SQLInsertQuery

  /**
   * Create UPDATE query.
   * 
   * This query builder should never be invoked directly using the database
   * instance but instead indirectly via SQL template literals.

   */
  createSQLUpdateQuery(stmt: SealedSQLStatement): SQLUpdateQuery

  /**
   * Create DELETE query.
   *
   * This query builder should never be invoked directly using the database
   * instance but instead indirectly via SQL template literals.
   */
  createSQLDeleteQuery(stmt: SealedSQLStatement): SQLDeleteQuery
}
