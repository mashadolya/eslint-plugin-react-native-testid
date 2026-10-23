"use strict";

const { getElementName, findAttribute, getStaticValue, docsUrl } = require("../utils");

// lower-kebab segments, optionally grouped with dots: "login.submit-button", "cart-item"
const DEFAULT_PATTERN = "^[a-z0-9]+(?:-[a-z0-9]+)*(?:\\.[a-z0-9]+(?:-[a-z0-9]+)*)*$";

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce a consistent naming convention for testID values",
      recommended: true,
      url: docsUrl("testid-format"),
    },
    schema: [
      {
        type: "object",
        properties: {
          pattern: { type: "string" },
          attribute: { type: "string" },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      format: '{{attribute}} "{{value}}" on <{{name}}> does not match the convention {{pattern}}.',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const attribute = options.attribute || "testID";
    const pattern = options.pattern || DEFAULT_PATTERN;
    const regex = new RegExp(pattern);

    return {
      JSXOpeningElement(node) {
        const attr = findAttribute(node, attribute);
        const value = getStaticValue(attr);
        if (value === null || value === "") return; // dynamic or empty (handled by require-testid)
        if (!regex.test(value)) {
          context.report({
            node: attr,
            messageId: "format",
            data: { attribute, value, name: getElementName(node.name), pattern },
          });
        }
      },
    };
  },
};

module.exports.DEFAULT_PATTERN = DEFAULT_PATTERN;
