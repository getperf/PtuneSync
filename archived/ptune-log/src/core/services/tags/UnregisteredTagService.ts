// File: src/core/services/tags/UnregisteredTagService.ts
import { logger } from 'src/core/services/logger/loggerInstance';
import { TagYamlIO } from '../yaml/TagYamlIO';
import { Vault } from 'obsidian';

/**
 * --- UnregisteredTagService
 * 未登録タグ（tags辞書のみ）を検出する。
 *
 * 定義:
 *   unregistered = usedTags - registeredTags
 * ※ aliases は含めない
 */
export class UnregisteredTagService {
  private loaded = false;
  private registered = new Set<string>();

  constructor(private readonly tagYamlIO: TagYamlIO) {}

  /** tags辞書のみロード（classification/subject/usage など全種を想定） */
  async ensureLoaded(vault: Vault): Promise<void> {
    if (this.loaded) return;

    const all = await this.tagYamlIO.loadAllTagNames(vault);
    this.registered = new Set(all);

    this.loaded = true;
    logger.debug(
      `[UnregisteredTagService] loaded registeredTags=${this.registered.size}`
    );
  }

  /** ノート側の使用タグから未登録タグを抽出（aliasesなし） */
  detect(usedTags: string[]): string[] {
    const unregistered = usedTags.filter((t) => !this.registered.has(t));
    const uniq = Array.from(new Set(unregistered));

    logger.debug(
      `[UnregisteredTagService.detect] used=${usedTags.length}, unregistered=${uniq.length}`
    );
    return uniq;
  }
}
