// src/infrastructure/conversion/task/tree/TaskKeyMatcher.ts

import { TaskEntryMapper } from "../../../../application/planning/services/TaskEntryMapper";
import { ParsedTaskNode } from "../../../../domain/task/dto/ParsedTaskNode";
import { TaskEntry } from "../../../../domain/task/TaskEntry";
import { TaskKeyService } from "./TaskKeyService";

export class TaskKeyMatcher {
  static buildEntries(
    nodes: ParsedTaskNode[],
    taskKeyMap: Record<string, string>, // taskKey -> GoogleTaskId
  ): TaskEntry[] {
    const entries = TaskEntryMapper.createAll(nodes);

    // taskKey -> entry
    const keyMap = new Map<string, TaskEntry>();

    // ① node と entry を 1 対 1 で紐付け（taskKey を確定）
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const entry = entries[i];

      const key = node.parentTitle
        ? TaskKeyService.buildChildKey(node.parentTitle, node.title)
        : TaskKeyService.buildRootKey(node.title);

      keyMap.set(key, entry);
    }

    // ② id 確定（未登録は taskKey を仮IDとして採用）
    for (const [key, entry] of keyMap.entries()) {
      entry.id = taskKeyMap[key] ?? key; // ✅ null にしない
    }

    // ③ parentId / parentKey 確定（親が未登録でも接続できる）
    for (const node of nodes) {
      if (!node.parentTitle) continue;

      const childKey = TaskKeyService.buildChildKey(
        node.parentTitle,
        node.title,
      );
      const parentKey = TaskKeyService.buildRootKey(node.parentTitle);

      const entry = keyMap.get(childKey);
      const parent = keyMap.get(parentKey);

      if (!entry) continue;

      // 親は ② で id が必ず埋まっている（Google ID or taskKey）
      entry.parentId = parent?.id ?? parentKey; // ✅ 保険（通常 parent は存在する想定）
      entry.parentKey = parentKey; // ✅ 親タイトルではなく taskKey を保存
    }

    return entries;
  }
}
