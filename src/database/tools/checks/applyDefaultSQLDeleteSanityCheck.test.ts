import { nil } from "core/nil"

import { applyDefaultSQLDeleteSanityCheck } from "database/tools/checks/applyDefaultSQLDeleteSanityCheck"
import {
  FORBIDDEN_ADMIN_TEST_CASES,
  FORBIDDEN_MIXEDQUERY_TEST_CASES,
  FORBIDDEN_UPDATE_TEST_CASES,
} from "database/tools/checks/applyDefaultSQLSelectSanityCheck.test"
import { FORBIDDEN_SELECT_TEST_CASES } from "database/tools/checks/applyDefaultSQLUpdateSanityCheck.test"

////////////////////////////////////////////////////////////////////////////////

const TEST_CASES: {
  testcase: string
  errors: nil | string[]
}[] = [
  ...FORBIDDEN_MIXEDQUERY_TEST_CASES("DELETE"),
  ...FORBIDDEN_ADMIN_TEST_CASES("DELETE"),
  ...FORBIDDEN_UPDATE_TEST_CASES("DELETE"),
  ...FORBIDDEN_SELECT_TEST_CASES("DELETE", false),

  // =========================
  // DELETE Related Test Cases
  // =========================

  {
    testcase: `
      DELETE t1, t2 FROM t1 INNER JOIN t2 INNER JOIN t3
      WHERE t1.id=t2.id AND t2.id=t3.id;
    `,
    errors: nil,
  },
]

////////////////////////////////////////////////////////////////////////////////

describe("database/tools/checks/applyDefaultSQLDeleteSanityCheck", () => {
  test("test cases", () => {
    for (let entry of TEST_CASES) {
      let errors = applyDefaultSQLDeleteSanityCheck(entry.testcase)
      expect({
        testcase: entry.testcase,
        errors,
      }).toEqual({
        testcase: entry.testcase,
        errors: entry.errors,
      })
    }
  })
})
