export interface GoogleTaskRaw {
  id?: string;
  title?: string;
  note?: string;
  parent?: string;
  position?: string;
  status?: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  updated?: string;
  started?: string;
  deleted?: boolean;

  // プラグイン内で拡張使用（任意）
  pomodoro?: {
    planned?: number;
    actual?: number;
  };
}
