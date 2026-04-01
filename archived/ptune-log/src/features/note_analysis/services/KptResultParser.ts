import { KptDocument } from '../models/KptDocument';
import { KptNode } from '../models/KptNode';

export class KptResultParser {
  parse(text: string): KptDocument {
    const root: KptDocument = {
      keep: [],
      problem: [],
      try: [],
    };

    // 今回は検証用に Keep 固定
    const target = root.keep;

    // レベルごとの親スタック
    const stack: KptNode[] = [];

    const lines = text
      .split('\n')
      .map((l) => l.replace(/\s+$/, '')) // 右端空白除去
      .filter((l) => l.trim().length > 0);

    for (const line of lines) {
      const level = this.countIndent(line);
      const text = line.trim();

      const node: KptNode = {
        id: crypto.randomUUID(),
        text,
        children: [],
      };

      if (level === 0) {
        target.push(node);
        stack.length = 0;
        stack.push(node);
        continue;
      }

      // 親を level-1 から取得
      const parent = stack[level - 1];
      if (!parent) {
        // 保険：壊れた入力でも落とさない
        target.push(node);
        stack.length = 0;
        stack.push(node);
        continue;
      }

      parent.children.push(node);

      // スタックを詰め直す
      stack.length = level;
      stack.push(node);
    }

    return root;
  }

  /** タブ or 2スペース単位でインデント数を数える */
  private countIndent(line: string): number {
    let count = 0;
    let i = 0;

    while (i < line.length) {
      if (line.startsWith('\t', i)) {
        count++;
        i += 1;
      } else if (line.startsWith('  ', i)) {
        count++;
        i += 2;
      } else {
        break;
      }
    }
    return count;
  }
}
