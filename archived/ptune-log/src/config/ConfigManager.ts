// File: src/config/ConfigManager.ts

import { Plugin } from 'obsidian';
import { LogLevel } from 'src/core/services/logger/Logger';
import { LLMSettings } from './settings/LLMSettings';
import { PROJECT_NOTE_TEMPLATE } from 'src/core/templates/project_note/project_note_template';
import { SerialNoteCreationType } from 'src/features/note_creator/modals/NoteCreatorModal';
import {
  DEFAULT_REVIEW_SETTINGS,
  ReviewSettings,
} from './settings/ReviewSettings';

/**
 * =========================================
 * ConfigManager
 *
 * - プラグイン全体の永続設定を一元管理する
 * - UI（SettingTab）からは string key でアクセスする
 * - i18n（UI文言）は責務外（設定値のみを扱う）
 *
 * 設計方針:
 * - 設定構造は「後方互換」を最優先
 * - load() 時は deep merge により欠損キーを補完
 * - get/update は Obsidian SettingTab からの利用を想定
 * =========================================
 */

/** ノート番号プレフィックスの種別 */
export enum notePrefixType {
  SERIAL = 'serial',
  DATE = 'date',
}

/** ノート作成関連の設定 */
export interface NoteSettings {
  folderPrefix: notePrefixType;
  notePrefix: notePrefixType;
  prefixDigits: number;
  templateText: string;
}

/** スニペット保存設定 */
export interface SnippetSettings {
  filename: string;
}

/** Google OAuth 認証設定 */
export interface GoogleAuthSettings {
  clientId: string;
  clientSecret: string;
  useWinApp: boolean;
}

/**
 * プラグイン全体の設定スキーマ
 *
 * ⚠ UI 表示文言・言語設定は含めない
 */
export interface PluginSettings {
  logLevel: LogLevel;
  enableLogFile: boolean;
  note: NoteSettings;
  snippet: SnippetSettings;
  llm: LLMSettings;
  google_auth: GoogleAuthSettings;
  review: ReviewSettings;
}

/**
 * デフォルト設定
 *
 * - 新規インストール時
 * - 既存ユーザで設定キーが欠損している場合
 * に使用される基準値
 */
export const DEFAULT_SETTINGS: PluginSettings = {
  logLevel: 'info',
  enableLogFile: false,

  note: {
    folderPrefix: notePrefixType.SERIAL,
    notePrefix: notePrefixType.SERIAL,
    prefixDigits: 2,
    templateText: PROJECT_NOTE_TEMPLATE,
  },

  snippet: {
    filename: 'snippet.md',
  },

  llm: {
    provider: 'OpenAI Chat',
    apiKey: '',
    model: 'gpt-4o-mini',
    embeddingModel: 'text-embedding-3-small',
    baseUrl: 'https://api.openai.com/v1',
    temperature: 0.2,
    maxTokens: 1024,
    minSimilarityScore: 0.5,
    enableChecklist: true,
  },

  google_auth: {
    clientId: '',
    clientSecret: '',
    useWinApp: true,
  },

  review: DEFAULT_REVIEW_SETTINGS,
};

export class ConfigManager {
  private plugin: Plugin;

  /** 現在の設定（常に DEFAULT_SETTINGS を補完済み） */
  settings: PluginSettings;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
    this.settings = DEFAULT_SETTINGS;
  }

  /**
   * 設定ロード
   *
   * - 保存済みデータを読み込む
   * - DEFAULT_SETTINGS と deep merge することで
   *   ・古い設定
   *   ・途中で追加された設定
   *   にも安全に対応する
   */
  async load(): Promise<void> {
    const loaded = await this.plugin.loadData();

    this.settings = {
      ...DEFAULT_SETTINGS,
      ...loaded,

      note: {
        ...DEFAULT_SETTINGS.note,
        ...(loaded?.note ?? {}),
      },

      snippet: {
        ...DEFAULT_SETTINGS.snippet,
        ...(loaded?.snippet ?? {}),
      },

      llm: {
        ...DEFAULT_SETTINGS.llm,
        ...(loaded?.llm ?? {}),
      },

      google_auth: {
        ...DEFAULT_SETTINGS.google_auth,
        ...(loaded?.google_auth ?? {}),
      },

      review: {
        ...DEFAULT_REVIEW_SETTINGS,
        ...(loaded?.review ?? {}),
      },
    };
  }

  /** 設定保存（即時反映） */
  async save(): Promise<void> {
    await this.plugin.saveData(this.settings);
  }

  /**
   * ----------------------------------------
   * 設定取得
   *
   * - "note.prefixDigits" のようなドット区切りキーを使用
   * - SettingTab からの利用を簡潔にするための設計
   * ----------------------------------------
   */
  get<T>(key: string): T {
    const parts = key.split('.');
    let current: unknown = this.settings;

    for (const p of parts) {
      if (typeof current === 'object' && current !== null && p in current) {
        current = (current as Record<string, unknown>)[p];
      } else {
        // キー不在時は undefined を返す（型は呼び出し側で保証）
        return undefined as unknown as T;
      }
    }

    return current as T;
  }

  /**
   * ----------------------------------------
   * 設定更新
   *
   * - ネストしたキーも更新可能
   * - 更新後は必ず save() される
   * ----------------------------------------
   */
  async update<T>(key: string, value: T): Promise<void> {
    const parts = key.split('.');
    let current: unknown = this.settings;

    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];

      if (typeof current === 'object' && current !== null && p in current) {
        current = (current as Record<string, unknown>)[p];
      } else {
        // 存在しない階層は作成する（後方互換用）
        (current as Record<string, unknown>)[p] = {};
        current = (current as Record<string, unknown>)[p];
      }
    }

    const lastKey = parts[parts.length - 1];
    if (typeof current === 'object' && current !== null) {
      (current as Record<string, unknown>)[lastKey] = value;
    }

    await this.save();
  }

  /**
   * ノート作成時の prefix 種別解決
   *
   * - ファイル作成 / フォルダ作成で参照する設定を切り替える
   */
  getPrefixType(creationType: SerialNoteCreationType): notePrefixType {
    switch (creationType) {
      case SerialNoteCreationType.FILE:
        return this.get<notePrefixType>('note.notePrefix');

      case SerialNoteCreationType.FOLDER:
        return this.get<notePrefixType>('note.folderPrefix');

      default:
        return notePrefixType.SERIAL;
    }
  }
}
