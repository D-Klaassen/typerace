import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["worker-configuration.d.ts", ".wrangler/**"]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
]);
