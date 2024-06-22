import type { MySQLParamData } from "database/mysql/types/MySQLParamData"
import type { SQLQueryInput } from "database/types/SQLQueryInput"

import { keys } from "lib/util/keys"

import { nil } from "core/nil"

import { Panic } from "error/panic"

////////////////////////////////////////////////////////////////////////////////

export function createMySQLParamData(
  stmt: string,
  query: SQLQueryInput,
): MySQLParamData {
  let matches = stmt.match(/@[a-zA-Z0-9_]+/gm)

  let unknownKeys: string[] = []
  let duplicateKeys: string[] = []
  let missingKeys: string[] = []

  let usedKeys: string[] = []

  let res: MySQLParamData = []

  if (matches) {
    for (let [, match] of matches.entries()) {
      let key = match.substring(1)
      if (usedKeys.includes(key)) {
        duplicateKeys.push(key)
      } else if (query[key] != nil) {
        usedKeys.push(key)
        res.push(query[key])
      } else {
        // else: query[key] not found
        missingKeys.push(key)
      }
    }
  }

  let knownKeys = keys(query)

  // we can just check length since usedKeys already gurantees the key
  // was inside the query so it's also inside knownKeys
  if (knownKeys.length != usedKeys.length) {
    for (let key in knownKeys) {
      if (!usedKeys.includes(key)) {
        unknownKeys.push(key)
      }
    }
  }

  if (
    missingKeys.length != 0 ||
    duplicateKeys.length != 0 ||
    unknownKeys.length != 0
  ) {
    throw new Panic({
      code: "INVALID_QUERY",
      message: "query has duplicate keys, unknown keys or missing keys",
      desc: [
        "Your query keys must match your statement variables.",
        "You may also not use any key multiple times in your statement.",
      ],
      state: {
        missingKeys,
        duplicateKeys,
        unknownKeys,
      },
    })
  }

  return res
}
