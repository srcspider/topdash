import type { SealedSQLDatabase } from "database/types/SealedSQLDatabase"

import { isEmpty } from "lib/util/isEmpty"

import { getenv } from "core/env"
import { createBooleanParser } from "core/env/parser/createBooleanParser"
import { createNumericParser } from "core/env/parser/createNumericParser"
import { createPortParser } from "core/env/parser/createPortParser"
import { createTimeParser } from "core/env/parser/createTimeParser"
import { nil } from "core/nil"
import { Seconds } from "core/time"

import { Panic, PanicType } from "error/panic"

import { MySQLDeleteQuery } from "database/mysql/queries/MySQLDeleteQuery"
import { MySQLInsertQuery } from "database/mysql/queries/MySQLInsertQuery"
import { MySQLSelectQuery } from "database/mysql/queries/MySQLSelectQuery"
import { MySQLUpdateQuery } from "database/mysql/queries/MySQLUpdateQuery"
import type { SealedSQLStatement } from "database/sql"
import { applyDefaultSQLDeleteSanityCheck } from "database/tools/checks/applyDefaultSQLDeleteSanityCheck"
import { applyDefaultSQLInsertSanityCheck } from "database/tools/checks/applyDefaultSQLInsertSanityCheck"
import { applyDefaultSQLSelectSanityCheck } from "database/tools/checks/applyDefaultSQLSelectSanityCheck"
import { applyDefaultSQLUpdateSanityCheck } from "database/tools/checks/applyDefaultSQLUpdateSanityCheck"

import mysql from "mysql2/promise"

////////////////////////////////////////////////////////////////////////////////

const DefaultMySQLPort = 3306

const DefaultWaitForConnections = true
const DefaultConnectionLimit = 10
const DefaultMaxIdle = DefaultConnectionLimit
const DefaultIdleTimeout = 60 * Seconds
const DefaultQueueLimit = 0
const DefaultEnableKeepAlive = true
const DefaultKeepAliveInitialDelay = 0
const DefaultConnectTimeout = 10 * Seconds

////////////////////////////////////////////////////////////////////////////////

export type MySQLConfig = {
  // ===================
  // Connection Settings
  // ===================

  database: string
  host: string
  user: string
  pass: string
  port?: number

  // =============
  // Pool Settings
  // =============

  waitForConnections?: boolean
  connectionLimit?: number
  maxIdle?: number
  idleTimeout?: number
  queueLimit?: number
  enableKeepAlive?: boolean
  keepAliveInitialDelay?: number
  connectTimeout?: number
}

export type MySQLOptions = {
  // ===================
  // Connection Settings
  // ===================

  database: string
  host: string
  user: string
  pass: string
  port: number

  // =============
  // Pool Settings
  // =============

  waitForConnections: boolean
  connectionLimit: number
  maxIdle: number
  idleTimeout: number
  queueLimit: number
  enableKeepAlive: boolean
  keepAliveInitialDelay: number
  connectTimeout: number
}

export function parseMySQLConf(conf: MySQLConfig): MySQLOptions {
  return {
    // ===================
    // Connection Settings
    // ===================

    database: conf.database,
    host: conf.host,
    user: conf.user,
    pass: conf.pass,
    port: conf.port || DefaultMySQLPort,

    // =============
    // Pool Settings
    // =============

    waitForConnections: conf.waitForConnections || DefaultWaitForConnections,
    connectionLimit: conf.connectionLimit || DefaultConnectionLimit,
    maxIdle: conf.maxIdle || DefaultMaxIdle,
    idleTimeout: conf.idleTimeout || DefaultIdleTimeout,
    queueLimit: conf.queueLimit || DefaultQueueLimit,
    enableKeepAlive: conf.enableKeepAlive || DefaultEnableKeepAlive,
    keepAliveInitialDelay:
      conf.keepAliveInitialDelay || DefaultKeepAliveInitialDelay,
    connectTimeout: conf.connectTimeout || DefaultConnectTimeout,
  }
}

