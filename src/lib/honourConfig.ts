const HONOUR_FLAG_KEYS = new Set([
  "honour",
  "honor",
  "enablehonour",
  "enablehonor",
  "honourenabled",
  "honorenabled",
]);

const normalizeHonourConfigKey = (value: string) =>
  String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const isTruthyHonourValue = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return (
      normalized === "1" ||
      normalized === "true" ||
      normalized === "yes" ||
      normalized === "on"
    );
  }

  return false;
};

export const isHonourEnabledInConfig = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.some((item) => isHonourEnabledInConfig(item));
  }

  if (!value || typeof value !== "object") {
    return false;
  }

  return Object.entries(value as Record<string, unknown>).some(([key, child]) => {
    if (
      HONOUR_FLAG_KEYS.has(normalizeHonourConfigKey(key)) &&
      isTruthyHonourValue(child)
    ) {
      return true;
    }

    return isHonourEnabledInConfig(child);
  });
};
