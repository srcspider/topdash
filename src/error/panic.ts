import type { ID, Time } from "core/types/common"
import type { PanicInfo, PanicPackage } from "error/types/panic"
import type { PanicReporterService } from "error/types/reporter"

import { isArray } from "lib/util/isArray"
import { isError } from "lib/util/isError"
import { isObject } from "lib/util/isObject"
import { isString } from "lib/util/isString"

import { nil } from "core/nil"
import { Seconds } from "core/time"

import { TerminalPanicReportService } from "error/service/reporter/TerminalPanicReportService"
import { createTrace } from "error/tools/createTrace"
import { parseNativeError } from "error/tools/parseNativeError"

////////////////////////////////////////////////////////////////////////////////

// key used to identify the Panic objects as panic; symbol keys are unique and
// cant be replicated, they also don't show up during normal serialization
export const IsPanicKey = Symbol("IsTopdashPanic")

/**
 * Panic Type Flags
 *
 * To set multiple types you must use bitwise operations.
 *
 * eg.
 *
 * ```ts
 * new Panic({
 *  type: PanicType.Warning | PanicType.Attack | PanicType.Security
 * })
 * ```
 */
export enum PanicType {
  /**
   * The problem is just a warning and did not result in
   * interruption of other routines.
   */
  Warning = 2 << 0,

  /**
   * Glitch in code. Examples of situations for this error are branch
   * conditions that should never trigger given other assumtions of
   * the logic. Triggering of these branches either implies error in
   * logic or something else going wrong at another level.
   */
  Impossible = 2 << 1,

  /**
   * The error involves very likely loss of data or data corruption.
   * In some cases this may indicate the need for corrective action
   * on affected cases.
   */
  Corruption = 2 << 2,

  /**
   * The error is related to a security problem.
   */
  Security = 2 << 3,

  /**
   * The context in which the error happened can only occur or is very likely
   * to occur during an intentional attack on the system. Errors of this type are
   * often honeypot errors sprinkled across sensitive routines to alert engineers
   * of funny business happening. This can be as someone trying to login with inhuman
   * attempts, very suspecious access patterns or some very sophisticated pattern; often
   * times these patterns are easier to identify by engineers building systems then by
   * operators later on, so it's good to create these errors and mark appropriatly.
   */
  Attack = 2 << 4,

  /**
   * Error can be tracked down to configuration error and is expected to go
   * away as soon as configuration is fixed or similar initialization
   * requirements are met.
   */
  ConfigurationError = 2 << 5,
}

/**
 * Parses panic type information into array of type names.
 */
export function parsePanicType(type: PanicType | nil): string[] {
  let res: string[] = []

  if (type == nil) {
    return res
  }

  if ((type & PanicType.Warning) != 0) {
    res.push("Warning")
  }

  if ((type & PanicType.Impossible) != 0) {
    res.push("Impossible")
  }

  if ((type & PanicType.Corruption) != 0) {
    res.push("Corruption")
  }

  if ((type & PanicType.Security) != 0) {
    res.push("Security")
  }

  if ((type & PanicType.Attack) != 0) {
    res.push("Attack")
  }

  if ((type & PanicType.ConfigurationError) != 0) {
    res.push("ConfigurationError")
  }

  return res
}

////////////////////////////////////////////////////////////////////////////////

/**
 * @return boolean true if target is Panic
 */
export function isPanic(err: any): boolean {
  if (err == nil || !isObject(err)) {
    return false
  }

  if ((err as any)[IsPanicKey]) {
    return true
  }

  return false
}

////////////////////////////////////////////////////////////////////////////////

export class PanicSettings {
  /**
   * Controls how trace formatting works. By default the panic system tries
   * to simplify the trace output and eliminate noise.
   */
  static traceMode: "raw" | "short" = "short"

  /**
   * Report panic after given time (miliseconds).
   *
   * If set to -1 panic is reported immediatly. If set to any other value panic
   * is reported outside of the current execution.
   */
  static autoreportTimeout: Time = 5 * Seconds

  /**
   * Service to use when reporting. You can replace it with your own service
   * implementation, combinator implementations or anything else you would find
   * useful.
   */
  static reporter: PanicReporterService = new TerminalPanicReportService()
}

const settings = PanicSettings

////////////////////////////////////////////////////////////////////////////////

export class PanicTracker {
  /**
   * Next ID to use for panic.
   */
  static nextId: number = 0

  /**
   * Current active list of panic objects.
   */
  static activePanicList: {
    [key: number]: {
      panic: Panic
      timeoutId: any | nil
    }
  } = {}

