// src/task-io/builders/TaskKeyDuplicateChecker.ts

import { ParsedTaskNode } from "../../../../domain/task/dto/ParsedTaskNode";
import { TaskKeyService } from "./TaskKeyService";

export class TaskKeyDuplicateChecker {
  static validate(nodes: ParsedTaskNode[]): void {
    const seen = new Set<string>();

    for (const node of nodes) {
      const key = node.parentTitle
        ? TaskKeyService.buildChildKey(node.parentTitle, node.title)
        : TaskKeyService.buildRootKey(node.title);

      if (seen.has(key)) {
        throw new Error(`Duplicate task key detected: ${key}`);
      }

      seen.add(key);
    }
  }
}
