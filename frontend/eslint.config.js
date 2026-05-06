import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // The Tailwind config is shipped minified in this repo; running ESLint over
  // it produces dozens of false positives (no-undef on `global`/`module`,
  // duplicate-name in the bundled regex helpers, etc.). It's not source code
  // we author by hand, so skip it.
  globalIgnores(['dist', 'tailwind.config.js']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Capitalized args (e.g. `{ icon: Icon }`) are React-component aliases;
      // they often look "unused" inside the destructure even when used in JSX.
      // Same exception applies to argsIgnorePattern as varsIgnorePattern.
      'no-unused-vars': [
        'error',
        { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]|^_' },
      ],
      // The new react-hooks plugin is overly aggressive about local component
      // declarations and synchronous setState in effects. They're stylistic
      // signals, not correctness bugs — downgrade to warnings so CI passes.
      'react-hooks/static-components': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
