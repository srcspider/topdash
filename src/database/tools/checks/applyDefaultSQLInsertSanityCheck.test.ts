import { nil } from "core/nil"

import { applyDefaultSQLInsertSanityCheck } from "database/tools/checks/applyDefaultSQLInsertSanityCheck"
import {
  FORBIDDEN_ADMIN_TEST_CASES,
  FORBIDDEN_DELETE_TEST_CASES,
  FORBIDDEN_MIXEDQUERY_TEST_CASES,
} from "database/tools/checks/applyDefaultSQLSelectSanityCheck.test"
import { FORBIDDEN_SELECT_TEST_CASES } from "database/tools/checks/applyDefaultSQLUpdateSanityCheck.test"

////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////

const TEST_CASES: {
  testcase: string
  errors: nil | string[]
}[] = [
  ...FORBIDDEN_MIXEDQUERY_TEST_CASES("INSERT"),
  ...FORBIDDEN_ADMIN_TEST_CASES("INSERT"),
  ...FORBIDDEN_DELETE_TEST_CASES("INSERT"),
  ...FORBIDDEN_SELECT_TEST_CASES("INSERT", true),

  // =========================
  // INSERT Related Test Cases
  // =========================

  {
    testcase: `
        INSERT INTO tbl_name (a,b,c)
        VALUES (1,2,3), (4,5,6), (7,8,9);
      `,
    errors: nil,
  },

  {
    testcase: `
        INSERT INTO tbl_name (a,b,c) 
        VALUES (1,2,3,4,5,6,7,8,9);
      `,
    errors: nil,
  },

  {
    testcase: `
        INSERT INTO tbl_name (a,b,c)
        VALUES ROW(1,2,3), ROW(4,5,6), ROW(7,8,9);
      `,
    errors: nil,
  },
]

////////////////////////////////////////////////////////////////////////////////

describe("database/tools/checks/applyDefaultSQLInsertSanityCheck", () => {
  test("test cases", () => {
    for (let entry of TEST_CASES) {
      let errors = applyDefaultSQLInsertSanityCheck(entry.testcase)
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
