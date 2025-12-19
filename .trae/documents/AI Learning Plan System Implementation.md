我已分析项目结构和数据库模式，以下是满足您需求的详细实施计划。

## 1. 项目设置与依赖安装
- **动作**: 安装 AI 集成所需的依赖包。
- **依赖**:
  - `@langchain/core`
  - `@langchain/openai` (兼容 DeepSeek)
  - `@langchain/community`

## 2. Supabase 客户端重构 (数据隐私)
- **目标**: 允许用户使用自己的数据库 Key，同时保持对环境变量的兼容。
- **实现**:
  - 修改 `src/lib/supabase.ts`，优先从 `localStorage` 读取配置，若不存在则降级使用 `import.meta.env`。
  - 确保应用在缺少 Key 时能优雅处理，引导用户前往设置页面。

## 3. 状态管理 (Pinia)
- **动作**: 创建新的 Pinia store `src/stores/settingsStore.ts`。
- **状态**:
  - `supabaseUrl`: 用户的 Supabase URL。
  - `supabaseKey`: 用户的 Supabase Anon Key。
  - `llmApiKey`: 用户的 LLM (DeepSeek) API Key。
  - `llmBaseUrl`: LLM Base URL (默认 DeepSeek 地址)。
- **持久化**: 自动将这些值保存到 `localStorage`。

## 4. 界面实现
### A. 设置页面 (`src/views/Settings.vue`)
- **功能**:
  - Supabase URL 和 Key 的输入框。
  - LLM API Key 和 Base URL 的输入框。
  - "保存并重载" 按钮，用于应用数据库连接变更。

### B. AI 计划生成器 (`src/views/PlanGenerator.vue`)
- **功能**:
  - **用户信息表单**:
    - 身份/角色 (如：学生、前端开发)
    - 工作年限 (如：0年、3年)
    - 心动岗位 JD (粘贴文本)
    - 学习周期 (周数)
  - **交互界面**:
    - "生成规划" 按钮。
    - 带有进度反馈的加载状态。
  - **预览与保存**:
    - 展示生成的里程碑摘要。
    - "初始化数据库" 按钮，将规划保存到 `tasks` 和 `milestones` 表。

## 5. AI 逻辑与提示词工程
- **提示词设计**:
  - 构建结构化的 Prompt，指导 AI 严格按照 `tasks` 和 `milestones` 表结构生成 JSON 数据。
  - Prompt 将包含日期计算逻辑，基于"今天"生成具体的 `date` 和 `target_date` 字段。
- **集成**:
  - 使用 `LangChain` 调用 LLM。
  - 解析 JSON 响应。
  - 使用配置好的客户端将数据批量插入 Supabase。

## 6. 手动使用的提示词 (需求 1)
我将提供一个专门的 Markdown 文件 (`PROMPTS.md`)，其中包含优化后的提示词模板。如果您不想使用 API 集成，可以直接复制该内容到 Trae/Cursor 中手动生成规划。

## 执行顺序
1. 安装依赖。
2. 创建 `PROMPTS.md`。
3. 实现 `settingsStore` 和 `Settings.vue`。
4. 重构 `supabase.ts`。
5. 实现 `PlanGenerator.vue` 和 AI 逻辑。
6. 更新路由以包含新页面。
