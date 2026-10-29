<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { MatrixStore } from "../core/store";
  import { ProjectData, TaskItem, MermaidMatrixSettings } from "../types";
  import { projectsToMermaidGantt } from "../core/mermaid-converter";
  import VisualTable from "./components/VisualTable.svelte";
  import GanttChart from "./components/GanttChart.svelte";
  import MermaidModal from "./components/MermaidModal.svelte";

  export let store: MatrixStore;
  export let settings: MermaidMatrixSettings;
  export let onSaveTaskToMarkdown: (task: TaskItem) => Promise<void> = async () => {};
  export let onOpenNote: (filePath: string, lineIndex?: number) => void = () => {};
  export let onScanVault: () => Promise<void> = async () => {};

  let projects: ProjectData[] = [];
  let viewMode: "split" | "table" | "gantt" = settings.defaultView || "split";
  let searchQuery = "";
  let showMermaidModal = false;
  let generatedMermaidCode = "";
  let isScanning = false;

  let unsubscribe: (() => void) | null = null;

  onMount(() => {
    unsubscribe = store.subscribe((allProjects) => {
      projects = allProjects;
    });
  });

  onDestroy(() => {
    if (unsubscribe) unsubscribe();
  });

  // Filter projects by search query
  $: filteredProjects = projects.map(p => {
    if (!searchQuery.trim()) return p;
    const q = searchQuery.toLowerCase();
    const matchingTasks = p.tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q)
    );
    return {
      ...p,
      tasks: matchingTasks
    };
  }).filter(p => p.tasks.length > 0 || p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  async function handleUpdateTask(task: TaskItem) {
    store.updateTask(task.id, task);
    await onSaveTaskToMarkdown(task);
  }

  function handleSelectTask(task: TaskItem) {
    // Optional focus / scroll
  }

  function handleOpenMermaidModal() {
    generatedMermaidCode = projectsToMermaidGantt(projects, "QGIS 插件集群研发进度大盘");
    showMermaidModal = true;
  }

  async function triggerVaultScan() {
    isScanning = true;
    try {
      await onScanVault();
    } finally {
      isScanning = false;
    }
  }
</script>

<div class="matrix-app-container">
  <!-- Top App Navigation / Toolbar -->
  <header class="matrix-topbar">
    <div class="topbar-left">
      <div class="app-logo">
        <span class="logo-icon">🧭</span>
        <span class="logo-title">MermaidMatrix</span>
      </div>
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          placeholder="搜索项目或待办..."
          bind:value={searchQuery}
        />
        {#if searchQuery}
          <button class="clear-search-btn" on:click={() => searchQuery = ""}>✕</button>
        {/if}
      </div>
    </div>

    <div class="topbar-right">
      <!-- View mode switch -->
      <div class="view-switcher">
        <button
          class="switch-btn"
          class:active={viewMode === "split"}
          on:click={() => viewMode = "split"}
          title="双栏并排 (表格 + 甘特图)"
        >
          ◫ 综合大盘
        </button>
        <button
          class="switch-btn"
          class:active={viewMode === "table"}
          on:click={() => viewMode = "table"}
          title="纯表格监控视图"
        >
          ☰ 监控表格
        </button>
        <button
          class="switch-btn"
          class:active={viewMode === "gantt"}
          on:click={() => viewMode = "gantt"}
          title="纯泳道甘特图"
        >
          ☵ 泳道甘特
        </button>
      </div>

      <button
        class="icon-action-btn"
        class:spinning={isScanning}
        title="刷新/重新扫描项目笔记"
        on:click={triggerVaultScan}
      >
        🔄
      </button>

      <button
        class="primary-action-btn"
        title="导出为标准 Mermaid 语法"
        on:click={handleOpenMermaidModal}
      >
        🧜‍♀️ 导出 Mermaid
      </button>
    </div>
  </header>

  <!-- Workspace View Body -->
  <main class="matrix-main-body mode-{viewMode}">
    {#if viewMode === "split"}
      <div class="pane pane-table">
        <div class="pane-header">📊 任务监控表格</div>
        <div class="pane-content">
          <VisualTable
            projects={filteredProjects}
            onUpdateTask={handleUpdateTask}
            onOpenNote={onOpenNote}
            onSelectTask={handleSelectTask}
          />
        </div>
      </div>
      <div class="pane-divider"></div>
      <div class="pane pane-gantt">
        <div class="pane-header">⏱ 交互式泳道甘特图</div>
        <div class="pane-content">
          <GanttChart
            projects={filteredProjects}
            onUpdateTask={handleUpdateTask}
            onSelectTask={handleSelectTask}
          />
        </div>
      </div>
    {:else if viewMode === "table"}
      <div class="pane pane-full">
        <VisualTable
          projects={filteredProjects}
          onUpdateTask={handleUpdateTask}
          onOpenNote={onOpenNote}
          onSelectTask={handleSelectTask}
        />
      </div>
    {:else if viewMode === "gantt"}
      <div class="pane pane-full">
        <GanttChart
          projects={filteredProjects}
          onUpdateTask={handleUpdateTask}
          onSelectTask={handleSelectTask}
        />
      </div>
    {/if}
  </main>

  <!-- Mermaid Modal -->
  {#if showMermaidModal}
    <MermaidModal
      mermaidCode={generatedMermaidCode}
      onClose={() => showMermaidModal = false}
      onCopy={() => {}}
    />
  {/if}
</div>

<style>
  .matrix-app-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: var(--background-primary);
    overflow: hidden;
    font-family: var(--font-interface);
  }

  .matrix-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background: var(--background-secondary);
    border-bottom: 1px solid var(--background-modifier-border);
    flex-shrink: 0;
  }

  .topbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .app-logo {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .logo-icon {
    font-size: 16px;
  }
  .logo-title {
    font-weight: 700;
    font-size: 14.5px;
    letter-spacing: -0.01em;
    color: var(--text-normal);
  }

  .search-box {
    display: flex;
    align-items: center;
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    padding: 3px 8px;
    width: 220px;
    gap: 6px;
  }
  .search-icon {
    font-size: 12px;
    color: var(--text-muted);
  }
  .search-box input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 12px;
    color: var(--text-normal);
    width: 100%;
  }
  .clear-search-btn {
    border: none;
    background: none;
    color: var(--text-muted);
    font-size: 11px;
    cursor: pointer;
    padding: 0;
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .view-switcher {
    display: flex;
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    padding: 2px;
  }
  .switch-btn {
    border: none;
    background: none;
    font-size: 12px;
    padding: 3px 10px;
    border-radius: 4px;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .switch-btn.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    font-weight: 500;
  }

  .icon-action-btn {
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    padding: 5px 8px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s ease;
  }
  .icon-action-btn:hover {
    background: var(--background-modifier-hover);
  }
  .spinning {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    100% { transform: rotate(360deg); }
  }

  .primary-action-btn {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: 6px;
    padding: 5px 12px;
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: filter 0.15s ease;
  }
  .primary-action-btn:hover {
    filter: brightness(1.1);
  }

  .matrix-main-body {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
  }

  .pane {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .pane-header {
    padding: 6px 14px;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--text-muted);
    background: var(--background-secondary-alt);
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .pane-content {
    flex: 1;
    overflow: hidden;
  }

  .pane-table {
    flex: 1;
    min-width: 320px;
  }
  .pane-gantt {
    flex: 1.2;
    min-width: 400px;
  }
  .pane-divider {
    width: 1px;
    background: var(--background-modifier-border);
  }

  .pane-full {
    width: 100%;
    height: 100%;
  }
</style>
