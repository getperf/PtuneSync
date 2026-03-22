export function extractResponsesText(json: unknown): string | null {
  if (!json || typeof json !== "object") {
    return null;
  }

  const outputText = (json as { output_text?: unknown }).output_text;
  if (typeof outputText === "string" && outputText.trim().length > 0) {
    return outputText;
  }

  const output = (json as { output?: unknown }).output;
  if (!Array.isArray(output)) {
    return null;
  }

  const texts: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) {
      continue;
    }

    for (const part of content) {
      if (!part || typeof part !== "object") {
        continue;
      }

      const text = (part as { text?: unknown }).text;
      if (typeof text === "string" && text.trim().length > 0) {
        texts.push(text);
      }
    }
  }

  return texts.length > 0 ? texts.join("\n").trim() : null;
}
