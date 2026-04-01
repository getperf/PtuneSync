import { App, Vault } from 'obsidian';
import { YamlIOBase } from './YamlIOBase';
import { TagExtractor } from 'src/features/tags/services/TagExtractor';
import { logger } from '../logger/loggerInstance';
import { TagRow } from 'src/core/models/tags/Tags';

/**
 * --- TagYamlIO
 * タグ辞書 (_tagging/tags) のYAML入出力を担当するクラス。
 */
export class TagYamlIO extends YamlIOBase {
  protected baseDir = '_tagging/tags';
  protected keyField = 'name';

  /** --- 初期化処理：タグYAMLが存在しない場合に生成 */
  async ensure(app: App): Promise<void> {
    const dir = '_tagging/tags';
    const files = app.vault
      .getFiles()
      .filter((f) => f.path.startsWith(`${dir}/`) && f.path.endsWith('.yaml'));

    if (files.length > 0) {
      logger.debug(`[TagYamlIO.ensure] already initialized (${files.length})`);
      return;
    }

    const tags = await TagExtractor.extractAndGroup(app);
    await tags.save(app.vault);
    logger.info('[TagYamlIO.ensure] タグYAML初期保存完了');
  }

  /** --- タグ一覧をYAMLファイル群として保存 */
  async save(vault: Vault, rows: TagRow[]): Promise<void> {
    logger.debug(`[TagYamlIO.save] total=${rows.length}`);
    const grouped: Record<
      string,
      Record<string, Omit<TagRow, 'tagKind' | 'name'>>
    > = {};

    for (const row of rows) {
      const { tagKind, name, ...rest } = row;
      if (!grouped[tagKind]) grouped[tagKind] = {};
      grouped[tagKind][name] = rest;
    }

    for (const [kindId, data] of Object.entries(grouped)) {
      logger.debug(
        `[TagYamlIO.save] kindId=${kindId}, entries=${Object.keys(data).length}`
      );
      await this.writeYamlFile(vault, kindId, data);
    }
  }

  /** --- YAMLファイル群からタグデータを読み込み */
  async load(vault: Vault): Promise<TagRow[]> {
    const raw = await this.readYamlFiles(vault);
    const result: TagRow[] = [];

    for (const { kindId, content } of raw) {
      const parsed =
        this.fromYaml<Record<string, Omit<TagRow, 'tagKind' | 'name'>>>(
          content
        );
      for (const [name, row] of Object.entries(parsed)) {
        result.push({ ...row, name, tagKind: kindId });
      }
    }

    logger.debug(`[TagYamlIO.load] total loaded rows=${result.length}`);
    return result;
  }

  /**
   * --- 登録済みタグ名一覧を返す（tags辞書のみ）
   * ※ aliases は含めない
   */
  async loadAllTagNames(vault: Vault): Promise<string[]> {
    const rows = await this.load(vault);
    const names = rows.map((r) => r.name);

    logger.debug(`[TagYamlIO.loadAllTagNames] total=${names.length}`);
    return names;
  }
}
