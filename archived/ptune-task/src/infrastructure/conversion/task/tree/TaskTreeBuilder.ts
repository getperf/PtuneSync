import { TaskEntry } from "../../../../domain/task/TaskEntry";

export interface TaskTreeNode {
  entry: TaskEntry;
  children: TaskTreeNode[];
}

export class TaskTreeBuilder {
  static build(entries: TaskEntry[]): TaskTreeNode[] {
    const nodeMap = new Map<string, TaskTreeNode>();

    // ① 全ノード生成
    for (const entry of entries) {
      if (!entry.id) {
        throw new Error(`Invalid entry: empty id for title=${entry.title}`);
      }
      nodeMap.set(entry.id, {
        entry,
        children: [],
      });
    }

    const roots: TaskTreeNode[] = [];

    // ② 親子接続（JSON順を保持）
    for (const entry of entries) {
      const node = nodeMap.get(entry.id)!;

      if (!entry.parentId) {
        roots.push(node);
        continue;
      }

      const parent = nodeMap.get(entry.parentId);
      if (!parent) {
        throw new Error(`Parent not found: ${entry.parentId}`);
      }

      parent.children.push(node);
    }

    return roots;
  }
}
