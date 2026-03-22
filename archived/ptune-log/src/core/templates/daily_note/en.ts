// src/core/templates/daily_note/en.ts

import { HeadingBuilder } from 'src/core/utils/daily_note/HeadingBuilder';

export function buildDailyNoteTemplateEn(): string {
  return `---
tags:
  - journal
---

${HeadingBuilder.create('task.planned')}

<!--
Write today’s tasks here.
After that, export them to the ptune mobile app via Google Tasks.
-->

- [ ] Morning medicine
- [ ] Evening swimming

---

${HeadingBuilder.create('task.timelog')}

---

${HeadingBuilder.create('note.review.memo')}

-
`;
}
