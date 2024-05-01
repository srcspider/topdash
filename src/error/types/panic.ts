import { Time } from "core/types/common"

import type { Panic, PanicType } from "error/panic"

////////////////////////////////////////////////////////////////////////////////

export interface PanicInfo {
  /**
   * The kind of error this is.
   */
  type?: PanicType

  /**
   * A semi-unique code to help identify the message.
   *
   * The code doesn't have to be fully unique so long as it accuratly
   * identifies the cause of the error (enough to fix it).
   *
   * If you have multiple instances with same error message you should try
   * to have unique error codes to distinguish them.
   */
  code: string

  /**
   * Short error message describing the error.
   *
   * Given the same error circumstances the message should not change. However
   * given significantly different circumstances (ie. different error) it's
   * fine for the message to change even if at the same location.
   *
   * eg. multiple errors on the same field should be the same
   * eg. different kinds of errors on the same field should be unique
   *
   * It's recommended that the message also be "end user friendly" but it's not
   * a requirement, especially if you are handling very low level systems.
   *
   * You can stick dynamic details and very technical error messages in both
   * the description (desc key) and the state debug information (state key).
   */
  message: string

  /**
   * (Optional) Technical description of the problem. It's highly encouraged to specify
   * some potential solutions. Often times the developer writing the code that
   * throws the error is more knowledgable on the cause and effect, then the
   * people who might end up in the position of needing to fix or analyze the
   * problem.
   *
   * This can also include friendly development messages.
   *
   * eg.
   * ```txt
   * This problem often happens when the service X is not responding. You can
   * fix this switching to a compatible service or bypass it temporarily by
   * enabling the SKIP_SERVICE_X flag. In development you can enable DEBUG_X
   * to get better error messages.
   * ```
   */
  desc?: string | string[]

  /**
   * (Optional) State information for the context of the problem.
   *
   * For example if you have a error that happens when service does a specific
   * thing you can include service ID information and other useful data in
   * the state, rather then the message of the error.
   *
   * **WARNING**: Always be careful of accidentally including personal
   * information or otherwise sensitive information like passwords and secret
   * keys in the state.
   *
   * **Tip**: You can include hints to some sensitive information like keys,
   * for example key length and such, but it's recommended you still lock this
   * information behind a flag of some sort thats disabled by default, such as
   * an environment variable, so that it's only being sent in emergency
   * debugging/incident resolution.
   */
  state?: {
    [key: string]: unknown
  }

  /**
   * The error that caused this error.
   *
   * Acceptable: Error objects, Objects that look like errors, strings, etc
   */
  cause?: any
}

export interface PanicPackage extends PanicInfo {
  type?: PanicType
  desc?: string
  id: number
  reportedAt: Time
  trace: string[]
  cause?: Panic
}
