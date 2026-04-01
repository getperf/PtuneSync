// src/application/review/dto/ReviewTaskDto.ts

export interface ReviewTaskDto {
  id: string;
  title: string;

  parent?: string | null;

  status?: string;

  pomodoro_planned?: number;
  pomodoro_actual?: number;

  started?: string;
  completed?: string;

  tags?: string[];

  goal?: string;
  review_flags?: string[];
}