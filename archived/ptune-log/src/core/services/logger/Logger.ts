/**
 * ログ出力のためのユーティリティクラスです。
 * 指定したプレフィックスとログレベルに基づいて、ログメッセージを出力します。
 *
 * @remarks
 * loggerInstance.ts で logger をグローバル変数としてインスタンス化し、利用します。
 *
 * @example
 * import { logger } from "src/utils/loggerInstance";
 * logger.info("情報メッセージ");
 * logger.error("エラーメッセージ");
 */
import { Vault, normalizePath } from 'obsidian';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

export class Logger {
  private prefix: string;
  private level: LogLevel;
  private enableFileOutput = false;
  private logDir = '';
  private vault?: Vault;

  constructor(prefix = 'ptune', level: LogLevel = 'info') {
    this.prefix = prefix;
    this.level = level;
  }
  public setLevel(level: LogLevel) {
    this.level = level;
  }

  public async initFileOutput(vault: Vault, enable: boolean) {
    this.vault = vault;
    this.enableFileOutput = enable;
    this.logDir = normalizePath(`${vault.configDir}/plugins/ptune-log/logs`);
    if (enable && !(await vault.adapter.exists(this.logDir))) {
      await vault.adapter.mkdir(this.logDir);
    }
  }

  private getLogPath(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const today = `${yyyy}-${mm}-${dd}`;
    return normalizePath(`${this.logDir}/ptune-log_${today}.log`);
  }

  private async writeToFile(level: string, message: string) {
    if (!this.enableFileOutput || !this.vault) return;
    const line = `[${new Date().toLocaleTimeString()}][${
      this.prefix
    }][${level}] ${message}\n`;
    const path = this.getLogPath();
    await this.vault.adapter.append(path, line).catch(console.error);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private log(level: LogLevel, ...args: unknown[]) {
    if (!this.shouldLog(level)) return;

    const msg = args
      .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
      .join(' ');

    const prefixMsg = `[${this.prefix}] ${msg}`;

    // --- console.log を禁止し、debug/warn/error のみに統一 ---
    if (level === 'debug' || level === 'info') {
      console.debug(prefixMsg); // info は debug にフォールバック
    } else if (level === 'warn') {
      console.warn(prefixMsg);
    } else if (level === 'error') {
      console.error(prefixMsg);
    }

    // Fire and Forget（ログ失敗でアプリを止めない）
    void this.writeToFile(level, msg);
  }

  debug(...args: unknown[]) {
    void this.log('debug', ...args);
  }
  info(...args: unknown[]) {
    void this.log('info', ...args);
  }
  warn(...args: unknown[]) {
    void this.log('warn', ...args);
  }
  error(...args: unknown[]) {
    void this.log('error', ...args);
  }
}
