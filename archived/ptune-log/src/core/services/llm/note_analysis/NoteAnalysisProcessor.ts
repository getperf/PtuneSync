// File: src/core/services/llm/note_analysis/NoteAnalysisProcessor.ts
import { App, TFile } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';
import { NoteSummary } from 'src/core/models/notes/NoteSummary';
import { TagAliases } from 'src/core/models/tags/TagAliases';
import { NoteFrontmatterParser } from 'src/core/utils/frontmatter/NoteFrontmatterParser';
import { FrontmatterWriter } from 'src/core/utils/frontmatter/FrontmatterWriter';
import { NoteSummaryFactory } from 'src/core/models/notes/NoteSummaryFactory';

import { NoteLLMAnalyzer } from './NoteLLMAnalyzer';
import { TagNormalizationService } from 'src/core/services/tags/TagNormalizationService';

export class NoteAnalysisProcessor {
  private readonly writer: FrontmatterWriter;

  constructor(
    private readonly app: App,
    private readonly analyzer: NoteLLMAnalyzer,
    private readonly normalizer: TagNormalizationService,
  ) {
    this.writer = new FrontmatterWriter(app.vault);
  }

  /**
   * --- process（副作用あり）
   * frontmatter を更新する
   */
  async process(
    file: TFile,
    prompt: string,
    aliases: TagAliases,
    force = false,
  ): Promise<NoteSummary> {
    logger.debug(`[NoteAnalysisProcessor.process] start file=${file.path}`);

    const currentFm = await NoteFrontmatterParser.parseFromFile(this.app, file);

    // スキップ判定
    if (!force && NoteFrontmatterParser.isLLMTagGenerated(currentFm)) {
      logger.info(
        `[NoteAnalysisProcessor] skip (already generated): ${file.path}`,
      );
      return NoteSummaryFactory.createFromMergedFrontmatter(
        this.app,
        file,
        currentFm,
        currentFm.tags ?? [],
        [],
      );
    }

    const content = await this.app.vault.read(file);

    // LLM 解析
    const analysis = await this.analyzer.analyze(content, prompt);

    // タグ正規化
    const { normalized, newTags } = this.normalizer.normalize(
      analysis.tags,
      aliases,
    );

    // 更新データ
    const newData = {
      summary: analysis.summary ?? currentFm.summary ?? '(要約なし)',
      tags: normalized,
    };

    // frontmatter 更新
    await this.writer.update(file, newData);

    const merged = { ...currentFm, ...newData };

    return NoteSummaryFactory.createFromMergedFrontmatter(
      this.app,
      file,
      merged,
      normalized,
      newTags,
    );
  }
}
