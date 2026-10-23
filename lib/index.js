"use strict";

const pkg = require("../package.json");

const plugin = {
  meta: { name: pkg.name, version: pkg.version },
  rules: {
    "require-testid": require("./rules/require-testid"),
    "testid-format": require("./rules/testid-format"),
    "no-duplicate-testid": require("./rules/no-duplicate-testid"),
    // Alias for teams migrating from eslint-plugin-react-native-require-testid (rule `testid-missing`)
    "testid-missing": require("./rules/require-testid"),
  },
  configs: {},
};

const recommendedRules = {
  "react-native-testid/require-testid": "error",
  "react-native-testid/no-duplicate-testid": "error",
  "react-native-testid/testid-format": "warn",
};

// Flat config (ESLint 9+)
plugin.configs.recommended = {
  name: "react-native-testid/recommended",
  plugins: { "react-native-testid": plugin },
  rules: recommendedRules,
};

// Legacy .eslintrc
plugin.configs["legacy-recommended"] = {
  plugins: ["react-native-testid"],
  rules: recommendedRules,
};

module.exports = plugin;
