/* eslint-env node */
const { REACT_RESTRICTED_SYNTAX, RESTRICTED_SYNTAX } = require('@theguild/eslint-config/constants');

const HIVE_RESTRICTED_SYNTAX = [
  {
    // ❌ '0.0.0.0' or `0.0.0.0`
    selector: ':matches(Literal[value="0.0.0.0"], TemplateElement[value.raw="0.0.0.0"])',
    message: 'Use "::" to make it compatible with both IPv4 and IPv6',
  },
];

module.exports = {
  reportUnusedDisableDirectives: true,
  ignorePatterns: [
    'scripts',
    'rules',
    'out',
    '.hive',
    'public',
    'packages/web/app/src/graphql/index.ts',
    'packages/libraries/cli/src/sdk.ts',
    'packages/services/storage/src/db/types.ts',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: ['./tsconfig.eslint.json'],
  },
  parser: '@typescript-eslint/parser',
  plugins: ['hive'],
  extends: '@theguild',
  rules: {
    'no-process-env': 'error',
    'no-empty': ['error', { allowEmptyCatch: true }],
    'import/no-absolute-path': 'error',
    'import/no-self-import': 'error',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['packages/services/storage/tools/*.js', 'packages/services/**'],
        optionalDependencies: false,
      },
    ],
    'hive/enforce-deps-in-dev': [
      'error',
      {
        scopes: ['@hive', '@graphql-hive'],
        ignored: ['packages/libraries/**', 'packages/web/**'],
      },
    ],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    'no-restricted-syntax': ['error', ...HIVE_RESTRICTED_SYNTAX, ...RESTRICTED_SYNTAX],

    // 🚨 The following rules needs to be fixed and was temporarily disabled to avoid printing warning
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/triple-slash-reference': 'off',

    'import/extensions': 'off',
    'unicorn/prefer-node-protocol': 'off',
    'no-console': 'off',
    'import/no-default-export': 'off',
    'n/no-restricted-import': 'off',
  },
  overrides: [
    {
      files: ['packages/web/**'],
      extends: [
        '@theguild/eslint-config/react',
        'plugin:tailwindcss/recommended',
        'plugin:@next/next/recommended',
      ],
      settings: {
        'import/resolver': {
          typescript: {
            project: ['packages/web/app/tsconfig.json'],
          },
        },
      },
      rules: {
        // conflicts with official prettier-plugin-tailwindcss and tailwind v3
        'tailwindcss/classnames-order': 'off',
        // set more strict to highlight in editor
        'tailwindcss/enforces-shorthand': 'error',
        'tailwindcss/no-custom-classname': 'error',
        'tailwindcss/migration-from-tailwind-2': 'error',
        'tailwindcss/no-contradicting-classname': 'error',
        'react/display-name': 'off',
        'react/prop-types': 'off',
        'react/no-unknown-property': 'off',
        'jsx-a11y/anchor-is-valid': ['off', { components: ['Link', 'NextLink'] }],
        'jsx-a11y/alt-text': ['warn', { elements: ['img'], img: ['Image', 'NextImage'] }],
        'no-restricted-syntax': ['error', ...HIVE_RESTRICTED_SYNTAX, ...REACT_RESTRICTED_SYNTAX],
        // TODO: enable below rules👇
        '@typescript-eslint/no-non-null-assertion': 'off',
        'react/jsx-no-useless-fragment': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        'react-hooks/rules-of-hooks': 'off',
        'react-hooks/exhaustive-deps': 'off',
        'unicorn/filename-case': 'off',
        '@next/next/no-img-element': 'off',
        '@typescript-eslint/ban-types': 'off',
        'react/jsx-key': 'off',
        'jsx-a11y/label-has-associated-control': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        'jsx-a11y/no-static-element-interactions': 'off',
        '@next/next/no-html-link-for-pages': 'off',
      },
    },
    {
      files: ['packages/web/app/**'],
      settings: {
        next: {
          rootDir: 'packages/web/app',
        },
        tailwindcss: {
          config: 'packages/web/app/tailwind.config.cjs',
          whitelist: ['drag-none'],
        },
      },
    },
    // {
    //   files: ['packages/web/app/**'],
    //   excludedFiles: ['packages/web/app/pages/**'],
    //   rules: {
    //     'import/no-unused-modules': ['error', { unusedExports: true }],
    //   },
    // },
    {
      files: ['packages/web/docs/**'],
      settings: {
        next: {
          rootDir: 'packages/web/docs',
        },
        tailwindcss: {
          config: 'packages/web/docs/tailwind.config.cjs',
        },
      },
    },
    {
      files: ['packages/web/landing-page/**'],
      settings: {
        next: {
          rootDir: 'packages/web/landing-page',
        },
        tailwindcss: {
          config: 'packages/web/landing-page/tailwind.config.cjs',
        },
      },
    },
    {
      files: 'cypress/**',
      extends: 'plugin:cypress/recommended',
    },
  ],
};
