// src/core/templates/project_index_template.ts
import { PROJECT_INDEX_BASES_BLOCK } from '../project_index_bases';

export const PROJECT_INDEX_TEMPLATE = `---
created: {{created}}
updated: {{updated}}
---

# 📁 フォルダ概要

このフォルダの共通タグや進捗サマリを記載します。

## 📄 ノート一覧

${PROJECT_INDEX_BASES_BLOCK}
`;
