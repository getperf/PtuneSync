import { splitNoteSummaryIntoSentences } from "../splitNoteSummaryIntoSentences";

describe("splitNoteSummaryIntoSentences", () => {
  test("splits a normalized paragraph into sentences", () => {
    expect(
      splitNoteSummaryIntoSentences(
        "ObsidianはMarkdownネストリストを標準サポートしている。 Outlinerプラグインは行単位ツリー操作を提供する。 Canvasは可視化を行うが自動ノード化は標準ではない。",
      ),
    ).toEqual([
      "ObsidianはMarkdownネストリストを標準サポートしている。",
      "Outlinerプラグインは行単位ツリー操作を提供する。",
      "Canvasは可視化を行うが自動ノード化は標準ではない。",
    ]);
  });

  test("splits japanese sentences even when there is no space after punctuation", () => {
    expect(
      splitNoteSummaryIntoSentences(
        "正規化を適用した。振り返りは文分割へ変更した。テストを追加した。",
      ),
    ).toEqual([
      "正規化を適用した。",
      "振り返りは文分割へ変更した。",
      "テストを追加した。",
    ]);
  });
});
