// File: src/core/services/llm/note_analysis/NoteAnalysisPromptService.ts
import { App } from 'obsidian';
import { TagKindRegistry } from 'src/core/models/tags/TagKindRegistry';
import { TagYamlIO } from 'src/core/services/yaml/TagYamlIO';
import { TagRankCalculator } from 'src/core/services/tags/TagRankCalculator';
import { PromptTemplateService } from 'src/core/services/llm/client/PromptTemplateService';
import { NoteAnalysisPromptBuilder } from './NoteAnalysisPromptBuilder';

/**
 * NoteAnalysisPromptService（static utility）
 *
 * 役割:
 * - ノート分析（タグ/要約）用の prompt を生成する
 *
 * 設計方針:
 * - DI は行わない（Obsidian プラグインの制約・可読性優先）
 * - 状態を持たない（キャッシュなし）
 * - UI 表示前での await を避け、UseCase / onConfirm から呼ぶ前提
 *
 * 注意:
 * - 例外は呼び出し元へ送出（UI 側で try/catch 推奨）
 * - 将来キャッシュや用途増加が必要になったらインスタンス化を検討
 */
export class NoteAnalysisPromptService {
  /**
   * ノート分析用 prompt を生成
   * - タグランクをロードしてテンプレートに埋め込む
   */
  static async build(app: App): Promise<string> {
    console.debug('[PromptService] build: start');

    console.debug('[PromptService] get TagKindRegistry');
    const registry = TagKindRegistry.getInstance(app.vault);

    console.debug('[PromptService] create TagYamlIO');
    const tagYamlIO = new TagYamlIO();

    console.debug('[PromptService] create TagRankCalculator');
    const calculator = new TagRankCalculator(registry, tagYamlIO);

    console.debug('[PromptService] calculateTop: start');
    const tagRanks = await calculator.calculateTop(app.vault);
    console.debug('[PromptService] calculateTop: done', tagRanks.length);

    console.debug('[PromptService] create PromptTemplateService');
    const templateService = new PromptTemplateService(app.vault);

    console.debug('[PromptService] build prompt');
    const builder = new NoteAnalysisPromptBuilder(templateService);
    const prompt = await builder.build({ topTags: tagRanks });

    console.debug('[PromptService] build: done');
    return prompt;
  }

}
