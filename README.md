# MermaidMatrix (obsidian-mermaid-matrix)

> **本地优先的轻量研发项目中台**：以“一文档即一项目”的极简哲学，提供**图示化监控表格**与**交互式泳道甘特图**，并与原生 **Mermaid Gantt** 语法实现 100% 双向同步。坚果云纯文本增量同步友好，绝无私有数据库锁死。

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-7C3AED.svg)](https://obsidian.md)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()

---

## 🌟 核心设计背景与痛点解决

在开发多个 QGIS 插件（如 `QuickFieldBrush`、`AttrSnap` 等）或中大型工程项目时，现有的项目管理工具往往面临尴尬选择：
* **传统全功能插件（如 Neseser）**：强制将每个微小待办拆解为独立文件（`Tasks/*.md`），产生大量碎片文件，在坚果云多端同步时极易导致冲突副本。
* **纯手写 Mermaid 甘特图**：维护极其繁琐，每次调整起止日期、计算任务重叠都需手动计算修改代码。
* **第三方云端看板（ClickUp / Linear / Jira）**：无法与本地 Markdown 知识库深度融合，割裂了笔记与代码开发上下文。

**MermaidMatrix** 采用了**“中台解耦 + 纯文本双向绑定”**的架构方案：
1. **一文一项目**：每个插件或工程保留一份完整的 `.md` 记录详细技术方案、踩坑点与待办列表。
2. **多项目大盘**：自动扫描指定目录，各项目独占一条横向泳道（Swimlane），在同一个大盘中全局横向对比与协同。
3. **交互式拖拽**：在甘特图上自由拖拽伸缩工期、在表格中下拉切换状态，插件**静默双向写回底层 Markdown**。
4. **Mermaid 原生互通**：支持一键导出/转换标准 ````mermaid gantt` 语法，脱离插件也能在 GitHub、手机端和通用 Markdown 渲染器中完美呈现。

---

## 🧭 功能全景

### 1. 📊 图示化监控表格 (Visual Table)
* **状态胶囊切换**：提供 `待办 (To Do)`、`进行中 (Active)`、`已完成 (Done)`、`阻塞 (Blocked)` 4 色状态药丸，一键下拉切换。
* **动态进度条**：根据子任务完成情况实时聚合计算完成率 `[██████░░░░] 60%`。
* **快捷日历微调**：原生日期选择器快速指定起止日期（`YYYY-MM-DD`）。
* **精准上下文直达**：点击行右侧跳转按钮 `↗`，直接打开对应项目的 `.md` 文件并自动高亮聚焦到所在行。

### 2. ⏱ 交互式泳道甘特图 (Interactive Swimlane Gantt)
* **项目泳道聚合**：每个项目作为独立 Section 泳道排列，纵览所有插件的并行排期。
* **鼠标拖拽调整**：
  * **整体平移**：按住色块条拖动快速平移整个工期。
  * **两端伸缩**：按住左/右侧手柄，横向拉伸或缩短计划时间。
* **时间轴缩放**：支持 `紧凑 (24px/天)`、`标准 (36px/天)`、`宽展 (48px/天)` 三档缩放。
* **红线今日指示器**：精确标定当前日期时间线，逾期风险一目了然。

### 3. 🧜‍♀️ 标准 Mermaid 原生双向同步
* 自动生成符合 Mermaid 规范的标准代码块：
  ```mermaid
  gantt
      dateFormat YYYY-MM-DD
      title QGIS 插件集群研发进度大盘
      excludes weekends
      section QuickFieldBrush
      漂移修复 :done, task_1, 2026-10-25, 2026-10-28
      属性表挂载 :active, task_2, 2026-10-28, 2026-11-05
  ```
* 提供一键复制与 Markdown 块嵌入弹窗。

---

## 📝 Markdown 编写规范（零心智负担）

您无需改变任何日常写作习惯，在任何项目笔记（例如 `QGIS插件开发/QuickFieldBrush.md`）中正常记录即可：

```markdown
---
title: QuickFieldBrush
type: project
---
# QuickFieldBrush 核心架构与开发详情

这里记录技术方案、底层 QgsMapCanvas 画布挂载逻辑...

## 📅 任务排期
- [x] 漂移 Bug 根因修复 2026-10-25 ~ 2026-10-28
- [/] 原生属性表功能挂载 2026-10-28 ~ 2026-11-05
- [ ] 性能高频压测 2026-11-06 ~ 2026-11-10
- [-] 废弃的旧接口清理
```

### 识别规则对照：
| 标记 | 状态枚举 | 默认完成率 | 说明 |
| :--- | :--- | :--- | :--- |
| `- [ ]` | `todo` | `0%` | 待办事项 |
| `- [/]` 或 `- [>]` | `in-progress` | `50%` | 进行中任务 |
| `- [x]` 或 `- [X]` | `done` | `100%` | 已完成任务 |
| `- [-]` | `blocked` | `0%` | 阻塞/搁置任务 |
| `YYYY-MM-DD ~ YYYY-MM-DD` | 排期区间 | - | 支持 `~`、`至`、`to` 或 `⏳ 📅` 表情符号 |

---

## 🛠 工程构建与本地安装

### 1. 编译构建
```bash
# 安装依赖
npm install

# 运行自动化测试 (10 个单元与 E2E 测试全部覆盖)
npm test

# 生产环境打包 (输出 main.js 与 styles.css)
npm run build
```

### 2. 部署到您的 Obsidian Vault
1. 在您的 Obsidian 库目录中找到或新建：`<Vault根目录>/.obsidian/plugins/mermaid-matrix/`
2. 将本项目根目录下的以下文件复制进该目录：
   * `manifest.json`
   * `main.js`
   * `styles.css`
3. 打开 Obsidian -> 设置 -> 第三方插件 -> 启用 **MermaidMatrix**。
4. 点击左侧工具栏新增的 **🧭 MermaidMatrix** 图标，或按 `Ctrl + P` 输入 `打开项目中台大盘` 即可！

---

## 🏗 代码架构设计

```text
MermaidMatrix/
├── src/
│   ├── types.ts                 # 领域模型定义 (TaskItem, ProjectData, TaskStatus)
│   ├── main.ts                  # Obsidian Plugin 入口与事件监听
│   ├── core/
│   │   ├── parser.ts            # Markdown 任务提取器与行内静默写回引擎
│   │   ├── mermaid-converter.ts # 领域模型 ⇄ 标准 Mermaid gantt 双向转换
│   │   └── store.ts             # 响应式状态管理 (订阅发布模型)
│   └── ui/
│       ├── MatrixView.ts        # Obsidian ItemView 适配层
│       ├── MatrixApp.svelte     # 中台大盘主容器与视图路由
│       └── components/
│           ├── VisualTable.svelte   # 状态药丸、完成率进度条、日期选择表格
│           ├── GanttChart.svelte    # 矢量多泳道、工期拖拽伸缩交互甘特图
│           └── MermaidModal.svelte  # Mermaid 语法源码导出预览弹窗
├── tests/                       # Vitest 单元与端到端集成测试集
│   ├── types.test.ts
│   ├── parser.test.ts
│   ├── mermaid-converter.test.ts
│   ├── store.test.ts
│   └── e2e.test.ts
├── esbuild.config.mjs           # 极速打包构建脚本 (Svelte + TS)
├── manifest.json                # Obsidian 官方插件元信息清单
└── package.json
```

---

## 📄 License
MIT License © 2026 OpenQGIS
