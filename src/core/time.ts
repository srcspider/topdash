export const Milisecond = 1
export const Miliseconds = Milisecond
export const Second = 1000 * Miliseconds
export const Seconds = Second
export const Minute = 60 * Seconds
export const Minutes = Minute
export const Hour = 60 * Minutes
export const Hours = Hour
export const Day = 24 * Hours
export const Days = Day
export const Week = 7 * Days
export const Weeks = Week

//
// There is no type for "Month" and "Months" since it's a human concept that
// has no approximation; while "30 days" is often used it's better to just
// write "30 *Days" then to have some confusion that "Month" is dynamic
//

export const Year = 365 * Days
export const Years = Year
