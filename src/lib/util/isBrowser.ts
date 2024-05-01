import * as currentEnv from "browser-or-node"

/**
 * @returns boolean true if running inside a browser environment
 */
export function isBrowser() {
  return currentEnv.isBrowser
}
