import { App, Notice, parseYaml, stringifyYaml, TFile } from 'obsidian';
import { Replacement } from '../models/Replacement';
import { TagPosition } from '../models/TagPosition';
import { logger } from 'src/core/services/logger/loggerInstance';
import { ErrorUtils } from 'src/core/utils/common/ErrorUtils';
import { TagAliasUpdater } from 'src/features/tags/services/TagAliasUpdater';

/**
 * ノートファイル内のタグ置換サービス
 * - frontmatter と本文を対象にタグ名を更新
 * - TagAliasUpdater による alias 辞書の更新もサポート
 */
export class TagFileUpdater {
  private replacements = new Map<string, string>();

  constructor(
    private app: App,
    private filename: string,
    private tagPositions: TagPosition[],
    private hasFrontMatter: boolean,
    private aliasUpdater?: TagAliasUpdater
  ) {}

  /** タグ置換を実行 */
  async update(replace: Replacement): Promise<boolean> {
    const file = this.app.vault.getAbstractFileByPath(this.filename);
    if (!file || !(file instanceof TFile)) return false;

    const original = await this.app.vault.read(file);
    const text = original;

    const FRONT_MATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;
    const match = FRONT_MATTER_RE.exec(text);
    const frontMatterText = match ? match[0] : '';
    const offsetBase = match ? match.index + match[0].length : 0;
    const bodyText = text.slice(offsetBase);

    logger.debug(`[TagFileUpdater.update] start file=${this.filename}`);

    let replacedFrontMatter = frontMatterText;
    if (this.hasFrontMatter) {
      replacedFrontMatter = this.replaceInFrontMatter(frontMatterText, replace);
    }

    const replacedBody = this.replaceBodyTags(
      bodyText,
      replace,
      frontMatterText.length
    );
    const newText = replacedFrontMatter + replacedBody;

    if (newText !== original) {
      await this.app.vault.modify(file, newText);
      logger.info(`[TagFileUpdater.update] updated file=${this.filename}`);

      if (this.aliasUpdater && this.replacements.size > 0) {
        for (const [from, to] of this.replacements.entries()) {
          logger.debug(`[TagFileUpdater.update] alias update: ${from} → ${to}`);
          await this.aliasUpdater.updateAlias(from, to);
        }
      }
      return true;
    }

    logger.debug(`[TagFileUpdater.update] no changes: ${this.filename}`);
    return false;
  }

  /** 本文中のタグ置換 */
  private replaceBodyTags(
    body: string,
    replace: Replacement,
    offsetBase: number
  ): string {
    let result = body;
    logger.debug(
      `[TagFileUpdater.replaceBodyTags] start: file=${this.filename}`
    );

    const cacheKeys = Object.keys(replace['cache'] ?? {});
    const fromTag = cacheKeys.find((k) => k.startsWith('#')) || '';
    const canonicalFrom = fromTag.toLowerCase();

    for (const tagPosition of [...this.tagPositions].reverse()) {
      const { start, end } = tagPosition.position;
      if (start.offset == null || end.offset == null) continue;

      const startPos = start.offset - offsetBase;
      const endPos = end.offset - offsetBase;
      if (startPos < 0 || endPos > result.length) continue;

      const segment = result.slice(startPos, endPos);
      const segLower = segment.toLowerCase();

      if (segLower === canonicalFrom) {
        const newResult = replace.inString(result, startPos);
        const newTag = replace['cache'][segment] ?? fromTag;
        if (newResult !== result) {
          this.replacements.set(segment, newTag);
          result = newResult;
          logger.debug(
            `[TagFileUpdater.replaceBodyTags] replaced: ${segment} → ${newTag}`
          );
        }
      } else if (segLower.startsWith(canonicalFrom + '/')) {
        const newPrefix = replace['cache'][fromTag] ?? fromTag;
        const newSegment = segment.replace(fromTag, newPrefix);
        if (newSegment !== segment) {
          this.replacements.set(segment, newSegment);
          result =
            result.slice(0, startPos) + newSegment + result.slice(endPos);
          logger.debug(
            `[TagFileUpdater.replaceBodyTags] replaced nested: ${segment} → ${newSegment}`
          );
        }
      }
    }
    return result;
  }

  /** frontmatter 内のタグ・エイリアスを置換 */
  private replaceInFrontMatter(text: string, replace: Replacement): string {
    const FRONT_MATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
    const match = FRONT_MATTER_RE.exec(text);
    if (!match) return text;

    const yamlText = match[1];
    let data: any;
    try {
      data = parseYaml(yamlText) || {};
    } catch (err) {
      const msg = ErrorUtils.toMessage(err);
      logger.error(
        `[TagFileUpdater.replaceInFrontMatter] YAML parse error: ${this.filename}, ${msg}`
      );
      new Notice(`YAML parse error in ${this.filename}`);
      return text;
    }

    let changed = false;

    const processField = (fieldName: string, isAlias: boolean) => {
      const value = data[fieldName];
      if (!value) return;

      if (typeof value === 'string') {
        const parts = value.split(isAlias ? /(^\s+|\s*,\s*|\s+$)/ : /([\s,]+)/);
        const replaced = replace.inArray(parts, true, isAlias).join('');
        if (replaced !== value) {
          data[fieldName] = replaced;
          this.replacements.set(value, replaced);
          changed = true;
          logger.debug(
            `[TagFileUpdater.replaceInFrontMatter] ${fieldName}: string replaced`
          );
        }
      } else if (Array.isArray(value)) {
        const replacedArray = replace.inArray(value, false, isAlias);
        if (JSON.stringify(replacedArray) !== JSON.stringify(value)) {
          data[fieldName] = replacedArray;
          value.forEach((v, i) => {
            if (v !== replacedArray[i])
              this.replacements.set(v, replacedArray[i]);
          });
          changed = true;
          logger.debug(
            `[TagFileUpdater.replaceInFrontMatter] ${fieldName}: array replaced`
          );
        }
      }
    };

    for (const key of Object.keys(data)) {
      if (/^tags?$/i.test(key)) processField(key, false);
      else if (/^alias(es)?$/i.test(key)) processField(key, true);
    }

    if (!changed) return text;

    const newYaml = stringifyYaml(data).trimEnd();
    const newFrontMatter = `---\n${newYaml}\n---\n`;
    logger.info(
      `[TagFileUpdater.replaceInFrontMatter] updated frontmatter: ${this.filename}`
    );
    return text.replace(FRONT_MATTER_RE, newFrontMatter);
  }
}
