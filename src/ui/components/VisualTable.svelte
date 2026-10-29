<script lang="ts">
  import { TaskItem, ProjectData, TaskStatus } from "../../types";

  export let projects: ProjectData[] = [];
  export let onUpdateTask: (task: TaskItem) => void = () => {};
  export let onOpenNote: (filePath: string, lineIndex?: number) => void = () => {};
  export let onSelectTask: (task: TaskItem) => void = () => {};

  let collapsedProjects: Record<string, boolean> = {};

  function toggleCollapse(projectId: string) {
    collapsedProjects[projectId] = !collapsedProjects[projectId];
    collapsedProjects = { ...collapsedProjects };
  }

  function handleStatusChange(task: TaskItem, newStatus: TaskStatus) {
    const updated = { ...task, status: newStatus };
    if (newStatus === TaskStatus.DONE) updated.progress = 100;
    else if (newStatus === TaskStatus.IN_PROGRESS && updated.progress === 0) updated.progress = 50;
    else if (newStatus === TaskStatus.TODO) updated.progress = 0;
    onUpdateTask(updated);
  }

  function handleStartDateChange(task: TaskItem, e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.value) {
      onUpdateTask({ ...task, startDate: target.value });
    }
  }

  function handleEndDateChange(task: TaskItem, e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.value) {
      onUpdateTask({ ...task, endDate: target.value });
    }
  }
</script>

