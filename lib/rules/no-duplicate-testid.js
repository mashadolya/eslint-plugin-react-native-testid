"use strict";

const { findAttribute, getStaticValue, docsUrl } = require("../utils");

const FUNCTION_TYPES = new Set(["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"]);

/**
 * True when two nodes can never render together: they sit in opposite branches of a
 * ternary or if/else, or in two different `return` statements of the same function.
 */
function areExclusive(ancestorsA, ancestorsB) {
  let i = 0;
  while (i < ancestorsA.length && i < ancestorsB.length && ancestorsA[i] === ancestorsB[i]) i++;
  const common = ancestorsA[i - 1];
  const branchA = ancestorsA[i];
  const branchB = ancestorsB[i];
  if (!common || !branchA || !branchB) return false;

  if (common.type === "ConditionalExpression" || common.type === "IfStatement") {
    const pair = [common.consequent, common.alternate];
    return pair.includes(branchA) && pair.includes(branchB);
  }

  const returnsBeforeFunction = (ancestors) => {
    for (let j = i; j < ancestors.length; j++) {
      if (FUNCTION_TYPES.has(ancestors[j].type)) return false;
      if (ancestors[j].type === "ReturnStatement") return true;
    }
    return false;
  };
  return returnsBeforeFunction(ancestorsA) && returnsBeforeFunction(ancestorsB);
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow the same static testID twice in one file: duplicates make locators match the wrong element",
      recommended: true,
      url: docsUrl("no-duplicate-testid"),
    },
    schema: [
      {
        type: "object",
        properties: { attribute: { type: "string" } },
        additionalProperties: false,
      },
    ],
    messages: {
      duplicate: '{{attribute}} "{{value}}" is already used on line {{line}}.',
    },
  },

  create(context) {
    const attribute = (context.options[0] && context.options[0].attribute) || "testID";
    const sourceCode = context.sourceCode || context.getSourceCode();
    const seen = new Map(); // value -> [{ attr, ancestors }]

    return {
      JSXOpeningElement(node) {
        const attr = findAttribute(node, attribute);
        const value = getStaticValue(attr);
        if (!value) return;

        const ancestors = [...sourceCode.getAncestors(node), node];
        const previous = seen.get(value) || [];
        const clash = previous.find((p) => !areExclusive(p.ancestors, ancestors));
        if (clash) {
          context.report({
            node: attr,
            messageId: "duplicate",
            data: { attribute, value, line: String(clash.attr.loc.start.line) },
          });
          return;
        }
        previous.push({ attr, ancestors });
        seen.set(value, previous);
      },
    };
  },
};
