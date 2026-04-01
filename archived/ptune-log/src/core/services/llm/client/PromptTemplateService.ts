import { TFile, Vault } from 'obsidian';
import { createAndLogError } from 'src/core/utils/errors/errorFactory';
import { logger } from 'src/core/services/logger/loggerInstance';

export class PromptTemplateService {
  constructor(private vault: Vault) {}

  /**
   * system テンプレートと user テンプレートを読み込み、マージして変数展開する
   * @param systemPath system テンプレートのパス
   * @param userPath   user テンプレートのパス
   * @param variables  {{KEY}} 形式で置換する変数マップ
   */
  async mergeSystemAndUser(
    systemPath: string,
    userPath: string,
    variables: Record<string, string>
  ): Promise<string> {
    const user = await this.apply(userPath, variables);

    // USER_PROMPT を variables に注入してから system を apply
    const system = await this.apply(systemPath, {
      // ...variables,
      USER_PROMPT: user,
    });
    return system;
    // const hasPlaceholder = system.includes('{{USER_PROMPT}}');

    // logger.debug(
    //   `[PromptTemplate.merge] system=${system.length} user=${user.length} placeholder=${hasPlaceholder}`
    // );

    // return system.replace('{{USER_PROMPT}}', user);
  }

  async apply(
    templatePath: string,
    variables: Record<string, string>
  ): Promise<string> {
    const file = this.vault.getAbstractFileByPath(templatePath);
    if (!(file instanceof TFile)) {
      throw createAndLogError(`テンプレートが見つかりません: ${templatePath}`);
    }
    const content = await this.vault.read(file);

    return content.replace(/\{\{(.*?)\}\}/g, (_, key) => {
      const k = key.trim();
      return variables[k] ?? '';
    });
  }
}