<div class="matrix-table-container">
  {#if projects.length === 0}
    <div class="matrix-empty-state">
      <div class="empty-icon">📋</div>
      <div class="empty-title">未检测到带有任务排期的 Markdown 文档</div>
      <div class="empty-hint">在任何笔记中写入 <code>- [ ] 任务标题 2026-10-25 ~ 2026-10-28</code> 即可自动识别。</div>
    </div>
  {:else}
    <div class="matrix-table">
      <div class="table-header">
        <div class="col-title">任务名称 / 项目</div>
        <div class="col-status">状态</div>
        <div class="col-dates">排期区间</div>
        <div class="col-progress">进度</div>
        <div class="col-actions">操作</div>
      </div>

      <div class="table-body">
        {#each projects as project (project.id)}
          <div class="project-group">
            <!-- Project Header Row -->
            <div class="project-row" on:click={() => toggleCollapse(project.id)}>
              <div class="project-info">
                <span class="collapse-icon">{collapsedProjects[project.id] ? "▶" : "▼"}</span>
                <span class="project-name" title={project.filePath}>{project.name}</span>
                <span class="task-count-badge">{project.tasks.length} 项待办</span>
              </div>
              <div class="project-meta">
                <div class="progress-bar-wrap" title={`总完成率: ${project.progress}%`}>
                  <div class="progress-bar-fill" style="width: {project.progress}%;"></div>
                </div>
                <span class="progress-text">{project.progress}%</span>
                <button
                  class="action-btn"
                  title="在 Obsidian 中打开该项目笔记"
                  on:click|stopPropagation={() => onOpenNote(project.filePath)}
                >
                  📄
                </button>
              </div>
            </div>

            <!-- Task Rows -->
            {#if !collapsedProjects[project.id]}
              {#each project.tasks as task (task.id)}
                <div
                  class="task-row status-{task.status}"
                  on:click={() => onSelectTask(task)}
                >
                  <div class="col-title task-title-col">
                    <span class="task-bullet">•</span>
                    <span class="task-title" title={task.title}>{task.title}</span>
                  </div>

                  <div class="col-status">
                    <select
                      class="status-select select-{task.status}"
                      value={task.status}
                      on:change={(e) => handleStatusChange(task, e.currentTarget.value)}
                      on:click|stopPropagation
                    >
                      <option value={TaskStatus.TODO}>待办 (To Do)</option>
                      <option value={TaskStatus.IN_PROGRESS}>进行中 (Active)</option>
                      <option value={TaskStatus.DONE}>已完成 (Done)</option>
                      <option value={TaskStatus.BLOCKED}>阻塞 (Blocked)</option>
                    </select>
                  </div>

                  <div class="col-dates" on:click|stopPropagation>
                    <input
                      type="date"
                      class="date-input"
                      value={task.startDate}
                      on:change={(e) => handleStartDateChange(task, e)}
                    />
                    <span class="date-sep">~</span>
                    <input
                      type="date"
                      class="date-input"
                      value={task.endDate}
                      on:change={(e) => handleEndDateChange(task, e)}
                    />
                  </div>

                  <div class="col-progress">
                    <div class="task-progress-wrap">
                      <div class="task-progress-bar" style="width: {task.progress}%;"></div>
                    </div>
                    <span class="task-progress-num">{task.progress}%</span>
                  </div>

                  <div class="col-actions">
                    <button
                      class="jump-note-btn"
                      title="直达笔记对应待办行"
                      on:click|stopPropagation={() => onOpenNote(task.filePath || project.filePath, task.lineIndex)}
                    >
                      ↗
                    </button>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .matrix-table-container {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    font-size: 13px;
    color: var(--text-normal);
    background-color: var(--background-primary);
  }

  .matrix-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
  }
  .empty-icon {
    font-size: 36px;
    margin-bottom: 12px;
  }
  .empty-title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 6px;
  }
  .empty-hint {
    color: var(--text-muted);
    font-size: 13px;
  }
  .empty-hint code {
    background: var(--background-secondary);
    padding: 2px 6px;
    border-radius: 4px;
  }

  .matrix-table {
    display: flex;
    flex-direction: column;
    width: 100%;
    border-collapse: collapse;
  }

  .table-header {
    display: flex;
    align-items: center;
    padding: 8px 14px;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    background: var(--background-secondary);
    border-bottom: 1px solid var(--background-modifier-border);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .col-title { flex: 2; min-width: 180px; }
  .col-status { width: 130px; }
  .col-dates { width: 220px; }
  .col-progress { width: 120px; display: flex; align-items: center; gap: 8px; }
  .col-actions { width: 50px; text-align: center; }

  .project-group {
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .project-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: var(--background-secondary-alt);
    cursor: pointer;
    user-select: none;
    transition: background 0.15s ease;
  }
  .project-row:hover {
    background: var(--background-modifier-hover);
  }

  .project-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .collapse-icon {
    font-size: 10px;
    color: var(--text-muted);
    width: 12px;
  }
  .project-name {
    font-weight: 600;
    font-size: 13.5px;
    color: var(--text-normal);
  }
  .task-count-badge {
    font-size: 11px;
    background: var(--background-modifier-border);
    color: var(--text-muted);
    padding: 2px 7px;
    border-radius: 10px;
  }

  .project-meta {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .progress-bar-wrap {
    width: 90px;
    height: 6px;
    background: var(--background-modifier-border);
    border-radius: 3px;
    overflow: hidden;
  }
  .progress-bar-fill {
    height: 100%;
    background: var(--interactive-accent);
    border-radius: 3px;
    transition: width 0.3s ease;
  }
  .progress-text {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    width: 35px;
    text-align: right;
  }

  .task-row {
    display: flex;
    align-items: center;
    padding: 7px 14px 7px 28px;
    border-top: 1px solid var(--background-modifier-border);
    transition: background 0.1s ease;
  }
  .task-row:hover {
    background: var(--background-modifier-hover);
  }

  .task-title-col {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .task-bullet {
    color: var(--text-muted);
  }
  .task-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .status-select {
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 11.5px;
    font-weight: 500;
    border: 1px solid transparent;
    cursor: pointer;
    outline: none;
    background: var(--background-primary);
  }
  .select-todo {
    color: var(--text-muted);
    border-color: var(--background-modifier-border);
  }
  .select-in-progress {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.12);
    border-color: rgba(59, 130, 246, 0.3);
  }
  .select-done {
    color: #10b981;
    background: rgba(16, 185, 129, 0.12);
    border-color: rgba(16, 185, 129, 0.3);
  }
  .select-blocked {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.12);
    border-color: rgba(239, 68, 68, 0.3);
  }

  .date-input {
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    color: var(--text-normal);
    font-size: 11.5px;
    padding: 2px 4px;
    border-radius: 4px;
    outline: none;
  }
  .date-sep {
    color: var(--text-muted);
    margin: 0 4px;
    font-size: 12px;
  }

  .task-progress-wrap {
    width: 60px;
    height: 5px;
    background: var(--background-modifier-border);
    border-radius: 3px;
    overflow: hidden;
  }
  .task-progress-bar {
    height: 100%;
    background: #10b981;
    border-radius: 3px;
  }
  .task-progress-num {
    font-size: 11px;
    color: var(--text-muted);
    width: 30px;
  }

  .action-btn, .jump-note-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 12px;
    color: var(--text-muted);
    padding: 3px 6px;
    border-radius: 4px;
    transition: all 0.15s ease;
  }
  .action-btn:hover, .jump-note-btn:hover {
    color: var(--text-normal);
    background: var(--background-modifier-hover);
  }
</style>
