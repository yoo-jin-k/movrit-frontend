import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // 내용이 다른 미사용 사용자 복사본만 보존하며 검사에서 제외합니다.
  globalIgnores([
    'dist',
    'src/api/brandApi 2.js',
    'src/api/preorderApi 2.js',
    'src/api/productApi 2.js',
    'src/api/sellerApi 2.js',
    'src/pages/AdminSellerPage 2.jsx',
    'src/pages/BrandManagePage 2.jsx',
    'src/pages/PreorderManagePage 2.jsx',
    'src/pages/ProductManagePage 2.jsx',
  ]),
  {
    files: ['scripts/**/*.mjs'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
])
