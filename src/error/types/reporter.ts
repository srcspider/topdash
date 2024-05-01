import type { Panic } from "error/panic"

export interface PanicReporterService {
  report(panic: Panic): Promise<void>
}
