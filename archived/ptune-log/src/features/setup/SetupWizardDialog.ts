import { Plugin, App, Modal, Notice, Setting } from 'obsidian';
import type { InitialSetupManager } from './InitialSetupManager';
import { NoteSetupHelper } from './NoteSetupHelper';
import { PluginUtils } from 'src/core/utils/common/PluginUtils';

export class SetupWizardDialog extends Modal {
  app: App;

  constructor(
    private plugin: Plugin,
    private checker: InitialSetupManager,
    private noteHelper: NoteSetupHelper
  ) {
    super(plugin.app);
    this.app = plugin.app;
  }

  onOpen() {
    void this.render();
  }

  private async render(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();
    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText('更新')
        .setTooltip('現在のインストール状況を再確認します')
        .onClick(() => {
          void this.render(); // 自分自身を再描画
        })
    );
    this.renderNoteInitializationSection(contentEl);
    this.renderCorePluginsSection(contentEl);
    this.renderCustomPluginsSection(contentEl);
    await this.renderMinimalThemeSection(contentEl);
    await this.renderDailyNoteSection(contentEl);
    await this.renderWebClipperSection(contentEl);
    await this.renderPtuneSyncSection(contentEl);
  }

  private renderNoteInitializationSection(container: HTMLElement): void {
    container.createEl('h2', { text: '① ノート環境の初期化' });

    // 説明文
    container.createEl('p', {
      text: 'ノート用のディレクトリやテンプレートファイルを自動作成します（_project や _templates/note 等）',
    });

    // ボタン行
    const btnRow = container.createDiv({ cls: 'note-init-actions' });

    const initBtn = btnRow.createEl('button', { text: '初期化を実行' });
    initBtn.setAttr(
      'title',
      'ノート関連のディレクトリとテンプレートを作成します'
    );
    initBtn.addEventListener('click', () => {
      void (async () => {
        await this.noteHelper.ensureResources({ force: true });
        new Notice('ノート関連のディレクトリとテンプレートを初期化しました');
      })();
    });
  }

  private renderCorePluginsSection(container: HTMLElement): void {
    const corePlugins = this.checker.getInvalidCorePlugins();

    container.createEl('h2', { text: '② コアプラグインの有効化' });

    if (corePlugins.length === 0) {
      container.createEl('p', {
        text: 'すべてのコアプラグインが有効になっています。',
      });
      return;
    }

    // 🔽 手順の説明を最初にまとめて表示
    container.createEl('p', {
      text: `以下のコアプラグインが無効です。設定 → コアプラグイン を開き、該当のプラグインを有効にしてください。`,
    });

    // 🔽 無効なプラグイン一覧をリスト表示
    const ul = container.createEl('ul');
    corePlugins.forEach((plugin) => {
      ul.createEl('li', { text: plugin.name });
    });

    // 🔽 手順の補足（Optional）
    container.createEl('p', {
      text: `※「設定」は Obsidian 左下の歯車アイコンから開けます。`,
    });
  }

  private renderCustomPluginsSection(container: HTMLElement): void {
    const invalid = this.checker.getInvalidPlugins().filter((p) => !p.isCore);

    const toEnable = invalid.filter((p) => !p.mustBeDisabled);
    const toDisable = invalid.filter((p) => p.mustBeDisabled);

    container.createEl('h2', {
      text: '③ カスタムプラグインの状態確認',
    });

    if (invalid.length === 0) {
      container.createEl('p', {
        text: 'すべてのカスタムプラグインが正しく構成されています。',
      });
      return;
    }

    // --- 有効化が必要 ---
    if (toEnable.length > 0) {
      container.createEl('p', {
        text: '以下のカスタムプラグインが未インストールまたは無効です。有効化してください。',
      });

      toEnable.forEach((plugin) => {
        new Setting(container)
          .setName(plugin.name)
          .setDesc(`ID: ${plugin.id}`)
          .addExtraButton((button) =>
            button
              .setTooltip('公式ページを開く')
              .setIcon('link')
              .onClick(() => {
                const url = PluginUtils.getPluginUrl(plugin);
                window.open(url, '_blank');
              })
          );
      });
    }

    // --- 無効化が必要 ---
    if (toDisable.length > 0) {
      container.createEl('p', {
        text: '以下のカスタムプラグインは競合するため、無効化してください。',
      });

      toDisable.forEach((plugin) => {
        new Setting(container)
          .setName(plugin.name)
          .setDesc(`ID: ${plugin.id} （無効化が必要）`);
        // 無効化なので ExtraButton は不要
      });
    }

    // --- 共通の補足 ---
    container.createEl('p', {
      text: '※ Obsidian の設定 → コミュニティプラグイン から有効化・無効化を変更できます。',
    });
  }

  private async renderMinimalThemeSection(
    container: HTMLElement
  ): Promise<void> {
    const theme = await this.checker.getMissingTheme?.(); // 例: "Minimal"
    container.createEl('h2', { text: '④ テーマのセットアップ' });

    if (!theme) {
      container.createEl('p', {
        text: 'すでにテーマが適切に設定されています。',
      });
      return;
    }

    container.createEl('p', {
      text: `${theme} テーマが現在有効になっていません。以下の手順で手動で設定してください：`,
    });

    const ol = container.createEl('ol');
    ol.createEl('li', {
      text: 'Obsidian の画面左下にある「設定（歯車）」をクリック',
    });
    ol.createEl('li', {
      text: '「外観」 → 「テーマ」 → 「コミュニティテーマ」を選択',
    });
    ol.createEl('li', {
      text: `右上の検索ボックスに「${theme}」と入力し、表示されたテーマを選択して「インストール → 有効化」`,
    });

    container.createEl('p', {
      text: '設定後、このダイアログを閉じて再確認してください。',
      // style: "margin-top: 0.5em; font-size: 0.85em; opacity: 0.8;",
    });
  }

  private async renderDailyNoteSection(container: HTMLElement): Promise<void> {
    const isConfigured = await this.checker.isDailyNoteConfigured?.();

    container.createEl('h2', { text: '⑤ デイリーノートの設定' });

    if (isConfigured) {
      container.createEl('p', {
        text: 'デイリーノートの設定ファイルが検出されました。',
      });
      return;
    }

    container.createEl('p', {
      text: 'デイリーノートの設定が未構成のようです。以下の手順で手動設定を行ってください：',
    });

    const ol = container.createEl('ol');
    ol.createEl('li', { text: 'Obsidian の左下の「設定（歯車）」をクリック' });
    ol.createEl('li', {
      text: '「コアプラグイン」→「デイリーノート」を有効化',
    });
    ol.createEl('li', { text: '「デイリーノート」設定で以下を指定：' });

    // 表形式（table代替として description list）
    const dl = container.createEl('dl');
    dl.createEl('dt', { text: '新規ファイルの保存先' });
    dl.createEl('dd', { text: '_journal/' });
    dl.createEl('dt', { text: 'テンプレートのファイル' });
    dl.createEl('dd', { text: '_templates/note/daily_note.md' });

    container.createEl('p', {
      text: '※ ディレクトリやテンプレートファイルが存在しない場合は手動で作成してください。',
      cls: 'setting-item-description',
    });
  }

  private async renderWebClipperSection(container: HTMLElement): Promise<void> {
    container.createEl('h2', { text: '⑥ Web Clipper の確認' });

    const hasClippings = await this.app.vault.adapter.exists('Clippings/');
    const installed = hasClippings;

    if (installed) {
      container.createEl('p', {
        text: 'Clippings フォルダが検出されました。Web Clipper が導入済みとして扱われます。',
      });
    } else {
      container.createEl('p', {
        text: 'Clippings フォルダが見つかりません。Web Clipper が未導入、またはまだ利用されていない可能性があります。',
      });
      container.createEl('p', {
        text: '※ Web Clipper をインストールし、実際に1回以上クリップを実行すると Clippings フォルダが作成されます。',
        cls: 'setting-item-description',
      });
      container
        .createEl('a', {
          href: 'https://obsidian.md/clipper',
          text: 'Web Clipper インストールページを開く',
        })
        .setAttr('target', '_blank');
    }
  }

  // src/providers/InitialSetupModal.ts
  private async renderPtuneSyncSection(container: HTMLElement): Promise<void> {
    container.createEl('h2', {
      text: '⑦ PtuneSync (Windows認証アプリ) の確認',
    });

    const { available, verified } = await this.checker.checkPtuneSync();

    // 共通メッセージ
    container.createEl('p', {
      text: '※ この設定は Windows 環境のみ有効で、必須ではありません。',
    });

    if (!available) {
      container.createEl('p', {
        text: '現在の環境は Windows ではないため、この項目はスキップされます。',
      });
      return;
    }

    if (verified) {
      // ✅ success: 動作確認済み
      container.createEl('p', { text: 'PtuneSync の動作を確認しました。' });
      return;
    }

    // ❌ 未確認または未インストール
    container.createEl('p', {
      text: '利用には「PtuneSync Windows 認証アプリ」のインストールが必要です。',
    });

    container
      .createEl('a', {
        href: 'https://apps.microsoft.com/detail/9P9HQS78NVLZ',
        text: 'Microsoft ストアの PtuneSync を開く',
      })
      .setAttr('target', '_blank');

    container.createEl('p', {
      text: 'インストール後、Obsidian コマンド「Google Tasks: 認証をやり直す」を実行して動作を確認してください。',
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}
