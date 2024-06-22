import type { MySQLParamData } from "database/mysql/types/MySQLParamData"
import type { SQLQueryInput } from "database/types/SQLQueryInput"
import { SQLStatementType } from "database/types/SQLStatementType"
import type { SQLTableAliasMap } from "database/types/SQLTableAliasMap"
import type { SealedSQLDatabase } from "database/types/SealedSQLDatabase"
import type { SQLInsertQuery } from "database/types/queries/SQLInsertQuery"
import type { InsertStatementOptions } from "database/types/queries/options/InsertStatementOptions"

import { nil } from "core/nil"

import { Panic } from "error/panic"

import type { MySQLDatabase } from "database/mysql/MySQLDatabase"
import { createMySQLParamData } from "database/mysql/tools/createMySQLParamData"
import { applyTableAlias, type SealedSQLStatement } from "database/sql"
import { formatSQL } from "database/tools/formatSQL"

import mysql2, { type ResultSetHeader } from "mysql2/promise"

////////////////////////////////////////////////////////////////////////////////

const DefaultInsertOptions: InsertStatementOptions = {
  prepareStatement: true,
}

export class MySQLInsertQuery implements SQLInsertQuery {
  /**
   * Execution options.
   */
  private options: InsertStatementOptions | nil

  /**
   * Query Parameters
   */
  private params: MySQLParamData | nil

  constructor(
    private db: MySQLDatabase,
    private stmt: SealedSQLStatement,
  ) {
    if (stmt.statementType() != SQLStatementType.INSERT) {
      throw new Panic({
        code: "INVALID_SQL",
        message: "using non-INSERT sealed statement in INSERT query",
      })
    }
  }

  with(db: SealedSQLDatabase): SQLInsertQuery {
    return db.createSQLInsertQuery(this.stmt)
  }

  table(tableAlias: SQLTableAliasMap): MySQLInsertQuery {
    this.stmt = applyTableAlias(this.stmt, tableAlias)
    return this
  }

  config(options: Partial<InsertStatementOptions>): MySQLInsertQuery {
    this.options = Object.assign({}, DefaultInsertOptions, options)
    return this
  }

  query(params: SQLQueryInput): MySQLInsertQuery {
    this.params = createMySQLParamData(this.stmt.statement(), params)
    return this
  }

  async insert(): Promise<{ insertId: number }> {
    let options = this.options || DefaultInsertOptions
    let conn: mysql2.PoolConnection | nil = nil
    try {
      conn = await this.db.pool.getConnection()

      let queryStmt = this.stmt.statement().replace(/@[A-Za-z0-9_]+/, "?")
      let params = this.params || []

      if (options.prepareStatement) {
        let query = await conn.prepare(queryStmt)
        let [res] = await query.execute(params)

        let { insertId } = res as ResultSetHeader

        return { insertId }
      } else {
        // else: dont prepare statement

        let [res] = await conn.query(queryStmt, params)

        let { insertId } = res as ResultSetHeader

        return { insertId }
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
