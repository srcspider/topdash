import type { nil } from "core/nil"

/**
 * ```txt
 * nil = no restriction;
 * N1 = exactly n1 entries;
 * [ N1 ] = at least N1 entries, no upper limit;
 * [ N1, N2 ] = between N1 and N2 entries (inclusive)
 * ```
 */
export type SQLQueryRange = nil | number | [number] | [number, number]
