export function isTruthyValue(value: string) {
  return ["yes", "true", "1", "on", "enabled"].includes(
    value.toLocaleLowerCase(),
  )
}
