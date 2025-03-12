import problems from 'eslint-config-problems'
import globals from 'globals'

export default [
  problems,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
]
