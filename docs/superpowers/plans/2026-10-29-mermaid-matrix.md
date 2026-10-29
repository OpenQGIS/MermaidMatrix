# MermaidMatrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `MermaidMatrix` Obsidian plugin (`obsidian-mermaid-matrix`), a project middle-office dashboard offering visual table monitoring, interactive swimlane Gantt charting, and bi-directional native Mermaid syntax synchronization.

**Architecture:** A lightweight local-first middle-office engine. The parser extracts task items, metadata, and dates from Markdown project notes and standard Mermaid Gantt syntax. Svelte 4 + TypeScript reactive stores render a dual-view split dashboard (Visual Status Table + SVG Interactive Swimlane Gantt). Any UI manipulation (drag-drop dates, status badge changes) silently updates the underlying Markdown or Mermaid representation.

**Tech Stack:** TypeScript, Svelte 4, esbuild, Obsidian API, Vitest (TDD unit tests).

## Global Constraints

- **Repository**: `https://github.com/OpenQGIS/MermaidMatrix.git`
- **Output Bundle**: `main.js`, `manifest.json`, `styles.css`
- **Target Platform**: Obsidian Desktop & Mobile (iOS / Android / Windows / macOS / Linux)
- **Data Integrity**: Zero proprietary binary databases; pure Markdown text and Mermaid code blocks compatible with Nutstore (坚果云) sync.

---

### Task 1: Scaffolding, Build Pipeline & Core Data Types

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `esbuild.config.mjs`
- Create: `manifest.json`
- Create: `src/types.ts`
- Create: `vitest.config.ts`
- Test: `tests/types.test.ts`

**Interfaces:**
- Produces: `TaskItem`, `ProjectData`, `TaskStatus`, `GanttSection`, `MermaidMatrixSettings` defined in `src/types.ts`

- [ ] **Step 1: Write test for core types validation**

Create `tests/types.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { TaskStatus, isValidDateString } from "../src/types";

describe("Core Types and Helpers", () => {
  it("validates standard task status enum values", () => {
    expect(TaskStatus.TODO).toBe("todo");
    expect(TaskStatus.IN_PROGRESS).toBe("in-progress");
    expect(TaskStatus.DONE).toBe("done");
    expect(TaskStatus.BLOCKED).toBe("blocked");
  });

  it("validates date string formats YYYY-MM-DD", () => {
    expect(isValidDateString("2026-10-29")).toBe(true);
    expect(isValidDateString("2026-02-30")).toBe(false);
    expect(isValidDateString("invalid")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/types.test.ts`
Expected: FAIL (types and function not found)

- [ ] **Step 3: Implement package.json, configs, and types.ts**

Write `package.json`, `tsconfig.json`, `esbuild.config.mjs`, `manifest.json`, and `src/types.ts`.
In `src/types.ts`:
```typescript
export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in-progress",
  DONE = "done",
  BLOCKED = "blocked"
}

export interface TaskItem {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  status: TaskStatus;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  progress: number;  // 0 - 100
  filePath?: string;
  lineIndex?: number;
  tags?: string[];
}

export interface ProjectData {
  id: string;
  name: string;
  filePath: string;
  tasks: TaskItem[];
  progress: number;
}

export interface MermaidMatrixSettings {
  scanFolder: string;
  defaultView: "split" | "table" | "gantt";
  dateFormat: string;
}

export function isValidDateString(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json esbuild.config.mjs manifest.json vitest.config.ts src/types.ts tests/types.test.ts
git commit -m "chore: setup build pipeline, vitest and core types"
```

---

### Task 2: Markdown Task & Frontmatter Parser Engine

**Files:**
- Create: `src/core/parser.ts`
- Test: `tests/parser.test.ts`

**Interfaces:**
- Consumes: `TaskItem`, `TaskStatus`, `ProjectData` from `src/types.ts`
- Produces: `parseProjectMarkdown(content: string, filePath: string): ProjectData` and `updateTaskInMarkdown(content: string, task: TaskItem): string`

- [ ] **Step 1: Write the failing tests for Markdown parser**

Create `tests/parser.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/parser.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal parser implementation**

Implement `src/core/parser.ts` supporting standard Obsidian checkbox markers:
- `[ ]` -> `TODO` (0% progress)
- `[/]` or `[>]` -> `IN_PROGRESS` (50% progress)
- `[x]` or `[X]` -> `DONE` (100% progress)
- `[-]` -> `BLOCKED` (0% progress)
Support date parsing from `YYYY-MM-DD ~ YYYY-MM-DD` or `⏳ YYYY-MM-DD 📅 YYYY-MM-DD`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/parser.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/parser.ts tests/parser.test.ts
git commit -m "feat: implement markdown task & frontmatter parser with test suite"
```

---

### Task 3: Bi-directional Mermaid Gantt Converter

**Files:**
- Create: `src/core/mermaid-converter.ts`
- Test: `tests/mermaid-converter.test.ts`

**Interfaces:**
- Consumes: `ProjectData`, `TaskItem`, `TaskStatus` from `src/types.ts`
- Produces: `projectsToMermaidGantt(projects: ProjectData[], title?: string): string` and `parseMermaidGantt(mermaidContent: string): ProjectData[]`

- [ ] **Step 1: Write the failing tests for Mermaid converter**

Create `tests/mermaid-converter.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/mermaid-converter.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Mermaid converter**

Implement `src/core/mermaid-converter.ts`:
- Handle `section` matching project name.
- Map `:done` to `TaskStatus.DONE`, `:active` to `TaskStatus.IN_PROGRESS`, `:crit` flags, and default to `TaskStatus.TODO`.
- Calculate dates and identifiers cleanly.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/mermaid-converter.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/mermaid-converter.ts tests/mermaid-converter.test.ts
git commit -m "feat: implement bi-directional mermaid gantt converter"
```

