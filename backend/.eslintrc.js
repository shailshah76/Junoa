module.exports = {
    env: {
      browser: false,
      es2021: true,
      node: true,
      jest: true
    },
    extends: [
      'standard'
    ],
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      // Customize rules as needed
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'indent': ['error', 2],
      'no-trailing-spaces': 'error',
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'eol-last': ['error', 'always'],
      'comma-dangle': ['error', 'never'],
      'space-before-function-paren': ['error', {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always'
      }],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'computed-property-spacing': ['error', 'never'],
      'key-spacing': ['error', { beforeColon: false, afterColon: true }],
      'keyword-spacing': ['error', { before: true, after: true }],
      'space-infix-ops': 'error',
      'space-unary-ops': 'error',
      'spaced-comment': ['error', 'always'],
      'no-unused-vars': ['error', { 
        vars: 'all', 
        args: 'after-used', 
        ignoreRestSiblings: false 
      }],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'template-curly-spacing': ['error', 'never'],
      'arrow-spacing': ['error', { before: true, after: true }],
      'prefer-arrow-callback': 'error',
      'arrow-parens': ['error', 'as-needed'],
      'no-duplicate-imports': 'error',
      'no-useless-constructor': 'error',
      'class-methods-use-this': 'off',
      'consistent-return': 'error',
      'default-case': 'error',
      'dot-notation': 'error',
      'eqeqeq': ['error', 'always'],
      'guard-for-in': 'error',
      'no-alert': 'warn',
      'no-caller': 'error',
      'no-eval': 'error',
      'no-extend-native': 'error',
      'no-extra-bind': 'error',
      'no-fallthrough': 'error',
      'no-floating-decimal': 'error',
      'no-implicit-coercion': 'error',
      'no-implied-eval': 'error',
      'no-iterator': 'error',
      'no-labels': 'error',
      'no-lone-blocks': 'error',
      'no-loop-func': 'error',
      'no-multi-spaces': 'error',
      'no-multi-str': 'error',
      'no-new': 'error',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-octal-escape': 'error',
      'no-proto': 'error',
      'no-return-assign': 'error',
      'no-script-url': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-unused-expressions': 'error',
      'no-useless-call': 'error',
      'no-void': 'error',
      'no-with': 'error',
      'radix': 'error',
      'wrap-iife': ['error', 'any'],
      'yoda': 'error'
    },
    globals: {
      process: 'readonly',
      Buffer: 'readonly',
      __dirname: 'readonly',
      __filename: 'readonly',
      global: 'readonly',
      module: 'readonly',
      require: 'readonly',
      exports: 'readonly'
    },
    overrides: [
      {
        files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
        env: {
          jest: true
        },
        rules: {
          'no-console': 'off'
        }
      },
      {
        files: ['scripts/**/*.js'],
        rules: {
          'no-console': 'off'
        }
      }
    ]
  };