import { ReviewTaskTree } from "../models/ReviewTaskTree";

export class UnfinishedTasksBuilder {
  build(tree: ReviewTaskTree): string {
    const unfinished = tree.unfinishedNodes();

    if (unfinished.length === 0) {
      return `- (unfinished: none)`;
    }

    // ここでは「フラット」出力（必要なら親子表現を追加）
    return unfinished
      .map((t) => `- ⏳ ${t.title}`)
      .join("\n")
      .trim();
  }
}
