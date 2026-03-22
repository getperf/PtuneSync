// core/services/llm/note_analysis/NoteAnalysisPromptBuilder.ts
import { TagRank } from 'src/core/services/tags/TagRankCalculator';
import { PromptTemplateService } from 'src/core/services/llm/client/PromptTemplateService';

export class NoteAnalysisPromptBuilder {
  constructor(
    private readonly templates: PromptTemplateService,
    private readonly systemTemplate = '_templates/llm/system/tag_generate_system.md',
    private readonly userTemplate = '_templates/llm/tag_generate.md'
  ) { }

  async build(params: { topTags: TagRank[] }): Promise<string> {
    const topTagsText = this.formatTopTags(params.topTags);

    return this.templates.mergeSystemAndUser(
      this.systemTemplate,
      this.userTemplate,
      { TOP_TAGS: topTagsText }
    );
  }

  private formatTopTags(ranks: TagRank[]): string {
    if (ranks.length === 0) return '';

    const lines: string[] = [];
    for (const r of ranks) {
      lines.push(`### 🏷 ${r.kindLabel}タグ上位`);
      for (const t of r.tags) {
        lines.push(`- ${t.name}`);
      }
      lines.push('');
    }
    return lines.join('\n');
  }
}
