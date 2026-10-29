import { ProjectData, TaskItem, TaskStatus, calculateProgress } from "../types";

export function projectsToMermaidGantt(projects: ProjectData[], title: string = "Project Matrix Dashboard"): string {
  const lines: string[] = [
    "gantt",
    "    dateFormat YYYY-MM-DD",
    `    title ${title}`,
    "    excludes weekends"
  ];

  for (const project of projects) {
    lines.push(`    section ${project.name}`);
    for (const task of project.tasks) {
      const modifiers: string[] = [];
      if (task.status === TaskStatus.DONE) {
        modifiers.push("done");
      } else if (task.status === TaskStatus.IN_PROGRESS) {
        modifiers.push("active");
      } else if (task.status === TaskStatus.BLOCKED) {
        modifiers.push("crit");
      }

      // Safe clean taskId for mermaid
      const safeId = (task.id || `task_${Math.random().toString(36).substring(2, 7)}`)
        .replace(/[^a-zA-Z0-9_-]/g, "_");

      modifiers.push(safeId);

      const modStr = modifiers.join(", ");
      lines.push(`    ${task.title} :${modStr}, ${task.startDate}, ${task.endDate}`);
    }
  }

  return lines.join("\n");
}

export function parseMermaidGantt(mermaidContent: string): ProjectData[] {
  const lines = mermaidContent.split(/\r?\n/);
  const projects: ProjectData[] = [];
  let currentProject: ProjectData | null = null;
  const today = new Date().toISOString().slice(0, 10);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("%%") || trimmed.startsWith("gantt") || trimmed.startsWith("dateFormat") || trimmed.startsWith("title") || trimmed.startsWith("excludes")) {
      continue;
    }

    const sectionMatch = trimmed.match(/^section\s+(.+)$/i);
    if (sectionMatch) {
      const sectionName = sectionMatch[1].trim();
      currentProject = {
        id: `sec_${projects.length + 1}`,
        name: sectionName,
        filePath: `${sectionName}.md`,
        tasks: [],
        progress: 0
      };
      projects.push(currentProject);
      continue;
    }

    if (!currentProject) {
      currentProject = {
        id: "default_project",
        name: "General Tasks",
        filePath: "General Tasks.md",
        tasks: [],
        progress: 0
      };
      projects.push(currentProject);
    }

    // Match task: TaskTitle :[modifiers], [id], startDate, endDate
    const taskMatch = trimmed.match(/^([^:]+)\s*:\s*(.+)$/);
    if (taskMatch) {
      const title = taskMatch[1].trim();
      const metaParts = taskMatch[2].split(",").map(s => s.trim());

      let status = TaskStatus.TODO;
      let taskId = "";
      const dates: string[] = [];

      for (const part of metaParts) {
        const lower = part.toLowerCase();
        if (lower === "done") {
          status = TaskStatus.DONE;
        } else if (lower === "active") {
          status = TaskStatus.IN_PROGRESS;
        } else if (lower === "crit") {
          if (status !== TaskStatus.DONE && status !== TaskStatus.IN_PROGRESS) {
            status = TaskStatus.BLOCKED;
          }
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
          dates.push(part);
        } else if (/^[a-zA-Z0-9_\-]+$/.test(part) && !taskId) {
          taskId = part;
        }
      }

      let startDate = today;
      let endDate = today;

      if (dates.length >= 2) {
        startDate = dates[0];
        endDate = dates[1];
      } else if (dates.length === 1) {
        startDate = dates[0];
        endDate = dates[0];
      }

      let progress = 0;
      if (status === TaskStatus.DONE) progress = 100;
      else if (status === TaskStatus.IN_PROGRESS) progress = 50;

      currentProject.tasks.push({
        id: taskId || `task_${currentProject.tasks.length + 1}`,
        projectId: currentProject.id,
        projectName: currentProject.name,
        title,
        status,
        startDate,
        endDate,
        progress,
        filePath: currentProject.filePath
      });
    }
  }

  for (const p of projects) {
    p.progress = calculateProgress(p.tasks);
  }

  return projects;
}
