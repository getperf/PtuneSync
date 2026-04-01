// File: src/core/services/llm/note_analysis/NoteAnalysisPreviewService.ts
import { App, TFile } from 'obsidian';
import { NoteSummary } from 'src/core/models/notes/NoteSummary';
import { NoteFrontmatterParser } from 'src/core/utils/frontmatter/NoteFrontmatterParser';
import { TagAliases } from 'src/core/models/tags/TagAliases';
import { NoteSummaryFactory } from 'src/core/models/notes/NoteSummaryFactory';

import { NoteLLMAnalyzer } from './NoteLLMAnalyzer';
import { TagNormalizationService } from 'src/core/services/tags/TagNormalizationService';

export class NoteAnalysisPreviewService {
  constructor(
    private readonly app: App,
    private readonly analyzer: NoteLLMAnalyzer,
    private readonly normalizer: TagNormalizationService
  ) { }

  async preview(
    file: TFile,
    prompt: string,
    aliases: TagAliases
  ): Promise<NoteSummary> {
    // 既存 frontmatter
    const currentFm = await NoteFrontmatterParser.parseFromFile(this.app, file);
    const content = await this.app.vault.read(file);

    // LLM 解析
    const analysis = await this.analyzer.analyze(content, prompt);

    // タグ正規化
    const { normalized, newTags } = this.normalizer.normalize(analysis.tags, aliases)

    // summary 決定（preview 用）
    const summary = this.resolveSummary(analysis.summary, currentFm.summary);

    const merged = {
      ...currentFm,
      summary,
      tags: normalized,
    };

    return NoteSummaryFactory.createFromMergedFrontmatter(
      this.app,
      file,
      merged,
      normalized,
      newTags
    );
  }

  private resolveSummary(
    analysisSummary: unknown,
    currentSummary: unknown
  ): string {
    if (typeof analysisSummary === 'string') return analysisSummary;
    if (typeof currentSummary === 'string') return currentSummary;
    return '(要約なし)';
  }

}