export class MySQLDatabase implements SealedSQLDatabase {
  /**
   * Toggle if instantiation from env variables is allowed.
   *
   * Default: allowed
   */
  static allowEnvInstance: boolean = true

  /**
   * Prefix used when reading configuration from environment.
   *
   * You can change this to any other value in case of conflicts on your
   * application initialization or other reasons like consitency to existing
   * configuration patterns.
   */
  static envVarPrefix: string = "MYSQL_"

  /**
   * Current active Database instance created from environment
   */
  static lastEnvInstance: MySQLDatabase | nil = nil

  /**
   * Current active Database instance.
   */
  static lastInstance: MySQLDatabase | nil = nil

  /**
   * Instantiate or retrieve a singelton instance that is configured based on
   * local environment variables.
   */
  static createInstanceFromEnv(): MySQLDatabase {
    if (MySQLDatabase.allowEnvInstance) {
      throw new Panic({
        code: "DB_INIT_ERROR",
        message: "environment based initialization is not allowed",
        desc: "The environment system is disabled.",
        state: {
          allowEnvInstance: MySQLDatabase.allowEnvInstance,
        },
      })
    }

    if (MySQLDatabase.lastEnvInstance != nil) {
      return MySQLDatabase.lastEnvInstance
    }

    const prefix = MySQLDatabase.envVarPrefix

    let db = new MySQLDatabase({
      // ===================
      // Connection Settings
      // ===================

      database: getenv({
        prefix,
        name: "DB",
        parser: (databaseName: string) => {
          if (isEmpty(databaseName)) {
            return {
              value: "no-database-provided",
              errors: ["Invalid database name (was empty)"],
            }
          }

          return { value: databaseName }
        },
      }),

      host: getenv({ prefix, name: "HOST", defaultValue: "127.0.0.1" }),

      user: getenv({ prefix, name: "USER", defaultValue: "root" }),

      pass: getenv({ prefix, name: "PASS" }),

      port: getenv({
        prefix,
        name: "PORT",
        parser: createPortParser(DefaultMySQLPort),
      }),

      // =============
      // Pool Settings
      // =============

      waitForConnections: getenv({
        prefix,
        name: "WAIT_FOR_CONNECTIONS",
        parser: createBooleanParser(DefaultWaitForConnections),
      }),

      connectionLimit: getenv({
        prefix,
        name: "CONNECTION_LIMIT",
        parser: createNumericParser(
          DefaultConnectionLimit,
          "Invalid MySQL Pool Connection Limit",
        ),
      }),

      maxIdle: getenv({
        prefix,
        name: "MAX_IDLE",
        parser: createNumericParser(
          DefaultMaxIdle,
          "Invalid MySQL Pool Max Idle",
        ),
      }),

      idleTimeout: getenv({
        prefix,
        name: "IDLE_TIMEOUT",
        parser: createTimeParser(
          DefaultIdleTimeout,
          "Invalid MySQL Pool Idle Timeout",
        ),
      }),

      queueLimit: getenv({
        prefix,
        name: "QUEUE_LIMIT",
        parser: createNumericParser(
          DefaultQueueLimit,
          "Invalid MySQL Pool Queue Limit",
        ),
      }),

      enableKeepAlive: getenv({
        prefix,
        name: "ENABLE_KEEP_ALIVE",
        parser: createBooleanParser(DefaultEnableKeepAlive),
      }),

      keepAliveInitialDelay: getenv({
        prefix,
        name: "KEEP_ALIVE_INITIAL_DELAY",
        parser: createTimeParser(
          DefaultKeepAliveInitialDelay,
          "Invalid MySQL Pool Keep Alive Initial Delay",
        ),
      }),

      connectTimeout: getenv({
        prefix,
        name: "CONNECT_TIMEOUT",
        parser: createTimeParser(
          DefaultConnectTimeout,
          "Invalid MySQL Pool Connect Timeout",
        ),
      }),
    })

    MySQLDatabase.lastEnvInstance = db

    return db
  }

