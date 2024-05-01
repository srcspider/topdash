import { Panic } from "error/panic"
import { unwrapPanic } from "error/tools/unwrapPanic"

////////////////////////////////////////////////////////////////////////////////

describe("error/tools/unwrapPanic", () => {
  test("unwrapPanic(singleError)", () => {
    let err = new Panic({
      code: "EX001",
      message: "example error",
    })

    expect(unwrapPanic(err)).toEqual([err])
  })

  test("unwrapPanic(multiError)", () => {
    let originalErr = new Panic({
      code: "EX001",
      message: "original error",
    })

    let err = new Panic({
      code: "EX001",
      message: "example error",
      cause: originalErr,
    })

    expect(unwrapPanic(err)).toEqual([err, originalErr])
  })
})
