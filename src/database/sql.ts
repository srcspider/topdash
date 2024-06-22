import { SQLStatementType } from "database/types/SQLStatementType"
import type { SQLTableAliasMap } from "database/types/SQLTableAliasMap"
import type { SealedSQLDatabase } from "database/types/SealedSQLDatabase"
import type { SQLDeleteQuery } from "database/types/queries/SQLDeleteQuery"
import type { SQLInsertQuery } from "database/types/queries/SQLInsertQuery"
import type { SQLSelectQuery } from "database/types/queries/SQLSelectQuery"
import type { SQLUpdateQuery } from "database/types/queries/SQLUpdateQuery"

import { nil } from "core/nil"

import { Panic, PanicType } from "error/panic"

import { TopdashSQLSettings } from "database/settings"

import crypto from "node:crypto"

////////////////////////////////////////////////////////////////////////////////

/**
 * ===============
 * IMORTANT README
 * ===============
 *
 * To ensure one of the goals of the tagged template literal SQL functions,
 * namely that of ONLY these functions being able to created sealed statements
 * and virtually no other code being able to do so outside of these functions
 * we HAVE TO keep a lot of the logic within this file, due to primarily no
 * other way to ensure secret key confidentiality within the
 * typescript/javscript language module system at the time of this writing.
 *
 * An unfortunate consequence of this is that a lot of the code has to just be
 * written in this file and interfaces need to be avoided to ensure fake
 * versions cant be easily created.
 *
 * All consequences are accepted as price to pay for the feature/goal to be
 * achieved to the best of our ability to do so.
 */

////////////////////////////////////////////////////////////////////////////////

// THIS MUST NOT BE EXPORTED
// This key is used by SealedSQLStatement and sql template functions
const SealedSQLStmtSecretKey = crypto.randomBytes(32).toString("hex")

////////////////////////////////////////////////////////////////////////////////

/**
 * Special entity class that can only be instantiated in the context of the
 * sql template functions. This allows for semi-reliable safe SQL statement
 * since it makes it impossible for anything but intentionally malicious misuse
 * such as intentionally creating extremely obvious and awkward monkey patching
 * hacks to get around it.
 *
 * Even in those cases simple solutions like some extra linting rules can be
 * used to prevent them further but thats not the goal of this implementation.
 * As far as this implementation is concerned if you cant do it accidentally
 * or unknowingly it's safe enough for purpose.
 */
export class SealedSQLStatement {
  private stmt: string
  private type: SQLStatementType

  constructor(type: SQLStatementType, stmt: string, secretKey: string) {
    if (secretKey != SealedSQLStmtSecretKey) {
      throw new Panic({
        type: PanicType.Security | PanicType.Attack,
        code: "SQL_USAGE_ERROR",
        message: "invalid statement key",
        desc: [
          "Sealed statement can only be created by dedicated functions.",
          "These function only exist within the library or are created via",
          "derivation functions that allow database to be preset.",
          "The secret key required to create sealed statements is only known",
          "to these functions, making them the only allowed generators.",
          "Attempting to create sealed statements outside of these functions",
          "though other means should be considered malicious or invalid code.",
        ],
        state: {
          stmt,
        },
      })
    }

    this.type = type
    this.stmt = stmt
  }

  statement(): string {
    return this.stmt
  }

  statementType(): SQLStatementType {
    return this.type
  }
}

/**
 * Given a sealed statement converts it to the equivalent statement with all
 * table references replaced with the specified alias.
 */
export function applyTableAlias(
  stmt: SealedSQLStatement,
  tableAlias: SQLTableAliasMap,
): SealedSQLStatement {
  let type = stmt.statementType()
  let rawStmt = stmt.statement()

  for (let key in tableAlias) {
    rawStmt = rawStmt.replace(
      new RegExp(`from ${key}`, "gi"),
      `FROM ${tableAlias[key]}`,
    )
    rawStmt = rawStmt.replace(
      new RegExp(`join ${key}`, "gi"),
      `JOIN ${tableAlias[key]}`,
    )
  }

  return new SealedSQLStatement(type, rawStmt, SealedSQLStmtSecretKey)
}

////////////////////////////////////////////////////////////////////////////////

// =======================
// Universal Query Helpers
// =======================

function convertStringTemplateToRawStatement(
  strs: TemplateStringsArray,
  inputs: string[],
): string {
  if (strs.length > 0 || inputs.length > 0) {
    throw new Panic({
      type: PanicType.Corruption | PanicType.Security,
      code: "INVALID_SQL",
      message: "you can not insert variables directly in sql template strings",
      desc: "You need to use SQL variables in the statement and then bind them.",
    })
  }

  return strs[0]
}

