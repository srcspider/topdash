const Reset = "\x1b[0m"
const Bright = "\x1b[1m"
const Dim = "\x1b[2m"
const Underscore = "\x1b[4m"
const Blink = "\x1b[5m"
const Reverse = "\x1b[7m"
const Hidden = "\x1b[8m"

const FgBlack = "\x1b[30m"
const FgRed = "\x1b[31m"
const FgGreen = "\x1b[32m"
const FgYellow = "\x1b[33m"
const FgBlue = "\x1b[34m"
const FgMagenta = "\x1b[35m"
const FgCyan = "\x1b[36m"
const FgWhite = "\x1b[37m"
const FgGray = "\x1b[90m"

const BgBlack = "\x1b[40m"
const BgRed = "\x1b[41m"
const BgGreen = "\x1b[42m"
const BgYellow = "\x1b[43m"
const BgBlue = "\x1b[44m"
const BgMagenta = "\x1b[45m"
const BgCyan = "\x1b[46m"
const BgWhite = "\x1b[47m"
const BgGray = "\x1b[100m"

////////////////////////////////////////////////////////////////////////////////

// Labels
// ======

export function textOkLabel(text: string): string {
  return `${BgGreen}${FgWhite} ${text} ${Reset}`
}

export function textErrorLabel(text: string): string {
  return `${BgRed}${FgWhite} ${text} ${Reset}`
}

// Special States
// ==============

export function textBold(text: string): string {
  return `${Bright}${text}${Reset}`
}

export function textDim(text: string): string {
  return `${Dim}${text}${Reset}`
}

export function textUnderline(text: string): string {
  return `${Underscore}${text}${Reset}`
}

// Colored Text
// ============

export function textBlue(text: string): string {
  return `${FgBlue}${text}${Reset}`
}

export function textGreen(text: string): string {
  return `${FgGreen}${text}${Reset}`
}

export function textRed(text: string): string {
  return `${FgRed}${text}${Reset}`
}
