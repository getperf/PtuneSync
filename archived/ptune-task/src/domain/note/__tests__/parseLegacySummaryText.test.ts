import { parseLegacySummaryText } from "../parseLegacySummaryText";

describe("parseLegacySummaryText", () => {
  test("splits legacy string summaries with dot-based sentence boundaries", () => {
    expect(
      parseLegacySummaryText(
        "推奨ディレクトリ構成、AGENTS.md 方針、config/experiments.yml による戦略設定を確認した.",
      ),
    ).toEqual([
      "推奨ディレクトリ構成、AGENTS.",
      "md 方針、config/experiments.",
      "yml による戦略設定を確認した.",
    ]);
  });
});