function verifyDbClassIsValid(databaseClass: any | nil) {
  if (databaseClass == nil) {
    throw new Panic({
      code: "INVALID_DB",
      message: "database class was nil",
    })
  }

  if (databaseClass.instance == nil) {
    throw new Panic({
      code: "INVALID_DB",
      message: "database class does not have a static instance method",
      desc: [
        "The database class you provide is required to have a static instance",
        'method, called "instance()", that returns a instance',
        "of the database class.",
      ],
    })
  }
}

function verifyDbInstanceIsValid(db: SealedSQLDatabase | nil) {
  if (db == nil) {
    throw new Panic({
      code: "INVALID_DB",
      message: "database was nil",
      desc: [
        "This is often caused when no default database is set",
        "or environment has no valid or acceptable database credentials",
        "resulting in database insance failing to initialize.",
        "Please check your application initialization for errors.",
      ],
    })
  }
}

////////////////////////////////////////////////////////////////////////////////

// ====================
// SELECT Query Support
// ====================

function createSQLSelectQuery(
  db: SealedSQLDatabase,
  strs: TemplateStringsArray,
  inputs: string[],
): SQLSelectQuery {
  let rawStmt = convertStringTemplateToRawStatement(strs, inputs)

  let errors = db.sanityCheckSQLSelect(rawStmt)

  if (errors != nil) {
    throw new Panic({
      type: PanicType.Corruption | PanicType.Security | PanicType.Attack,
      code: "INVALID_SQL",
      message:
        "the SELECT statement does not respect SELECT statement restrictions",
      desc: [
        "if you need to use INSERT, UPDATE or DELETE statements you must",
        "use appropriate template string tag function",
      ],
      state: {
        errors,
      },
    })
  }

  let stmt = new SealedSQLStatement(
    SQLStatementType.SELECT,
    rawStmt,
    SealedSQLStmtSecretKey,
  )

  return db.createSQLSelectQuery(stmt)
}

export function createSealedSQLSelectTemplateLiteral(
  databaseClass: any,
): (strs: TemplateStringsArray, ...inputs: string[]) => SQLSelectQuery {
  verifyDbClassIsValid(databaseClass)

  return function sealedSQLSelect(
    strs: TemplateStringsArray,
    ...inputs: string[]
  ): SQLSelectQuery {
    let db = databaseClass.instance()
    verifyDbInstanceIsValid(db)
    return createSQLSelectQuery(db, strs, inputs)
  }
}

/**
 * Create SELECT statement query
 *
 * This function uses the database defined by SQLSettings.defaultDb
 */
export function sql(
  strs: TemplateStringsArray,
  ...inputs: string[]
): SQLSelectQuery {
  let databaseClass = TopdashSQLSettings.defaultDbClass
  verifyDbClassIsValid(databaseClass)
  let db = databaseClass.instance()
  verifyDbInstanceIsValid(db)
  return createSQLSelectQuery(db, strs, inputs)
}

////////////////////////////////////////////////////////////////////////////////

// ====================
// Insert Query Support
// ====================

function createSQLInsertQuery(
  db: SealedSQLDatabase,
  strs: TemplateStringsArray,
  inputs: string[],
): SQLInsertQuery {
  let rawStmt = convertStringTemplateToRawStatement(strs, inputs)

  let errors = db.sanityCheckSQLInsert(rawStmt)

  if (errors != nil) {
    throw new Panic({
      type: PanicType.Corruption | PanicType.Security | PanicType.Attack,
      code: "INVALID_SQL",
      message:
        "the INSERT statement does not respect INSERT statement restrictions",
      desc: [
        "if you need to use SELECT, UPDATE or DELETE statements you must",
        "use appropriate template string tag function",
      ],
      state: {
        errors,
      },
    })
  }

  let stmt = new SealedSQLStatement(
    SQLStatementType.INSERT,
    rawStmt,
    SealedSQLStmtSecretKey,
  )

  return db.createSQLInsertQuery(stmt)
}

export function createSealedSQLInsertTemplateLiteral(
  databaseClass: any,
): (strs: TemplateStringsArray, ...inputs: string[]) => SQLInsertQuery {
  verifyDbClassIsValid(databaseClass)

  return function sealedSQLInsert(
    strs: TemplateStringsArray,
    ...inputs: string[]
  ): SQLInsertQuery {
    let db = databaseClass.instance()
    return createSQLInsertQuery(db, strs, inputs)
  }
}

/**
 * Create UPDATE statement query
 *
 * This function uses the database defined by SQLSettings.defaultDb
 */
export function sqlINSERT(
  strs: TemplateStringsArray,
  ...inputs: string[]
): SQLInsertQuery {
  let databaseClass = TopdashSQLSettings.defaultDbClass
  verifyDbClassIsValid(databaseClass)
  let db = databaseClass.instance()
  verifyDbInstanceIsValid(db)
  return createSQLInsertQuery(db, strs, inputs)
}

