"use strict";

const { getElementName, findAttribute, hasSpread, getStaticValue, isNullishValue, toKebab, docsUrl } = require("../utils");

const DEFAULT_COMPONENTS = [
  "Button",
  "Pressable",
  "TouchableOpacity",
  "TouchableHighlight",
  "TouchableWithoutFeedback",
  "TouchableNativeFeedback",
  "TextInput",
  "Switch",
];

// Props whose text is a good source for a suggested testID.
const LABEL_PROPS = ["accessibilityLabel", "aria-label", "title", "placeholder"];

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    hasSuggestions: true,
    docs: {
      description:
        "Require a testID on interactive React Native components so E2E tests (Appium, Detox, Maestro) can locate them reliably",
      recommended: true,
      url: docsUrl("require-testid"),
    },
    schema: [
      {
        type: "object",
        properties: {
          components: { type: "array", items: { type: "string" }, uniqueItems: true },
          additionalComponents: { type: "array", items: { type: "string" }, uniqueItems: true },
          ignoreSpread: { type: "boolean" },
          attribute: { type: "string" },
          // Option names of eslint-plugin-react-native-require-testid, accepted for drop-in migration
          enableComponents: { type: "array", items: { type: "string" }, uniqueItems: true },
          disableDefaultComponents: { type: "array", items: { type: "string" }, uniqueItems: true },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missing: "<{{name}}> is interactive but has no {{attribute}}. Add one so E2E tests can find it.",
      empty: "<{{name}}> has an empty {{attribute}}.",
      suggest: 'Add {{attribute}}="{{id}}"',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const attribute = options.attribute || "testID";
    const ignoreSpread = options.ignoreSpread !== false;
    const components = new Set([
      ...(options.components || DEFAULT_COMPONENTS),
      ...(options.additionalComponents || []),
      ...(options.enableComponents || []),
    ]);
    for (const name of options.disableDefaultComponents || []) components.delete(name);

    return {
      JSXOpeningElement(node) {
        const name = getElementName(node.name);
        if (!components.has(name)) return;

        const attr = findAttribute(node, attribute);
        if (attr) {
          const value = getStaticValue(attr);
          if ((value !== null && value.trim() === "") || isNullishValue(attr)) {
            context.report({ node: attr, messageId: "empty", data: { name, attribute } });
          }
          return;
        }

        // {...props} may already carry the testID; don't guess.
        if (ignoreSpread && hasSpread(node)) return;

        const suggest = [];
        for (const prop of LABEL_PROPS) {
          const label = getStaticValue(findAttribute(node, prop));
          const id = label && toKebab(label);
          if (id) {
            suggest.push({
              messageId: "suggest",
              data: { attribute, id },
              fix: (fixer) => fixer.insertTextAfter(node.name, ` ${attribute}="${id}"`),
            });
            break;
          }
        }

        context.report({ node, messageId: "missing", data: { name, attribute }, suggest });
      },
    };
  },
};

module.exports.DEFAULT_COMPONENTS = DEFAULT_COMPONENTS;
