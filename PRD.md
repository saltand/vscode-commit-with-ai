# PRD.md — CommitGen（VS Code 插件：基于 Git Staged 生成 Commit 信息）

## 1. 背景与目标

开发一个 VS Code 插件：读取当前 Git 仓库 **staged（已暂存）** 的变更内容，通过 AI 生成一条（或多条）commit message，并自动写入 **Source Control 的 commit 输入框**。

### 核心目标
1. 在 Source Control（SCM）区域增加一个“生成 commit 信息”的按钮，点击后自动把生成结果写入 commit input。
2. 生成期间支持“loading 状态”展示：按钮可见但不可用（灰掉），并显示旋转 loading 图标提示正在生成。
3. 提供 4 个设置项：`ai base url`、`ai model`、`ai key`、`prompt`。

### 非目标（本期不做）
- 不实现把按钮“塞进 commit input 输入框内部”（该能力属于 Proposed API，稳定版/Marketplace 不推荐）。
- 不实现自动提交（只生成并填入，不执行 git commit）。
- 不实现复杂的对话式编辑（只生成一次，用户可手动修改）。

---

## 2. 用户故事与使用流程

### 用户故事
- 作为开发者，我在提交前把改动 `git add` 到 staged，想要一键生成规范的 commit message。
- 当生成进行中，我希望 UI 明确提示“正在生成”，避免重复点击造成多次请求。

### 交互流程
1. 用户在某仓库完成 staged。
2. 打开 Source Control 视图。
3. 点击右上角（SCM 标题栏）的 **“Generate Commit Message”** 按钮。
4. 插件读取 staged 文件列表与 staged diff，调用 AI 接口生成 commit message。
5. 生成结果自动写入 commit input。
6. 生成过程中：
   - “Generate”按钮保持可见但禁用（灰掉）。
   - 同位置附近显示一个旋转的 loading 图标（或一个“Generating…”按钮）。

---

## 3. UI / UX 需求

### 3.1 按钮位置
- 放在 **Source Control 视图标题栏（scm/title）** 的 action 区域（右侧一排图标）。
- 仅在当前 SCM provider 为 `git` 时显示。

### 3.2 Loading 状态（重点）
采用“禁用而不是隐藏”的策略：
- “Generate Commit Message”按钮：
  - 始终可见（在 git provider 下）。
  - 生成中：禁用（灰掉），避免重复触发。
- 额外显示一个旋转 loading 图标按钮（或图标）：
  - 仅在生成中显示，图标使用 `$(loading~spin)`。
  - 点击无动作（no-op），只是状态提示。

### 3.3 进度提示
- 生成期间显示 VS Code 的进度提示（推荐 `ProgressLocation.SourceControl`），标题如：`CommitGen: generating…`

---

## 4. 配置项（Settings）

在 `Settings -> Extensions -> CommitGen` 下提供 4 项：

1. `commitgen.aiBaseUrl`（string）
   - AI 服务 base url（OpenAI-compatible）
   - 示例：`https://api.openai.com/v1`
2. `commitgen.aiModel`（string）
   - 模型名
   - 示例：`gpt-4o-mini`
3. `commitgen.aiKey`（string）
   - API Key（按需求做 setting；可在后续版本改用 SecretStorage）
4. `commitgen.prompt`（string）
   - Prompt 模板，支持占位符：
     - `{{files}}`：staged 文件列表（每行一个相对路径）
     - `{{diff}}`：staged diff 文本
   - 默认建议（可按团队规范调整）：
     - 输出 1 行 subject（<=72 chars）
     - 可选 body：空行 + bullets
     - 尽量使用 conventional commits（feat/fix/chore/...）

---

## 5. 功能需求（Functional Requirements）

### FR-1：读取 staged 变更
- 从 VS Code 内置 Git 扩展 API 获取当前仓库：
  - staged 文件：`repo.state.indexChanges`
  - staged diff：`repo.diff(true)`（cached/staged diff）
- 若 staged 为空：提示 `No staged changes.`，不调用 AI。

### FR-2：多仓库支持
- 若存在多个 Git 仓库：
  - 优先选取当前“被选中”的仓库（如可获取）。
  - 否则弹出 QuickPick 让用户选择仓库（可选实现，推荐实现）。

### FR-3：调用 AI 生成 commit message
- 使用 OpenAI-compatible Chat Completions 形式调用：
  - `POST {baseUrl}/chat/completions`（若 baseUrl 已含 `/v1`，则拼接为 `/v1/chat/completions`）
- 请求体：
  - `model`
  - `messages: [{ role: "user", content: prompt }]`
  - `temperature` 建议 0.2
