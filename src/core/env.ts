import { isEmpty } from "lib/util/isEmpty"

import { nil } from "core/nil"

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
  prefix?: string
  name: string
  defaultValue?: string
  parser?: (value: string) => { value: T; errors?: string[] }
}): T {
  let { prefix, name, defaultValue = "", parser } = input

  if (prefix != nil) {
    name = `${prefix}${name}`
  }

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
