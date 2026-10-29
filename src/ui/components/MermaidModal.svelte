<script lang="ts">
  export let mermaidCode: string = "";
  export let onClose: () => void = () => {};
  export let onCopy: () => void = () => {};

  let copied = false;

  function handleCopy() {
    navigator.clipboard.writeText(`\`\`\`mermaid\n${mermaidCode}\n\`\`\``);
    copied = true;
    onCopy();
    setTimeout(() => {
      copied = false;
    }, 2000);
  }
</script>

<div class="matrix-modal-backdrop" on:click={onClose}>
  <div class="matrix-modal-card" on:click|stopPropagation>
    <div class="modal-header">
      <div class="modal-title">🧜‍♀️ Mermaid Gantt 源码导出</div>
      <button class="modal-close-btn" on:click={onClose}>✕</button>
    </div>

    <div class="modal-desc">
      标准 Mermaid Gantt 原生语法，100% 兼容 Obsidian、GitHub 以及坚果云纯文本 Markdown 渲染。
    </div>

    <div class="code-preview-wrap">
      <pre><code>```mermaid
{mermaidCode}
```</code></pre>
    </div>

    <div class="modal-actions">
      <button class="copy-btn" on:click={handleCopy}>
        {copied ? "✓ 已复制到剪贴板！" : "📋 复制标准 Mermaid 代码"}
      </button>
      <button class="close-btn" on:click={onClose}>关闭</button>
    </div>
  </div>
</div>

<style>
  .matrix-modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .matrix-modal-card {
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    width: 620px;
    max-width: 90vw;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-normal);
  }

  .modal-close-btn {
    background: none;
    border: none;
    font-size: 16px;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
  }
  .modal-close-btn:hover {
    color: var(--text-normal);
    background: var(--background-modifier-hover);
  }

  .modal-desc {
    font-size: 12.5px;
    color: var(--text-muted);
  }

  .code-preview-wrap {
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    max-height: 320px;
    overflow-y: auto;
    padding: 12px;
  }

  pre {
    margin: 0;
    font-family: var(--font-monospace);
    font-size: 12px;
    line-height: 1.5;
    color: var(--text-normal);
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 8px;
  }

  .copy-btn {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    padding: 6px 16px;
    border-radius: 5px;
    font-weight: 500;
    cursor: pointer;
    font-size: 13px;
  }
  .copy-btn:hover {
    filter: brightness(1.1);
  }

  .close-btn {
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    color: var(--text-normal);
    padding: 6px 14px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 13px;
  }
  .close-btn:hover {
    background: var(--background-modifier-hover);
  }
</style>
