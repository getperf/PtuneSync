import {
  App,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile,
} from 'obsidian';
import { logger } from 'src/core/services/logger/loggerInstance';

/**
 * --- PomodoroSuggest
 * タスク行の末尾で「🍅」や「::」を入力した際に
 * Pomodoro関連の記号サジェストを提示するクラス。
 */
export class PomodoroSuggest extends EditorSuggest<string> {
  constructor(app: App) {
    super(app);
    logger.debug('[PomodoroSuggest] initialized');
  }

  /** --- サジェスト候補のリストを返す */
  getSuggestions(context: EditorSuggestContext): string[] {
    logger.debug('[PomodoroSuggest.getSuggestions] called');
    return ['🍅x1', '🍅x2', '🍅x3', '🚫', '🚫🍅x1', '🚫🍅x2', '🚫🍅x3'];
  }

  /** --- サジェスト候補の描画処理 */
  renderSuggestion(suggestion: string, el: HTMLElement): void {
    if (suggestion === '🚫') {
      el.createEl('div', { text: '繰り越しなし' });
    }
    el.createSpan({ text: suggestion });
  }

  /** --- サジェストが選択されたときに実行される処理 */
  selectSuggestion(suggestion: string, evt: MouseEvent | KeyboardEvent): void {
    logger.debug(`[PomodoroSuggest.selectSuggestion] selected: ${suggestion}`);
    const editor = this.context?.editor;
    if (!editor) {
      logger.warn('[PomodoroSuggest.selectSuggestion] editor not found');
      return;
    }

    const { start, end } = this.context!;
    editor.replaceRange(suggestion, start, end);
    logger.debug(
      `[PomodoroSuggest.selectSuggestion] inserted "${suggestion}" at line=${start.line}, ch=${start.ch}`
    );
  }

  /** --- トリガー条件を判定してサジェストを起動する */
  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
    file: TFile
  ): EditorSuggestTriggerInfo | null {
    const line = editor.getLine(cursor.line);
    const isTaskLine = line.trimStart().startsWith('- [ ]');
    const triggerMatch = line.slice(0, cursor.ch).match(/(🍅|::)$/);

    if (isTaskLine && triggerMatch) {
      const triggerInfo = {
        start: {
          line: cursor.line,
          ch: cursor.ch - triggerMatch[0].length,
        },
        end: cursor,
        query: triggerMatch[0],
      };
      logger.debug('[PomodoroSuggest.onTrigger] trigger detected', triggerInfo);
      return triggerInfo;
    }
    return null;
  }
}
