import * as config from '@lvce-editor/eslint-config'

export default [
  ...config.default,
  ...config.recommendedNode,
  {
    rules: {
      // TODO
      '@typescript-eslint/explicit-function-return-type': 'off',
      'unicorn/no-await-expression-member': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'unicorn/consistent-function-scoping': 'off',
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',
      'unicorn/no-process-exit': 'off',
      'no-console': 'off',
      'unicorn/no-array-method-this-argument': 'off',
      'prefer-destructuring': 'off',
      'unicorn/prefer-string-raw': 'off',
      'n/no-process-exit': 'off',
      'sonarjs/prefer-specific-assertions': 'off',
      'unicorn/no-error-property-assignment': 'off',
      'unicorn/no-global-object-property-assignment': 'off',
      'unicorn/no-this-outside-of-class': 'off',
      'unicorn/no-top-level-assignment-in-function': 'off',
      'unicorn/no-top-level-side-effects': 'off',
      'unicorn/no-useless-template-literals': 'off',
      'unicorn/no-unsafe-string-replacement': 'off',
      'unicorn/prefer-boolean-return': 'off',
      'unicorn/prefer-https': 'off',
      'unicorn/prefer-promise-with-resolvers': 'off',

      '@typescript-eslint/no-deprecated': 'off',
      'jest/no-restricted-jest-methods': 'off',

      '@cspell/spellchecker': 'off',
    },
  },
]
