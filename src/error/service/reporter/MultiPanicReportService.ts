import type { PanicReporterService } from "error/types/reporter"

import { LogLevel } from "core/logging"
import { topdash } from "core/settings"

import type { Panic } from "error/panic"

////////////////////////////////////////////////////////////////////////////////

/**
 * Service for using multiple panic reporters at same time.
 */
export class MultiPanicReportService implements PanicReporterService {
  constructor(private reporters: PanicReporterService[]) {}

  async report(panic: Panic): Promise<void> {
    for (let entry of this.reporters) {
      try {
        await entry.report(panic)
      } catch (err) {
        if (topdash.LOG_LEVEL >= LogLevel.Error) {
          console.error(
            `[${typeof this}] Error attempting to report using ${typeof entry} reporter`,
            err,
          )
        }
      }
    }
  }
}
