import { TaskEntry } from "../../../../domain/task/TaskEntry";
import { TaskTreeNode } from "../../../../infrastructure/conversion/task/tree/TaskTreeBuilder";
import { MergeTaskTreeService } from "../MergeTaskTreeService";

function entry(
  id: string,
  title: string,
  parentId: string | null = null,
): TaskEntry {
  return {
    id,
    title,
    parentId,
    parentKey: null,
    pomodoroPlanned: null,
    tags: [],
    goal: null,
  };
}

function node(
  taskEntry: TaskEntry,
  children: TaskTreeNode[] = [],
): TaskTreeNode {
  return {
    entry: taskEntry,
    children,
  };
}

describe("MergeTaskTreeService", () => {
  test("matches newly created tasks by semantic key when ids differ", () => {
    const service = new MergeTaskTreeService();

    const local = [
      node(entry("a-id", "a"), [
        node(entry("a__a1", "a1", "a-id")),
        node(entry("a__a2", "a2", "a-id")),
        node(entry("a__a3", "a3", "a-id")),
      ]),
      node(entry("b", "b"), [
        node(entry("b__b1", "b1", "b")),
        node(entry("b__b2", "b2", "b")),
      ]),
    ];

    const remote = [
      node(entry("a-id", "a"), [
        node(entry("ga1", "a1", "a-id")),
        node(entry("ga2", "a2", "a-id")),
        node(entry("ga3", "a3", "a-id")),
      ]),
      node(entry("gb", "b"), [
        node(entry("gb1", "b1", "gb")),
        node(entry("gb2", "b2", "gb")),
      ]),
    ];

    const merged = service.merge(local, remote);

    expect(merged).toHaveLength(2);
    expect(merged[0]?.entry.title).toBe("a");
    expect(merged[0]?.children.map((child) => child.entry.title)).toEqual([
      "a1",
      "a2",
      "a3",
    ]);
    expect(merged[1]?.entry.title).toBe("b");
    expect(merged[1]?.children.map((child) => child.entry.title)).toEqual([
      "b1",
      "b2",
    ]);
    expect(merged[1]?.entry.id).toBe("gb");
    expect(merged[0]?.children[2]?.entry.id).toBe("ga3");
  });
});
