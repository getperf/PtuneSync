// src/core/services/daily_notes/parse/HeadingSpecResolver.ts
import { HeadingSpecRegistry } from 'src/core/models/daily_notes/specs/HeadingSpecRegistry';
import { HeadingNormalizer } from './HeadingNormalizer';
import { HeadingSpec } from 'src/core/models/daily_notes/specs/HeadingSpec';

export class HeadingSpecResolver {
  static resolve(line: string): {
    spec?: HeadingSpec;
    level: number;
    suffix?: string;
  } {
    line = line.replace(/\r$/, '');
    const m = line.match(/^(#+)\s*(.+)$/);
    if (!m) return { level: 0 };

    const level = m[1].length;
    const raw = m[2];
    const normalizedRaw = HeadingNormalizer.normalize(raw);

    for (const { spec, label } of HeadingSpecRegistry.sectionLabels()) {
      if (spec.level !== level) continue;

      const normalizedLabel = HeadingNormalizer.normalize(label);
      if (!normalizedRaw.startsWith(normalizedLabel)) continue;

      // ★ 正規化ベースで suffix を取得（位置ずれしない）
      const suffix = raw
        .slice(raw.length - normalizedRaw.slice(normalizedLabel.length).length)
        .trimEnd();

      return {
        spec,
        level,
        suffix: suffix.length > 0 ? suffix : undefined,
      };
    }

    return { level };
  }
}
