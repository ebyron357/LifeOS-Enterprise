module.exports = {
  root: true,
  ignorePatterns: ['dist', '.next', 'coverage', 'node_modules'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json']
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  overrides: [
    {
      files: ['*.js', '*.cjs'],
      env: {
        node: true
      },
      parserOptions: {
        project: null
      }
    }
  ]
};
