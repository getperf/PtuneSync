import { TaskLineMetaParser, TaskLineFormatError } from "../TaskLineMetaParser";

describe("TaskLineMetaParser", () => {
  test("parses title-only line", () => {
    const meta = TaskLineMetaParser.parse("Buy milk");
    expect(meta).toEqual({
      title: "Buy milk",
      tags: [],
      goal: null,
      pomodoroPlanned: null,
    });
  });

  test("extracts tags and pomodoro and trims", () => {
    const meta = TaskLineMetaParser.parse("  Finish report #work #urgent 🍅x2  ");
    expect(meta).toEqual({
      title: "Finish report",
      tags: ["work", "urgent"],
      goal: null,
      pomodoroPlanned: 2,
    });
  });

  test("recognises goal separated by pipe", () => {
    const meta = TaskLineMetaParser.parse("Implement feature | Q1 OKR");
    expect(meta).toEqual({
      title: "Implement feature",
      tags: [],
      goal: "Q1 OKR",
      pomodoroPlanned: null,
    });
  });

  test("throws when empty string", () => {
    expect(() => TaskLineMetaParser.parse("   ")).toThrow(TaskLineFormatError);
  });

  test("rejects multiple pipes", () => {
    expect(() => TaskLineMetaParser.parse("a | b | c")).toThrow(TaskLineFormatError);
  });

  test("rejects tag after goal", () => {
    expect(() => TaskLineMetaParser.parse("task | goal #tag")).toThrow(TaskLineFormatError);
  });

  test("rejects bad pomodoro format", () => {
    expect(() => TaskLineMetaParser.parse("Do thing 🍅x0")).toThrow(TaskLineFormatError);
    expect(() => TaskLineMetaParser.parse("Do thing 🍅xabc")).toThrow(TaskLineFormatError);
  });
});
