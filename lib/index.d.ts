import type { ESLint, Linter, Rule } from "eslint";

declare const plugin: ESLint.Plugin & {
  rules: Record<"require-testid" | "testid-format" | "no-duplicate-testid" | "testid-missing", Rule.RuleModule>;
  configs: {
    recommended: Linter.Config;
    "legacy-recommended": Linter.LegacyConfig;
  };
};

export = plugin;
