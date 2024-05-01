/**
 * Time is just a number representing miliseconds unix time as interger value.
 */
export type Time = number

/**
 * A standard ID is (understood as) just a number.
 */
export type ID = number

/**
 * A standard UUID is just a string in a special format.
 */
export type UUID = string

/**
 * A C-type boolean is just a number representing a boolean value.
 * 0 is false, other values are true (typically 1 is true)
 *
 * Sometimes -1 might mean undefined/default/unset.
 */
export type CBool = number
