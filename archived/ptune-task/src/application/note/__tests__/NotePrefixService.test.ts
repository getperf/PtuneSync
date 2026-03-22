import { NotePrefixService } from "../NotePrefixService";

describe("NotePrefixService", () => {
  test("builds next serial prefix from existing names", () => {
    const service = new NotePrefixService();

    expect(
      service.getNextPrefix(
        ["001_alpha", "002_beta", "010_gamma"],
        "serial",
        3,
      ),
    ).toBe("011");
  });

  test("builds date prefix in YYYYMMDDHHmmss format", () => {
    const service = new NotePrefixService();
    const now = new Date(2026, 2, 14, 1, 2, 3);

    expect(service.getNextPrefix([], "date", 3, now)).toBe("20260314010203");
  });
});
