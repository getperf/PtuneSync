// src/task-io/builders/TaskDeletionDetector.ts

import { DeletedTaskEntry } from "../../../../domain/task/DeletedTaskEntry";
import { ParsedTaskNode } from "../../../../domain/task/dto/ParsedTaskNode";
import { TaskKeyService } from "./TaskKeyService";

export class TaskDeletionDetector {
  static detect(
    nodes: ParsedTaskNode[],
    taskKeyMap: Record<string, string>,
  ): DeletedTaskEntry[] {
    if (!taskKeyMap || Object.keys(taskKeyMap).length === 0) {
      return [];
    }

    const currentKeys = new Set<string>();

    // ① 現在Markdownからkey生成
    for (const node of nodes) {
      const key = node.parentTitle
        ? TaskKeyService.buildChildKey(node.parentTitle, node.title)
        : TaskKeyService.buildRootKey(node.title);

      currentKeys.add(key);
    }

    const deleted: DeletedTaskEntry[] = [];

    // ② 差分抽出
    for (const [key, taskId] of Object.entries(taskKeyMap)) {
      if (currentKeys.has(key)) continue;

      const { parentTitle, title } = TaskKeyService.parseCompositeKey(key);

      deleted.push({
        id: taskId,
        compositeKey: key,
        parentTitle,
        title,
      });
    }

    return deleted;
  }
}
