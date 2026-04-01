// src/core/utils/daily_note/HeadingBuilder.ts
import { HeadingSpecRegistry } from 'src/core/models/daily_notes/specs/HeadingSpecRegistry';
import { DailyNoteLabelKey } from 'src/core/models/daily_notes/SectionKey';

/**
 * HeadingBuilder
 * - HeadingSpec + i18n から Markdown 見出しを生成
 */
export class HeadingBuilder {
  static create(key: DailyNoteLabelKey, opts?: { suffix?: string }): string {
    const { spec, label } = HeadingSpecRegistry.resolve(key);

    const prefix = '#'.repeat(spec.level);
    const emoji = spec.emoji ? `${spec.emoji} ` : '';
    const suffix = opts?.suffix ?? '';

    return `${prefix} ${emoji}${label}${suffix}`;
  }
}
