import type { Time } from "core/types/common"

import { parseDuration } from "lib/util/parseDuration"

import { nil } from "core/nil"

////////////////////////////////////////////////////////////////////////////////

export function createTimeParser(defaultValue: Time, errorMessage: string) {
  return (rawConf: string) => {
    if (rawConf == "") {
      return { value: defaultValue }
    }

    let conf: Time
    try {
      conf = parseDuration(rawConf)
    } catch (err) {
      return {
        value: nil,
        errors: [`${errorMessage} (was: ${rawConf})`],
      }
    }

    return {
      value: conf,
    }
  }
}
