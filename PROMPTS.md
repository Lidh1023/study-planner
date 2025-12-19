# AI 学习规划提示词

此提示词用于帮助用户手动生成符合 Supabase 数据库表结构的 JSON 学习规划。请将以下内容复制到 Trae 或 Cursor 的对话框中，并替换 `{}` 中的内容。

---

## 提示词模板

```markdown
Role: 你是一位专业的学习路径规划师。
Task: 根据用户的个人情况和目标，制定一份详细的学习计划。

User Profile:
- 身份: {您的身份，例如：大三学生、转行人员}
- 工作年限: {您的年限，例如：0年}
- 心动岗位JD: {请在此处粘贴您想申请的岗位JD}
- 学习周期: {预计周数，例如：12} 周

Output Requirement:
请输出一个标准的 JSON 对象，包含两个数组：`milestones` (里程碑) 和 `tasks` (每日任务)。
请严格遵守以下 Schema 定义，不要包含 JSON 以外的任何解释性文字。

Schema Definitions:

1. milestones (每周一个主要目标):
{
  "week": number, // 1 到 {学习周期}
  "title": string, // 里程碑标题
  "description": string, // 详细描述
  "target_date": string, // 目标完成日期 (YYYY-MM-DD)，假设开始日期是今天
  "completed": false
}

2. tasks (每日具体的学习任务):
{
  "date": string, // YYYY-MM-DD
  "week": number, // 对应第几周
  "day": number, // 累计第几天 (1-84)
  "type": "study" | "algorithm", // 任务类型：学习 或 算法
  "title": string, // 任务标题
  "description": string, // 任务详情
  "difficulty": "easy" | "medium" | "hard", // 难度
  "completed": false
}

Constraints:
1. 规划必须覆盖完整的 {学习周期} 周。
2. 每天至少安排 1 个 study 任务，每周至少安排 3-4 个 algorithm 任务。
3. 任务难度应循序渐进。
4. date 和 target_date 请根据当前日期推算。
```

## 使用说明
1. 将上述模板复制到 AI 助手。
2. 替换 `{}` 中的内容为您的实际情况。
3. 获取 AI 生成的 JSON 代码。
4. (可选) 如果您使用了本系统的自动导入功能，系统会自动解析此 JSON 并写入数据库。
