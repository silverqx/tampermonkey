import globals from 'globals'
import { defineConfig } from 'eslint/config'

import stylisticJs from '@stylistic/eslint-plugin-js'
import jsdoc from 'eslint-plugin-jsdoc'

export default defineConfig([{
    plugins: {
        '@stylistic/js': stylisticJs,
        jsdoc,
    },

    languageOptions: {
        globals: {
            ...globals.browser,

            // Tampermonkey
            GM_getValue: 'readonly',
            GM_setValue: 'readonly',
            GM_deleteValue: 'readonly',
            GM_listValues: 'readonly',
            GM_addStyle: 'readonly',
            GM_xmlhttpRequest: 'readonly',
            GM_setClipboard: 'readonly',
            GM_info: 'readonly',
        },

        ecmaVersion: 2024,
        sourceType: 'module',
    },

    rules: {
        // ESLint Core
        'max-len': ['error', {'code': 100, 'ignoreTrailingComments': true}],
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

        // ESLint Stylistic
        '@stylistic/js/indent': ['error', 4],
        '@stylistic/js/linebreak-style': ['error', 'unix'],
        '@stylistic/js/quotes': ['error', 'single'],
        '@stylistic/js/semi': ['error', 'never'],

        // JSDoc Plugin
        'jsdoc/check-param-names': 'warn',
        'jsdoc/check-tag-names': 'warn',
        'jsdoc/check-types': 'warn',
        'jsdoc/require-param': 'warn',
        'jsdoc/require-param-description': 'warn',
        'jsdoc/require-param-type': 'warn',
        'jsdoc/require-description-complete-sentence': 'warn',
        'jsdoc/require-returns-type': ['warn', {
            'contexts': [
                'ArrowFunctionExpression',
                'FunctionDeclaration',
                'FunctionExpression',
                'ClassMethod', // Added explicitly
            ]
        }],
        'jsdoc/require-returns-description': 'off', // Disable return description requirement
        'jsdoc/require-hyphen-before-param-description': 'warn',
        'jsdoc/tag-lines': ['warn', 'any', {startLines: 1}],
    },
}])
