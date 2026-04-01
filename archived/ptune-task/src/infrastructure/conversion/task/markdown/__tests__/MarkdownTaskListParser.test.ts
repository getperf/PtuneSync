// mock the extractor since it pulls in ESM modules that jest can't handle
jest.mock("../TaskListMdastExtractor", () => ({
  TaskListMdastExtractor: {
    extract: (body: string) => {
      // rudimentary line-based parser used only in tests
      return body
        .split(/\r?\n/)
        .map((l) => l.replace(/\t/g, "  "))
        .map((l) => {
          const match = /^(\s*)- \[ \] (.*)$/.exec(l);
          if (!match) return null;
          const indent = match[1]!.length;
          const depth = Math.floor(indent / 2) + 1;
          return { rawText: match[2]!.trim(), depth };
        })
        .filter((x): x is { rawText: string; depth: number } => !!x);
    },
  },
}));

import { MarkdownTaskListParser } from "../MarkdownTaskListParser";

// TaskLineMetaParser is used internally; we don't need its exports here.

describe("MarkdownTaskListParser", () => {
  const sample = `
- [ ] First task #a 🍅x1
  - [ ] Sub task | goal1
- [ ] Second task #b
`;

  test("parses hierarchy and metadata correctly", () => {
    const nodes = MarkdownTaskListParser.parse(sample);

    expect(nodes).toHaveLength(3);

    expect(nodes[0]).toEqual({
      title: "First task",
      parentTitle: null,
      pomodoroPlanned: 1,
      tags: ["a"],
      goal: null,
    });

    expect(nodes[1]).toEqual({
      title: "Sub task",
      parentTitle: "First task",
      pomodoroPlanned: null,
      tags: [],
      goal: "goal1",
    });

    expect(nodes[2]).toEqual({
      title: "Second task",
      parentTitle: null,
      pomodoroPlanned: null,
      tags: ["b"],
      goal: null,
    });
  });

  test("ignores completed tasks", () => {
    const md = `
- [x] Done
- [ ] Todo
`;
    const nodes = MarkdownTaskListParser.parse(md);
    expect(nodes.map((n) => n.title)).toEqual(["Todo"]);
  });

  test("works with deeper nesting", () => {
    const md = `
- [ ] A
  - [ ] B
    - [ ] C
`;
    const nodes = MarkdownTaskListParser.parse(md);
    expect(nodes).toEqual([
      { title: "A", parentTitle: null, pomodoroPlanned: null, tags: [], goal: null },
      { title: "B", parentTitle: "A", pomodoroPlanned: null, tags: [], goal: null },
      { title: "C", parentTitle: "B", pomodoroPlanned: null, tags: [], goal: null },
    ]);
  });
});