  /**
   * Retrieve a usable ID for panic. The ID is used as reference for other
   * operations.
   */
  static createPanicId(): ID {
    const panicList = PanicTracker.activePanicList
    let nextId = PanicTracker.nextId

    while (panicList[nextId] != nil) {
      nextId += 1

      if (nextId == Number.MAX_SAFE_INTEGER) {
        nextId = 0
      }

      if (nextId == PanicTracker.nextId) {
        // in theory should never happen, more likely for system to run out
        // of memory then this case to happen
        console.error("[ERROR] Panic system was unable to assign unique ID")
        break
      }
    }

    PanicTracker.nextId = nextId + 1

    if (nextId == Number.MAX_SAFE_INTEGER) {
      nextId = 0
    }

    return nextId
  }

  static queuePanic(panic: Panic): void {
    this.activePanicList[panic.id] = {
      panic,
      timeoutId: setTimeout(() => {
        PanicTracker.report(panic)
      }, settings.autoreportTimeout),
    }
  }

  static dequeuePanic(panic: Panic): void {
    let entry = this.activePanicList[panic.id]
    if (entry != nil) {
      delete this.activePanicList[panic.id]

      if (entry.timeoutId != nil) {
        clearTimeout(entry.timeoutId)
      }
    }
  }

  /**
   * Report panic using reporter service.
   */
  static report(panic: Panic): Promise<void> {
    return settings.reporter.report(panic)
  }
}

////////////////////////////////////////////////////////////////////////////////

export class Panic {
  /**
   * Special key used by isPanic to determine identity as a Panic
   */
  [IsPanicKey] = true

  /**
   * Tracking list used by reporting systems to specify item was reported.
   * Used for both deduplication and debugging purposes.
   *
   * This is not mandatory for reporters. A termninal printer reporting service
   * likely wouldnt bother with updating this list.
   */
  reportedBy?: string[]

  /**
   * Panic data.
   */
  data: PanicPackage

  constructor(info: PanicInfo) {
    let cause = Panic.from(info.cause)

    if (cause != nil) {
      cause.ignorePanicReport()
    }

    let { type, code, message, desc, state } = info

    this.data = {
      type,
      code,
      message,
      desc: isArray(desc) ? desc.join(" ") : desc,
      state,
      trace: createTrace(),
      reportedAt: Date.now(),
      id: PanicTracker.createPanicId(),
    }

    if (cause != nil) {
      this.data.cause = cause
    }
  }

  /**
   * Given input returns Panic object derived from input or undefined if the
   * input itself was undefined or null.
   */
  static from(input: unknown): Panic | nil {
    if (input == nil) {
      return nil
    }

    if (isPanic(input)) {
      return input as Panic
    } else if (isError(input)) {
      return parseNativeError(input)
    } else if (isObject(input)) {
      let parsed = parseNativeError(input)
      parsed.data.desc = "generated from Object"
      return parsed
    } else if (isString(input)) {
      return new Panic({
        code: "STRERR",
        message: input,
        desc: "generated from string passed as error",
      })
    } else {
      // else: fallback, unknown error thats not Object or String
      return new Panic({
        code: "ERR",
        message: "unknown error type",
        state: {
          errType: typeof input,
          errMsg: `${input}`,
          err: input,
        },
      })
    }
  }

  /**
   * Create warning. Reports immediatly.
   */
  static async warning(info: PanicInfo): Promise<void> {
    if (info.type == nil) {
      info.type = PanicType.Warning
    } else {
      info.type = PanicType.Warning | info.type
    }

    let panic = new Panic(info)
    await panic.report()
  }

  /**
   * Create TODO type error.
   */
  static todo(message: string) {
    throw new Panic({
      code: "TODO",
      message,
    })
  }

  // Getters
  // =======

  get id(): number {
    return this.data.id
  }

  get type(): PanicType | nil {
    return this.data.type
  }

  get code(): string {
    return this.data.code
  }

  get message(): string {
    let { type, code, message, cause } = this.data

    let typeInfo: string = ""
    if (type != nil) {
      typeInfo = ` (${parsePanicType(type).join(", ")})`
    }

    if (cause != nil) {
      return `[${code}] ${message}${typeInfo} CAUSED BY ${cause.message}`
    } else {
      return `[${code}] ${message}${typeInfo}`
    }
  }

  /**
   * Technical description of the error.
   *
   * May include:
   *  - very technical description
   *  - hint of actual cause
   *  - hint of potential solutions
   */
  get desc(): any | nil {
    return this.data.desc
  }

  /**
   * State information at the point the error happened.
   */
  get state(): any | nil {
    return this.data.state
  }

  /**
   * Cause of this error
   */
  get cause(): Panic | nil {
    return this.data.cause
  }

  // Meta Operations
  // ===============

  /**
   * Ignore panic report.
   */
  ignorePanicReport() {
    PanicTracker.dequeuePanic(this)
  }

  /**
   * Report panic to current reporter service.
   *
   * You can set the service via `PanicSettings.reporter`
   */
  async report(): Promise<void> {
    PanicTracker.dequeuePanic(this)
    await PanicTracker.report(this)
  }
}
