import eslint from '@eslint/js'
import pluginJest from 'eslint-plugin-jest'
import nodePlugin from 'eslint-plugin-n'
import perfectionist from 'eslint-plugin-perfectionist'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    plugins: {
      perfectionist,
    },
    rules: {
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'natural',
          order: 'asc',
          newlinesBetween: 'never',
        },
      ],
    },
  },
  nodePlugin.configs['flat/recommended'],
  pluginJest.configs['flat/recommended'],
  {
    ignores: [
      'dist',
      'coverage',
      'scripts',
      'rollup.config.js',
      'eslint.config.js',
      'src/mainProcessMain.ts',
      'files/previewInjectedCode.js',
      'pages',
    ],
  },
  {
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'error',
      'n/no-unpublished-import': [
        'error',
        {
          allowModules: ['@jest/globals', 'electron'],
        },
      ],
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-deprecated': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      'jest/no-disabled-tests': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'n/no-process-exit': 'off',
      '@typescript-eslint/no-dynamic-delete': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },
)
