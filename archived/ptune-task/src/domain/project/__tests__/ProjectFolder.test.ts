import { ProjectFolder } from "../ProjectFolder";

describe("ProjectFolder", () => {
  test("recognises project root path", () => {
    expect(ProjectFolder.isProjectRootPath("_project")).toBe(true);
    expect(ProjectFolder.isProjectRootPath("_project/001_alpha")).toBe(false);
  });

  test("recognises direct child project folders", () => {
    expect(ProjectFolder.isProjectFolderPath("_project/001_alpha")).toBe(true);
    expect(ProjectFolder.isProjectFolderPath("_project/001_alpha/sub")).toBe(false);
    expect(ProjectFolder.isProjectFolderPath("misc/001_alpha")).toBe(false);
  });

  test("splits prefixed folder names", () => {
    const folder = new ProjectFolder("_project/001_alpha", "task__key", "[[_journal/2026-03-14|2026-03-14]]");

    expect(folder.prefix).toBe("001");
    expect(folder.title).toBe("alpha");
    expect(folder.indexNotePath).toBe("_project/001_alpha/index.md");
    expect(folder.taskKey).toBe("task__key");
    expect(folder.dailynote).toBe("[[_journal/2026-03-14|2026-03-14]]");
  });
});
