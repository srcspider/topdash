import { getenv } from "core/env"
import { nil } from "core/nil"

////////////////////////////////////////////////////////////////////////////////

/**
 * ## Usage Guide
 *
 * The following explains how to use the different log levels effectively.
 * These are not hardset rules, just recommended practices.
 *
 * ## Log Levels Explained
 *
 * There are 4 types of log levels:
 *  - meta log levels (Nothing, Everything)
 *  - error log levels (Error, Trace)
 *  - info log levels (Info, Verbose)
 *  - dev log levels (Debug, Trace)
 *
 * If you ever need to record that log level is not set, just use undefined.
 *
 * ### What should my default log level be
 *
 * We recommend Info. The Error log level is also another close contender.
 *
 * If your application is not spammy Info is the best, otherwise Error is good
 * default.
 *
 * ## Recommended Usage Pattern
 *
 * ```ts
 * if (LOG_LEVEL >= LogLevel.Verbose) {
 *   // log something
 * }
 * ```
 *
 * Note the use of `>=` instead of `==`.
 *
 * You always want to say "this or higher" when specifying if something is
 * displayed.
 *
 * ### What to use for logging
 *
 * In terms of what to use to log a simple `console.log` and `console.error`
 * are typically sufficient since they'll post to STDOUT and STDERR. You don't
 * really need to overcomplicate things since it's much more reliable to have
 * your program properly write to the standard logging pipes and redirect
 * those to different systems outside of your app.
 *
 * In most cases even if you add some other intermediate system those systems
 * would still trigger.
 *
 * ### Should log levels control 3rd-party behaviour
 *
 * DO NOT use logging levels and rules to control if you send to a 3rd-party
 * alert system or error reporting system. Just set filter/pull rules on that
 * system instead of outputting less. The only exception to this are of course
 * systems that just blindly grab logs of your programs and record them; in
 * the cases of these systems it is useful to control how much your program
 * writes out so the output is useful.
 *
 * ### JSON-only logs
 *
 * If you need log output to be in the form of json or similar then it's
 * recommended you monkeypatch/overwrite console.log, console.error as well as
 * a few other common ones such as console.dir instead of trying to make things
 * more complicated then they have to be.
 *
 * ### Multiple Logging Systems
 *
 * If you need different log levels for different systems you simply
 * create a settings global object and then set it appropriatly and use
 * that value everywhere. This can be useful for some contexts.
 *
 * ```ts
 * const logLevel = TopdashSettings.LOG_LEVEL
 *
 * // ...
 *
 * if (logLevel >= LogLevel.Verbose) {
 *   // log something
 * }
 * ```
 *
 * ### Layered Logging Systems
 *
 * If you need multiple layers of this just use undefined on the child, as
 * the "use parent LOG_LEVEL" flag. Then you can just chain them:
 *
 * ```ts
 * const logLevel = TopdashDBSettings.LOG_LEVEL || TopdashSettings.LOG_LEVEL
 *
 * // ...
 *
 * if (logLevel >= LogLevel.Verbose) {
 *   // log something
 * }
 * ```
 *
 * ## Log Levels
 *
 * ### Nothing and Everything
 *
 * Nothing and Everything are only meant to be used to ask for everything off,
 * or everything on. They have no other special meaning.
 *
 * ### Error Log Level
 *
 * As a rule of thumb this is information that is useful for debugging small or
 * very common issues. It is also error information that is printed as part of
 * regular operations. In general when a error happens, if it's logged, this
 * log level would ensure at least one line is writen out mentioning it.
 *
 * If the error would cause the program to crash it's recommended that you
 * do not tie the error information about what caused the crash behind the Error
 * level; it's may lead to loss of critical information. You can control
 * complete silence in CLI output or similar implementations though dedicated
 * flag, instead of tieing it to your logging rules.
 *
 * If the error information involves "pages of information" then it's better
 * placed in Trace. In general Trace logging has an equivalent Error level
 * logging version or just adds the extreme details.
 *
 * **WARNING 1**: There is no log level that controlls the display of
 * "personal information" or otherwise sensitive information. If you need
 * features like that for development purposes it's recommended to have them as
 * distinct environment toggles, as well as clearly marked with something like
 * "DEBUG_" prefix or similar, eg. "DEBUG_LOG_USER_LOGIN", "DEBUG_PRINT_AUTH"
 *
 * **WARNING 2**: It's recommended you NEVER print keys in any circumstance,
 * including at the highest of log levels. Instead of doing that only print at
 * most a tiny hint of the key such as the key bit size and start and end
 * character in a key at most.
 *
 * ### Info Log Level
 *
 * 1. Any startup information (no matter how verbose) is Info.
 * 2. Any important state change information is Info if rare,
 *    use Verbose if extremely frequent (ie. every request/call/second),
 *    and use Debug & Trace if only developers would be interested in it.
 *
 * ### Verbose Log Level
 *
 * As a rule of thumb verbose should be anything that is just information on
 * the system running but unlike Info happens at a frequency measured in:
 * seconds, every-request, 10-at-a-time, pages-of-text at a time, etc.
 *
 * In other words, Verbose is anything that contributes or by itself makes the
 * log unreadable due to extreme volume or frequency, even in a development
 * environment with a single user and controlled use case. The context of how
 * important or not important it is, is irrelevant.
 *
 * If it's hard to tell when it's too verbose and when it isnt, the simple
 * rule of thumb is: are you printing more then 1-line to the logs (directly
 * or indirectly) then it's Verbose. Exception: error information, you should
 * reference only Error and Trace for how verbose those can be.
 *
 * So as an example, a lot of audit logging such as user creation,
 * user changes, or admin actions, aren't that frequent or wont write that much
 * to the logs (or be too difficult to read though) so you should limit them
 * using the Info level, not the Verbose level. On the other hand, "what
 * request you made to the DB" or if cache was hit or similar, even if they're
 * not too important or fit in one line, are extremely spammy, hard to read
 * though and distracting even in lowest frequency interaction, so you should
 * stick them under Verbose log level.
 *
 * ### Debug Log Level
 *
 * Is the information readable by developers and unreadable or irrelevant to
 * operations people? It's debug. Generally this isn't very strict, and
 * primarily refers to information that needs a lot of correlation to be useful.
 * If you have something like "stacktraces" that's just Verbose but it's plenty
 * useful to everyone; not just devs.
 *
 * In general Debug is like what Info is to Verbose. Short and sweet, even if
 * it's a lot of information. Anything that makes the output barely readable
 * if not outright unreadable should go in Trace instead.
 *
 * ### Trace Log Level
 *
 * The equivalent of Verbose but for Errors, however can also be just
 * "information" as the line between error information and information becomes
 * blurry when trying to track down a known-unknown or unknown-unknown.
 * Typically limited to only dev related error or info, as well as only the
 * most may-be-useful details.
 */
