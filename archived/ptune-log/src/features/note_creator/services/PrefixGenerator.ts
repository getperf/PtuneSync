import { normalizePath, TFile, TFolder, Vault } from 'obsidian';
import { Utils } from '../../../core/utils/common/Utils';
import { ConfigManager, notePrefixType } from 'src/config/ConfigManager';
import { logger } from 'src/core/services/logger/loggerInstance';
import { SerialNoteCreationType } from 'src/features/note_creator/modals/NoteCreatorModal';

/**
 * --- PrefixGenerator
 * ノートやフォルダに付与するプレフィックス（連番・日付）を生成するユーティリティクラス。
 */
export class PrefixGenerator {
  /** --- 共通のプレフィックス生成ロジック（既存項目一覧から次の番号を求める） */
  static getNextPrefixFromItems(items: string[], digits: number): string {
    logger.debug(
      `[PrefixGenerator.getNextPrefixFromItems] items=${items.length}, digits=${digits}`
    );
    const regex = /^(\d+)_/;
    let max = 0;

    for (const name of items) {
      const match = name.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num)) max = Math.max(max, num);
      }
    }

    const next = max + 1;
    const result = next
      .toString()
      .padStart(digits, '0')
      .replace(/^0+(\d{4,})$/, '$1');

    logger.debug(
      `[PrefixGenerator.getNextPrefixFromItems] max=${max}, next=${next}, result=${result}`
    );
    return result;
  }

  /** --- フォルダ内のファイルから次の連番プレフィックスを生成する */
  static getNextFilePrefix(
    folder: TFolder,
    digits: number
  ): string {
    const files = folder.children
      .filter((f) => f instanceof TFile)
      .map((f) => f.name);
    logger.debug(
      `[PrefixGenerator.getNextFilePrefix] folder=${folder.path}, files=${files.length}`
    );
    return this.getNextPrefixFromItems(files, digits);
  }

  /** --- ファイル作成時のプレフィックスを返す（日付／連番対応） */
  static getFilePrefix(
    vault: Vault,
    parentPath: string,
    prefix: notePrefixType,
    digits = 2
  ): string {
    logger.debug(
      `[PrefixGenerator.getFilePrefix] path=${parentPath}, prefixType=${prefix}`
    );
    if (prefix === notePrefixType.DATE) return Utils.getDatePrefix();

    const folder = vault.getAbstractFileByPath(normalizePath(parentPath));
    if (folder instanceof TFolder) {
      return this.getNextFilePrefix(folder, digits);
    }

    logger.error(
      `[PrefixGenerator.getFilePrefix] Invalid folder path: ${parentPath}`
    );
    throw new Error(`Invalid folder path: ${parentPath}`);
  }

  /** --- フォルダ内のフォルダから次の連番プレフィックスを生成する */
  static getNextFolderPrefix(
    folder: TFolder,
    digits: number
  ): string {
    const folders = folder.children
      .filter((f) => f instanceof TFolder)
      .map((f) => f.name);
    logger.debug(
      `[PrefixGenerator.getNextFolderPrefix] folder=${folder.path}, subfolders=${folders.length}`
    );
    return this.getNextPrefixFromItems(folders, digits);
  }

  /** --- フォルダ作成時のプレフィックスを返す（日付／連番対応） */
  static getFolderPrefix(
    vault: Vault,
    parentPath: string,
    prefix: notePrefixType,
    digits = 2
  ): string {
    logger.debug(
      `[PrefixGenerator.getFolderPrefix] path=${parentPath}, prefixType=${prefix}`
    );
    if (prefix === notePrefixType.DATE) return Utils.getDatePrefix();

    const folder = vault.getAbstractFileByPath(normalizePath(parentPath));
    if (folder instanceof TFolder) {
      return this.getNextFolderPrefix(folder, digits);
    }

    logger.error(
      `[PrefixGenerator.getFolderPrefix] Invalid folder path: ${parentPath}`
    );
    throw new Error(`Invalid folder path: ${parentPath}`);
  }

  /** --- ノートまたはフォルダの作成種別に応じて次のプレフィックスを返す */
  static getNextPrefix(
    vault: Vault,
    folder: TFolder,
    creationType: SerialNoteCreationType,
    config: ConfigManager
  ) {
    const prefixType = config.getPrefixType(creationType);
    const prefixDigits = config.get<number>('prefixDigits');
    logger.debug(
      `[PrefixGenerator.getNextPrefix] creationType=${creationType}, prefixType=${prefixType}, digits=${prefixDigits}`
    );

    if (creationType === SerialNoteCreationType.FILE) {
      return this.getFilePrefix(vault, folder.path, prefixType, prefixDigits);
    } else {
      return this.getFolderPrefix(vault, folder.path, prefixType, prefixDigits);
    }
  }
}
