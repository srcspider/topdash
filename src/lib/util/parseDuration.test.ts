import type { Time } from "core/types/common"

import { parseDuration } from "lib/util/parseDuration"

import { Days, Hour, Hours, Minutes, Seconds, Weeks } from "core/time"

////////////////////////////////////////////////////////////////////////////////

const TEST_CASES: {
  [testcase: string]: Time
} = {
  "12345656": 12345656,
  "1hr 20mins": 1 * Hour + 20 * Minutes,
  "1hour 20mins": 1 * Hour + 20 * Minutes,
  "1 hour 20 mins": 1 * Hour + 20 * Minutes,
  "12 days": 12 * Days,
  "6 weeks": 6 * Weeks,
  "6w": 6 * Weeks,
  "3d": 3 * Days,
  "3h 3m 3s": 3 * Hours + 3 * Minutes + 3 * Seconds,
}

describe("lib/util/parseDuration", () => {
  test("exceptional cases", () => {
    expect(() => {
      parseDuration("hello world")
    }).toThrow(
      "[UNPARSABLE_DURATION] expected time; input is not recognized as measurment of time (ConfigurationError)",
    )
  })

  test("test cases", () => {
    for (let testcase in TEST_CASES) {
      expect(parseDuration(testcase)).toEqual(TEST_CASES[testcase])
    }
  })
})
