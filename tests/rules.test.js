"use strict";

const eslint = require("eslint");
// ESLint 8's default RuleTester takes eslintrc-style config; its flat one lives here
const RuleTester =
  eslint.Linter.version.startsWith("8.") ? require("eslint/use-at-your-own-risk").FlatRuleTester : eslint.RuleTester;
const plugin = require("../lib");

// RuleTester integrates with node:test via global describe/it
const { describe, it } = require("node:test");
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("require-testid", plugin.rules["require-testid"], {
  valid: [
    '<Pressable testID="login.submit" onPress={go} />',
    "<TouchableOpacity testID={id} />",
    "<TextInput testID={`email-input`} />",
    "<View />",
    "<Text>Hello</Text>",
    "<Pressable {...props} />",
    { code: "<MyButton testID='x' />", options: [{ additionalComponents: ["MyButton"] }] },
    { code: "<Pressable accessibilityIdentifier='a' />", options: [{ attribute: "accessibilityIdentifier" }] },
    // migration options from eslint-plugin-react-native-require-testid
    { code: "<Pressable />", options: [{ disableDefaultComponents: ["Pressable"] }] },
  ],
  invalid: [
    {
      code: "<Pressable onPress={go} />",
      errors: [{ messageId: "missing", suggestions: [] }],
    },
    {
      code: '<TextInput placeholder="Email address" />',
      errors: [
        {
          messageId: "missing",
          suggestions: [
            { messageId: "suggest", output: '<TextInput testID="email-address" placeholder="Email address" />' },
          ],
        },
      ],
    },
    {
      code: '<Button title="Log In" onPress={go} />',
      errors: [
        {
          messageId: "missing",
          suggestions: [{ messageId: "suggest", output: '<Button testID="log-in" title="Log In" onPress={go} />' }],
        },
      ],
    },
    { code: '<Switch testID="" />', errors: [{ messageId: "empty" }] },
    { code: "<Switch testID={undefined} />", errors: [{ messageId: "empty" }] },
    { code: "<Switch testID={null} />", errors: [{ messageId: "empty" }] },
    { code: "<Card onPress={go} />", options: [{ enableComponents: ["Card"] }], errors: [{ messageId: "missing" }] },
    {
      code: `<Button title="${"a".repeat(59)} b" />`,
      errors: [
        {
          messageId: "missing",
          suggestions: [{ messageId: "suggest", output: `<Button testID="${"a".repeat(59)}" title="${"a".repeat(59)} b" />` }],
        },
      ],
    },
    { code: "<Pressable {...props} />", options: [{ ignoreSpread: false }], errors: [{ messageId: "missing" }] },
    {
      code: "<Animated.Pressable />",
      options: [{ additionalComponents: ["Animated.Pressable"] }],
      errors: [{ messageId: "missing" }],
    },
  ],
});

ruleTester.run("testid-format", plugin.rules["testid-format"], {
  valid: [
    '<View testID="login.submit-button" />',
    '<View testID="cart-item" />',
    "<View testID={dynamicId} />",
    "<View testID={`item-${i}`} />",
    { code: '<View testID="LoginScreen_Submit" />', options: [{ pattern: "^[A-Z][A-Za-z]+_[A-Z][A-Za-z]+$" }] },
  ],
  invalid: [
    { code: '<View testID="LoginButton" />', errors: [{ messageId: "format" }] },
    { code: '<View testID="login button" />', errors: [{ messageId: "format" }] },
    { code: '<View testID={"Submit_btn"} />', errors: [{ messageId: "format" }] },
  ],
});

ruleTester.run("no-duplicate-testid", plugin.rules["no-duplicate-testid"], {
  valid: [
    '<><View testID="a" /><View testID="b" /></>',
    "<><View testID={x} /><View testID={x} /></>",
    // mutually exclusive branches never render together
    '<View>{loading ? <Button testID="save" disabled /> : <Button testID="save" />}</View>',
    'function A() { if (loading) { return <Spinner testID="screen" />; } else { return <View testID="screen" />; } }',
    'function A() { if (loading) return <Spinner testID="screen" />; return <View testID="screen" />; }',
  ],
  invalid: [
    {
      code: '<>\n<View testID="save" />\n<Pressable testID="save" />\n</>',
      errors: [{ messageId: "duplicate", data: { attribute: "testID", value: "save", line: "2" } }],
    },
    {
      code: 'function A() { const h = <View testID="x" />; return <View>{h}<Text testID="x" /></View>; }',
      errors: [{ messageId: "duplicate" }],
    },
    {
      code: 'function A() { return <View testID="x" />; }\nfunction B() { return <View testID="x" />; }',
      errors: [{ messageId: "duplicate" }],
    },
    {
      code: '<View>{a ? <View testID="x"><Text testID="x" /></View> : null}</View>',
      errors: [{ messageId: "duplicate" }],
    },
  ],
});

describe("plugin", () => {
  it("exposes a recommended flat config", () => {
    const cfg = plugin.configs.recommended;
    if (cfg.plugins["react-native-testid"] !== plugin) throw new Error("plugin not registered");
    if (Object.keys(cfg.rules).length !== 3) throw new Error("expected 3 rules");
  });
});
