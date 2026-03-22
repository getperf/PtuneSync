import { App, FuzzyMatch, FuzzySuggestModal } from 'obsidian';
import { PromptTemplate } from '../../../core/services/prompts';

export class SelectPromptTemplateModal extends FuzzySuggestModal<string> {
  private onSelectCallback: (templateId: string) => void;

  constructor(app: App, onSelect: (templateId: string) => void) {
    super(app);
    this.onSelectCallback = onSelect;
    this.setPlaceholder('テンプレートを選択してください');
  }

  getItems(): string[] {
    return Array.from(PromptTemplate.getTitles().keys());
  }

  getItemText(item: string): string {
    const title = PromptTemplate.getTitles().get(item);
    return title ? `${title}（${item}）` : item;
  }

  renderSuggestion(item: FuzzyMatch<string>, el: HTMLElement): void {
    el.setText(this.getItemText(item.item)); // ← 修正ポイント
    el.createEl('small', {
      text: '⚠️ 選択すると既存のテンプレートが上書きされます',
    });
  }

  onChooseItem(templateId: string, evt: MouseEvent | KeyboardEvent) {
    this.onSelectCallback(templateId);
  }
}
