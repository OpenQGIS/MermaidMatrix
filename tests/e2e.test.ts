import { describe, it, expect } from "vitest";
import { parseProjectMarkdown, updateTaskInMarkdown } from "../src/core/parser";
import { projectsToMermaidGantt, parseMermaidGantt } from "../src/core/mermaid-converter";
import { createMatrixStore } from "../src/core/store";
import { TaskStatus } from "../src/types";

describe("E2E Workflow Test", () => {
  it("completes full round-trip flow without data loss", () => {
    const rawMd = `---
title: QuickFieldBrush
---
# QuickFieldBrush 开发日志

- [ ] 漂移修复 2026-10-25 ~ 2026-10-28
- [/] 属性表挂载 2026-10-28 ~ 2026-11-05
`;
    // 1. Parse markdown
    const project = parseProjectMarkdown(rawMd, "QuickFieldBrush.md");
    expect(project.name).toBe("QuickFieldBrush");
    expect(project.tasks.length).toBe(2);

    // 2. Put into Store
    const store = createMatrixStore([project]);
    expect(store.getProjects()[0].progress).toBe(25); // (0 + 50) / 2 = 25%

    // 3. Export to Mermaid Gantt
    const mermaid = projectsToMermaidGantt(store.getProjects(), "QGIS Plugins Dashboard");
    expect(mermaid).toContain("section QuickFieldBrush");
    expect(mermaid).toContain("漂移修复");
    expect(mermaid).toContain("属性表挂载");

    // 4. Parse Mermaid back to verify syntax compatibility
    const fromMermaid = parseMermaidGantt(mermaid);
    expect(fromMermaid.length).toBe(1);
    expect(fromMermaid[0].tasks.length).toBe(2);

    // 5. User changes task in UI (completes task 1)
    store.updateTask(project.tasks[0].id, { status: TaskStatus.DONE, endDate: "2026-10-29" });
    const updatedTask = store.getProjects()[0].tasks[0];
    expect(updatedTask.status).toBe(TaskStatus.DONE);
    expect(store.getProjects()[0].progress).toBe(75); // (100 + 50) / 2 = 75%

    // 6. Write back to Markdown
    const updatedMd = updateTaskInMarkdown(rawMd, updatedTask);
    expect(updatedMd).toContain("- [x] 漂移修复 2026-10-25 ~ 2026-10-29");
  });
});
