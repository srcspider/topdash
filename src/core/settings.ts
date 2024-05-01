import { LOG_LEVEL, type LogLevel } from "core/logging"

////////////////////////////////////////////////////////////////////////////////

export class TopdashSettings {
  static LOG_LEVEL: LogLevel = LOG_LEVEL
}

// Alias
export const topdash = TopdashSettings
