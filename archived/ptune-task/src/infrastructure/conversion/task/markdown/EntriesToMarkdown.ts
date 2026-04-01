import { TaskTreeNode } from "../tree/TaskTreeBuilder";
import { TaskLineFormatter } from "./TaskLineFormatter";

export class EntriesToMarkdown {
  static renderTaskList(roots: TaskTreeNode[]): string {
    const lines: string[] = [];

    for (const root of roots) {
      this.renderNode(root, 0, lines);
    }

    return lines.join("\n");
  }

  private static renderNode(
    node: TaskTreeNode,
    depth: number,
    lines: string[],
  ): void {
    const indent = "  ".repeat(depth);

    const line = TaskLineFormatter.format(node.entry);

    lines.push(`${indent}- [ ] ${line}`);

    for (const child of node.children) {
      this.renderNode(child, depth + 1, lines);
    }
  }
}
