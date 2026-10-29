import { TaskItem, TaskStatus, ProjectData, calculateProgress } from "../types";

export function parseProjectMarkdown(content: string, filePath: string): ProjectData {
  const lines = content.split(/\r?\n/);
  let projectName = "";

  // Extract from Frontmatter
  let inFrontmatter = false;
  let frontmatterEndIndex = -1;
  const frontmatterMap: Record<string, string> = {};

  if (lines.length > 0 && lines[0].trim() === "---") {
    inFrontmatter = true;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === "---") {
        inFrontmatter = false;
        frontmatterEndIndex = i;
        break;
      }
      const match = line.match(/^([a-zA-Z0-9_\-]+)\s*:\s*(.*)$/);
      if (match) {
        frontmatterMap[match[1].toLowerCase()] = match[2].trim().replace(/^['"]|['"]$/g, "");
      }
    }
  }

  if (frontmatterMap["title"]) {
    projectName = frontmatterMap["title"];
  } else if (frontmatterMap["name"]) {
    projectName = frontmatterMap["name"];
  }

  // If no frontmatter title, look for first H1 header
  if (!projectName) {
    for (let i = Math.max(0, frontmatterEndIndex); i < lines.length; i++) {
      const h1Match = lines[i].match(/^#\s+(.+)$/);
      if (h1Match) {
        projectName = h1Match[1].trim();
        break;
      }
    }
  }

  // Fallback to basename of file
  if (!projectName) {
    const base = filePath.replace(/\\/g, "/").split("/").pop() || "Untitled Project";
    projectName = base.replace(/\.md$/i, "");
  }

  const tasks: TaskItem[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match Markdown checkbox: - [ ] or * [ ]
    const taskMatch = line.match(/^(\s*[-*]\s*\[([ xX\/>\-\?])\])\s*(.+)$/);
    if (!taskMatch) continue;

    const marker = taskMatch[2];
    const fullText = taskMatch[3].trim();

    let status = TaskStatus.TODO;
    let progress = 0;

    if (marker === "x" || marker === "X") {
      status = TaskStatus.DONE;
      progress = 100;
    } else if (marker === "/" || marker === ">") {
      status = TaskStatus.IN_PROGRESS;
      progress = 50;
    } else if (marker === "-") {
      status = TaskStatus.BLOCKED;
      progress = 0;
    }

    // Date parsing:
    // Pattern A: 2026-10-25 ~ 2026-10-28 or 2026-10-25 至 2026-10-28
    const dateRangeMatch = fullText.match(/(\d{4}-\d{2}-\d{2})\s*(?:~|至|to)\s*(\d{4}-\d{2}-\d{2})/);
    // Pattern B: ⏳ 2026-10-25 📅 2026-10-28
    const emojiRangeMatch = fullText.match(/⏳\s*(\d{4}-\d{2}-\d{2})\s*📅\s*(\d{4}-\d{2}-\d{2})/);
    // Pattern C: Single date 📅 2026-10-28
    const singleDateMatch = fullText.match(/📅\s*(\d{4}-\d{2}-\d{2})/);

    let startDate = today;
    let endDate = today;

    if (dateRangeMatch) {
      startDate = dateRangeMatch[1];
      endDate = dateRangeMatch[2];
    } else if (emojiRangeMatch) {
      startDate = emojiRangeMatch[1];
      endDate = emojiRangeMatch[2];
    } else if (singleDateMatch) {
      endDate = singleDateMatch[1];
      startDate = endDate;
    }

    // Clean title by stripping date parts and tags
    let cleanTitle = fullText
      .replace(/(\d{4}-\d{2}-\d{2})\s*(?:~|至|to)\s*(\d{4}-\d{2}-\d{2})/g, "")
      .replace(/⏳\s*\d{4}-\d{2}-\d{2}/g, "")
      .replace(/📅\s*\d{4}-\d{2}-\d{2}/g, "")
      .trim();

    // Remove tags like #tag
    const tags: string[] = [];
    cleanTitle = cleanTitle.replace(/#([\w\-]+)/g, (_, t) => {
      tags.push(t);
      return "";
    }).trim();

    const taskId = `${filePath}:${i}`;

    tasks.push({
      id: taskId,
      projectId: filePath,
      projectName,
      title: cleanTitle,
      status,
      startDate,
      endDate,
      progress,
      filePath,
      lineIndex: i,
      tags
    });
  }

  const overallProgress = calculateProgress(tasks);

  return {
    id: filePath,
    name: projectName,
    filePath,
    tasks,
    progress: overallProgress
  };
}

export function updateTaskInMarkdown(content: string, task: TaskItem): string {
  const lines = content.split(/\r?\n/);
  if (task.lineIndex === undefined || task.lineIndex < 0 || task.lineIndex >= lines.length) {
    return content;
  }

  const oldLine = lines[task.lineIndex];
  // Determine new checkbox marker
  let marker = " ";
  if (task.status === TaskStatus.DONE) marker = "x";
  else if (task.status === TaskStatus.IN_PROGRESS) marker = "/";
  else if (task.status === TaskStatus.BLOCKED) marker = "-";

  // Check prefix indentation and bullet
  const prefixMatch = oldLine.match(/^(\s*[-*]\s*\[)[ xX\/>\-\?]+(\]\s*)/);
  if (!prefixMatch) return content;

  // Format date range
  const dateStr = `${task.startDate} ~ ${task.endDate}`;
  const newLine = `${prefixMatch[1]}${marker}${prefixMatch[2]}${task.title} ${dateStr}`;

  lines[task.lineIndex] = newLine;
  return lines.join("\n");
}
