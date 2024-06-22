import { isTruthyValue } from "lib/util/isTruthyValue"

import { nil } from "core/nil"

////////////////////////////////////////////////////////////////////////////////

const TEST_CASES: {
  [testcase: string]: boolean
} = {
  true: true,
  True: true,
  enabled: true,
  Enabled: true,
  ON: true,
  on: true,
  On: true,
  "1": true,
  false: false,
  off: false,
  "0": false,
  "42": false,
  disabled: false,
  "": false,
}

describe("lib/util/isTruthyValue", () => {
  test("test cases", () => {
    for (let testcase in TEST_CASES) {
      expect(isTruthyValue(testcase)).toEqual(TEST_CASES[testcase])
    }
  })
})
