import { i18n } from "../../../shared/i18n/I18n";
import { TimetableBuilder } from "../builders/TimetableBuilder";
import { ReviewTaskNode } from "../models/ReviewTaskNode";
import { ReviewTaskTree } from "../models/ReviewTaskTree";
import { ReviewFlagLabelResolver } from "../services/ReviewFlagLabelResolver";

describe("TimetableBuilder", () => {
  beforeEach(() => {
    i18n.init("ja");
  });

  test("builds markdown table with remark column", () => {
    const tree = new ReviewTaskTree([
      new ReviewTaskNode({
        id: "1",
        title: "変更調査",
        status: "completed",
        pomodoroPlanned: 2,
        pomodoroActual: 1.5,
        started: "08:10",
        completed: "09:00",
        goal: "ユースケース整理",
        reviewFlags: ["decisionPending"],
        children: [
          new ReviewTaskNode({
            id: "2",
            title: "ユースケース",
            status: "needsAction",
            pomodoroPlanned: 1,
            reviewFlags: ["operationMiss"],
          }),
        ],
      }),
    ]);

    const builder = new TimetableBuilder(new ReviewFlagLabelResolver());

    expect(builder.build(tree)).toBe(
      [
        "| 状態 | タイトル | 計画🍅 | 実績✅ | 開始 | 完了 | 備考 |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        "| ✅ | 変更調査 | 2.0 | 1.5 | 08:10 | 09:00 | 🎯ユースケース整理 / ⚠未解決 |",
        "|  | &nbsp;&nbsp;&nbsp;&nbsp;ユースケース | 1.0 |  |  |  | ⚠止め忘れ |",
      ].join("\n"),
    );
  });

  test("keeps remark column empty when there is no extra metadata", () => {
    const tree = new ReviewTaskTree([
      new ReviewTaskNode({
        id: "1",
        title: "実装",
        pomodoroPlanned: 2,
        pomodoroActual: 2.2,
      }),
    ]);

    const builder = new TimetableBuilder(new ReviewFlagLabelResolver());

    expect(builder.build(tree)).toBe(
      [
        "| 状態 | タイトル | 計画🍅 | 実績✅ | 開始 | 完了 | 備考 |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        "|  | 実装 | 2.0 | 2.2 |  |  |  |",
      ].join("\n"),
    );
  });
});
