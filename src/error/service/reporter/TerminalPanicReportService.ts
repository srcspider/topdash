import type { PanicReporterService } from "error/types/reporter"

import { textBold, textDim } from "lib/cli/formatting"

import { LogLevel } from "core/logging"
import { nil } from "core/nil"
import { topdash } from "core/settings"

import { parsePanicType, type Panic } from "error/panic"

////////////////////////////////////////////////////////////////////////////////

export type TraceFormatMode = "raw" | "short"

/**
 * Formats trace into, typically, easier to read more condensed format.
 * Intended for use in terminals and other specialized outputs.
 */
export function formatTrace(
  frames: string[],
  mode: TraceFormatMode = "short",
): string[] {
  if (mode == "raw") {
    return frames
  } else if (mode == "short") {
    let formatted: string[] = []

    for (let frame of frames) {
      let is3rdPartyFrame = false
      let isSrcFrame = false
      if (/\(.*\/node_modules\//g.test(frame)) {
        is3rdPartyFrame = true
      } else if (/\(.*\/src\//g.test(frame)) {
        isSrcFrame = true
      }

      frame = frame
        .replace(/\(.*\/node_modules\//g, "(3rd-party:/")
        .replace(/\(.*\/src\//g, "(src/")

      if (frame.match(/at new Promise \(<anonymous>\)/)) {
        frame = textDim(frame)
      }

      if (frame.match(/at processTicksAndRejections/)) {
        frame = textDim(frame)
      }

      if (is3rdPartyFrame) {
        frame = textDim(frame)
      }

      if (isSrcFrame) {
        frame = textBold(frame)
      }

      formatted.push(frame)
    }

    return formatted
  }

  return frames
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Reporter service specialized in printing to the terminal.
 */
export class TerminalPanicReportService implements PanicReporterService {
  async report(panic: Panic): Promise<void> {
    // TODO: improved terminal logging output

    if (topdash.LOG_LEVEL >= LogLevel.Verbose) {
      let data = panic.data

      let traceMode: TraceFormatMode = "short"
      if (topdash.LOG_LEVEL >= LogLevel.Verbose) {
        traceMode = "raw"
      }

      let { code, message, reportedAt, desc, state, type, cause } = data

      let prettyData: any = {}

      if (type) {
        prettyData.type = parsePanicType(type)
      }

      prettyData.code = code
      prettyData.message = message

      if (desc != nil) {
        prettyData.dev = desc
      }

      if (state != nil) {
        prettyData.state = state
      }

      prettyData.reportedAt = new Date(reportedAt)

      console.dir(prettyData, { depth: null })

      for (let frame of formatTrace(data.trace, traceMode)) {
        console.info(frame)
      }
    } else if (topdash.LOG_LEVEL >= LogLevel.Error) {
      console.log(`🚩 ${panic.message}`)
    }
  }
}
