import { Plugin, WorkspaceLeaf, PluginSettingTab, App, Setting, Notice, Editor, MarkdownView } from "obsidian";
import { MatrixView, MERMAID_MATRIX_VIEW_TYPE } from "./ui/MatrixView";
import { MatrixStore, createMatrixStore } from "./core/store";
import { MermaidMatrixSettings, DEFAULT_SETTINGS } from "./types";
import { projectsToMermaidGantt } from "./core/mermaid-converter";
import { DateRangeModal } from "./ui/DateRangeModal";

export default class MermaidMatrixPlugin extends Plugin {
  settings: MermaidMatrixSettings = DEFAULT_SETTINGS;
  store: MatrixStore = createMatrixStore([]);

  async onload(): Promise<void> {
    await this.loadSettings();

    // Register View
    this.registerView(
      MERMAID_MATRIX_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new MatrixView(leaf, this.store, this.settings)
    );

    // Ribbon Icon on left bar
    this.addRibbonIcon("layout-dashboard", "打开 MermaidMatrix 项目中台", () => {
      this.activateView();
    });

    // Command: Open Dashboard
    this.addCommand({
      id: "open-mermaid-matrix-dashboard",
      name: "打开项目中台大盘 (Dashboard)",
      callback: () => {
        this.activateView();
      }
    });

    // Command: Date Range Picker for Current Line in Editor
    this.addCommand({
      id: "pick-task-date-range",
      name: "弹出日历面板设置当前行排期日期 (Date Picker)",
      editorCallback: (editor: Editor) => {
        new DateRangeModal(this.app, editor).open();
      }
    });

    // Editor Context Menu: Right-click to pick date
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor: Editor) => {
        menu.addItem((item) => {
          item
            .setTitle("📅 设置/修改排期日期 (MermaidMatrix)")
            .setIcon("calendar")
            .onClick(() => {
              new DateRangeModal(this.app, editor).open();
            });
        });
      })
    );

    // Command: Export Mermaid Gantt
    this.addCommand({
      id: "export-all-mermaid-gantt",
      name: "导出当前项目甘特图为 Mermaid 代码",
      callback: () => {
        const projects = this.store.getProjects();
        if (projects.length === 0) {
          new Notice("当前没有检测到有效的项目或任务");
          return;
        }
        const mermaid = projectsToMermaidGantt(projects);
        navigator.clipboard.writeText(`\`\`\`mermaid\n${mermaid}\n\`\`\``);
        new Notice("🧜‍♀️ 已成功复制标准 Mermaid Gantt 代码到剪贴板！");
      }
    });

    // Add Settings Tab
    this.addSettingTab(new MermaidMatrixSettingTab(this.app, this));

    // Listen to Vault modifications to automatically update dashboard
    this.registerEvent(
      this.app.vault.on("modify", () => {
        this.refreshActiveViews();
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", () => {
        this.refreshActiveViews();
      })
    );
    this.registerEvent(
      this.app.vault.on("rename", () => {
        this.refreshActiveViews();
      })
    );
  }

  async onunload(): Promise<void> {
    this.app.workspace.detachLeavesOfType(MERMAID_MATRIX_VIEW_TYPE);
  }

  async activateView(): Promise<void> {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(MERMAID_MATRIX_VIEW_TYPE);

    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getLeaf("tab");
      if (leaf) {
        await leaf.setViewState({
          type: MERMAID_MATRIX_VIEW_TYPE,
          active: true,
        });
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  private refreshActiveViews(): void {
    const leaves = this.app.workspace.getLeavesOfType(MERMAID_MATRIX_VIEW_TYPE);
    for (const leaf of leaves) {
      if (leaf.view instanceof MatrixView) {
        leaf.view.scanVault();
      }
    }
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}

class MermaidMatrixSettingTab extends PluginSettingTab {
  plugin: MermaidMatrixPlugin;

  constructor(app: App, plugin: MermaidMatrixPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "MermaidMatrix 设置" });

    new Setting(containerEl)
      .setName("目标扫描文件夹")
      .setDesc("仅扫描该文件夹下的 Markdown 项目笔记（留空则扫描整个 Vault 仓库）")
      .addText((text) =>
        text
          .setPlaceholder("如：QGIS插件开发")
          .setValue(this.plugin.settings.scanFolder)
          .onChange(async (value) => {
            this.plugin.settings.scanFolder = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("默认视图布局")
      .setDesc("打开大盘时默认展示的视图风格")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("split", "综合大盘 (表格 + 甘特图)")
          .addOption("table", "纯表格监控")
          .addOption("gantt", "纯泳道甘特图")
          .setValue(this.plugin.settings.defaultView)
          .onChange(async (value: "split" | "table" | "gantt") => {
            this.plugin.settings.defaultView = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
