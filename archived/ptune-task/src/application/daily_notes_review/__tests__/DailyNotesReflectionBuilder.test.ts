import { NoteSummaries } from "../../../domain/note/NoteSummaries";
import { DailyNotesReflectionBuilder } from "../builders/DailyNotesReflectionBuilder";
import { DailyNotesReflectionDocumentBuilder } from "../builders/DailyNotesReflectionDocumentBuilder";

describe("DailyNotesReflectionBuilder", () => {
  test("builds outline reflection with guidance comment", () => {
    const doc = buildDocument();
    const builder = new DailyNotesReflectionBuilder();

    expect(builder.build(doc, "outline")).toContain(
      "下記は当日のノート要約から抽出した振り返り素材です。",
    );
    expect(builder.build(doc, "outline")).toContain("- push時の差分ロジック見直し");
    expect(builder.build(doc, "outline")).toContain("  - 新規作成で親見出し追加");
    expect(builder.build(doc, "outline")).toContain("    - 親見出しの追加手順を確認した");
  });

  test("builds xmind reflection with link and input/output blocks", () => {
    const doc = buildDocument();
    const builder = new DailyNotesReflectionBuilder();
    const markdown = builder.build(doc, "xmind", {
      xmindFileLink: "_journal/2026/03/2026-03-16_reviewpoint.xmind",
    });

    expect(markdown).toContain("[XMind による振り返り手順]");
    expect(markdown).toContain("[編集用 XMind ファイルを開く](_journal/2026/03/2026-03-16_reviewpoint.xmind)");
    expect(markdown).toContain("**インプット（XMind 用）**");
    expect(markdown).toContain("push時の差分ロジック見直し");
    expect(markdown).toContain("\t新規作成で親見出し追加");
    expect(markdown).toContain("**アウトプット（XMind 編集結果）**");
  });
});

function buildDocument() {
  const summaries = new NoteSummaries();
  summaries.add({
    noteFolder: "_project/331_push時の差分ロジック見直し",
    notePath: "_project/331_push時の差分ロジック見直し/01_新規作成で親見出し追加.md",
    noteTitle: "新規作成で親見出し追加",
    summary: "親見出しの追加手順を確認した",
  });

  return new DailyNotesReflectionDocumentBuilder().build(summaries);
}
