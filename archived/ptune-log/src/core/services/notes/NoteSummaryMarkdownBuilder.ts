import { NoteSummary } from 'src/core/models/notes/NoteSummary';

export interface SummaryRenderOptions {
  baseHeadingLevel?: number; // 既定 2: ## ノート名
  checklist?: boolean; // true なら - [ ] 形式
  sentenceSplit?: boolean; // true ならセンテンス分割
  withLink?: boolean; // タイトルにリンク追加（既定: true）
  withUserReview?: boolean; // ユーザレビュー欄を追加（既定: false）
  bullet?: boolean; // 箇条書きを付けるか（既定 true）
}

export class NoteSummaryMarkdownBuilder {
  static render(note: NoteSummary, options: SummaryRenderOptions = {}): string {
    const {
      baseHeadingLevel = 2,
      checklist = false,
      sentenceSplit = false,
      withLink = true,
      withUserReview = false,
      bullet = true,
    } = options;

    const lines: string[] = [];

    lines.push(this.renderNoteHeading(note, baseHeadingLevel, withLink));

    lines.push(
      ...this.renderSummary(note, {
        checklist,
        sentenceSplit,
        bullet,
      }),
    );

    if (note.goal) {
      lines.push(...this.renderGoal(note.goal, checklist));
    }

    if (withUserReview) {
      lines.push(...this.renderUserReview(baseHeadingLevel));
    }

    return lines.join('\n');
  }

  // --- ノート見出し ---
  private static renderNoteHeading(
    note: NoteSummary,
    baseHeadingLevel: number,
    withLink: boolean,
  ): string {
    const base = note.notePath.replace(/\.md$/, '').split('/').pop();
    const path = note.notePath.replace(/\.md$/, '');
    const title = withLink ? `[[${path}|${base}]]` : path;
    const heading = '#'.repeat(baseHeadingLevel);

    return `${heading} ${title}`;
  }

  // --- Summary ---
  static renderSummary(
    note: NoteSummary,
    opts: { checklist: boolean; sentenceSplit: boolean; bullet: boolean },
  ): string[] {
    const { checklist, sentenceSplit, bullet } = opts;

    const bulletPrefix = bullet ? (checklist ? '- [ ] ' : '- ') : '';

    const sentences = sentenceSplit
      ? note.summary
          .split(
            /(?<=[。！？])\s*|(?<=\.)\s+(?=[A-Z\u3040-\u30FF\u4E00-\u9FFF])/,
          )
          .map((s) => s.trim())
          .filter(Boolean)
      : [note.summary];

    return sentences.map((s) => `${bulletPrefix}${s}`);
  }

  // --- Goal ---
  private static renderGoal(goal: string, checklist: boolean): string[] {
    const bullet = checklist ? '- [ ] ' : '- ';
    return [`${bullet}目標: ${goal}`];
  }

  // --- ユーザレビュー欄（記入用プレースホルダ） ---
  private static renderUserReview(baseHeadingLevel: number): string[] {
    const heading = '#'.repeat(baseHeadingLevel + 1);
    return ['', `${heading} レビューコメント`, '- '];
  }
}