////////////////////////////////////////////////////////////////////////////////

// ====================
// Update Query Support
// ====================

function createSQLUpdateQuery(
  db: SealedSQLDatabase,
  strs: TemplateStringsArray,
  inputs: string[],
): SQLUpdateQuery {
  let rawStmt = convertStringTemplateToRawStatement(strs, inputs)

  let errors = db.sanityCheckSQLUpdate(rawStmt)

  if (errors != nil) {
    throw new Panic({
      type: PanicType.Corruption | PanicType.Security | PanicType.Attack,
      code: "INVALID_SQL",
      message:
        "the UPDATE statement does not respect UPDATE statement restrictions",
      desc: [
        "if you need to use SELECT, INSERT or DELETE statements you must",
        "use appropriate template string tag function",
      ],
      state: {
        errors,
      },
    })
  }

  let stmt = new SealedSQLStatement(
    SQLStatementType.UPDATE,
    rawStmt,
    SealedSQLStmtSecretKey,
  )

  return db.createSQLUpdateQuery(stmt)
}

export function createSealedSQLUpdateTemplateLiteral(
  databaseClass: any,
): (strs: TemplateStringsArray, ...inputs: string[]) => SQLUpdateQuery {
  verifyDbClassIsValid(databaseClass)

  return function sealedSQLUpdate(
    strs: TemplateStringsArray,
    ...inputs: string[]
  ): SQLUpdateQuery {
    let db = databaseClass.instance()
    return createSQLUpdateQuery(db, strs, inputs)
  }
}

/**
 * Create UPDATE statement query
 *
 * This function uses the database defined by SQLSettings.defaultDb
 */
export function sqlUPDATE(
  strs: TemplateStringsArray,
  ...inputs: string[]
): SQLUpdateQuery {
  let databaseClass = TopdashSQLSettings.defaultDbClass
  verifyDbClassIsValid(databaseClass)
  let db = databaseClass.instance()
  verifyDbInstanceIsValid(db)
  return createSQLUpdateQuery(db, strs, inputs)
}

////////////////////////////////////////////////////////////////////////////////

// ====================
// DELETE Query Support
// ====================

/**
 * DO NOT USE THIS FUNCTION!
 *
 * This function is meant to only be used internally, its not meant to be
 * called in userland. If you see this function called in your user code please
 * add the function name to your linter blacklist.
 */
export function createSQLDeleteQuery(
  db: SealedSQLDatabase,
  strs: TemplateStringsArray,
  inputs: string[],
): SQLDeleteQuery {
  let rawStmt = convertStringTemplateToRawStatement(strs, inputs)

  let errors = db.sanityCheckSQLUpdate(rawStmt)

  if (errors != nil) {
    throw new Panic({
      type: PanicType.Corruption | PanicType.Security | PanicType.Attack,
      code: "INVALID_SQL",
      message:
        "the DELETE statement does not respect DELETE statement restrictions",
      desc: [
        "if you need to use SELECT, INSERT or UPDATE statements you must",
        "use appropriate template string tag function",
      ],
      state: {
        errors,
      },
    })
  }

  let stmt = new SealedSQLStatement(
    SQLStatementType.DELETE,
    rawStmt,
    SealedSQLStmtSecretKey,
  )

  return db.createSQLDeleteQuery(stmt)
}

export function createSealedSQLDeleteTemplateLiteral(
  databaseClass: any,
): (strs: TemplateStringsArray, ...inputs: string[]) => SQLDeleteQuery {
  verifyDbClassIsValid(databaseClass)

  return function sealedSQLDelete(
    strs: TemplateStringsArray,
    ...inputs: string[]
  ): SQLDeleteQuery {
    let db = databaseClass.instance()
    return createSQLDeleteQuery(db, strs, inputs)
  }
}

/**
 * Create DELETE statement query
 *
 * This function uses the database defined by SQLSettings.defaultDb
 */
export function sqlDELETE(
  strs: TemplateStringsArray,
  ...inputs: string[]
): SQLDeleteQuery {
  let databaseClass = TopdashSQLSettings.defaultDbClass
  verifyDbClassIsValid(databaseClass)
  let db = databaseClass.instance()
  verifyDbInstanceIsValid(db)
  return createSQLDeleteQuery(db, strs, inputs)
}

////////////////////////////////////////////////////////////////////////////////

// =========================
// ALTER/Admin Query Support
// =========================

// We INTENTIONALLY do not provide any support for ALTER usage or other type of
// adminastritive tasks, since this ensures that only regular usage can be
// performed and misused is impossible via the system. Administrative usage
// is generally extremely specialized and often very simple and specific
// so this omision is not considered a problem.
