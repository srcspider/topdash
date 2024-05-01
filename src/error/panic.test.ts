import { nil } from "core/nil"

import { Panic, PanicType, isPanic, parsePanicType } from "error/panic"

////////////////////////////////////////////////////////////////////////////////

describe("error/panic", () => {
  // Basic Tests
  // ===========

  describe("basic usage", () => {
    test("create minimal panic", () => {
      let err = new Panic({
        code: "EX001",
        message: "example error",
      })

      expect(err.message).toBe("[EX001] example error")
    })
  })

  // Getter Tests
  // ============

  describe("getter tests", () => {
    test("panic.id getter", () => {
      let err = new Panic({
        code: "EX001",
        message: "example error",
      })

      expect(err.id).toEqual(err.data.id)
    })

    test("panic.type getter", () => {
      let err1 = new Panic({
        type: PanicType.Impossible | PanicType.Attack,
        code: "EX001",
        message: "example error",
      })

      expect(err1.type).toEqual(PanicType.Impossible | PanicType.Attack)
    })

    test("panic.code getter", () => {
      let err1 = new Panic({
        code: "EX001",
        message: "example error",
      })

      expect(err1.code).toEqual("EX001")
    })

    test("panic.message getter", () => {
      let err1 = new Panic({
        code: "EX001",
        message: "example error",
      })

      expect(err1.message).toEqual("[EX001] example error")
    })

    test("panic.desc getter", () => {
      let err1 = new Panic({
        code: "EX001",
        message: "example error",
        desc: "example description",
      })

      expect(err1.desc).toEqual("example description")
    })

    test("panic.state getter", () => {
      let err1 = new Panic({
        code: "EX001",
        message: "example error",
        state: { a: 1, b: 2 },
      })

      expect(err1.state).toEqual({ a: 1, b: 2 })
    })

    test("panic.cause getter", () => {
      let err1 = new Panic({
        code: "EX001",
        message: "example error",
        cause: new Error("example parent"),
      })

      expect(err1.cause!.message).toEqual("[ERR] example parent")
    })
  })

  // Inferance Tests
  // ===============

  describe("inferrance tests", () => {
    test("Panic.from(anotherPanic)", () => {
      let originalErr = new Panic({
        code: "EX000",
        message: "example original error",
      })

      let err = Panic.from(originalErr)

      expect(err).toEqual(originalErr)
    })

    test("Panic.from(stringErr)", () => {
      let err = Panic.from("example error")

      expect({
        type: err!.type,
        code: err!.code,
        message: err!.message,
        desc: err!.desc,
        state: err!.state,
      }).toEqual({
        type: nil,
        code: "STRERR",
        message: "[STRERR] example error",
        desc: "generated from string passed as error",
        state: nil,
      })
    })

    test("Panic.from(basicError)", () => {
      let example: any = new Error("example error")
      let err = Panic.from(example)

      expect({
        type: err!.type,
        code: err!.code,
        message: err!.message,
        desc: err!.desc,
        state: err!.state,
      }).toEqual({
        type: nil,
        code: "ERR",
        message: "[ERR] example error",
        desc: "generated from native Error",
        state: nil,
      })
    })

    test("Panic.from(advancedError)", () => {
      let example: any = new Error("example error")

      example.code = "EX001"
      example.cause = new Error("parent error")
      example.exampleProp1 = 123
      example.exampleProp2 = 456

      let err = Panic.from(example)

      expect({
        code: err!.code,
        message: err!.message,
        desc: err!.desc,
        state: err!.state,
      }).toEqual({
        code: "EX001",
        message: "[EX001] example error CAUSED BY [ERR] parent error",
        desc: `generated from native Error`,
        state: {
          exampleProp1: 123,
          exampleProp2: 456,
        },
      })
    })

    test("Panic.from(objectThatLooksLikeError)", () => {
      let example: any = {
        message: "object error message",
        code: "EX001",
        exampleProp1: 123,
        exampleProp2: 456,
      }

      let err = Panic.from(example)

      expect({
        code: err!.code,
        message: err!.message,
        desc: err!.desc,
        state: err!.state,
      }).toEqual({
        code: "EX001",
        message: "[EX001] object error message",
        desc: `generated from Object`,
        state: {
          exampleProp1: 123,
          exampleProp2: 456,
        },
      })
    })
  })

  // Adevanced Usage Tests
  // =====================

  describe("advance usage tests", () => {
    test("create complex panic", () => {
      let originalErr = new Panic({
        code: "EX000",
        message: "example original error",
      })

      let parentErr = new Panic({
        type: PanicType.Warning | PanicType.Attack,
        code: "EX001",
        message: "example parent error",
        desc: "this is a parent",
        cause: originalErr,
      })

      let err = new Panic({
        type: PanicType.Impossible | PanicType.Security | PanicType.Attack,
        code: "EX002",
        message: "example error",
        desc: "this is a dev message",
        state: {
          number: 1,
          string: "hello",
          object: {
            a: 1,
            b: "2",
            3: new Date(),
          },
        },
        cause: parentErr,
      })

      expect(err.message).toEqual(
        [
          "[EX002] example error (Impossible, Security, Attack)",
          "[EX001] example parent error (Warning, Attack)",
          "[EX000] example original error",
        ].join(" CAUSED BY "),
      )
    })
  })

  // Adevanced Usage Tests
  // =====================

  describe("unit-test usage tests", () => {
    test("catch panic in tests", () => {
      expect(() => {
        throw new Panic({
          code: "EX000",
          message: "example error",
        })
      }).toThrow("[EX000] example error")
    })
  })

  // Utilities
  // =========

  describe("utilities usage tests", () => {
    test("isPanic(panic)", () => {
      let err = new Panic({
        code: "EX000",
        message: "example error",
      })

      expect(isPanic(err)).toEqual(true)
    })

    test("isPanic(nativeError)", () => {
      expect(isPanic(new Error("example"))).toEqual(false)
    })

    test("isPanic(string)", () => {
      expect(isPanic("example")).toEqual(false)
    })

    test("parsePanicType", () => {
      expect(
        parsePanicType(
          PanicType.Attack |
            PanicType.Corruption |
            PanicType.Impossible |
            PanicType.Security |
            PanicType.Warning,
        ),
      ).toEqual(["Warning", "Impossible", "Corruption", "Security", "Attack"])
    })
  })
})
