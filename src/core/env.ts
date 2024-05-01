import {
  textBold,
  textErrorLabel,
  textOkLabel,
  textRed,
} from "lib/cli/formatting"
import { isEmpty } from "lib/util/isEmpty"
import { keys } from "lib/util/keys"

import { LogLevel } from "core/logging"
import { nil } from "core/nil"
import { topdash } from "core/settings"

////////////////////////////////////////////////////////////////////////////////

/**
 * List of environment errors. The list is populated by returning errors during
 * parser implementations inside getenv.
 */
export const ENV_ERRORS: {
  [key: string]: string[]
} = {}

/**
 * Get environment variable. You can provide default value to read from
 * environment and parser to parse the value to more usable value as well as
 * return errors where applicable, such as invalid values.
 *
 * You can retrieve environment errors though ENV_ERRORS variable.
 *
 * You can also handle errors easily with hasEnvErrors and printEnvErrors
 */
export function getenv<T = string>(input: {
  name: string
  defaultValue: string
  parser?: (value: string) => { value: T; errors?: string[] }
}): T {
  let { name, defaultValue = "", parser } = input

  let value
  let env = process?.env
  if (env != nil) {
    value = env[name] || defaultValue
  } else {
    value = defaultValue
  }

  if (parser != nil) {
    let parsed = parser(value)

    if (parsed.errors != nil) {
      ENV_ERRORS[name] = parsed.errors
    }

    return parsed.value
  } else {
    return value as T
  }
}

/**
 * Errors are populated by `genenv` parser implementations.
 *
 * @returns boolean true if errors exist
 */
export function hasEnvErrors() {
  return !isEmpty(ENV_ERRORS)
}

/**
 * Prints current state of environment errors.
 */
export function printEnvErrorState() {
  if (hasEnvErrors()) {
    if (topdash.LOG_LEVEL >= LogLevel.Info) {
      console.error()
      for (let envName of keys(ENV_ERRORS)) {
        console.error(`${textBold(envName)}`)
        for (let error of ENV_ERRORS[envName]) {
          console.error(` - ${textRed(error)}`)
        }
        console.error()
      }

      console.log(`${textErrorLabel("ERROR")} Envrionment Errors Detected`)
    }
  } else {
    if (topdash.LOG_LEVEL >= LogLevel.Info) {
      console.log(`${textOkLabel("PASSED")} No Environment Errors`)
    }
  }
}
