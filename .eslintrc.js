module.exports = {
    "rules": {
        // the rules below should be sorted in a same way they are sorted on http://eslint.org/docs/rules page
        // http://eslint.org/docs/rules/#possible-errors
        "no-caller": 2,
        "no-control-regex": 2,
        "no-empty": 1,
        "no-invalid-regexp": 2,
        "no-regex-spaces": 2,
        "valid-jsdoc": 0,
        "valid-typeof": 2,
        // http://eslint.org/docs/rules/#best-practices
        "curly": 2,
        "eqeqeq": [2, "smart"],
        "guard-for-in": 0,
        "no-else-return": 1,
        "no-fallthrough": 2,
        "no-invalid-this": 1,
        "no-iterator": 2,
        "no-loop-func": 2,
        "no-multi-str": 2,
        "no-new-func": 2,
        "no-new-wrappers": 2,
        "no-new": 2,
        "no-proto": 2,
        "no-script-url": 2,
        "wrap-iife": [2, "outside"],
        // http://eslint.org/docs/rules/#strict-mode
        "strict": 2,
        // http://eslint.org/docs/rules/#variables
        "no-shadow-restricted-names": 2,
        "no-shadow": 1,
        "no-undef": 2,
        "no-unused-vars": [1, {"vars": "all", "args": "none"}],
        "no-use-before-define": 0,
        // http://eslint.org/docs/rules/#nodejs-and-commonjs
        "no-new-require": 2,
        // http://eslint.org/docs/rules/#stylistic-issues
        "block-spacing": 1,
        "brace-style": [1, "1tbs", { allowSingleLine: true }],
        "camelcase": 1,
        "comma-dangle": 2,
        "comma-spacing": 1,
        "comma-style": [1, "last"],
        "computed-property-spacing": 1,
        "eol-last": 1,
        "func-call-spacing": 1,
        "indent": [1, 4],
        "key-spacing": [1, { beforeColon: false, afterColon: true }],
        "max-len": [1, 120],
        "new-cap": [0, {
            "capIsNewExceptions": [
                "$.Deferred",
                "$.Event",
                "CodeMirror.Pos",
                "Immutable.Map",
                "Immutable.List",
                "JSLINT"
            ]
        }],
        "new-parens": 2,
        "no-bitwise": 2,
        "no-new-object": 2,
        "no-trailing-spaces": 1,
        "semi-spacing": 1,
        "semi": 2
    },
    "globals": {
        "$": false,
        "brackets": false,
        "clearTimeout": false,
        "console": false,
        "define": false,
        "require": false,
        "setTimeout": false,
        "window": false,
        "ArrayBuffer": false,
        "Uint32Array": false,
        "WebSocket": false,
        "XMLHttpRequest": false
    }
};
