import type { Time } from "core/types/common"

import { Panic, PanicType } from "error/panic"

import parse from "parse-duration"

////////////////////////////////////////////////////////////////////////////////

/**
 * Given duration representation in miliseconds or relative units, such as
 * minutes, hours, seconds. Returns back the milisecond equivalent.
 */
export function parseDuration(input: string): Time {
  input = input.trim()

  if (input == "") {
    throw new Panic({
      type: PanicType.ConfigurationError,
      code: "UNPARSABLE_DURATION",
      message: "empty input",
      desc: "expected at least some input",
    })
  }

  // if input is just a number, we assume it's time in miliseconds
  if (/^[0-9]+$/.test(input)) {
    return parseInt(input)
  }

  let output
  try {
    output = parse(input)
  } catch (err) {
    throw new Panic({
      type: PanicType.ConfigurationError,
      code: "UNPARSABLE_DURATION",
      message: "error while parsing input",
      cause: err,
    })
  }

  if (output == null) {
    throw new Panic({
      type: PanicType.ConfigurationError,
      code: "UNPARSABLE_DURATION",
      message: "expected time; input is not recognized as measurment of time",
      desc: "eg. '50ms', '1hr 20mins', etc",
      state: {
        input,
      },
    })
  }

  return Math.floor(output)
}