- 超时控制：60s（AbortController）。

### FR-4：写入 commit input
- 将 AI 返回内容写入 `repo.inputBox.value`。
- 写入前 `trim()`，避免首尾空白。
- 不覆盖用户正在输入的内容？（默认覆盖，简单；可选：若 input 非空，弹窗确认/追加模式，后续版本做）

### FR-5：Loading 状态与防重复触发
- 点击生成后立即：
  - `setContext("commitgen.isGenerating", true)`
  - 本地 `inFlight = true`
- 结束（成功/失败）必须 `finally`：
  - `setContext("commitgen.isGenerating", false)`
  - `inFlight = false`

---

## 6. 非功能需求（Non-Functional Requirements）

### NFR-1：可发布性
- 仅使用稳定 API（不依赖 Proposed API），保证可上架 Marketplace。

### NFR-2：性能与容量保护
- diff 可能很大，必须做截断：
  - 例如最多 120k 字符，超出截断并在末尾追加 `…(diff truncated)…`
- staged 文件列表也可限制最大数量（例如 > 200 文件时提示并仍可继续）。

### NFR-3：稳定性与错误提示
- AI 调用失败（HTTP 非 2xx / JSON 结构异常 / 返回空）：
  - 弹出错误提示（showErrorMessage）
  - 不写入 input
- Git API 不可用：
  - 提示用户启用内置 Git 扩展（vscode.git）。

### NFR-4：安全
- `aiKey` 存在 settings 里不是最安全，但按本期需求实现。
- 后续版本建议迁移到 `SecretStorage`，并提供迁移策略。

---

## 7. 菜单与命令设计（Contributes）

### Commands
1. `commitgen.generate`
   - 标题：Generate Commit Message (from staged)
   - 图标：`$(sparkle)`
2. `commitgen.generating`
   - 标题：Generating…
   - 图标：`$(loading~spin)`
   - 行为：no-op（仅用于提示）

### Menus（scm/title）
- `commitgen.generate`
  - `when: scmProvider == git`
  - `enablement: !commitgen.isGenerating`  ← 关键：生成中禁用而不是隐藏
- `commitgen.generating`
  - `when: scmProvider == git && commitgen.isGenerating`
  - 永远 enabled（点了也没事），或也可禁用都行

---

## 8. 技术方案（实现要点）

### 8.1 获取 Git API
- `vscode.extensions.getExtension("vscode.git")?.exports.getAPI(1)`

### 8.2 数据准备
- `files = repo.state.indexChanges.map(c => workspace.asRelativePath(c.uri))`
- `diff = await repo.diff(true)`

### 8.3 Prompt 组装
- `promptTpl.replaceAll("{{files}}", filesText).replaceAll("{{diff}}", diffText)`

### 8.4 网络请求
- 使用 `fetch`（Node 18+ / VS Code 环境通常可用；必要时 fallback `node-fetch`）
- 支持 baseUrl 自动拼接 chat/completions endpoint。

### 8.5 输出解析
- 主要解析：`json.choices[0].message.content`
- 若为空则判失败。

---

## 9. 验收标准（Acceptance Criteria）

1. 在 Git 仓库的 Source Control 视图中可看到 Generate 按钮。
2. staged 有内容时点击 Generate：
   - SCM 区域显示进度提示 `CommitGen: generating…`
   - Generate 按钮立即变为禁用（灰掉）
   - 出现旋转 loading 图标提示正在生成
3. AI 返回后：
   - commit input 自动填入生成的 message
   - loading 图标消失
   - Generate 按钮恢复可用
4. staged 为空时点击 Generate：
   - 提示 `No staged changes.`
   - 不发起网络请求
5. 未配置 baseUrl/model/key 时：
   - 明确提示用户先配置
6. AI 请求失败：
   - 明确错误提示
   - 不写入 input
   - UI 状态能正确恢复（不会卡在 generating）

---

## 10. 测试清单（建议）

- 单仓库 + staged 1 文件：正常生成、写入
- 单仓库 + staged 多文件：正常生成、写入
- diff 超长：截断后仍能生成
- staged 为空：提示正确
- 多仓库：能选对仓库（或 QuickPick）
- AI 401/403/500：错误提示 + 状态恢复
- 连点按钮：不会重复请求（inFlight 生效）

---

## 11. 里程碑

- M1：跑通 Git staged -> AI -> 写入 input
- M2：完成 UI（按钮 + loading + disable）
- M3：完善错误处理、多仓库、截断保护
- M4：打包发布（vsce），编写 README 与配置说明
