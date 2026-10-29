<script lang="ts">
  import { ProjectData, TaskItem, TaskStatus } from "../../types";

  export let projects: ProjectData[] = [];
  export let onUpdateTask: (task: TaskItem) => void = () => {};
  export let onSelectTask: (task: TaskItem) => void = () => {};

  let dayWidth = 36;
  const rowHeight = 36;
  const headerHeight = 44;
  const sidebarWidth = 180;

  // Compute time bounds
  let minDateMs = 0;
  let maxDateMs = 0;
  let totalDays = 30;
  let dateList: Date[] = [];
  let todayMs = new Date().setHours(0, 0, 0, 0);

  $: {
    let min = Infinity;
    let max = -Infinity;

    for (const p of projects) {
      for (const t of p.tasks) {
        if (t.startDate) {
          const s = new Date(t.startDate).getTime();
          if (!isNaN(s) && s < min) min = s;
        }
        if (t.endDate) {
          const e = new Date(t.endDate).getTime();
          if (!isNaN(e) && e > max) max = e;
        }
      }
    }

    if (min === Infinity || max === -Infinity) {
      const now = new Date();
      min = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      max = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();
    }

    // Add 3 days buffer on each side
    minDateMs = min - 3 * 86400000;
    maxDateMs = max + 7 * 86400000;
    totalDays = Math.max(14, Math.round((maxDateMs - minDateMs) / 86400000));

    const list: Date[] = [];
    for (let i = 0; i < totalDays; i++) {
      list.push(new Date(minDateMs + i * 86400000));
    }
    dateList = list;
  }

  function getXFromDate(dateStr: string): number {
    const t = new Date(dateStr).getTime();
    if (isNaN(t)) return 0;
    const diff = (t - minDateMs) / 86400000;
    return diff * dayWidth;
  }

  function getDateFromX(x: number): string {
    const days = Math.round(x / dayWidth);
    const d = new Date(minDateMs + days * 86400000);
    return d.toISOString().slice(0, 10);
  }

  function getBarWidth(start: string, end: string): number {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (isNaN(s) || isNaN(e)) return dayWidth;
    const days = Math.max(1, Math.round((e - s) / 86400000) + 1);
    return days * dayWidth;
  }

  // Drag interaction state
  let draggingTask: TaskItem | null = null;
  let dragMode: "move" | "resize-left" | "resize-right" | null = null;
  let startMouseX = 0;
  let initialStartX = 0;
  let initialWidth = 0;

  function onMouseDown(e: MouseEvent, task: TaskItem, mode: "move" | "resize-left" | "resize-right") {
    e.stopPropagation();
    draggingTask = task;
    dragMode = mode;
    startMouseX = e.clientX;
    initialStartX = getXFromDate(task.startDate);
    initialWidth = getBarWidth(task.startDate, task.endDate);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  function onMouseMove(e: MouseEvent) {
    if (!draggingTask || !dragMode) return;
    const dx = e.clientX - startMouseX;

    if (dragMode === "move") {
      const newX = initialStartX + dx;
      const newStartDate = getDateFromX(newX);
      const daysDuration = Math.round(initialWidth / dayWidth);
      const endD = new Date(new Date(newStartDate).getTime() + (daysDuration - 1) * 86400000);
      draggingTask.startDate = newStartDate;
      draggingTask.endDate = endD.toISOString().slice(0, 10);
    } else if (dragMode === "resize-right") {
      const newWidth = Math.max(dayWidth, initialWidth + dx);
      const daysDuration = Math.round(newWidth / dayWidth);
      const endD = new Date(new Date(draggingTask.startDate).getTime() + (daysDuration - 1) * 86400000);
      draggingTask.endDate = endD.toISOString().slice(0, 10);
    } else if (dragMode === "resize-left") {
      const newX = initialStartX + dx;
      const newStartDate = getDateFromX(newX);
      if (new Date(newStartDate).getTime() <= new Date(draggingTask.endDate).getTime()) {
        draggingTask.startDate = newStartDate;
      }
    }
    projects = [...projects];
  }

  function onMouseUp() {
    if (draggingTask) {
      onUpdateTask(draggingTask);
      draggingTask = null;
      dragMode = null;
    }
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }

  function getStatusColor(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.DONE: return "#10b981";
      case TaskStatus.IN_PROGRESS: return "#3b82f6";
      case TaskStatus.BLOCKED: return "#ef4444";
      default: return "#8b5cf6";
    }
  }

  function isWeekend(d: Date): boolean {
    const day = d.getDay();
    return day === 0 || day === 6;
  }