  /**
   * Retrieve current active instance. If environment instantiation is allowed
   * a database instance will automatically be instantiated from the current
   * environment.
   * If environment instantiation is disabled then you need need to run
   * {@link MySQLDatabase.setupInstance} first.
   */
  static instance() {
    if (MySQLDatabase.lastInstance == nil) {
      if (MySQLDatabase.allowEnvInstance) {
        MySQLDatabase.lastInstance = MySQLDatabase.createInstanceFromEnv()
      } else {
        // else: lastInstance=nil and allowEnvInstance=false
        throw new Panic({
          type: PanicType.ConfigurationError,
          code: "MYSQL_INIT_ERROR",
          message: "unable to initalize instance; missing prev instance",
          desc: [
            "This error happens when env initialization is disabled",
            "(see: MySQLDatabase.allowEnvInstance) and no instance was created",
            "on application init before query was invoked.",
            "To fix this error in your application initalization call",
            "MySQLDatabase.setupInstance({ ... }) before any other statements.",
          ],
          state: {
            allowEnvInstance: MySQLDatabase.allowEnvInstance,
          },
        })
      }
    }

    return MySQLDatabase.lastInstance
  }

  static setupInstance(conf: MySQLConfig) {
    this.lastInstance = new MySQLDatabase(conf)
  }

  //////////////////////////////////////////////////////////////////////////////

  options: MySQLOptions

  pool: mysql.Pool

  connectionIsInitialized: boolean = false

  constructor(conf: MySQLConfig) {
    this.options = parseMySQLConf(conf)

    let {
      database,
      host,
      user,
      pass,
      port,
      waitForConnections,
      connectionLimit,
      maxIdle,
      idleTimeout,
      queueLimit,
      enableKeepAlive,
      keepAliveInitialDelay,
      connectTimeout,
    } = this.options

    this.pool = mysql.createPool({
      database,
      host,
      user,
      password: pass,
      port,
      waitForConnections,
      connectionLimit,
      maxIdle,
      idleTimeout,
      queueLimit,
      enableKeepAlive,
      keepAliveInitialDelay,
      connectTimeout,
      multipleStatements: false,
    })
  }

  // ===================
  // Query Sanity Checks
  // ===================

  sanityCheckSQLSelect(rawStmt: string): string[] | nil {
    // NOTE: we do not have any special extra rules
    return applyDefaultSQLSelectSanityCheck(rawStmt)
  }

  sanityCheckSQLInsert(rawStmt: string): string[] | nil {
    // NOTE: we do not have any special extra rules
    return applyDefaultSQLInsertSanityCheck(rawStmt)
  }

  sanityCheckSQLUpdate(rawStmt: string): string[] | nil {
    // NOTE: we do not have any special extra rules
    return applyDefaultSQLUpdateSanityCheck(rawStmt)
  }

  sanityCheckSQLDelete(rawStmt: string): string[] | nil {
    // NOTE: we do not have any special extra rules
    return applyDefaultSQLDeleteSanityCheck(rawStmt)
  }

  // ==============
  // Query Builders
  // ==============

  createSQLSelectQuery(stmt: SealedSQLStatement): MySQLSelectQuery {
    return new MySQLSelectQuery(this, stmt)
  }

  createSQLInsertQuery(stmt: SealedSQLStatement): MySQLInsertQuery {
    return new MySQLInsertQuery(this, stmt)
  }

  createSQLUpdateQuery(stmt: SealedSQLStatement): MySQLUpdateQuery {
    return new MySQLUpdateQuery(this, stmt)
  }

  createSQLDeleteQuery(stmt: SealedSQLStatement): MySQLDeleteQuery {
    return new MySQLDeleteQuery(this, stmt)
  }
}
