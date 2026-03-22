export interface ExportTask {
  title: string;
  fullTitle: string; // 表示・階層管理用（例: "親/子"）
  taskKey: string; // ファイル名安全なキー（例: "親_子"）
  parentTitle?: string;
  children?: ExportTask[];
  rawLine?: string;
}
