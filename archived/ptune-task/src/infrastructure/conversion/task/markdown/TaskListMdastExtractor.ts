// src/task-io/transforms/markdown/TaskListMdastExtractor.ts

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { visitParents } from "unist-util-visit-parents";
import type { Root, ListItem, Paragraph, Text, InlineCode } from "mdast";
import type { Parent } from "unist";

export type MdastTaskLine = {
  rawText: string;
  depth: number;
};

export class TaskListMdastExtractor {
  static extract(body: string): MdastTaskLine[] {
    const tree = unified().use(remarkParse).use(remarkGfm).parse(body) as Root;

    const results: MdastTaskLine[] = [];

    visitParents(tree, "listItem", (node, ancestors) => {
      const listItem = node as ListItem;

      // 未完了タスクのみ
      if (listItem.checked !== false) return;

      const depth = ancestors.filter((a: Parent) => a.type === "list").length;

      const rawText = this.extractInlineText(listItem);
      if (!rawText) return;

      results.push({ rawText, depth });
    });

    return results;
  }

  private static extractInlineText(node: ListItem): string {
    const paragraph = node.children.find(
      (c): c is Paragraph => c.type === "paragraph",
    );
    if (!paragraph) return "";

    let text = "";

    for (const child of paragraph.children) {
      if (child.type === "text") {
        text += (child as Text).value;
        continue;
      }
      if (child.type === "inlineCode") {
        text += (child as InlineCode).value;
        continue;
      }
    }

    return text.trim();
  }
}
