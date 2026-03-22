// src/core/templates/daily_note/ja.ts
import { HeadingBuilder } from 'src/core/utils/daily_note/HeadingBuilder';

export function buildDailyNoteTemplateJa(): string {
  return `---
tags:
  - 用途/日誌
---

${HeadingBuilder.create('task.planned')}

<!--
作業開始時に1日のタスクリストを記入してください。
記入後、エクスポートコマンドで Google Tasks 経由で ptune スマホアプリと連携します
-->

- [ ] <朝>くすり🚫
- [ ] <夜>プール🚫

---

${HeadingBuilder.create('task.timelog')}

---

${HeadingBuilder.create('note.review.memo')}

-
`;
}
