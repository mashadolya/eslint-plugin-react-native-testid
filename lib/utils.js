"use strict";

/** Full JSX element name as written: "Pressable", "Animated.View", "ns:Tag". */
function getElementName(nameNode) {
  if (!nameNode) return "";
  switch (nameNode.type) {
    case "JSXIdentifier":
      return nameNode.name;
    case "JSXMemberExpression":
      return `${getElementName(nameNode.object)}.${getElementName(nameNode.property)}`;
    case "JSXNamespacedName":
      return `${nameNode.namespace.name}:${nameNode.name.name}`;
    default:
      return "";
  }
}

/** Finds a JSX attribute by name on an opening element. */
function findAttribute(openingElement, name) {
  return openingElement.attributes.find(
    (attr) => attr.type === "JSXAttribute" && attr.name && attr.name.name === name
  );
}

function hasSpread(openingElement) {
  return openingElement.attributes.some((attr) => attr.type === "JSXSpreadAttribute");
}

/**
 * Returns the static string value of an attribute, or null when the value is dynamic.
 * Handles testID="x", testID={"x"} and testID={`x`} (template without expressions).
 */
function getStaticValue(attr) {
  if (!attr || !attr.value) return null;
  const value = attr.value;
  if (value.type === "Literal" && typeof value.value === "string") return value.value;
  if (value.type === "JSXExpressionContainer") {
    const expr = value.expression;
    if (expr.type === "Literal" && typeof expr.value === "string") return expr.value;
    if (expr.type === "TemplateLiteral" && expr.expressions.length === 0) {
      return expr.quasis[0].value.cooked;
    }
  }
  return null;
}

/** "Log in to account" -> "log-in-to-account" */
function toKebab(text) {
  return text
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
}

/** testID={undefined} / testID={null}: present in the source but renders nothing. */
function isNullishValue(attr) {
  const expr = attr && attr.value && attr.value.type === "JSXExpressionContainer" && attr.value.expression;
  if (!expr) return false;
  return (expr.type === "Literal" && expr.value === null) || (expr.type === "Identifier" && expr.name === "undefined");
}

const REPO_URL = "https://github.com/mashadolya/eslint-plugin-react-native-testid";

function docsUrl(ruleName) {
  return `${REPO_URL}#${ruleName}`;
}

module.exports = { getElementName, findAttribute, hasSpread, getStaticValue, isNullishValue, toKebab, docsUrl };
