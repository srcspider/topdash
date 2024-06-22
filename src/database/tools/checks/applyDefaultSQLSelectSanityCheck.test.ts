import { nil } from "core/nil"

import { applyDefaultSQLSelectSanityCheck } from "database/tools/checks/applyDefaultSQLSelectSanityCheck"

////////////////////////////////////////////////////////////////////////////////

export const FORBIDDEN_ADMIN_TEST_CASES: (typeName: string) => {
  testcase: string
  errors: nil | string[]
}[] = (typeName: string) => {
  return [
    // =======================
    // CALL Related Test Cases
    // =======================

    {
      testcase: `
        CALL p(@version, @increment);
      `,
      errors: [
        `Usage of forbidden keyword within ${typeName}-only query (was: CALL).`,
      ],
    },

    // =========================
    // CREATE Related Test Cases
    // =========================

    {
      testcase: `
        DELIMITER //

        CREATE PROCEDURE p (OUT ver_param VARCHAR(25), INOUT incr_param INT)
        BEGIN
          # Set value of OUT parameter
          SELECT VERSION() INTO ver_param;
          # Increment value of INOUT parameter
          SET incr_param = incr_param + 1;
        END //
        
        DELIMITER ;
      `,
      errors: [
        `Usage of more then one statement per query or query delimitors of any kind, is not allowed.`,
      ],
    },

    {
      testcase: `
        CREATE PROCEDURE p (OUT ver_param VARCHAR(25), INOUT incr_param INT)
        BEGIN
          # Set value of OUT parameter
          SELECT VERSION() INTO ver_param;
          # Increment value of INOUT parameter
          SET incr_param = incr_param + 1;
        END //
      `,
      errors: [
        `Usage of more then one statement per query or query delimitors of any kind, is not allowed.`,
      ],
    },

    {
      testcase: `
        CREATE TABLE items (
          id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          wholesale DECIMAL(6,2) NOT NULL DEFAULT 0.00,
          retail DECIMAL(6,2) NOT NULL DEFAULT 0.00,
          quantity BIGINT NOT NULL DEFAULT 0
        );
      `,
      errors: [
        `Usage of forbidden keyword within ${typeName}-only query (was: CREATE).`,
      ],
    },

    // ========================
    // ALTER Related Test Cases
    // ========================

    {
      testcase: `
        ALTER TABLE t1
      `,
      errors: [
        `Usage of forbidden keyword within ${typeName}-only query (was: ALTER).`,
      ],
    },

    {
      testcase: `
        ALTER TABLE t1 
        CHANGE COLUMN c1 c1 BLOB 
          COMMENT = 'NDB_COLUMN=BLOB_INLINE_SIZE=4096,MAX_BLOB_PART_SIZE';
      `,
      errors: [
        `Usage of forbidden keyword within ${typeName}-only query (was: ALTER).`,
      ],
    },

    {
      testcase: `
        ALTER TABLE t1 CHANGE a b BIGINT NOT NULL;
      `,
      errors: [
        `Usage of forbidden keyword within ${typeName}-only query (was: ALTER).`,
      ],
    },

    {
      testcase: `
        ALTER TABLE t1 RENAME COLUMN a TO b,
        RENAME COLUMN b TO a;
      `,
      errors: [
        `Usage of forbidden keyword within ${typeName}-only query (was: ALTER).`,
      ],
    },

    {
      testcase: `
        ALTER TABLE tbl_name DROP FOREIGN KEY fk_symbol;
      `,
      errors: [
        `Usage of forbidden keyword within ${typeName}-only query (was: ALTER).`,
      ],
    },

    {
      testcase: `
        ALTER DATABASE mydb READ ONLY = 0 DEFAULT COLLATE utf8mb4_bin;
      `,
      errors: [
        `Usage of forbidden keyword within ${typeName}-only query (was: ALTER).`,
      ],
    },

    {
      testcase: `
        RENAME TABLE t TO t_old, t_copy TO t;
      `,
      errors: [
        `Usage of forbidden keyword within ${typeName}-only query (was: RENAME).`,
      ],
    },

    // =======================
    // DROP Related Test Cases
    // =======================

    {
      testcase: `
        DROP table_name
      `,
      errors: [
        `Usage of forbidden keyword within ${typeName}-only query (was: DROP).`,
      ],
    },

    {
      testcase: `
        DROP DATATBASE example
      `,
      errors: [
        `Usage of forbidden keyword within ${typeName}-only query (was: DROP).`,
      ],
    },
  ]
}

