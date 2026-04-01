// src/task-io/builders/TaskKeyService.ts

/**
 * taskKey生成専用サービス
 * - 正規化ルールを一元管理
 * - "__" 区切りもここに集約
 */
export class TaskKeyService {
  private static readonly DELIMITER = "__";

  static normalize(title: string): string {
    return title.trim();
  }

  static parseCompositeKey(key: string): {
    parentTitle: string | null;
    title: string;
  } {
    const parts = key.split(this.DELIMITER);

    if (parts.length === 1) {
      return { parentTitle: null, title: parts[0]! };
    }

    return {
      parentTitle: parts[0]!,
      title: parts[1]!,
    };
  }

  static buildRootKey(title: string): string {
    return this.normalize(title);
  }

  static buildChildKey(
    parentTitle: string,
    childTitle: string,
  ): string {
    return (
      this.normalize(parentTitle) +
      this.DELIMITER +
      this.normalize(childTitle)
    );
  }
}
