import { NoteSummaries } from "../../../domain/note/NoteSummaries";
import { DailyNotesReportBuilder } from "../builders/DailyNotesReportBuilder";

describe("DailyNotesReportBuilder", () => {
  test("merges sentence lists into a single report line", () => {
    const summaries = new NoteSummaries();
    summaries.add({
      noteFolder: "_project/331_push時の差分ロジック見直し",
      notePath: "_project/331_push時の差分ロジック見直し/01_新規作成で親見出し追加.md",
      noteTitle: "新規作成で親見出し追加",
      summarySentences: [
        "親見出しの追加手順を確認した。",
        "テンプレート構成を整理した。",
      ],
    });

    const builder = new DailyNotesReportBuilder();

    expect(builder.build(summaries)).toBe(
      [
        "- push時の差分ロジック見直し",
        "  - [新規作成で親見出し追加](_project/331_push%E6%99%82%E3%81%AE%E5%B7%AE%E5%88%86%E3%83%AD%E3%82%B8%E3%83%83%E3%82%AF%E8%A6%8B%E7%9B%B4%E3%81%97/01_%E6%96%B0%E8%A6%8F%E4%BD%9C%E6%88%90%E3%81%A7%E8%A6%AA%E8%A6%8B%E5%87%BA%E3%81%97%E8%BF%BD%E5%8A%A0.md)",
        "    - 親見出しの追加手順を確認した。 テンプレート構成を整理した。",
      ].join("\n"),
    );
  });

  test("omits summary lines when summaries are disabled", () => {
    const summaries = new NoteSummaries();
    summaries.add({
      noteFolder: "_project/331_push時の差分ロジック見直し",
      notePath: "_project/331_push時の差分ロジック見直し/01_新規作成で親見出し追加.md",
      noteTitle: "新規作成で親見出し追加",
      summary: "これは表示しない",
    });

    const builder = new DailyNotesReportBuilder();

    expect(
      builder.build(summaries, { includeSummaries: false }),
    ).toBe(
      [
        "- push時の差分ロジック見直し",
        "  - [新規作成で親見出し追加](_project/331_push%E6%99%82%E3%81%AE%E5%B7%AE%E5%88%86%E3%83%AD%E3%82%B8%E3%83%83%E3%82%AF%E8%A6%8B%E7%9B%B4%E3%81%97/01_%E6%96%B0%E8%A6%8F%E4%BD%9C%E6%88%90%E3%81%A7%E8%A6%AA%E8%A6%8B%E5%87%BA%E3%81%97%E8%BF%BD%E5%8A%A0.md)",
      ].join("\n"),
    );
  });
});
