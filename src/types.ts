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

export const DEFAULT_SETTINGS: MermaidMatrixSettings = {
  scanFolder: "",
  defaultView: "split",
  dateFormat: "YYYY-MM-DD"
};

export function isValidDateString(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function calculateProgress(tasks: TaskItem[]): number {
  if (!tasks || tasks.length === 0) return 0;
  const sum = tasks.reduce((acc, t) => {
    if (t.status === TaskStatus.DONE) return acc + 100;
    if (t.status === TaskStatus.IN_PROGRESS) return acc + (t.progress > 0 ? t.progress : 50);
    return acc;
  }, 0);
  return Math.round(sum / tasks.length);
}
