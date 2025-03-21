module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    node: true,
    jest: true,
  },
  rules: {
    // Add any custom rules here
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_',
    }],
    // Allow console logs as this is a CLI application
    'no-console': 'off',
  },
  ignorePatterns: ['dist/', 'node_modules/', 'jest.config.ts'],
  overrides: [
    {
      // Disable TypeScript-specific rules that require type information for test files
      // This avoids the need for including tests in tsconfig.json
      files: ['**/*.test.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        // Remove the project option for test files
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      rules: {
        // Disable rules that require type information
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
      }
    }
  ]
}; 