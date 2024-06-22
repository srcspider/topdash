import type { MySQLParamData } from "database/mysql/types/MySQLParamData"
import type { SQLQueryInput } from "database/types/SQLQueryInput"
import type { SQLQueryRange } from "database/types/SQLQueryRange"
import { SQLStatementType } from "database/types/SQLStatementType"
import type { SQLTableAliasMap } from "database/types/SQLTableAliasMap"
import type { SealedSQLDatabase } from "database/types/SealedSQLDatabase"
import type { SQLSelectQuery } from "database/types/queries/SQLSelectQuery"
import type { SelectStatementOptions } from "database/types/queries/options/SelectStatementOptions"

import { nil } from "core/nil"

import { Panic } from "error/panic"

import type { MySQLDatabase } from "database/mysql/MySQLDatabase"
import { createMySQLParamData } from "database/mysql/tools/createMySQLParamData"
import { applyTableAlias, type SealedSQLStatement } from "database/sql"
import { formatSQL } from "database/tools/formatSQL"
import { validateQueryRange } from "database/tools/validateQueryRange"

import mysql2 from "mysql2/promise"

////////////////////////////////////////////////////////////////////////////////

const DefaultSelectOptions: SelectStatementOptions = {
  prepareStatement: true,
}

export class MySQLSelectQuery implements SQLSelectQuery {
  /**
   * Execution options.
   */
  private options: SelectStatementOptions | nil

  /**
   * Query Parameters
   */
  private params: MySQLParamData | nil

  constructor(
    private db: MySQLDatabase,
    private stmt: SealedSQLStatement,
  ) {
    if (stmt.statementType() != SQLStatementType.SELECT) {
      throw new Panic({
        code: "INVALID_SQL",
        message: "using non-SELECT sealed statement in SELECT query",
      })
    }
  }

  with(db: SealedSQLDatabase): SQLSelectQuery {
    return db.createSQLSelectQuery(this.stmt)
  }

  table(tableAlias: SQLTableAliasMap): MySQLSelectQuery {
    this.stmt = applyTableAlias(this.stmt, tableAlias)
    return this
  }

  config(options: Partial<SelectStatementOptions>): MySQLSelectQuery {
    this.options = Object.assign({}, DefaultSelectOptions, options)
    return this
  }

  query(params: SQLQueryInput): MySQLSelectQuery {
    this.params = createMySQLParamData(this.stmt.statement(), params)
    return this
  }

  async entries<T>(expectedRange?: SQLQueryRange): Promise<T[]> {
    let options = this.options || DefaultSelectOptions
    let conn: mysql2.PoolConnection | nil = nil
    try {
      conn = await this.db.pool.getConnection()

      let queryStmt = this.stmt.statement().replace(/@[A-Za-z0-9_]+/, "?")
      let params = this.params || []

      // TODO correct IN query errors with prepare statements in mysql2
      // TODO auto-adjust troublesome values to strings for auto-resolution

      if (options.prepareStatement) {
        let query = await conn.prepare(queryStmt)

        let [res] = await query.execute(params)
        let rows = res as T[]

        if (expectedRange) {
          validateQueryRange(this.stmt, expectedRange, rows.length)
        }

        return rows
      } else {
        // else: dont prepare statement
        let [res] = await conn.query(queryStmt, params)
        let rows = res as T[]

        if (expectedRange) {
          validateQueryRange(this.stmt, expectedRange, rows.length)
        }

        return rows
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

  async maybeEntry<T>(): Promise<T | null> {
    let records = await this.entries<T>(1)

    if (records.length == 0) {
      return null
    } else {
      return records[0]
    }
  }

  async entry<T>(): Promise<T> {
    let records = await this.entries<T>(1)

    if (records.length == 0) {
      throw new Panic({
        code: "LIB_ERROR",
        message: "expected at least 1 record",
        desc: "this should never happen due to range constraints",
      })
    } else {
      return records[0]
    }
  }

  async data<T = number>(key: string = "data"): Promise<T> {
    let entry = (await this.entry()) as any
    return entry[key]
  }
}
