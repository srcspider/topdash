import { nil } from "core/nil"

/**
 * Given raw statement, checks if the statement is valid as INSERT-only
 * statement.
 *
 * ## DISCLAIMER
 *
 * This is not intended to validate against attacks from external attacks. The
 * validation is meant to protect against misuse from otherwise well meaning
 * internal usage (ie. devs)
 */
export function applyDefaultSQLInsertSanityCheck(
  rawStmt: string,
): string[] | nil {
  // strip statement delimitors that are at end of queries, since
  // this is a very common way some people write and is of no concern
  rawStmt = rawStmt.replace(/[; \n\r]+$/gi, "")

  if (/;/.test(rawStmt)) {
    return [
      `Usage of more then one statement per query or query delimitors of any kind, is not allowed.`,
    ]
  }

  let match = rawStmt.match(
    /(CREATE|PROCEDURE|DELIMITER|CALL|DELETE|DO|HANDLER|IMPORT|INTERSECT|LOAD|REPLACE|UPDATE|ALTER|DROP|RENAME)/,
  )

  if (match != nil) {
    let forbiddenKey = match[1]
    return [
      `Usage of forbidden keyword within INSERT-only query (was: ${forbiddenKey}).`,
    ]
  }

  if (!/INSERT/.test(rawStmt)) {
    return ["Not a recognizable INSERT query."]
  }

  return nil
}
