import { TaskTreeNode } from "./TaskTreeBuilder";
import { TaskKeyService } from "./TaskKeyService";
import { TaskKeys } from "../../../../domain/task/TaskKeys";

function isGoogleId(id: string): boolean {
  // Google Tasks ID は英数字・ハイフン・アンダースコアのみで構成され、
  // 20文字以上であれば本番IDとみなす。仮IDは短かったり規則に合わない。
  // 正規表現でチェックして判定を厳密にする。
  const pattern = /^[A-Za-z0-9\-_]{20,}$/;
  return pattern.test(id);
}

export class TaskKeyBuilder {
  static build(roots: TaskTreeNode[]): TaskKeys {
    const keys: TaskKeys = {};

    for (const root of roots) {
      const parentKey = TaskKeyService.buildRootKey(root.entry.title);

      if (isGoogleId(root.entry.id)) {
        keys[parentKey] = root.entry.id;
      }

      for (const child of root.children) {
        const childKey = TaskKeyService.buildChildKey(
          root.entry.title,
          child.entry.title,
        );

        if (isGoogleId(child.entry.id)) {
          keys[childKey] = child.entry.id;
        }
      }
    }

    return keys;
  }
}