export const FORBIDDEN_UPDATE_TEST_CASES: (typeName: string) => {
  testcase: string
  errors: nil | string[]
}[] = (typeName: string) => {
  return [
    // =========================
    // UPDATE Related Test Cases
    // =========================

    {
      testcase: `
        UPDATE t SET id = id + 1;
      `,
      errors: [
        `Usage of forbidden keyword within ${typeName}-only query (was: UPDATE).`,
      ],
    },

    {
      testcase: `
        UPDATE t SET id = id + 1 ORDER BY id DESC;
      `,
      errors: [
        `Usage of forbidden keyword within ${typeName}-only query (was: UPDATE).`,
      ],
    },

    {
      testcase: `
        UPDATE items,month SET items.price=month.price
        WHERE items.id=month.id;
      `,
      errors: [
        `Usage of forbidden keyword within ${typeName}-only query (was: UPDATE).`,
      ],
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
      errors: [
        `Usage of forbidden keyword within ${typeName}-only query (was: UPDATE).`,
      ],
    },
  ]
}

export const FORBIDDEN_DELETE_TEST_CASES: (typeName: string) => {
  testcase: string
  errors: nil | string[]
}[] = (typeName: string) => {
  return [
    // =========================
    // DELETE Related Test Cases
    // =========================

    {
      testcase: `
        DELETE t1, t2 FROM t1 INNER JOIN t2 INNER JOIN t3
        WHERE t1.id=t2.id AND t2.id=t3.id;
      `,
      errors: [
        `Usage of forbidden keyword within ${typeName}-only query (was: DELETE).`,
      ],
    },
  ]
}

export const FORBIDDEN_MIXEDQUERY_TEST_CASES: (typeName: string) => {
  testcase: string
  errors: nil | string[]
}[] = (typeName: string) => {
  return [
    // ===========
    // Mixed Query
    // ===========

    {
      testcase: `
        SELECT x from table;
        SELECT y from other_table
      `,
      errors: [
        "Usage of more then one statement per query or query delimitors of any kind, is not allowed.",
      ],
    },
  ]
}

////////////////////////////////////////////////////////////////////////////////

const TEST_CASES: {
  testcase: string
  errors: nil | string[]
}[] = [
  ...FORBIDDEN_MIXEDQUERY_TEST_CASES("SELECT"),
  ...FORBIDDEN_ADMIN_TEST_CASES("SELECT"),
  ...FORBIDDEN_UPDATE_TEST_CASES("SELECT"),
  ...FORBIDDEN_DELETE_TEST_CASES("SELECT"),

  // =================
  // SELECT Test Cases
  // =================

  {
    testcase: `
      SELECT * 
        FROM example
    `,
    errors: nil,
  },
  {
    testcase: `
      SELECT 1
    `,
    errors: nil,
  },
  {
    testcase: `
      SELECT date, SUM(price) AS sum_price
        FROM sales
       GROUP BY date
       ORDER BY date;
    `,
    errors: nil,
  },

  // ===============
  // WITH Test Cases
  // ===============

  // See: https://dev.mysql.com/doc/refman/8.4/en/with.html

  {
    testcase: `
      WITH
        cte1 AS (SELECT a, b FROM table1),
        cte2 AS (SELECT c, d FROM table2)
      SELECT b, d FROM cte1 JOIN cte2
      WHERE cte1.a = cte2.c;
    `,
    errors: nil,
  },
  {
    testcase: `
      WITH cte (col1, col2) AS
      (
        SELECT 1, 2
        UNION ALL
        SELECT 3, 4
      )
      SELECT col1, col2 FROM cte;
    `,
    errors: nil,
  },
  {
    testcase: `
      WITH RECURSIVE cte (n) AS
      (
        SELECT 1
        UNION ALL
        SELECT n + 1 FROM cte WHERE n < 5
      )
      SELECT * FROM cte;
    `,
    errors: nil,
  },
  {
    testcase: `
      WITH RECURSIVE employee_paths (id, name, path) AS
      (
        SELECT id, name, CAST(id AS CHAR(200))
          FROM employees
          WHERE manager_id IS NULL
        UNION ALL
        SELECT e.id, e.name, CONCAT(ep.path, ',', e.id)
          FROM employee_paths AS ep JOIN employees AS e
            ON ep.id = e.manager_id
      )
      SELECT * FROM employee_paths ORDER BY path;
    `,
    errors: nil,
  },
]

////////////////////////////////////////////////////////////////////////////////

describe("database/tools/checks/applyDefaultSQLSelectSanityCheck", () => {
  test("test cases", () => {
    for (let entry of TEST_CASES) {
      let errors = applyDefaultSQLSelectSanityCheck(entry.testcase)
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
