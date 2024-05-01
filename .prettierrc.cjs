/** @type {import("prettier").Config} */
const config = {
  plugins: ["@trivago/prettier-plugin-sort-imports"],

  // Overwrites
  // ==========

  // too much noise
  semi: false, // default: true

  // Ensure forward compatibility
  // ============================

  printWidth: 80,
  useTabs: false,
  tabWidth: 2,

  // Plugin: Import Sorter
  // =====================

  importOrder: [
    "^(.*)/types/(.*)$",
    "^lib/(.*)$",
    "^core/(.*)$",
    "^error/(.*)$",
    "^database/(.*)$",
    "^[./]",
    "<THIRD_PARTY_MODULES>",
  ],

  importOrderSeparation: true,
}

module.exports = config
