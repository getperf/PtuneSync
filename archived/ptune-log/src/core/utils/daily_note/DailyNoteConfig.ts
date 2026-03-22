import { normalizePath, Vault } from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';
import { VaultUtils } from '../common/VaultUtils';
import { DateUtil } from '../date/DateUtil';
import { createAndLogError } from '../errors/errorFactory';

interface DailyNoteSettings {
  folder: string;
  template: string;
  format: string;
}

/** --- デイリーノート設定管理クラス */
export class DailyNoteConfig {
  /** --- 今日の日付のWikiリンク ([[folder/date|date]]) を返す */
  static async getTodayDailyNoteLink(vault: Vault): Promise<string | null> {
    logger.debug('[DailyNoteConfig.getTodayDailyNoteLink] start');
    const settings = await this.getDailyNoteSettingsFromJson(vault);
    if (!settings) {
      logger.warn('[DailyNoteConfig] 設定が取得できません');
      return null;
    }

    const dateStr = DateUtil.mNow().format(settings.format);
    const link = `[[${settings.folder}/${dateStr}|${dateStr}]]`;

    logger.debug(
      `[DailyNoteConfig] generated today link: folder=${settings.folder}, format=${settings.format}, link=${link}`
    );
    return link;
  }

  /** --- N日前のデイリーノートパスを返す (例: "Daily/2024-06-14.md") */
  static async getDailyNotePath(
    vault: Vault,
    daysAgo = 0
  ): Promise<string | null> {
    const settings = await this.getDailyNoteSettingsFromJson(vault);
    if (!settings) return null;

    const targetMoment = DateUtil.mNow().subtract(daysAgo, 'days');
    const dateStr = targetMoment.format(settings.format);
    const path = normalizePath(`${settings.folder}/${dateStr}.md`);

    logger.debug(`[DailyNoteConfig.getDailyNotePath] ${path}`);
    return path;
  }

  /** --- 指定日付のデイリーノートパスを返す */
  static async getNotePathForDate(
    vault: Vault,
    targetDate: Date
  ): Promise<string | null> {
    const settings = await this.getDailyNoteSettingsFromJson(vault);
    if (!settings) return null;

    const dateStr = DateUtil.m(targetDate).format(settings.format);
    const path = normalizePath(`${settings.folder}/${dateStr}.md`);

    logger.debug(`[DailyNoteConfig.getNotePathForDate] ${path}`);
    return path;
  }

  /** --- `.obsidian/daily-notes.json` から設定を読み取る */
  static async getDailyNoteSettingsFromJson(
    vault: Vault
  ): Promise<DailyNoteSettings> {
    const path = VaultUtils.getConfigPathFromVault(vault, 'daily-notes.json');
    logger.debug(`[DailyNoteConfig] loading settings from ${path}`);

    try {
      const exists = await vault.adapter.exists(path);
      if (!exists) throw createAndLogError('daily-notes.json does not exist');

      const content = await vault.adapter.read(path);
      const json = JSON.parse(content);

      const settings = {
        folder: json.folder ?? '',
        template: json.template ?? '',
        format: !json.format || json.format === '' ? 'YYYY-MM-DD' : json.format,
      };

      logger.debug(
        `[DailyNoteConfig] loaded settings: folder=${settings.folder}, format=${settings.format}`
      );
      return settings;
    } catch (e) {
      logger.error('[DailyNoteConfig] failed to load daily-notes.json', e);
      return {
        folder: '',
        template: '',
        format: 'YYYY-MM-DD',
      };
    }
  }
}
