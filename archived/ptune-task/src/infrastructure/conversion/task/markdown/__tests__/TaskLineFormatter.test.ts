import { TaskLineFormatter } from "../TaskLineFormatter";

describe("TaskLineFormatter", () => {
  test("omits pomodoro when planned count is zero", () => {
    expect(
      TaskLineFormatter.format({
        title: "a",
        pomodoroPlanned: 0,
      }),
    ).toBe("a");
  });

  test("renders pomodoro when planned count is positive", () => {
    expect(
      TaskLineFormatter.format({
        title: "b",
        pomodoroPlanned: 1,
      }),
    ).toBe("b 🍅x1");
  });
});
