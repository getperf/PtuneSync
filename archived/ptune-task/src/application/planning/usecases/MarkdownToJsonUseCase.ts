// src/application/planning/usecases/MarkdownToJsonUseCase.ts

import { FrontmatterParser } from "md-ast-core";
import type { TaskKeys } from "../../../domain/task/TaskKeys";

import {
  MarkdownTaskListParser,
  TaskKeyMatcher,
  TaskDeletionDetector,
  TaskKeyDuplicateChecker,
  EntriesToJson,
} from "../../../infrastructure/conversion/task";

export class MarkdownToJsonUseCase {
  static execute(markdown: string): string {
    const { frontmatter, body } = FrontmatterParser.parse(markdown);

    const taskKeys = (frontmatter?.data?.taskKeys as TaskKeys) ?? {};

    const nodes = MarkdownTaskListParser.parse(body);

    TaskKeyDuplicateChecker.validate(nodes);

    const entries = TaskKeyMatcher.buildEntries(nodes, taskKeys);

    const deletedTasks = TaskDeletionDetector.detect(nodes, taskKeys);
    return EntriesToJson.build(entries, deletedTasks);
  }

}
