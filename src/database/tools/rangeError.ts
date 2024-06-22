import type { PanicInfo } from "error/types/panic"

import { Panic } from "error/panic"

import { TopdashSQLSettings } from "database/settings"

////////////////////////////////////////////////////////////////////////////////

/**
 * This function throws or just displays warning depending on settings.
 *
 * By default the behaviour is to throw on unexpected ranges when range is
 * specified.
 */
export function rangeError(info: PanicInfo) {
  if (TopdashSQLSettings.throwOnRangeErrors) {
    throw new Panic(info)
  } else {
    // else: handle as error
    Panic.warning(info)
  }
}
