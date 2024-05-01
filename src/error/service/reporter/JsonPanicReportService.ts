import type { PanicReporterService } from "error/types/reporter"

import { LogLevel } from "core/logging"
import { nil } from "core/nil"
import { topdash } from "core/settings"

import { parsePanicType, type Panic } from "error/panic"
import { unwrapPanic } from "error/tools/unwrapPanic"

////////////////////////////////////////////////////////////////////////////////

/**
 * Service for using multiple panic reporters at same time.
 */
export class JsonPanicReportService implements PanicReporterService {
  async report(panic: Panic): Promise<void> {
    if (topdash.LOG_LEVEL >= LogLevel.Error || true) {
      let errorStack: any[] = []

      let layers = unwrapPanic(panic)
      for (let layer of layers) {
        let { code, message, desc, state, type, reportedAt } = layer.data

        let entry: any = {
          reportedAt: new Date(reportedAt).toISOString(),
        }

        if (type != nil) {
          entry.type = parsePanicType(type)
        }

        entry.code = code
        entry.message = message

        if (desc) {
          entry.desc = desc
        }

        if (state) {
          entry.state = state
        }

        errorStack.push(entry)
      }

      console.error({
        message: panic.message,
        errorStack,
      })
    }
  }
}
