import { App, Modal, Editor } from "obsidian";
import DateRangePicker from "./components/DateRangePicker.svelte";

export class DateRangeModal extends Modal {
  private component: DateRangePicker | null = null;
  private initialStart: string = "";
  private initialEnd: string = "";
  private onConfirmCallback: ((start: string, end: string) => void) | null = null;
  private editor: Editor | null = null;
  private lineIndex: number = 0;

  constructor(
    app: App,
    target: Editor | { start: string; end: string; onConfirm: (s: string, e: string) => void }
  ) {
    super(app);
    const today = new Date().toISOString().slice(0, 10);

    if ("getCursor" in target) {
      this.editor = target;
      const cursor = this.editor.getCursor();
      this.lineIndex = cursor.line;
      const currentLine = this.editor.getLine(this.lineIndex);

      const match = currentLine.match(/(\d{4}-\d{2}-\d{2})\s*(?:~|至|to)\s*(\d{4}-\d{2}-\d{2})/);
      if (match) {
        this.initialStart = match[1];
        this.initialEnd = match[2];
      } else {
        this.initialStart = today;
        this.initialEnd = today;
      }
    } else {
      this.initialStart = target.start || today;
      this.initialEnd = target.end || today;
      this.onConfirmCallback = target.onConfirm;
    }
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.titleEl.setText("📅 设置任务排期区间");

    this.component = new DateRangePicker({
      target: contentEl,
      props: {
        startDate: this.initialStart,
        endDate: this.initialEnd,
        onConfirm: (start: string, end: string) => {
          if (this.onConfirmCallback) {
            this.onConfirmCallback(start, end);
          } else if (this.editor) {
            this.applyDateToLine(start, end);
          }
          this.close();
        },
        onCancel: () => {
          this.close();
        }
      }
    });
  }

  private applyDateToLine(start: string, end: string) {
    if (!this.editor) return;
    let line = this.editor.getLine(this.lineIndex);
    const dateRangeStr = `${start} ~ ${end}`;

    if (/(\d{4}-\d{2}-\d{2})\s*(?:~|至|to)\s*(\d{4}-\d{2}-\d{2})/.test(line)) {
      line = line.replace(/(\d{4}-\d{2}-\d{2})\s*(?:~|至|to)\s*(\d{4}-\d{2}-\d{2})/, dateRangeStr);
    } else {
      if (!/^\s*[-*]\s*\[[ xX\/>\-\?]?\]/.test(line)) {
        line = `- [ ] ${line.trim()} ${dateRangeStr}`;
      } else {
        line = `${line.trimEnd()} ${dateRangeStr}`;
      }
    }

    this.editor.setLine(this.lineIndex, line);
  }

  onClose() {
    if (this.component) {
      this.component.$destroy();
      this.component = null;
    }
  }
}
