// @ts-check

/** @type {import("@ianvs/prettier-plugin-sort-imports").PrettierConfig} */
module.exports = {
  plugins: [
    // @ts-ignore
    require("prettier-plugin-tailwindcss"),
    require("@ianvs/prettier-plugin-sort-imports"),
  ],
  importOrder: [
    "^react",
    "^next",
    "<THIRD_PARTY_MODULES>",
    "",
    "^~/(.*)$",
    "",
    "^[./]",
  ],
};
