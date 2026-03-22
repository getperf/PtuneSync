import { TFile } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';
import {
  NoteSummaryMarkdownBuilder,
  SummaryRenderOptions,
} from 'src/core/services/notes/NoteSummaryMarkdownBuilder';

/**
 * --- NoteSummary
 * 単一ノートの解析結果を保持するモデル。
 */
export class NoteSummary {
  constructor(
    public readonly notePath: string,
    public readonly summary: string,
    public readonly tags: string[],
    public readonly unregisteredTags: string[],
    public readonly createdAt: Date,
    public readonly dailynote?: string,
    public readonly taskKey?: string,
    public noteFolder: string = 'ルート',
    public readonly updatedAt?: Date,
    public readonly file?: TFile,
    public readonly goal?: string,
  ) {}

  /** --- ノートタイトル解決 */
  getNoteTitle(opts: { stripNumericPrefix?: boolean } = {}): string {
    const raw = this.deriveFileName();
    return opts.stripNumericPrefix ? stripNumericPrefix(raw) : raw;
  }

  private deriveFileName(): string {
    return this.notePath.split('/').pop()!.replace(/\.md$/, '');
  }

  /** --- Markdown 要約生成 */
  toMarkdownSummary(options: SummaryRenderOptions = {}): string {
    return NoteSummaryMarkdownBuilder.render(this, options);
  }

  /** --- fromFileData */
  static fromFileData(
    file: TFile,
    data: {
      summary?: string;
      tags?: string[];
      unregisteredTags?: string[];
      createdAt?: Date;
      dailynote?: string;
      taskKey?: string;
      goal?: string;
    },
  ): NoteSummary {
    const summary = data.summary ?? '(要約なし)';
    const tags = data.tags ?? [];
    const unregisteredTags = data.unregisteredTags ?? [];
    const updatedAt = new Date(file.stat.mtime);

    logger.debug(
      `[NoteSummary.fromFileData] created ${file.path}, tags=${tags.length}`,
    );

    return new NoteSummary(
      file.path,
      summary,
      tags,
      unregisteredTags,
      data.createdAt ?? new Date(),
      data.dailynote,
      data.taskKey,
      'ルート',
      updatedAt,
      file,
      data.goal,
    );
  }
}

/** --- 数値プレフィックス除去ユーティリティ */
function stripNumericPrefix(text: string): string {
  return text.replace(/^\d+_?/, '');
}
