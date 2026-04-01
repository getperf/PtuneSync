import { App, normalizePath, Notice, TFile, TFolder } from 'obsidian';
import { PromptTemplate } from './index';
import { SelectPromptTemplateModal } from 'src/features/llm_settings/ui/SelectPromptTemplateModal';

export class PromptTemplateManager {
  private readonly folderPath = '_templates/llm';
  private readonly userPath = `${this.folderPath}/tag_generate.md`;
  private readonly systemPath = `${this.folderPath}/system/tag_generate_system.md`;

  constructor(private app: App) {}

  async initializeTemplate(): Promise<void> {
    const vault = this.app.vault;

    // フォルダが無ければ作成
    const folder = vault.getAbstractFileByPath(normalizePath(this.folderPath));
    if (!(folder instanceof TFolder)) {
      await vault.createFolder(normalizePath(this.folderPath));
    }
    const systemFolder = vault.getAbstractFileByPath(
      normalizePath(`${this.folderPath}/system`)
    );
    if (!(systemFolder instanceof TFolder)) {
      await vault.createFolder(normalizePath(`${this.folderPath}/system`));
    }

    // user テンプレート
    if (!vault.getAbstractFileByPath(normalizePath(this.userPath))) {
      const content = PromptTemplate.getUser('prompt_general') ?? '';
      await vault.create(normalizePath(this.userPath), content);
      new Notice('📝 LLMタグ生成テンプレートを初期化しました');
    }

    // system テンプレート
    if (!vault.getAbstractFileByPath(normalizePath(this.systemPath))) {
      const content = PromptTemplate.getSystem('prompt_general') ?? '';
      await vault.create(normalizePath(this.systemPath), content);
    }
  }

  updateTemplate() {
    const modal = new SelectPromptTemplateModal(this.app, (templateId) => {
      // ハンドラは Promise を返さないようにする
      void (async () => {
        const userContent = PromptTemplate.getUser(templateId);
        const systemContent = PromptTemplate.getSystem(templateId);

        if (!userContent || !systemContent) {
          new Notice('❌ テンプレートが見つかりませんでした');
          return;
        }

        const vault = this.app.vault;

        // user 側を更新
        const userFile = vault.getAbstractFileByPath(
          normalizePath(this.userPath)
        );
        if (userFile instanceof TFile) {
          await vault.modify(userFile, userContent);
        } else {
          await vault.create(normalizePath(this.userPath), userContent);
        }

        // system 側を更新
        const systemFile = vault.getAbstractFileByPath(
          normalizePath(this.systemPath)
        );
        if (systemFile instanceof TFile) {
          await vault.modify(systemFile, systemContent);
        } else {
          await vault.create(normalizePath(this.systemPath), systemContent);
        }

        new Notice(`✅ ${templateId} のテンプレートを更新しました`);
      })();
    });

    modal.open();
  }
}
