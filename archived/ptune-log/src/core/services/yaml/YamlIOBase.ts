import { Vault, TFile, normalizePath } from 'obsidian';
import { stringifyYaml, parseYaml } from 'obsidian';
import { TagKindRegistry } from 'src/core/models/tags/TagKindRegistry';
import { logger } from '../logger/loggerInstance';

/**
 * --- YamlIOBase
 * タグやエイリアスのYAML入出力を共通処理として提供する抽象クラス。
 */
export abstract class YamlIOBase {
  protected abstract baseDir: string;
  protected abstract keyField: string;

  /** --- オブジェクトをYAML文字列へ変換 */
  protected toYaml<T>(obj: T): string {
    return stringifyYaml(obj);
  }

  /** --- YAML文字列をオブジェクトへ変換 */
  protected fromYaml<T>(yaml: string): T {
    try {
      const parsed = parseYaml(yaml) as T;
      return parsed;
    } catch (e) {
      logger.error('[YamlIOBase.fromYaml] YAMLパース失敗', e);
      throw e;
    }
  }

  /** --- YAMLファイル書き込み処理 */
  protected async writeYamlFile(vault: Vault, kindId: string, data: object) {
    const path = normalizePath(`${this.baseDir}/${kindId}.yaml`);
    const yaml = this.toYaml(data);
    logger.debug(`[YamlIOBase.writeYamlFile] writing ${path}`);

    try {
      await vault.adapter.write(path, yaml);
      logger.debug(`[YamlIOBase.writeYamlFile] success ${path}`);
    } catch (e: unknown) {
      logger.error(`[YamlIOBase.writeYamlFile] write failed: ${path}`, e);
      throw e;
    }
  }

  /** --- YAMLファイル群を読み込む（kindId単位） */
  protected async readYamlFiles(
    vault: Vault
  ): Promise<{ kindId: string; content: string }[]> {
    const registry = TagKindRegistry.getInstance();
    await registry.ensure();
    const result: { kindId: string; content: string }[] = [];

    for (const kindId of registry.getIdList()) {
      const path = normalizePath(`${this.baseDir}/${kindId}.yaml`);
      const file = vault.getAbstractFileByPath(path);

      if (!(file instanceof TFile)) {
        logger.debug(`[YamlIOBase.readYamlFiles] skip missing file: ${path}`);
        continue;
      }

      const content = await vault.read(file);
      result.push({ kindId, content });
      logger.debug(`[YamlIOBase.readYamlFiles] loaded ${path}`);
    }

    logger.debug(
      `[YamlIOBase.readYamlFiles] total=${result.length}, baseDir=${this.baseDir}`
    );
    return result;
  }
}
