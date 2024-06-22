import { isTruthyValue } from "lib/util/isTruthyValue"

import { getenv } from "core/env"

////////////////////////////////////////////////////////////////////////////////

/**
 * Parser for use with {@link getenv}
 */
export function createBooleanParser(defaultValue: boolean) {
  return (rawConf: string) => {
    if (rawConf == "") {
      return { value: defaultValue }
    }

    return {
      value: isTruthyValue(rawConf),
    }
  }
}
