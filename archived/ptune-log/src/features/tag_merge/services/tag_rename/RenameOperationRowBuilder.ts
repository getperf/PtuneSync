// src/features/tag_merge/services/tag_rename/RenameOperationRowBuilder.ts

import { App } from 'obsidian';
import { RenameCandidateRow } from './models/RenameCandidateRow';
import { RenameOperationRow } from './models/RenameOperationRow';
import { DebugViewModal } from '../../ui/utils/DebugViewModal';

type BuildOptions = {
  debug?: boolean;
};

export class RenameOperationRowBuilder {
  constructor(private readonly app: App) {}

  build(
    candidates: RenameCandidateRow[],
    opts?: BuildOptions,
  ): RenameOperationRow[] {
    const debug: string[] = [];
    debug.push('# RenameOperationRowBuilder');
    debug.push('');

    // 1) from -> to（最後勝ち）
    const map = new Map<string, string>();
    for (const c of candidates) {
      if (!c.from || c.from === c.to) {
        debug.push(`SKIP invalid: ${c.from} -> ${c.to}`);
        continue;
      }
      map.set(c.from, c.to);
    }

    debug.push('## Initial map');
    for (const [f, t] of map.entries()) debug.push(`- ${f} -> ${t}`);
    debug.push('');

    // 2) 短縮＋循環検出
    const rows: RenameOperationRow[] = [];
    const removed = new Set<string>();

    for (const from of map.keys()) {
      const visited = new Set<string>();
      let current = from;

      debug.push(`### Resolve: ${from}`);

      while (map.has(current)) {
        if (visited.has(current)) {
          debug.push(
            `CYCLE: ${Array.from(visited).join(' -> ')} -> ${current}`,
          );
          removed.add(from);
          break;
        }
        visited.add(current);
        const next = map.get(current)!;
        debug.push(`  ${current} -> ${next}`);
        current = next;
      }

      if (!removed.has(from)) {
        debug.push(`  FINAL: ${from} -> ${current}`);
        rows.push({ from, to: current });
      } else {
        debug.push(`  REMOVED: ${from}`);
      }

      debug.push('');
    }

    // 3) デバッグ表示
    if (opts?.debug) {
      new DebugViewModal(
        this.app,
        'Rename Operation Rows (Chain Compressed)',
        debug.join('\n'),
      ).open();
    }

    return rows;
  }
}
