import { TaskKeyOptionBuilder } from "../TaskKeyOptionBuilder";

describe("TaskKeyOptionBuilder", () => {
  test("builds root task option", () => {
    const builder = new TaskKeyOptionBuilder();

    expect(builder.build(["note-creator移行"])).toEqual([
      {
        taskKey: "note-creator移行",
        label: "note-creator移行",
        suggestedTitle: "note-creator移行",
      },
    ]);
  });

  test("builds child task option with indented label", () => {
    const builder = new TaskKeyOptionBuilder();

    expect(builder.build(["note-creator移行__ユースケース"])).toEqual([
      {
        taskKey: "note-creator移行__ユースケース",
        label: "↳ ユースケース",
        suggestedTitle: "note-creator移行__ユースケース",
      },
    ]);
  });
});
