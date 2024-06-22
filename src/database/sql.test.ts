import { SQLStatementType } from "database/types/SQLStatementType"
import type { SealedSQLDatabase } from "database/types/SealedSQLDatabase"
import type { SQLDeleteQuery } from "database/types/queries/SQLDeleteQuery"
import type { SQLInsertQuery } from "database/types/queries/SQLInsertQuery"
import type { SQLSelectQuery } from "database/types/queries/SQLSelectQuery"
import type { SQLUpdateQuery } from "database/types/queries/SQLUpdateQuery"

import { MySQLDatabase } from "database/mysql/MySQLDatabase"
import { TopdashSQLSettings } from "database/settings"
import { SealedSQLStatement, sql } from "database/sql"

////////////////////////////////////////////////////////////////////////////////

class MockMySQLDatabase implements SealedSQLDatabase {
  static instance(): MockMySQLDatabase {
    return new MockMySQLDatabase()
  }

  sanityCheckSQLSelect(rawStmt: string): string[] | undefined {
    return []
  }

  sanityCheckSQLInsert(rawStmt: string): string[] | undefined {
    return []
  }

  sanityCheckSQLUpdate(rawStmt: string): string[] | undefined {
    return []
  }

  sanityCheckSQLDelete(rawStmt: string): string[] | undefined {
    return []
  }

  createSQLSelectQuery(stmt: SealedSQLStatement): SQLSelectQuery {
    throw new Error("Method not implemented.")
  }

  createSQLInsertQuery(stmt: SealedSQLStatement): SQLInsertQuery {
    throw new Error("Method not implemented.")
  }

  createSQLUpdateQuery(stmt: SealedSQLStatement): SQLUpdateQuery {
    throw new Error("Method not implemented.")
  }

  createSQLDeleteQuery(stmt: SealedSQLStatement): SQLDeleteQuery {
    throw new Error("Method not implemented.")
  }
}

let originalDefaultDbClass = TopdashSQLSettings.defaultDbClass

describe("database/mysql", () => {
  beforeEach(() => {
    TopdashSQLSettings.defaultDbClass = MockMySQLDatabase
  })

  afterEach(() => {
    TopdashSQLSettings.defaultDbClass = originalDefaultDbClass
  })

  describe("SealedSQLStatement", () => {
    test("cannot create sealed statements with out knowing the key", () => {
      expect(() => {
        new SealedSQLStatement(
          SQLStatementType.SELECT,
          "select * from table",
          "randomkey",
        )
      }).toThrow("[SQL_USAGE_ERROR] invalid statement key (Security, Attack)")
    })
  })

  describe("sql string templates", () => {
    test("doesnt allow injection of variables", () => {
      expect(() => {
        let x = "test"
        sql`select * from table where x = ${x}`
      }).toThrow(
        "[INVALID_SQL] you can not insert variables directly in sql template strings (Corruption, Security)",
      )
    })
  })
})
