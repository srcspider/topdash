////////////////////////////////////////////////////////////////////////////////
import { createMySQLParamData } from "database/mysql/tools/createMySQLParamData"

describe("database/mysql/tools/createMySQLParamData", () => {
  describe("success cases", () => {
    test("basic usage", () => {
      expect(
        createMySQLParamData(
          `
            SELECT * 
              FROM table
            WHERE userId = @id 
          `,
          { id: 42 },
        ),
      ).toEqual([42])
    })
  })

  describe("error cases", () => {
    test("extra query keys", () => {
      expect(() =>
        createMySQLParamData(
          `
            SELECT * 
              FROM table
            WHERE userId = @id 
          `,
          { id: 42, userId: 50 },
        ),
      ).toThrow(
        "[INVALID_QUERY] query has duplicate keys, unknown keys or missing keys",
      )
    })

    test("missing query keys", () => {
      expect(() =>
        createMySQLParamData(
          `
            SELECT * 
              FROM table
            WHERE id = @id 
              AND userId = @userId
          `,
          { id: 42 },
        ),
      ).toThrow(
        "[INVALID_QUERY] query has duplicate keys, unknown keys or missing keys",
      )
    })

    test("duplicate key usage", () => {
      expect(() =>
        createMySQLParamData(
          `
            SELECT * 
              FROM table
            WHERE id = @id 
              AND userId = @id
          `,
          { id: 42 },
        ),
      ).toThrow(
        "[INVALID_QUERY] query has duplicate keys, unknown keys or missing keys",
      )
    })
  })
})
