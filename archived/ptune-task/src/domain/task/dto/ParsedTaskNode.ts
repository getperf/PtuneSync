// domain/planning/dto/ParsedTaskNode.ts

export interface ParsedTaskNode {
  title: string;
  parentTitle: string | null;
  pomodoroPlanned: number | null;
  tags: string[];
  goal: string | null;
}
