export function formatRequestError(label: string, error: unknown): string {
  if (!error || typeof error !== "object") {
    return `${label} error`;
  }

  const status = readNumber(error, "status");
  const jsonMessage = readNestedString(error, ["json", "error", "message"]);
  const text = readString(error, "text");
  const message = readString(error, "message");
  const details = jsonMessage ?? text ?? message ?? "request failed";

  return status ? `${label} error: ${status} ${details}` : `${label} error: ${details}`;
}

function readNumber(value: object, key: string): number | null {
  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === "number" ? candidate : null;
}

function readString(value: object, key: string): string | null {
  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === "string" ? candidate : null;
}

function readNestedString(value: object, path: string[]): string | null {
  let current: unknown = value;
  for (const key of path) {
    if (!current || typeof current !== "object") {
      return null;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === "string" ? current : null;
}
