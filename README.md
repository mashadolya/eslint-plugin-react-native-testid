# eslint-plugin-react-native-testid

[![npm](https://img.shields.io/npm/v/eslint-plugin-react-native-testid)](https://www.npmjs.com/package/eslint-plugin-react-native-testid)
[![CI](https://github.com/mashadolya/eslint-plugin-react-native-testid/actions/workflows/ci.yml/badge.svg)](https://github.com/mashadolya/eslint-plugin-react-native-testid/actions/workflows/ci.yml)

ESLint rules that keep React Native `testID`s **present, consistent and unique**, so Appium, Detox and Maestro E2E tests stay stable.

Missing or duplicated `testID`s are one of the most common causes of flaky mobile tests: locators fall back to text or XPath, break on every copy change, or silently match the wrong element. This plugin catches those problems at code-review time, before they reach the test suite.

## Rules

| Rule | What it does | Recommended |
| --- | --- | --- |
| `react-native-testid/require-testid` | Interactive components (`Pressable`, `Touchable*`, `Button`, `TextInput`, `Switch`, plus your own) must have a `testID`. Suggests one from `accessibilityLabel`, `title` or `placeholder`. | error |
| `react-native-testid/no-duplicate-testid` | The same static `testID` may not appear twice in a file (branches that never render together are allowed). | error |
| `react-native-testid/testid-format` | `testID` values follow one naming convention (default: `screen.element-name`, lower-kebab). | warn |

## Install

```sh
npm install --save-dev eslint-plugin-react-native-testid
```

Works with ESLint 8.57+, 9 and 10. Zero runtime dependencies.

## Usage (flat config)

```js
// eslint.config.js
const rnTestId = require("eslint-plugin-react-native-testid");
const tsParser = require("@typescript-eslint/parser"); // for .ts/.tsx

module.exports = [
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true } } },
  },
  { files: ["**/*.{js,jsx,ts,tsx}"], ...rnTestId.configs.recommended },
];
```

ESLint 9 lints only `.js`/`.mjs`/`.cjs` by default, so the `files` glob is needed for `.jsx` and `.tsx`.

Legacy `.eslintrc`:

```json
{ "extends": ["plugin:react-native-testid/legacy-recommended"] }
```

## Options

### `require-testid`

```js
"react-native-testid/require-testid": ["error", {
  additionalComponents: ["PrimaryButton", "Animated.Pressable"], // your design-system components
  components: undefined,   // replace the default list entirely
  ignoreSpread: true,      // skip elements with {...props}, which may already pass a testID
  attribute: "testID"      // e.g. "accessibilityIdentifier"
}]
```

`enableComponents` and `disableDefaultComponents` (the option names of `eslint-plugin-react-native-require-testid`) are accepted too.

`testID=""`, `testID={undefined}` and `testID={null}` are reported as empty.

Example:

```jsx
<TextInput placeholder="Email address" />
// ✖ <TextInput> is interactive but has no testID.
// 💡 Add testID="email-address"
```

### `testid-format`

```js
"react-native-testid/testid-format": ["warn", { pattern: "^[a-z]+\\.[a-z-]+$" }]
```

Dynamic values (`testID={id}`, `` testID={`item-${i}`} ``) are not checked.

### `no-duplicate-testid`

```jsx
<View testID="save" />
<Pressable testID="save" />   // ✖ testID "save" is already used on line 1.
```

Elements that can never render together are not duplicates:

```jsx
{loading ? <Button testID="save" disabled /> : <Button testID="save" />}   // ✓

if (loading) return <Spinner testID="screen" />;
return <View testID="screen" />;                                         // ✓
```

## Using with AI coding agents

AI assistants (Claude Code, Cursor, Copilot) write UI code quickly but rarely add `testID`s unless asked, because nothing tells them the code must be testable. A prompt can be ignored; a lint rule cannot. Most agents already run the project linter and fix what it reports, so the plugin turns "testable by default" into a constraint the agent has to satisfy.

Add this to `CLAUDE.md`, `AGENTS.md` or `.cursorrules`:

```md
## Testability
- Every interactive React Native element (Pressable, Touchable*, Button, TextInput, Switch,
  and our design-system buttons) must have a `testID`.
- `testID` format: `screen.element-name`, lower-kebab (e.g. `login.submit-button`).
- After editing UI files, run `npx eslint <changed files>` and fix every `react-native-testid/*` report
  before finishing. Do not disable these rules.
```

For CI, fail the pull request on any `react-native-testid/*` error so generated code cannot merge without locators:

```sh
npx eslint "src/**/*.{js,jsx,ts,tsx}" --max-warnings 0
```

## Migrating from `eslint-plugin-react-native-require-testid`

`react-native-testid/testid-missing` is an alias of `require-testid`, so you can swap the plugin and keep your rule name:

```diff
- "react-native-require-testid/testid-missing": "error"
+ "react-native-testid/testid-missing": "error"
```

Existing `enableComponents` / `disableDefaultComponents` options keep working. On top of the missing-`testID` check, this plugin adds a naming convention rule, duplicate detection, suggested `testID`s from labels, configurable component lists and ESLint 9 flat config.

## Compared to other plugins

| | this plugin | `react-native-require-testid` | `react-native-enforce-testid` |
| --- | --- | --- | --- |
| Missing `testID` | ✓ | ✓ | ✓ |
| Empty / `undefined` `testID` | ✓ | – | – |
| Naming convention | ✓ | – | – |
| Duplicate detection | ✓ | – | – |
| Suggested `testID` from label | ✓ | – | – |
| `Animated.View`-style names | ✓ | – | – |
| `{...props}` handling | configurable | – | crashes |
| Custom attribute (`accessibilityIdentifier`) | ✓ | – | – |
| Ready-made `recommended` config (flat + legacy) | ✓ | – | – |
| Runtime dependencies | 0 | 3 (incl. `eslint`, `babel-eslint`) | 3 |

## Why a lint rule and not a test?

Tests find a missing `testID` only after a locator fails, often in CI and often on one platform only. A lint rule finds it in the editor, in the same pull request that introduced the component, and makes "testable by default" part of the team's definition of done.

## License

MIT © Maryia Dolia
