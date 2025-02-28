module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    // "plugin:@typescript-eslint/recommended",
    'plugin:@typescript-eslint/recommended-type-checked',
    "plugin:vue/vue3-recommended",
    "plugin:prettier/recommended",
  ],
  ignorePatterns: ['.eslintrc.cjs', 'postcss.config.js'],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: "@typescript-eslint/parser",
    tsconfigRootDir: __dirname,
    sourceType: 'module',
    ecmaVersion: 'latest',
    project: ["./tsconfig.json", "./tsconfig.node.json"],
    extraFileExtensions: ['.vue'],
  },
  plugins: [
    'vue',
    '@typescript-eslint',
  ],
  rules: {
    "vue/eqeqeq": "error",
    eqeqeq: "error",
    "@typescript-eslint/strict-boolean-expressions": "error",
  },
};
