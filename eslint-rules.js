module.exports = {
  "rules": {
    "@typescript-eslint/adjacent-overload-signatures": "warn",
    "@typescript-eslint/array-type": [
      "warn",
      {
        "default": "array"
      }
    ],
    "@typescript-eslint/ban-types": [
      "warn",
      {
        "types": {
          "object": false,
          "Function": false,
          "Object": { "message": "Prefer `object`?" },
          "Boolean": { "message": "Prefer `boolean`?" },
          "Number": { "message": "Prefer `number`?" },
          "String": { "message": "Prefer `string`?" },
          "Symbol": { "message": "Prefer `symbol`?" }
        }
      }
    ],
    // "@typescript-eslint/class-name-casing": "warn",
    "@typescript-eslint/consistent-type-assertions": "warn",
    "@typescript-eslint/dot-notation": "off",
    "@typescript-eslint/explicit-member-accessibility": [
      "warn",
      {
        "accessibility": "no-public"
      }
    ],
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/indent": [
      "warn",
      2
    ],
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/member-delimiter-style": [
      "warn",
      {
        "multiline": {
          "delimiter": "none",
          "requireLast": true
        },
        "singleline": {
          "delimiter": "semi",
          "requireLast": false
        }
      }
    ],
    "@typescript-eslint/no-empty-function": "warn",
    "@typescript-eslint/no-empty-interface": "warn",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-misused-new": "warn",
    "@typescript-eslint/no-misused-promises": "off",
    "@typescript-eslint/no-namespace": "warn",
    "@typescript-eslint/no-parameter-properties": "off",
    "@typescript-eslint/no-this-alias": "off",
    "@typescript-eslint/no-unnecessary-type-assertion": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unused-expressions": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { "ignoreRestSiblings": true }],
    "@typescript-eslint/no-unsafe-return": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/prefer-for-of": "warn",
    "@typescript-eslint/prefer-function-type": "warn",
    "@typescript-eslint/prefer-namespace-keyword": "warn",
    "@typescript-eslint/quotes": [
      "warn",
      "double"
    ],
    "@typescript-eslint/restrict-template-expressions": "off",
    "@typescript-eslint/semi": [
      "warn",
      "never"
    ],
    "@typescript-eslint/triple-slash-reference": [
      "warn",
      {
        "path": "always",
        "types": "prefer-import",
        "lib": "always"
      }
    ],
    "@typescript-eslint/unbound-method": "off",
    "@typescript-eslint/unified-signatures": "off",
    "arrow-parens": [
      "off",
      "always"
    ],
    "camelcase": "warn",
    "comma-dangle": "off",
    "complexity": "off",
    "constructor-super": "warn",
    "curly": "off",
    "eol-last": "off",
    "eqeqeq": [
      "warn",
      "smart"
    ],
    "guard-for-in": "warn",
    "id-blacklist": "warn",
    "id-match": "warn",
    // "import/order": "warn",
    // "jsdoc/check-alignment": "warn",
    // "jsdoc/check-indentation": "warn",
    // "jsdoc/newline-after-description": "warn",
    "max-classes-per-file": "off",
    "max-len": "off",
    "new-parens": "warn",
    "no-bitwise": "warn",
    "no-caller": "warn",
    "no-case-declarations": "off",
    "no-cond-assign": "off",
    "no-console": "warn",
    "no-constant-condition": "off",
    "no-debugger": "warn",
    "no-empty": "warn",
    "no-eval": "warn",
    "no-fallthrough": "off",
    "no-invalid-this": "off",
    "no-multiple-empty-lines": "off",
    "no-new-wrappers": "warn",
    "no-prototype-builtins": "off",
    "no-shadow": [
      "off",
      {
        "hoist": "all"
      }
    ],
    "no-throw-literal": "warn",
    "no-trailing-spaces": "warn",
    "no-undef-init": "warn",
    "no-underscore-dangle": "off",
    "no-unsafe-finally": "warn",
    "no-unused-labels": "warn",
    "no-var": "warn",
    "object-shorthand": "off",
    "one-var": [
      "warn",
      "never"
    ],
    "prefer-arrow/prefer-arrow-functions": "off",
    "prefer-const": [
      "error", { "destructuring": "all" }
    ],
    "quote-props": "off",
    "radix": "off",
    "space-before-function-paren": "off",
    "spaced-comment": [
      "warn",
      "always",
      {
        "markers": [
          "/"
        ]
      }
    ],
    "use-isnan": "warn",
    "valid-typeof": "off"
  }
}
