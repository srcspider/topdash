import { getenv } from "core/env"
import { nil } from "core/nil"

////////////////////////////////////////////////////////////////////////////////

/**
 * Parser for use with {@link getenv}
 */
export function createPortParser(defaultPort: number) {
  return (rawPort: string) => {
    if (rawPort == "") {
      return { value: defaultPort }
    }

    let port = parseInt(rawPort, 10)

    if (isNaN(port) || port < 10) {
      return {
        value: nil,
        errors: [`Invalid port value (was: ${port})`],
      }
    }

    return {
      value: port,
    }
  }
}
