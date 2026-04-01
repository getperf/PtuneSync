// File: src/features/note_review/services/NoteReviewService.ts

import { App, TFile } from 'obsidian';
import { TagAliases } from 'src/core/models/tags/TagAliases';
import { NoteSummary } from 'src/core/models/notes/NoteSummary';
import { FrontmatterWriter } from 'src/core/utils/frontmatter/FrontmatterWriter';
import { DateUtil } from 'src/core/utils/date/DateUtil';
import { DailyNoteConfig } from 'src/core/utils/daily_note/DailyNoteConfig';
import { logger } from 'src/core/services/logger/loggerInstance';
import {
  EditableNoteSummary,
  EditableNoteSummaryFactory,
  EditableTagItem,
} from '../models/EditableNoteSummary';
import { LLMClient } from 'src/core/services/llm/client/LLMClient';
import { NoteAnalysisPreviewService } from 'src/core/services/llm/note_analysis/NoteAnalysisPreviewService';
import { LLMYamlExtractor } from 'src/core/services/llm/note_analysis/LLMYamlExtractor';
import { NoteLLMAnalyzer } from 'src/core/services/llm/note_analysis/NoteLLMAnalyzer';
import { TagNormalizationService } from 'src/core/services/tags/TagNormalizationService';
import { TagAliasCommitService } from 'src/core/services/tags/TagAliasCommitService';

/**
 * NoteReviewService
 * --------------------------------------------------
 * ノートレビュー機能のドメインサービス。
 *
 * 責務:
 * - LLM解析結果のプレビュー取得
 * - UI編集用モデル（EditableNoteSummary）の生成
 * - タグ編集結果の正規化・反映
 * - frontmatter への保存
 *
 * UI（Modal/Dialog）は本クラスを通してのみ
 * ドメインロジックへアクセスする。
 */
export class NoteReviewService {
  private readonly fmWriter: FrontmatterWriter;
  private readonly previewService: NoteAnalysisPreviewService;
  private readonly tagNormalizer: TagNormalizationService;
  private readonly aliases: TagAliases;

  constructor(
    private readonly app: App,
    client: LLMClient,
  ) {
    const extractor = new LLMYamlExtractor();
    const analyzer = new NoteLLMAnalyzer(client, extractor);

    this.aliases = new TagAliases();
    this.tagNormalizer = new TagNormalizationService();

    this.previewService = new NoteAnalysisPreviewService(
      app,
      analyzer,
      this.tagNormalizer,
    );

    this.fmWriter = new FrontmatterWriter(app.vault);

    logger.debug('[NoteReviewService] initialized');
  }

  /**
   * TagAliases の初期化を保証する
   * - 複数回呼ばれても load は1回のみ
   * - 正規化・既存判定の一貫性を担保
   */
  private async ensureAliasesLoaded(): Promise<void> {
    if ((this.aliases as any)._loaded) {
      logger.debug('[NoteReviewService.ensureAliasesLoaded] already loaded');
      return;
    }

    logger.debug('[NoteReviewService.ensureAliasesLoaded] loading aliases');
    await this.aliases.load(this.app.vault);
    logger.info(`[NoteReviewService.ensureAliasesLoaded] aliases loaded`);
  }

  /**
   * LLM解析結果のプレビューを取得
   * - frontmatter 更新は行わない
   * - TagAliases を用いた正規化を含む
   */
  async getPreview(file: TFile, prompt: string): Promise<NoteSummary> {
    logger.info('[NoteReviewService.getPreview] start', {
      file: file.path,
    });

    await this.ensureAliasesLoaded();

    const result = await this.previewService.preview(
      file,
      prompt,
      this.aliases,
    );

    logger.info('[NoteReviewService.getPreview] done', {
      file: file.path,
      tags: result.tags?.length ?? 0,
      unregistered: result.unregisteredTags?.length ?? 0,
    });

    return result;
  }

  /**
   * UI編集用モデルを生成
   * - NoteSummary → EditableNoteSummary
   * - UI操作に必要な最小情報のみを保持
   */
  createEditable(summary: NoteSummary): EditableNoteSummary {
    logger.debug('[NoteReviewService.createEditable]', {
      summaryLen: summary.summary?.length ?? 0,
      tags: summary.tags?.length ?? 0,
    });

    return EditableNoteSummaryFactory.fromNoteSummary(summary);
  }

  /**
   * タグ編集結果を EditableNoteSummary に反映
   *
   * 処理内容:
   * - 入力文字列の正規化
   * - 既存タグかどうかの判定
   * - tags 配列を再生成（UI再描画トリガー）
   *
   * NOTE:
   * - 破壊的変更は行わない（immutable更新）
   */
  applyEditedTag(
    editable: EditableNoteSummary,
    target: EditableTagItem,
    editedTagName: string,
  ): EditableNoteSummary {
    const trimmed = editedTagName.trim();
    if (!trimmed) {
      logger.debug('[NoteReviewService.applyEditedTag] empty input ignored');
      return editable;
    }

    const { normalized, isNew } = this.tagNormalizer.normalizeSingle(
      trimmed,
      this.aliases,
    );

    logger.debug('[NoteReviewService.applyEditedTag]', {
      input: editedTagName,
      normalized,
      isNew,
    });

    const newTags = editable.tags.map((t) =>
      t === target ? { ...t, name: normalized, isNew } : t,
    );

    return {
      ...editable,
      tags: newTags,
    };
  }

  /**
   * UI編集結果を frontmatter に保存
   *
   * - 無効化されたタグは除外
   * - updateDailyNote=true の場合 dailynote を更新
   * - taskKey が指定されていれば保存
   */
  async saveResult(file: TFile, editable: EditableNoteSummary): Promise<void> {
    logger.info('[NoteReviewService.saveResult] start', {
      file: file.path,
    });

    const enabledTags = editable.tags
      .filter((t) => t.enabled)
      .map((t) => t.name);

    const newData: Record<string, any> = {
      summary: editable.summary,
      tags: enabledTags,
    };

    // --- dailynote 更新 ---
    if (editable.updateDailyNote) {
      const settings = await DailyNoteConfig.getDailyNoteSettingsFromJson(
        this.app.vault,
      );
      const today = DateUtil.formatDate(new Date(), settings.format);
      const folder = settings.folder || '_journal';
      newData['dailynote'] = `[[${folder}/${today}|${today}]]`;

      logger.debug('[NoteReviewService.saveResult] set dailynote', {
        value: newData['dailynote'],
      });
    }

    // --- taskKey 更新 ---
    if (editable.taskKey?.trim()) {
      newData['taskKey'] = editable.taskKey.trim();
      logger.debug('[NoteReviewService.saveResult] set taskKey', {
        value: newData['taskKey'],
      });
    }

    // --- frontmatter 確定 ---
    await this.fmWriter.update(file, newData);

    // --- Alias commit（確定点・最小追加）---
    await this.ensureAliasesLoaded();
    const commitService = new TagAliasCommitService(this.aliases);
    await commitService.commit(enabledTags, this.app.vault);

    logger.info('[NoteReviewService.saveResult] completed', {
      file: file.path,
      tags: enabledTags.length,
    });
  }
}
