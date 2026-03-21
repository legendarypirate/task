import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Disable specific rules
      "@typescript-eslint/no-explicit-any": "off",
      "react/no-unescaped-entities": "off",
      
      // Configure unused vars to ignore variables starting with underscore
      "@typescript-eslint/no-unused-vars": [
        "warn", 
        { 
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_"
        }
      ],
      
      // Disable Next.js img warning (use Image component when possible)
      "@next/next/no-img-element": "warn",
      
      // Allow empty interfaces/types
      "@typescript-eslint/no-empty-object-type": "off",
      
      // Other useful rules you might want
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "no-console": "warn",
    }
  }
];

export default eslintConfig;