# 12WeekDev - 12 周学习计划追踪器

一个基于 Vue 3 + TypeScript + Supabase 的学习管理系统，帮助追踪前端进阶学习计划。

## ✨ 功能特性

- 📋 **每日任务** - 学习任务清单，支持完成勾选
- 📝 **每日复盘** - 记录学习心得、遇到的问题和明日计划
- 📒 **笔记链接** - 关联外部笔记（语雀/Notion/飞书）
- 📊 **进度统计** - 可视化图表展示学习进度
- 📚 **学习资源** - 精选资源推荐
- ✨ **额外学习** - 记录计划外的学习内容
- 🏆 **里程碑** - 关键节点提醒和倒计时

## 🛠 技术栈

- **前端**: Vue 3 + TypeScript + Vite
- **样式**: TailwindCSS
- **状态管理**: Pinia
- **图表**: ECharts
- **后端**: Supabase (PostgreSQL + RESTful API)

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd 12WeekDev-Template
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并填入你的 Supabase 配置：

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=你的supabase_url
VITE_SUPABASE_ANON_KEY=你的anon_key
```

### 4. 初始化数据库

在 Supabase Dashboard -> SQL Editor 中执行 `supabase/migrations/001_init.sql` 以创建表结构。

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 📁 项目结构

```
src/
├── views/           # 页面组件
├── stores/          # Pinia 状态管理
├── lib/             # Supabase 客户端
├── types/           # TypeScript 类型
└── utils/           # 工具函数
supabase/
└── migrations/      # 数据库迁移脚本
```

## 📝 License

MIT
