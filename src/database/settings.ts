import { MySQLDatabase } from "database/mysql/MySQLDatabase"

////////////////////////////////////////////////////////////////////////////////

export const TopdashSQLSettings: {
  defaultDbClass: any
  throwOnRangeErrors: boolean
} = {
  defaultDbClass: MySQLDatabase,
  throwOnRangeErrors: true,
}
