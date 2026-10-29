import { describe, it, expect } from "vitest";
import { projectsToMermaidGantt, parseMermaidGantt } from "../src/core/mermaid-converter";
import { ProjectData, TaskStatus } from "../src/types";

describe("Bi-directional Mermaid Gantt Converter", () => {
  const sampleProjects: ProjectData[] = [
    {
      id: "qfb",
      name: "QuickFieldBrush",
      filePath: "QuickFieldBrush.md",
      progress: 50,
      tasks: [
        {
          id: "task_1",
          projectId: "qfb",
          projectName: "QuickFieldBrush",
          title: "漂移修复",
          status: TaskStatus.DONE,
          startDate: "2026-10-25",
          endDate: "2026-10-28",
          progress: 100
        },
        {
          id: "task_2",
          projectId: "qfb",
          projectName: "QuickFieldBrush",
          title: "属性表挂载",
          status: TaskStatus.IN_PROGRESS,
          startDate: "2026-10-28",
          endDate: "2026-11-05",
          progress: 50
        }
      ]
    }
  ];

  it("converts projects into valid Mermaid gantt syntax", () => {
    const code = projectsToMermaidGantt(sampleProjects, "QGIS Plugins Dashboard");
    expect(code).toContain("gantt");
    expect(code).toContain("dateFormat YYYY-MM-DD");
    expect(code).toContain("section QuickFieldBrush");
    expect(code).toContain("漂移修复 :done, task_1, 2026-10-25, 2026-10-28");
    expect(code).toContain("属性表挂载 :active, task_2, 2026-10-28, 2026-11-05");
  });

  it("parses Mermaid gantt code back into ProjectData structures", () => {
    const mermaidCode = `gantt
    dateFormat YYYY-MM-DD
    title QGIS Plugins Dashboard
    section QuickFieldBrush
    漂移修复 :done, task_1, 2026-10-25, 2026-10-28
    属性表挂载 :active, task_2, 2026-10-28, 2026-11-05
    section AttrSnap
    拓扑捕获算法 :crit, active, task_3, 2026-11-01, 2026-11-15
`;
    const parsed = parseMermaidGantt(mermaidCode);
    expect(parsed.length).toBe(2);
    expect(parsed[0].name).toBe("QuickFieldBrush");
    expect(parsed[0].tasks.length).toBe(2);
    expect(parsed[0].tasks[0].status).toBe(TaskStatus.DONE);
    expect(parsed[1].name).toBe("AttrSnap");
    expect(parsed[1].tasks[0].title).toBe("拓扑捕获算法");
  });
});
