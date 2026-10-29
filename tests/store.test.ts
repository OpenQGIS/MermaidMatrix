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

  it("updates task dates accurately and triggers subscribers", () => {
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

    let callbackCount = 0;
    store.subscribe(() => {
      callbackCount++;
    });

    store.updateTask("t1", { startDate: "2026-10-26", endDate: "2026-11-02" });
    const task = store.getProjects()[0].tasks[0];
    expect(task.startDate).toBe("2026-10-26");
    expect(task.endDate).toBe("2026-11-02");
    expect(callbackCount).toBeGreaterThan(0);
  });
});
