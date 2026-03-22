import { Vault, TFile, normalizePath, parseYaml } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';
import { createAndLogError } from 'src/core/utils/errors/errorFactory';

// --- タグ種別の管理とロードを行うクラス
export interface TagKindDefinition {
  id: string; // "classification", "subject", etc.
  label: string; // 表示名: "分類"
  prefix: string; // 判定用: "分類/"
}

export const DEFAULT_KINDS: TagKindDefinition[] = [
  { id: 'classification', label: '分類', prefix: '分類/' },
  { id: 'subject', label: '主題', prefix: '主題/' },
  { id: 'usage', label: '用途', prefix: '用途/' },
  { id: 'unclassified', label: '未分類', prefix: '' },
];

// 設定ファイルの既定パス
export const DEFAULT_CONFIG_PATH = '_tagging/config/tag_kinds.yaml';

export class TagKindRegistry {
  private static instance: TagKindRegistry | null = null;
  private kinds: TagKindDefinition[] = [];
  private loaded = false;

  private constructor(private readonly vault: Vault) { }

  static getInstance(vault?: Vault): TagKindRegistry {
    if (!TagKindRegistry.instance) {
      if (!vault)
        throw createAndLogError('TagKindRegistry requires Vault for first init');
      TagKindRegistry.instance = new TagKindRegistry(vault);
    }
    return TagKindRegistry.instance;
  }

  // --- 設定ファイルを読み込みまたは作成
  async ensure(path: string = DEFAULT_CONFIG_PATH): Promise<void> {
    if (this.loaded) return;
    const fullPath = normalizePath(path);
    const file = this.vault.getAbstractFileByPath(fullPath);

    if (file instanceof TFile) {
      const yaml = await this.vault.read(file);
      const parsed = parseYaml(yaml);
      if (!Array.isArray(parsed))
        throw createAndLogError('タグ種別設定ファイルの形式が不正です');
      this.kinds = parsed as TagKindDefinition[];
      logger.info(`[TagKindRegistry] loaded ${this.kinds.length} kinds`);
    } else {
      const yamlText = DEFAULT_KINDS.map(
        (k) => `- id: ${k.id}\n  label: ${k.label}\n  prefix: ${k.prefix}`
      ).join('\n');
      await this.vault.adapter.write(fullPath, yamlText);
      this.kinds = [...DEFAULT_KINDS];
      logger.info(`[TagKindRegistry] created default kinds config`);
    }

    this.loaded = true;
  }

  // --- 現在ロードされているすべての種別を返す
  getAll(): TagKindDefinition[] {
    return this.kinds;
  }

  // --- プレフィックスに一致する種別を取得
  findByTag(tag: string): TagKindDefinition | null {
    return this.kinds.find((kind) => tag.startsWith(kind.prefix)) ?? null;
  }

  // --- ID一致で種別を取得
  findById(id: string): TagKindDefinition | null {
    return this.kinds.find((kind) => kind.id === id) ?? null;
  }

  // --- ID一覧だけ取得（例: ["classification", "subject", ...]）
  getIdList(): string[] {
    return this.kinds.map((k) => k.id);
  }

  // --- プレフィックスに一致する種別を取得（なければ "unclassified" を返す）
  getKindOrUnclassified(tag: string): TagKindDefinition {
    return (
      this.findByTag(tag) ?? {
        id: 'unclassified',
        label: '未分類',
        prefix: '',
      }
    );
  }
}
