import { nil } from "core/nil"

/**
 * Create trace at current position. Overhead frames can be specified to remove
 * them from final output, ie. ignore caller, this function, etc
 */
export function createTrace(overheadFrames: number = 2): string[] {
  let ErrorSystem: {
    captureStackTrace?: Function
  } = Error as any

  if (ErrorSystem.captureStackTrace != nil) {
    const analyzer: { stack?: string } = {}
    ErrorSystem.captureStackTrace(analyzer)
    if (analyzer.stack != nil) {
      let trace = analyzer.stack.split("\n").slice(1 + overheadFrames)
      return trace
    }

    return []
  } else {
    // else: fallback to emulating error
    let analyzer = new Error()

    if (analyzer.stack != nil) {
      let trace = analyzer.stack.split("\n").slice(1 + overheadFrames)
      return trace
    }

    return []
  }
}
