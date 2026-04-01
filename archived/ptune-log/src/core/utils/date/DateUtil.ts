// File: src/core/utils/date/DateUtil.ts
import { moment as obsidianMoment } from 'obsidian';

export class DateUtil {
  /** Obsidian の moment を callable にした共通ラッパー */
  private static readonly callMoment =
    obsidianMoment as unknown as (d?: Date | string | number) => moment.Moment;

  /** moment() 現在日時の MomentLike */
  static mNow(): moment.Moment {
    return DateUtil.callMoment();
  }

  /** moment(date) 任意日付の MomentLike */
  static m(date: Date | string | number): moment.Moment {
    return DateUtil.callMoment(date);
  }

  /** フォーマット付き日付文字列（デフォルト: YYYY-MM-DD） */
  static formatDate(date: Date | string, fmt = 'YYYY-MM-DD'): string {
    return DateUtil.m(date).format(fmt);
  }

  /** N日前の日付文字列（デフォルト: YYYY-MM-DD） */
  static dateDaysAgo(daysAgo: number, fmt = 'YYYY-MM-DD'): string {
    return DateUtil.mNow().subtract(daysAgo, 'days').format(fmt);
  }

  /** ローカル日付に正規化（時刻 00:00:00） */
  static normalizeLocalDate(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  /** UTC ISO文字列（例: 2025-11-11T00:00:00.000Z） */
  static utcString(date: Date = new Date()): string {
    return date.toISOString();
  }

  /** ローカル日付（YYYY-MM-DD） */
  static localDate(date: Date = new Date()): string {
    return date.toLocaleDateString('sv-SE');
  }

  /** YYYY-MM-DD からローカル日付 00:00 の Date を作成 */
  static localDateFromKey(key: string): Date {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  /** ローカル日時 ISO 風 YYYY-MM-DDTHH:mm:ss （タイムゾーン記号なし） */
  static localISOString(date: Date = new Date()): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
  }

  /** ローカル時刻（HH:mm） */
  static localTime(date: Date = new Date()): string {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * ISO文字列 → HH:mm 形式へ変換
   * 空欄やパース失敗時は空文字を返す
   */
  static toTimeHM(utc?: string): string {
    if (!utc) return '';
    const d = new Date(utc);
    if (Number.isNaN(d.getTime())) return '';
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }

  /** ISO形式の日付文字列を YYYY-MM-DD に変換 */
  static dateKey(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('sv-SE');
  }

  /** dailynote リンクから日付キーを抽出 */
  static extractDateKeyFromLink(link?: string): string | undefined {
    if (!link) return undefined;
    const m = link.match(/_journal\/(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : undefined;
  }

  /** 数値を小数点 n 位で表示（0 / undefined は空欄） */
  static formatDecimal(
    value?: number,
    digits = 1
  ): string {
    if (!value || value === 0) return '';
    return value.toFixed(digits);
  }

  /** 指定日が「今日」かどうか（ローカル日付ベース）  */
  static isToday(date: Date): boolean {
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }

}
