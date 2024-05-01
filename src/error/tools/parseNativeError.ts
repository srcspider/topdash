import { NativeErrorType } from "error/types/native"
import { PanicInfo } from "error/types/panic"

import { keys } from "lib/util/keys"

import { nil } from "core/nil"

import { Panic } from "error/panic"

////////////////////////////////////////////////////////////////////////////////

const KnownNativeErrorProps = [
  "code",
  "name",
  "message",
  "cause",
  "stack",
  "stacktrace",
  "prototype",
]

////////////////////////////////////////////////////////////////////////////////

/**
 * Given an unknown object as input, generally expected to be some form of
 * Error type object, parses it into a Panic object.
 */
export function parseNativeError(input: unknown): Panic {
  let panicInfo: PanicInfo = {
    code: "ERR",
    message: "unknown error",
    desc: `generated from native Error`,
  }

  let err: NativeErrorType = input as NativeErrorType

  if (err.message != nil) {
    panicInfo.message = err.message
  }

  if (err.name != nil && err.name != "Error") {
    panicInfo.code = err.name
  }

  if (err.code != nil) {
    panicInfo.code = err.code
  }

  let customErrorKeys = keys(err)

  for (let key of customErrorKeys) {
    if (!KnownNativeErrorProps.includes(key)) {
      let value = (err as any)[key]
      if (value != nil) {
        panicInfo.state = panicInfo.state || {}
        panicInfo.state[key] = value
      }
    }
  }

  if (err.cause != nil) {
    panicInfo.cause = Panic.from(err.cause)
  }

  return new Panic(panicInfo)
}