</script>

<div class="matrix-gantt-root">
  <!-- Controls toolbar -->
  <div class="gantt-toolbar">
    <div class="zoom-controls">
      <span class="label">时间轴缩放:</span>
      <button class="zoom-btn" class:active={dayWidth === 24} on:click={() => dayWidth = 24}>紧凑</button>
      <button class="zoom-btn" class:active={dayWidth === 36} on:click={() => dayWidth = 36}>标准</button>
      <button class="zoom-btn" class:active={dayWidth === 48} on:click={() => dayWidth = 48}>宽展</button>
    </div>
    <div class="legend">
      <span class="legend-item"><span class="dot" style="background:#8b5cf6;"></span>待办</span>
      <span class="legend-item"><span class="dot" style="background:#3b82f6;"></span>进行中</span>
      <span class="legend-item"><span class="dot" style="background:#10b981;"></span>已完成</span>
      <span class="legend-item"><span class="dot" style="background:#ef4444;"></span>阻塞</span>
    </div>
  </div>

  <div class="gantt-scroll-area">
    <div class="gantt-layout" style="width: {sidebarWidth + totalDays * dayWidth}px;">
      <!-- Timeline Header -->
      <div class="gantt-header-row" style="height: {headerHeight}px;">
        <div class="header-sidebar" style="width: {sidebarWidth}px;">
          <span>项目 / 泳道</span>
        </div>
        <div class="header-timeline" style="width: {totalDays * dayWidth}px;">
          {#each dateList as d, i}
            <div
              class="header-day-cell"
              class:weekend={isWeekend(d)}
              class:is-today={d.getTime() === todayMs}
              style="left: {i * dayWidth}px; width: {dayWidth}px;"
            >
              <div class="day-month">{d.getDate() === 1 || i === 0 ? `${d.getMonth() + 1}月` : ""}</div>
              <div class="day-number">{d.getDate()}</div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Swimlanes Body -->
      <div class="gantt-body">
        <!-- Today vertical indicator line -->
        {#if todayMs >= minDateMs && todayMs <= maxDateMs}
          {@const todayX = ((todayMs - minDateMs) / 86400000) * dayWidth + sidebarWidth}
          <div class="today-marker-line" style="left: {todayX}px;"></div>
        {/if}

        {#each projects as project}
          <!-- Project Swimlane Header -->
          <div class="swimlane-project-banner">
            <div class="banner-sidebar" style="width: {sidebarWidth}px;">
              📁 {project.name} ({project.tasks.length})
            </div>
            <div class="banner-track" style="width: {totalDays * dayWidth}px;"></div>
          </div>

          <!-- Task Rows -->
          {#each project.tasks as task}
            {@const x = getXFromDate(task.startDate)}
            {@const width = getBarWidth(task.startDate, task.endDate)}
            <div class="gantt-task-row" style="height: {rowHeight}px;">
              <div class="task-sidebar-label" style="width: {sidebarWidth}px;" title={task.title}>
                {task.title}
              </div>
              <div class="task-track-area" style="width: {totalDays * dayWidth}px;">
                <!-- Grid background lines -->
                {#each dateList as d, i}
                  <div
                    class="track-grid-col"
                    class:weekend={isWeekend(d)}
                    style="left: {i * dayWidth}px; width: {dayWidth}px;"
                  ></div>
                {/each}

                <!-- Interactive Gantt Task Bar -->
                <div
                  class="gantt-bar status-{task.status}"
                  style="left: {x}px; width: {width}px; background-color: {getStatusColor(task.status)};"
                  on:mousedown={(e) => onMouseDown(e, task, "move")}
                  on:click={() => onSelectTask(task)}
                  title={`${task.title} (${task.startDate} ~ ${task.endDate})`}
                >
                  <!-- Left resize handle -->
                  <div
                    class="drag-handle handle-left"
                    on:mousedown|stopPropagation={(e) => onMouseDown(e, task, "resize-left")}
                  ></div>

                  <!-- Bar content label -->
                  <span class="bar-title">{task.title}</span>

                  <!-- Right resize handle -->
                  <div
                    class="drag-handle handle-right"
                    on:mousedown|stopPropagation={(e) => onMouseDown(e, task, "resize-right")}
                  ></div>
                </div>
              </div>
            </div>
          {/each}
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .matrix-gantt-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    background: var(--background-primary);
    overflow: hidden;
  }

  .gantt-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    background: var(--background-secondary);
    border-bottom: 1px solid var(--background-modifier-border);
    font-size: 12px;
  }
  .zoom-controls {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .zoom-controls .label {
    color: var(--text-muted);
  }
  .zoom-btn {
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid var(--background-modifier-border);
    background: var(--background-primary);
    color: var(--text-normal);
    cursor: pointer;
    font-size: 11.5px;
  }
  .zoom-btn.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
  }

  .legend {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    color: var(--text-muted);
  }
  .legend-item .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .gantt-scroll-area {
    flex: 1;
    overflow: auto;
    position: relative;
  }

  .gantt-layout {
    position: relative;
  }

  .gantt-header-row {
    display: flex;
    position: sticky;
    top: 0;
    z-index: 20;
    background: var(--background-secondary);
    border-bottom: 1px solid var(--background-modifier-border);
  }
  .header-sidebar {
    padding: 10px 14px;
    font-weight: 600;
    color: var(--text-muted);
    font-size: 12px;
    border-right: 1px solid var(--background-modifier-border);
    background: var(--background-secondary);
    position: sticky;
    left: 0;
    z-index: 25;
  }
  .header-timeline {
    position: relative;
    height: 100%;
  }
  .header-day-cell {
    position: absolute;
    top: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-right: 1px solid var(--background-modifier-border);
    font-size: 10px;
    color: var(--text-muted);
  }
  .header-day-cell.weekend {
    background: rgba(0, 0, 0, 0.04);
  }
  .header-day-cell.is-today {
    background: rgba(239, 68, 68, 0.12);
    color: #ef4444;
    font-weight: bold;
  }
  .day-month {
    font-size: 9px;
  }
  .day-number {
    font-size: 11px;
    font-weight: 600;
  }

  .gantt-body {
    position: relative;
  }

  .today-marker-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #ef4444;
    z-index: 15;
    pointer-events: none;
  }

  .swimlane-project-banner {
    display: flex;
    background: var(--background-secondary-alt);
    border-bottom: 1px solid var(--background-modifier-border);
    font-weight: 600;
    font-size: 12px;
    padding: 6px 0;
  }
  .banner-sidebar {
    padding-left: 14px;
    position: sticky;
    left: 0;
    background: var(--background-secondary-alt);
    z-index: 10;
  }

  .gantt-task-row {
    display: flex;
    position: relative;
    border-bottom: 1px solid var(--background-modifier-border);
  }
  .gantt-task-row:hover {
    background: var(--background-modifier-hover);
  }

  .task-sidebar-label {
    padding: 8px 14px;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-right: 1px solid var(--background-modifier-border);
    background: var(--background-primary);
    position: sticky;
    left: 0;
    z-index: 10;
  }

  .task-track-area {
    position: relative;
    height: 100%;
  }

  .track-grid-col {
    position: absolute;
    top: 0;
    bottom: 0;
    border-right: 1px solid var(--background-modifier-border);
    pointer-events: none;
  }
  .track-grid-col.weekend {
    background: rgba(0, 0, 0, 0.02);
  }

  .gantt-bar {
    position: absolute;
    top: 6px;
    height: 24px;
    border-radius: 4px;
    color: #ffffff;
    font-size: 11px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px;
    cursor: grab;
    user-select: none;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    transition: transform 0.05s ease, box-shadow 0.1s ease;
    z-index: 5;
  }
  .gantt-bar:hover {
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    filter: brightness(1.05);
  }
  .gantt-bar:active {
    cursor: grabbing;
  }

  .bar-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0 4px;
  }

  .drag-handle {
    width: 6px;
    height: 100%;
    cursor: ew-resize;
    background: rgba(255, 255, 255, 0.35);
    border-radius: 2px;
  }
  .drag-handle:hover {
    background: rgba(255, 255, 255, 0.8);
  }
</style>
