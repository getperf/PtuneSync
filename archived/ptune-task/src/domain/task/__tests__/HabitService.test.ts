import { HabitService } from "../HabitService";

describe("HabitService", () => {
  test("collects only habits that still exist in markdown lines", () => {
    const lines = [
      "<!--",
      "comment",
      "-->",
      "",
      "- [ ] b",
      "- [ ] <夜>プール🚫",
      "- [ ] a",
    ];

    expect(
      HabitService.collectExistingHabits(lines, ["<朝>くすり🚫", "<夜>プール🚫"]),
    ).toEqual(["<夜>プール🚫"]);
  });

  test("preserves configured habit order", () => {
    const lines = [
      "- [ ] <夜>プール🚫",
      "- [ ] <朝>くすり🚫",
    ];

    expect(
      HabitService.collectExistingHabits(lines, ["<朝>くすり🚫", "<夜>プール🚫"]),
    ).toEqual(["<朝>くすり🚫", "<夜>プール🚫"]);
  });
});
