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

      '@typescript-eslint/no-deprecated': 'off',
    },
  },
]
