import { normalizeNoteSummaryText } from "../normalizeNoteSummaryText";

describe("normalizeNoteSummaryText", () => {
  test("joins multi-line summaries into a single paragraph", () => {
    expect(
      normalizeNoteSummaryText(
        [
          "ptune-log の代替がなく `outliner/xmind` 方式へ移行する決定が記載されている。",
          "outliner は Markdown のまま daily note 内で完結し、差分確認や Git 管理に強いと記載されている。",
          "",
          "xmind は外部アプリ前提で、貼り戻し手順が必要と記載されている。",
        ].join("\n"),
      ),
    ).toBe(
      "ptune-log の代替がなく `outliner/xmind` 方式へ移行する決定が記載されている。 outliner は Markdown のまま daily note 内で完結し、差分確認や Git 管理に強いと記載されている。 xmind は外部アプリ前提で、貼り戻し手順が必要と記載されている。",
    );
  });
});
