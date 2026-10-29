import { describe, it, expect } from "vitest";
import { parseProjectMarkdown, updateTaskInMarkdown } from "../src/core/parser";
import { TaskStatus } from "../src/types";

describe("Markdown Task Parser", () => {
  const sampleMd = `---
type: project
title: QuickFieldBrush
---
# QuickFieldBrush 开发日志

## 待办列表
- [x] 漂移 Bug 根因修复 2026-10-25 ~ 2026-10-28
- [/] 原生属性表功能挂载 2026-10-28 ~ 2026-11-05
- [ ] 性能高频压测 2026-11-06 ~ 2026-11-10
- [-] 废弃的旧接口清理
`;

  it("correctly extracts project info and task items", () => {
    const project = parseProjectMarkdown(sampleMd, "QGIS/QuickFieldBrush.md");
    expect(project.name).toBe("QuickFieldBrush");
    expect(project.tasks.length).toBe(4);

    expect(project.tasks[0].title).toBe("漂移 Bug 根因修复");
    expect(project.tasks[0].status).toBe(TaskStatus.DONE);
    expect(project.tasks[0].startDate).toBe("2026-10-25");
    expect(project.tasks[0].endDate).toBe("2026-10-28");
    expect(project.tasks[0].progress).toBe(100);

    expect(project.tasks[1].status).toBe(TaskStatus.IN_PROGRESS);
    expect(project.tasks[2].status).toBe(TaskStatus.TODO);
    expect(project.tasks[3].status).toBe(TaskStatus.BLOCKED);
  });

  it("calculates overall project progress accurately", () => {
    const project = parseProjectMarkdown(sampleMd, "QGIS/QuickFieldBrush.md");
    // 1 done (100), 1 in_progress (50), 1 todo (0), 1 blocked (0) -> (100 + 50 + 0 + 0) / 4 = 37.5% -> 38%
    expect(project.progress).toBe(38);
  });

  it("updates task status and date in markdown accurately", () => {
    const project = parseProjectMarkdown(sampleMd, "QGIS/QuickFieldBrush.md");
    const taskToUpdate = { ...project.tasks[2], status: TaskStatus.DONE, endDate: "2026-11-08" };
    const updatedMd = updateTaskInMarkdown(sampleMd, taskToUpdate);
    expect(updatedMd).toContain("- [x] 性能高频压测 2026-11-06 ~ 2026-11-08");
  });
});
