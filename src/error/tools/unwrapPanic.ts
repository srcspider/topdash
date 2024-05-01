import { nil } from "core/nil"

import type { Panic } from "error/panic"

////////////////////////////////////////////////////////////////////////////////

function unwrapLayers(layer: Panic, res: Panic[]): void {
  res.push(layer)
  if (layer.cause != nil) {
    unwrapLayers(layer.cause, res)
  }
}

/**
 * Convert panic into array of all panic objects that constitute the error.
 * The cause is not removed from each layer.
 */
export function unwrapPanic(panic: Panic): Panic[] {
  let res: Panic[] = []
  unwrapLayers(panic, res)
  return res
}
