import { NoteSummaries } from "../../../domain/note/NoteSummaries";
import { DailyNotesReflectionDocumentBuilder } from "../builders/DailyNotesReflectionDocumentBuilder";

describe("DailyNotesReflectionDocumentBuilder", () => {
  test("uses summary sentence list for reflection", () => {
    const summaries = new NoteSummaries();
    summaries.add({
      noteFolder: "_project/331_push時の差分ロジック見直し",
      notePath: "_project/331_push時の差分ロジック見直し/01_新規作成で親見出し追加.md",
      noteTitle: "新規作成で親見出し追加",
      summarySentences: [
        "移行方針を確認した。",
        "xmind 連携案を整理した。",
        "テンプレート複製案を追加した。",
      ],
    });

    const doc = new DailyNotesReflectionDocumentBuilder().build(summaries);

    expect(doc.projects[0].notes[0].sentences.map((sentence) => sentence.text)).toEqual([
      "移行方針を確認した。",
      "xmind 連携案を整理した。",
      "テンプレート複製案を追加した。",
    ]);
  });

  test("falls back to legacy string parsing for old summaries", () => {
    const summaries = new NoteSummaries();
    summaries.add({
      noteFolder: "_project/334_MindMap形式レポートプロト",
      notePath: "_project/334_MindMap形式レポートプロト/03_XMind形式レポートプロト__プロトタイプ.md",
      noteTitle: "XMind形式レポートプロト__プロトタイプ",
      summary: "ノート要約を改行なしで正規化した。振り返りはセンテンス分割へ変更した。テストを追加した。",
    });

    const doc = new DailyNotesReflectionDocumentBuilder().build(summaries);

    expect(doc.projects[0].notes[0].sentences.map((sentence) => sentence.text)).toEqual([
      "ノート要約を改行なしで正規化した。",
      "振り返りはセンテンス分割へ変更した。",
      "テストを追加した。",
    ]);
  });
});
