import { ItemView, WorkspaceLeaf, TFile } from "obsidian";
import MatrixApp from "./MatrixApp.svelte";
import { MatrixStore } from "../core/store";
import { TaskItem, MermaidMatrixSettings } from "../types";
import { parseProjectMarkdown, updateTaskInMarkdown } from "../core/parser";

export const MERMAID_MATRIX_VIEW_TYPE = "mermaid-matrix-view";

export class MatrixView extends ItemView {
  private component: MatrixApp | null = null;
  private store: MatrixStore;
  private settings: MermaidMatrixSettings;

  constructor(leaf: WorkspaceLeaf, store: MatrixStore, settings: MermaidMatrixSettings) {
    super(leaf);
    this.store = store;
    this.settings = settings;
  }

  getViewType(): string {
    return MERMAID_MATRIX_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "MermaidMatrix 项目中台";
  }

  getIcon(): string {
    return "layout-dashboard";
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();

    // Mount Svelte App
    this.component = new MatrixApp({
      target: container,
      props: {
        store: this.store,
        settings: this.settings,
        onSaveTaskToMarkdown: this.handleSaveTaskToMarkdown.bind(this),
        onOpenNote: this.handleOpenNote.bind(this),
        onScanVault: this.scanVault.bind(this)
      }
    });

    // Initial Vault Scan
    await this.scanVault();
  }

  async onClose(): Promise<void> {
    if (this.component) {
      this.component.$destroy();
      this.component = null;
    }
  }

  public async scanVault(): Promise<void> {
    const files = this.app.vault.getMarkdownFiles();
    const projects = [];

    const targetFolder = this.settings.scanFolder.trim();

    for (const file of files) {
      if (targetFolder && !file.path.startsWith(targetFolder)) {
        continue;
      }

      try {
        const content = await this.app.vault.read(file);
        // Only parse if it has checkboxes or frontmatter
        if (content.includes("- [") || content.includes("* [") || content.includes("type: project")) {
          const project = parseProjectMarkdown(content, file.path);
          if (project.tasks.length > 0) {
            projects.push(project);
          }
        }
      } catch (err) {
        console.error(`Failed to read file for MermaidMatrix: ${file.path}`, err);
      }
    }

    this.store.setProjects(projects);
  }

  private async handleSaveTaskToMarkdown(task: TaskItem): Promise<void> {
    if (!task.filePath) return;
    const abstractFile = this.app.vault.getAbstractFileByPath(task.filePath);
    if (abstractFile instanceof TFile) {
      try {
        const content = await this.app.vault.read(abstractFile);
        const updated = updateTaskInMarkdown(content, task);
        if (updated !== content) {
          await this.app.vault.modify(abstractFile, updated);
        }
      } catch (err) {
        console.error(`Failed to save task update to ${task.filePath}:`, err);
      }
    }
  }

  private async handleOpenNote(filePath: string, lineIndex?: number): Promise<void> {
    try {
      const leaf = this.app.workspace.getLeaf(false);
      await leaf.openFile(this.app.vault.getAbstractFileByPath(filePath) as TFile);
      if (lineIndex !== undefined && lineIndex >= 0) {
        // Position cursor if editor is active
        const view = this.app.workspace.getActiveViewOfType(ItemView);
        // @ts-ignore
        if (view && view.editor) {
          // @ts-ignore
          view.editor.setCursor({ line: lineIndex, ch: 0 });
          // @ts-ignore
          view.editor.scrollIntoView({ from: { line: lineIndex, ch: 0 }, to: { line: lineIndex, ch: 0 } }, true);
        }
      }
    } catch (err) {
      console.error(`Could not open note ${filePath}:`, err);
    }
  }
}