---

### Task 4: Reactive Middle-Office Store & Obsidian Vault Scanner

**Files:**
- Create: `src/core/store.ts`
- Test: `tests/store.test.ts`

**Interfaces:**
- Consumes: `ProjectData`, `TaskItem`, `parseProjectMarkdown`, `projectsToMermaidGantt`
- Produces: `matrixStore`, `updateTaskStatus`, `updateTaskDates`, `filterProjects`

- [ ] **Step 1: Write test for reactive store state operations**

Create `tests/store.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { createMatrixStore } from "../src/core/store";
import { TaskStatus } from "../src/types";

describe("Matrix Store State Management", () => {
  it("manages projects and allows task status updates", () => {
    const store = createMatrixStore([
      {
        id: "p1",
        name: "TestProject",
        filePath: "p1.md",
        progress: 0,
        tasks: [
          {
            id: "t1",
            projectId: "p1",
            projectName: "TestProject",
            title: "Task 1",
            status: TaskStatus.TODO,
            startDate: "2026-10-25",
            endDate: "2026-10-30",
            progress: 0
          }
        ]
      }
    ]);

    expect(store.getProjects()[0].tasks[0].status).toBe(TaskStatus.TODO);
    store.updateTask("t1", { status: TaskStatus.DONE });
    expect(store.getProjects()[0].tasks[0].status).toBe(TaskStatus.DONE);
    expect(store.getProjects()[0].progress).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/store.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement store.ts**

Write `src/core/store.ts` with subscribers and state management.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/store.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/store.ts tests/store.test.ts
git commit -m "feat: implement reactive matrix store"
```

---

### Task 5: UI Components (Visual Table + Interactive Swimlane Gantt + Styles)

**Files:**
- Create: `src/ui/components/VisualTable.svelte`
- Create: `src/ui/components/GanttChart.svelte`
- Create: `src/ui/components/MermaidModal.svelte`
- Create: `src/ui/MatrixApp.svelte`
- Create: `src/ui/MatrixView.ts`
- Create: `styles.css`
- Create: `src/main.ts`

**Interfaces:**
- Connects Obsidian `ItemView` and ribbon icon (`table-columns` or `compass`) to open `MermaidMatrix` middle-office tab.
- Renders SplitContainer with Visual Table on left/top and Interactive Gantt on right/bottom.
- Renders Mermaid export modal with syntax highlighting and one-click copy/insert.

- [ ] **Step 1: Implement Svelte UI components and styles**

Write:
- `src/ui/components/VisualTable.svelte`: Status badge dropdowns, dynamic progress bars, quick search filter, jump to Markdown note.
- `src/ui/components/GanttChart.svelte`: Responsive SVG Gantt canvas, swimlanes grouped by project, draggable bar handles for start/end dates, day/week grid lines, today indicator marker.
- `src/ui/components/MermaidModal.svelte`: Instant preview of generated Mermaid Gantt code with copy button and insert-to-note button.
- `src/ui/MatrixApp.svelte`: Root dashboard container connecting stores and views.
- `src/ui/MatrixView.ts`: Obsidian `ItemView` subclass (`MERMAID_MATRIX_VIEW_TYPE = "mermaid-matrix-view"`).
- `src/main.ts`: Obsidian plugin entry point registering command, ribbon icon, view, and settings.
- `styles.css`: High-end dark/light theme compatible CSS, refined borders, badges, and smooth hover animations.

- [ ] **Step 2: Run build pipeline**

Run: `npm run build`
Expected: Successful compilation to `main.js` and `styles.css` without errors.

- [ ] **Step 3: Commit**

```bash
git add src/ui/ styles.css src/main.ts
git commit -m "feat: implement visual table, interactive gantt chart and obsidian view"
```

---

### Task 6: End-to-End Verification, Documentation & Git Push

**Files:**
- Create: `README.md`
- Create: `tests/e2e.test.ts`

- [ ] **Step 1: Write E2E test verifying full flow (Markdown -> Model -> Mermaid -> Mutation -> Markdown)**

Create `tests/e2e.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { parseProjectMarkdown, updateTaskInMarkdown } from "../src/core/parser";
import { projectsToMermaidGantt, parseMermaidGantt } from "../src/core/mermaid-converter";
import { TaskStatus } from "../src/types";

describe("E2E Workflow Test", () => {
  it("completes full round-trip flow without data loss", () => {
    const rawMd = `---
title: QuickFieldBrush
---
- [ ] 漂移修复 2026-10-25 ~ 2026-10-28
- [/] 属性表挂载 2026-10-28 ~ 2026-11-05
`;
    // 1. Parse markdown
    const project = parseProjectMarkdown(rawMd, "QuickFieldBrush.md");
    expect(project.tasks.length).toBe(2);

    // 2. Export to Mermaid Gantt
    const mermaid = projectsToMermaidGantt([project]);
    expect(mermaid).toContain("section QuickFieldBrush");

    // 3. Mutate task in model
    const updatedTask = { ...project.tasks[0], status: TaskStatus.DONE };

    // 4. Update Markdown
    const updatedMd = updateTaskInMarkdown(rawMd, updatedTask);
    expect(updatedMd).toContain("- [x] 漂移修复 2026-10-25 ~ 2026-10-28");
  });
});
```

- [ ] **Step 2: Run all tests**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 3: Write comprehensive README.md**

Document plugin architecture, features, installation, Mermaid syntax compatibility, and QGIS plugin development tracking guide.

- [ ] **Step 4: Commit & Push to GitHub repository**

```bash
git add README.md tests/e2e.test.ts
git commit -m "docs: add README and E2E verification test"
git push -u origin main
```
