import en from "./en.json";

type NestedRecord = { [key: string]: string | NestedRecord };

const messages: NestedRecord = en;

/**
 * Simple translation helper using dot-notation keys.
 * Supports interpolation: t("key", { name: "Widget" }) replaces {name} in the string.
 * Falls back to the key itself if not found.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const parts = key.split(".");
  let current: string | NestedRecord = messages;

  for (const part of parts) {
    if (typeof current !== "object" || current === null) {
      return key;
    }
    current = (current as NestedRecord)[part];
  }

  if (typeof current !== "string") {
    return key;
  }

  if (!params) {
    return current;
  }

  return current.replace(/\{(\w+)\}/g, (_, name) =>
    params[name] !== undefined ? String(params[name]) : `{${name}}`
  );
}
