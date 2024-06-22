import { format } from "sql-formatter"

export function formatSQL(rawStmt: string): string {
  return format(rawStmt, {
    language: "sql",
    tabWidth: 2,
    keywordCase: "upper",
  })
}
