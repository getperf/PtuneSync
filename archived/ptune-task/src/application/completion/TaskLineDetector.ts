export const TASK_LINE_REGEX = /^\s*-\s\[( |x)\]\s+/;
export const EMPTY_UNCHECKED_TASK_TEMPLATE_REGEX = /^\s*-\s\[\s\]\s*@@$/;

export function isTaskLine(line: string): boolean {
  return TASK_LINE_REGEX.test(line);
}

export function isEmptyTaskTemplateTriggerLine(line: string): boolean {
  return EMPTY_UNCHECKED_TASK_TEMPLATE_REGEX.test(line);
}

export function getTaskBodyStart(line: string): number | null {
  const match = line.match(/^\s*-\s\[( |x)\]\s+/);

  return match ? match[0].length : null;
}
