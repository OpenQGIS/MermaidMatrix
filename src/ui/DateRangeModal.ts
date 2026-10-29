import { App, Modal, Editor } from "obsidian";
import DateRangePicker from "./components/DateRangePicker.svelte";

export class DateRangeModal extends Modal {
  private editor: Editor;
  private component: DateRangePicker | null = null;
  private initialStart: string = "";
  private initialEnd: string = "";
  private lineIndex: number = 0;

  constructor(app: App, editor: Editor) {
    super(app);
    this.editor = editor;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.titleEl.setText("📅 设置任务排期区间");

    const cursor = this.editor.getCursor();
    this.lineIndex = cursor.line;
    const currentLine = this.editor.getLine(this.lineIndex);

    // Extract existing dates if present
    const match = currentLine.match(/(\d{4}-\d{2}-\d{2})\s*(?:~|至|to)\s*(\d{4}-\d{2}-\d{2})/);
    const today = new Date().toISOString().slice(0, 10);

    if (match) {
      this.initialStart = match[1];
      this.initialEnd = match[2];
    } else {
      this.initialStart = today;
      this.initialEnd = today;
    }

    this.component = new DateRangePicker({
      target: contentEl,
      props: {
        startDate: this.initialStart,
        endDate: this.initialEnd,
        onConfirm: (start: string, end: string) => {
          this.applyDateToLine(start, end);
          this.close();
        },
        onCancel: () => {
          this.close();
        }
      }
    });
  }

  private applyDateToLine(start: string, end: string) {
    let line = this.editor.getLine(this.lineIndex);
    const dateRangeStr = `${start} ~ ${end}`;

    // If already has date range, replace it
    if (/(\d{4}-\d{2}-\d{2})\s*(?:~|至|to)\s*(\d{4}-\d{2}-\d{2})/.test(line)) {
      line = line.replace(/(\d{4}-\d{2}-\d{2})\s*(?:~|至|to)\s*(\d{4}-\d{2}-\d{2})/, dateRangeStr);
    } else {
      // If line does not have checkbox prefix, add "- [ ] "
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
