// src/core/models/daily_notes/reviews/specs/HeadingSpecRegistry.ts
import {
  HeadingSpec,
  TASK_HEADING_SPECS,
  NOTE_HEADING_SPECS,
} from './HeadingSpec';
import { DailyNoteLabelKey, SectionKey } from '../SectionKey';
import { i18n } from 'src/i18n';

/**
 * HeadingSpecRegistry
 * - 全 HeadingSpec を一元管理
 * - key → HeadingSpec 解決を担当
 */
export class HeadingSpecRegistry {
  private static readonly registry: Map<DailyNoteLabelKey, HeadingSpec> =
    new Map(
      [...TASK_HEADING_SPECS, ...NOTE_HEADING_SPECS].map((s) => [s.key, s])
    );
  private static labelCache:
    | Map<DailyNoteLabelKey, string>
    | null = null;

  /** 言語切替時に呼ぶ（i18n.init から） */
  static rebuildLabels(): void {
    const map = new Map<DailyNoteLabelKey, string>();
    const t = i18n.domain.daily_note;

    for (const spec of this.registry.values()) {
      const label = t[spec.key];
      if (!label) continue;

      map.set(spec.key, label);
    }
    this.labelCache = map;
  }

  static getSpec(key: DailyNoteLabelKey): HeadingSpec {
    const spec = this.registry.get(key);
    if (!spec) {
      throw new Error(`HeadingSpec not found: ${key}`);
    }
    return spec;
  }

  static getLabel(key: DailyNoteLabelKey): string {
    const label = this.labelCache?.get(key);
    if (!label) {
      throw new Error(`DailyNote label not found: ${key}`);
    }
    return label;
  }

  static resolve(key: DailyNoteLabelKey): {
    spec: HeadingSpec;
    label: string;
  } {
    return {
      spec: this.getSpec(key),
      label: this.getLabel(key),
    };
  }

  /** ✅ section 見出しのみ */
  static sectionSpecs(): Array<HeadingSpec & { key: SectionKey }> {
    return [...this.registry.values()].filter(
      (s) => s.kind === 'section'
    ) as Array<HeadingSpec & { key: SectionKey }>;
  }

  static sectionLabels(): Array<{
    spec: HeadingSpec & { key: SectionKey };
    label: string;
  }> {
    return this.sectionSpecs()
      .map((spec) => {
        const label = this.labelCache?.get(spec.key);
        return label ? { spec, label } : undefined;
      })
      .filter((item): item is { spec: HeadingSpec & { key: SectionKey }; label: string } => !!item);
  }

  static has(key: DailyNoteLabelKey): boolean {
    return this.registry.has(key);
  }

  static all(): HeadingSpec[] {
    return [...this.registry.values()];
  }
}
