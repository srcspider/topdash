import { nil } from "core/nil"

export function createNumericParser(
  defaultValue: number,
  errorMessage: string,
) {
  return (rawConf: string) => {
    if (rawConf == "") {
      return { value: defaultValue }
    }

    let conf = parseInt(rawConf, 10)

    if (isNaN(conf)) {
      return {
        value: nil,
        errors: [`${errorMessage} (was: ${conf})`],
      }
    }

    return {
      value: conf,
    }
  }
}