export enum LogLevel {
  Nothing = 0, // print nothing, ever
  Error = 10 ** 2, // print only errors and error related information
  Info = 10 ** 3, // print errors and basic information
  Debug = 10 ** 4, // print dev-focused info (as opposed to ops focused)
  Verbose = 10 ** 5, // print errors and a lot of information (typically events)
  Trace = 10 ** 6, // print everything in extreme detail

  // Note: this value isn't something like Number.MAX_SAFE_INTEGER to avoid
  // any complications if the value is ever stored or written out as-is
  Everything = 10 ** 10, // print everything, no matter what
}

/**
 * Given log level as string value, returns log level as LogLevel numerical
 * value, as understood by the system.
 */
export function parseLogLevel(
  rawLogLevel: string | nil,
  defaultValue = LogLevel.Info,
): LogLevel {
  if (rawLogLevel == nil) {
    return defaultValue
  }

  rawLogLevel = rawLogLevel.trim().toLocaleLowerCase()
  if (rawLogLevel == "nothing") {
    return LogLevel.Nothing
  } else if (rawLogLevel == "error") {
    return LogLevel.Error
  } else if (rawLogLevel == "info") {
    return LogLevel.Info
  } else if (rawLogLevel == "verbose") {
    return LogLevel.Verbose
  } else if (rawLogLevel == "debug") {
    return LogLevel.Debug
  } else if (rawLogLevel == "trace") {
    return LogLevel.Trace
  } else if (rawLogLevel == "everything") {
    return LogLevel.Everything
  } else {
    // else: unrecognized, use provided default
    return defaultValue
  }
}

export const LOG_LEVEL: LogLevel = getenv({
  name: "LOG_LEVEL",
  defaultValue: "debug",
  parser: (rawLogLevel: string) => {
    let value = parseLogLevel(rawLogLevel, nil)

    let errors: string[] | nil
    if (value == nil) {
      value = LogLevel.Info
      errors = [
        `unrecognized LOG_LEVEL specified (was: ${rawLogLevel})`,
        `LOG_LEVEL has been automatically set to Info fallback due to errors`,
      ]
    }

    return { value, errors }
  },
})
