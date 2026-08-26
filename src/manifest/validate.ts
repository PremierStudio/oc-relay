export type UnknownRecord = Record<string, unknown>;

export function isObject(value: unknown): value is UnknownRecord {
  if (Array.isArray(value)) {
    return false;
  }
  if (value === null) {
    return false;
  }
  return typeof value === "object";
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function isRecordOfStrings(value: unknown): value is Record<string, string> {
  if (!isObject(value)) {
    return false;
  }
  return Object.values(value).every((item) => typeof item === "string");
}

export function isPort(value: unknown): value is number {
  // Number.isInteger rejects every non-number, so the cast is type-level only.
  const n = value as number;
  return Number.isInteger(n) && n >= 1 && n <= 65535;
}
