export interface RawTaskV2 {
  id: string;
  title: string;
  parent: string | null;
  pomodoro_planned: number | null;
  pomodoro_actual: number | null;
  review_flags: string[];
  started: string | null;
  completed: string | null;
  status: string;
  tags: string[];
  goal: string | null;
}
