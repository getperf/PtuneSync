import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.ts", "**/*.js"],

    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },

  {
    files: ["**/*.test.ts", "**/__tests__/**/*.ts"],

    languageOptions: {
      globals: {
        ...globals.jest
      }
    },

    rules: {
      "@typescript-eslint/unbound-method": "off"
    }
  }

];