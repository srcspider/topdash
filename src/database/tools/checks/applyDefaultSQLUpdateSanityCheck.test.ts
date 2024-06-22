import { nil } from "core/nil"

import {
  FORBIDDEN_ADMIN_TEST_CASES,
  FORBIDDEN_DELETE_TEST_CASES,
  FORBIDDEN_MIXEDQUERY_TEST_CASES,
} from "database/tools/checks/applyDefaultSQLSelectSanityCheck.test"
import { applyDefaultSQLUpdateSanityCheck } from "database/tools/checks/applyDefaultSQLUpdateSanityCheck"

////////////////////////////////////////////////////////////////////////////////

export const FORBIDDEN_SELECT_TEST_CASES: (
  typeName: string,
  nonSelect: boolean,
) => {
  testcase: string
  errors: nil | string[]
}[] = (typeName: string, allowedAsSubquery: boolean = false) => {
  return [
    // =================
    // SELECT Test Cases
    // =================

    {
      testcase: `
        SELECT * 
          FROM example
      `,
      errors: [
        allowedAsSubquery
          ? `Not a recognizable ${typeName} query.`
          : `Usage of forbidden keyword within ${typeName}-only query (was: SELECT).`,
      ],
    },
    {
      testcase: `
        SELECT 1
      `,
      errors: [
        allowedAsSubquery
          ? `Not a recognizable ${typeName} query.`
          : `Usage of forbidden keyword within ${typeName}-only query (was: SELECT).`,
      ],
    },
    {
      testcase: `
        SELECT date, SUM(price) AS sum_price
          FROM sales
        GROUP BY date
        ORDER BY date;
      `,
      errors: [
        allowedAsSubquery
          ? `Not a recognizable ${typeName} query.`
          : `Usage of forbidden keyword within ${typeName}-only query (was: SELECT).`,
      ],
    },
  ]
}

////////////////////////////////////////////////////////////////////////////////

const TEST_CASES: {
  testcase: string
  errors: nil | string[]
}[] = [
  ...FORBIDDEN_MIXEDQUERY_TEST_CASES("UPDATE"),
  ...FORBIDDEN_ADMIN_TEST_CASES("UPDATE"),
  ...FORBIDDEN_DELETE_TEST_CASES("UPDATE"),
  ...FORBIDDEN_SELECT_TEST_CASES("UPDATE", true),

  // =========================
  // UPDATE Related Test Cases
  // =========================

  {
    testcase: `
        UPDATE t SET id = id + 1;
      `,
    errors: nil,
  },

  {
    testcase: `
        UPDATE t SET id = id + 1 ORDER BY id DESC;
      `,
    errors: nil,
  },

  {
    testcase: `
        UPDATE items,month SET items.price=month.price
        WHERE items.id=month.id;
      `,
    errors: nil,
  },

  {
    testcase: `
        UPDATE items,
          (SELECT id FROM items
            WHERE id IN
              (SELECT id FROM items
                WHERE retail / wholesale >= 1.3 AND quantity < 100))
            AS discounted
        SET items.retail = items.retail * 0.9
        WHERE items.id = discounted.id;
      `,
    errors: nil,
  },
]

////////////////////////////////////////////////////////////////////////////////

describe("database/tools/checks/applyDefaultSQLUpdateSanityCheck", () => {
  test("test cases", () => {
    for (let entry of TEST_CASES) {
      let errors = applyDefaultSQLUpdateSanityCheck(entry.testcase)
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
