import { ProjectData, TaskItem, TaskStatus, calculateProgress } from "../types";

export type StoreSubscriber = (projects: ProjectData[]) => void;

export class MatrixStore {
  private projects: ProjectData[] = [];
  private subscribers: Set<StoreSubscriber> = new Set();
  private searchQuery: string = "";
  private statusFilter: string = "all";

  constructor(initialProjects: ProjectData[] = []) {
    this.projects = JSON.parse(JSON.stringify(initialProjects));
  }

  public subscribe(callback: StoreSubscriber): () => void {
    this.subscribers.add(callback);
    callback(this.getProjects());
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify(): void {
    const data = this.getProjects();
    for (const sub of this.subscribers) {
      sub(data);
    }
  }

  public getProjects(): ProjectData[] {
    return JSON.parse(JSON.stringify(this.projects));
  }

  public setProjects(projects: ProjectData[]): void {
    this.projects = JSON.parse(JSON.stringify(projects));
    for (const p of this.projects) {
      p.progress = calculateProgress(p.tasks);
    }
    this.notify();
  }

  public updateTask(taskId: string, patch: Partial<TaskItem>): TaskItem | null {
    for (const project of this.projects) {
      const taskIndex = project.tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        const task = project.tasks[taskIndex];
        const updated = { ...task, ...patch };

        if (patch.status && !patch.progress) {
          if (patch.status === TaskStatus.DONE) updated.progress = 100;
          else if (patch.status === TaskStatus.IN_PROGRESS) updated.progress = 50;
          else if (patch.status === TaskStatus.TODO || patch.status === TaskStatus.BLOCKED) updated.progress = 0;
        }

        project.tasks[taskIndex] = updated;
        project.progress = calculateProgress(project.tasks);
        this.notify();
        return updated;
      }
    }
    return null;
  }

  public findTask(taskId: string): TaskItem | null {
    for (const p of this.projects) {
      const task = p.tasks.find(t => t.id === taskId);
      if (task) return task;
    }
    return null;
  }
}

export function createMatrixStore(initialProjects: ProjectData[] = []): MatrixStore {
  return new MatrixStore(initialProjects);
}
