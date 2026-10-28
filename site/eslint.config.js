import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "src/types.generated.ts"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  reactHooks.configs["recommended-latest"],
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
  },
);
