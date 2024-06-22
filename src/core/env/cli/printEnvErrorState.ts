import { keys } from "lib/util/keys"

import {
  textBold,
  textErrorLabel,
  textOkLabel,
  textRed,
} from "core/cli/formatting"
import { ENV_ERRORS, hasEnvErrors } from "core/env"
import { LogLevel } from "core/logging"
import { topdash } from "core/settings"

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
