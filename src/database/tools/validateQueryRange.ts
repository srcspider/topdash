import type { SQLQueryRange } from "database/types/SQLQueryRange"

import { isArray } from "lib/util/isArray"

import { nil } from "core/nil"

import type { SealedSQLStatement } from "database/sql"
import { formatSQL } from "database/tools/formatSQL"
import { rangeError } from "database/tools/rangeError"

////////////////////////////////////////////////////////////////////////////////

export function validateQueryRange(
  stmt: SealedSQLStatement,
  expectedRange: SQLQueryRange | nil,
  currentCount: number,
): void {
  if (expectedRange == nil) {
    return
  }

  if (isArray(expectedRange)) {
    if (expectedRange.length == 1) {
      if (currentCount < expectedRange[0]) {
        rangeError({
          code: "SQL_RANGE_ERROR",
          message: `expected at least ${expectedRange[0]} rows but got ${currentCount}`,
          state: {
            query: formatSQL(stmt.statement()),
          },
        })
      }
    } else {
      // else: assume [N1, N2] range constraint

      if (currentCount < expectedRange[0] || currentCount > expectedRange[1]) {
        rangeError({
          code: "SQL_RANGE_ERROR",
          message: `expected result within range [${expectedRange[0]}, ${expectedRange[1]}] but got ${currentCount}`,
          state: {
            query: formatSQL(stmt.statement()),
          },
        })
      }
    }
  } else {
    // assume number
    if (currentCount != expectedRange) {
      rangeError({
        code: "SQL_RANGE_ERROR",
        message: `expected exactly ${expectedRange} rows but got ${currentCount}`,
        state: {
          query: formatSQL(stmt.statement()),
        },
      })
    }
  }
}
