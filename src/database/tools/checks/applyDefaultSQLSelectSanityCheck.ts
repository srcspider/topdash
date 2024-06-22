import { nil } from "core/nil"

/**
 * Given raw statement, checks if the statement is valid as SELECT-only
 * statement.
 *
 * ## DISCLAIMER
 *
 * This is not intended to validate against attacks from external attacks. The
 * validation is meant to protect against misuse from otherwise well meaning
 * internal usage (ie. devs)
 */
export function applyDefaultSQLSelectSanityCheck(
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
    /(CREATE|PROCEDURE|DELIMITER|CALL|DELETE|DO|HANDLER|IMPORT|INSERT|INTERSECT|LOAD|REPLACE|UPDATE|ALTER|DROP|INTO|RENAME)/,
  )

  if (match != nil) {
    let forbiddenKey = match[1]
    return [
      `Usage of forbidden keyword within SELECT-only query (was: ${forbiddenKey}).`,
    ]
  }

  if (!/SELECT/.test(rawStmt)) {
    return ["Not a recognizable SELECT query."]
  }

  return nil
}
