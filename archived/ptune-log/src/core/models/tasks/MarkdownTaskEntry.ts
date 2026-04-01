export interface MarkdownTaskEntry {
  index: number;
  title: string;
  pomodoro: number;
  parent_index?: number;
  rawLine: string;
}
