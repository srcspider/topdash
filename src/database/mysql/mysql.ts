import { MySQLDatabase } from "database/mysql/MySQLDatabase"
import type { MySQLDeleteQuery } from "database/mysql/queries/MySQLDeleteQuery"
import type { MySQLSelectQuery } from "database/mysql/queries/MySQLSelectQuery"
import type { MySQLUpdateQuery } from "database/mysql/queries/MySQLUpdateQuery"
import {
  createSealedSQLSelectTemplateLiteral,
  createSealedSQLUpdateTemplateLiteral,
  createSealedSQLDeleteTemplateLiteral,
} from "database/sql"

////////////////////////////////////////////////////////////////////////////////

export const mysql: (
  strs: TemplateStringsArray,
  ...inputs: string[]
) => MySQLSelectQuery = createSealedSQLSelectTemplateLiteral(MySQLDatabase) as (
  strs: TemplateStringsArray,
  ...inputs: string[]
) => MySQLSelectQuery

export const mysqlUPDATE: (
  strs: TemplateStringsArray,
  ...inputs: string[]
) => MySQLUpdateQuery = createSealedSQLUpdateTemplateLiteral(MySQLDatabase) as (
  strs: TemplateStringsArray,
  ...inputs: string[]
) => MySQLUpdateQuery

export const mysqlDELETE: (
  strs: TemplateStringsArray,
  ...inputs: string[]
) => MySQLDeleteQuery = createSealedSQLDeleteTemplateLiteral(MySQLDatabase) as (
  strs: TemplateStringsArray,
  ...inputs: string[]
) => MySQLDeleteQuery
