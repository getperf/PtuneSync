import { Vault } from 'obsidian';
import { YamlIOBase } from './YamlIOBase';
import { TagAliasRow } from 'src/core/models/tags/TagAliases';
import { logger } from '../logger/loggerInstance';

/**
 * --- TagAliasYamlIO
 * タグエイリアス辞書 (_tagging/aliases) のYAML入出力を担当するクラス。
 */
export class TagAliasYamlIO extends YamlIOBase {
  protected baseDir = '_tagging/aliases';
  protected keyField = 'aliasName';

  /** --- エイリアス一覧をYAMLファイル群として保存 */
  async save(vault: Vault, rows: TagAliasRow[]): Promise<void> {
    logger.debug(`[TagAliasYamlIO.save] total=${rows.length}`);
    const grouped: Record<
      string,
      Record<string, Omit<TagAliasRow, 'tagKind' | 'aliasName'>>
    > = {};

    for (const row of rows) {
      const { tagKind, aliasName, ...rest } = row;
      if (!grouped[tagKind]) grouped[tagKind] = {};
      grouped[tagKind][aliasName] = rest;
    }

    for (const [kindId, data] of Object.entries(grouped)) {
      logger.debug(
        `[TagAliasYamlIO.save] kindId=${kindId}, entries=${
          Object.keys(data).length
        }`
      );
      await this.writeYamlFile(vault, kindId, data);
    }
  }

  /** --- YAMLファイル群からエイリアスデータを読み込み */
  async load(vault: Vault): Promise<TagAliasRow[]> {
    const raw = await this.readYamlFiles(vault);
    const result: TagAliasRow[] = [];

    for (const { kindId, content } of raw) {
      const parsed =
        this.fromYaml<Record<string, Omit<TagAliasRow, 'tagKind'>>>(content);
      for (const [aliasName, row] of Object.entries(parsed)) {
        result.push({ ...row, aliasName, tagKind: kindId });
      }
    }

    logger.debug(`[TagAliasYamlIO.load] total loaded rows=${result.length}`);
    return result;
  }
}
