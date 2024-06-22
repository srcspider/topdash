import type { MySQLParamData } from "database/mysql/types/MySQLParamData"
import type { SQLQueryInput } from "database/types/SQLQueryInput"
import type { SQLQueryRange } from "database/types/SQLQueryRange"
import { SQLStatementType } from "database/types/SQLStatementType"
import type { SQLTableAliasMap } from "database/types/SQLTableAliasMap"
import type { SealedSQLDatabase } from "database/types/SealedSQLDatabase"
import type { SQLUpdateQuery } from "database/types/queries/SQLUpdateQuery"
import type { UpdateStatementOptions } from "database/types/queries/options/UpdateStatementOptions"

import { nil } from "core/nil"

import { Panic } from "error/panic"

import type { MySQLDatabase } from "database/mysql/MySQLDatabase"
import { createMySQLParamData } from "database/mysql/tools/createMySQLParamData"
import { applyTableAlias, type SealedSQLStatement } from "database/sql"
import { formatSQL } from "database/tools/formatSQL"
import { validateQueryRange } from "database/tools/validateQueryRange"

import mysql2, { type ResultSetHeader } from "mysql2/promise"

////////////////////////////////////////////////////////////////////////////////

const DefaultUpdateOptions: UpdateStatementOptions = {
  prepareStatement: true,
}

export class MySQLUpdateQuery implements SQLUpdateQuery {
  /**
   * Execution options.
   */
  private options: UpdateStatementOptions | nil

  /**
   * Query Parameters
   */
  private params: MySQLParamData | nil

  constructor(
    private db: MySQLDatabase,
    private stmt: SealedSQLStatement,
  ) {
    if (stmt.statementType() != SQLStatementType.UPDATE) {
      throw new Panic({
        code: "INVALID_SQL",
        message: "using non-UPDATE sealed statement in UPDATE query",
      })
    }
  }

  with(db: SealedSQLDatabase): SQLUpdateQuery {
    return db.createSQLUpdateQuery(this.stmt)
  }

  table(tableAlias: SQLTableAliasMap): MySQLUpdateQuery {
    this.stmt = applyTableAlias(this.stmt, tableAlias)
    return this
  }

  config(options: Partial<UpdateStatementOptions>): MySQLUpdateQuery {
    this.options = Object.assign({}, DefaultUpdateOptions, options)
    return this
  }

  query(params: SQLQueryInput): MySQLUpdateQuery {
    this.params = createMySQLParamData(this.stmt.statement(), params)
    return this
  }

  async update(
    expectedRange?: SQLQueryRange,
  ): Promise<{ affectedRows: number }> {
    let options = this.options || DefaultUpdateOptions
    let conn: mysql2.PoolConnection | nil = nil
    try {
      conn = await this.db.pool.getConnection()

      let queryStmt = this.stmt.statement().replace(/@[A-Za-z0-9_]+/, "?")
      let params = this.params || []

      if (options.prepareStatement) {
        let query = await conn.prepare(queryStmt)
        let [res] = await query.execute(params)

        let { affectedRows } = res as ResultSetHeader

        if (expectedRange) {
          validateQueryRange(this.stmt, expectedRange, affectedRows)
        }

        return { affectedRows }
      } else {
        // else: dont prepare statement

        let [res] = await conn.query(queryStmt, params)

        let { affectedRows } = res as ResultSetHeader

        if (expectedRange) {
          validateQueryRange(this.stmt, expectedRange, affectedRows)
        }

        return { affectedRows }
      }
    } catch (err) {
      throw new Panic({
        code: "QUERY_ERROR",
        message: "failed to execute query",
        state: {
          query: formatSQL(this.stmt.statement()),
        },
      })
    } finally {
      if (conn != nil) {
        conn.release()
      }
    }
  }
}
