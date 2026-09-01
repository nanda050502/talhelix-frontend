import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { react },
    rules: {
      // Defense in depth: forbid cross-role imports
      // Student routes must never import admin data-fetching code
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/routes/admin/**', '**/api/admin/**'],
              message: 'Student/Institution code must not import admin modules — violates role isolation. Use role-specific API.',
            },
            {
              group: ['**/routes/student/**', '**/api/student/**'],
              message: 'Admin/Institution code must not import student modules.',
            },
            {
              group: ['**/routes/institution/**', '**/api/institution/**'],
              message: 'Admin/Student code must not import institution modules.',
            },
          ],
        },
      ],
    },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'tests/'],
  }
);
