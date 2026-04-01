export class ChecklistDecorator {
  constructor(
    private readonly enabled: boolean,
    private readonly prefix: string = '- [ ] '
  ) {}

  apply(line: string): string {
    if (!this.enabled) return line;

    // --- 共通タグ（そのまま prefix を付ける）
    if (/^\s*共通タグ\s*:/.test(line)) {
      return `${this.prefix}${line}`;
    }

    // --- 要約行の整形
    const summaryMatch = line.match(/^\s*[-*]?\s*要約\s*:(.*)$/);
    if (summaryMatch) {
      const body = summaryMatch[1].trim();
      return `- [ ] 要約: ${body}`;
    }

    // --- 目標行の整形
    const goalMatch = line.match(/^\s*[-*]?\s*目標\s*:(.*)$/);
    if (goalMatch) {
      const body = goalMatch[1].trim();
      return `- [ ] 目標: ${body}`;
    }

    return line;
  }
}
