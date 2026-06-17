---
title: Lensmor Monitor 实现计划
status: draft
---

目的：把 `requirements/*` 转为**可直接执行**的实现计划，作为唯一执行清单与状态 SSOT。
落盘位置：`{FEATURE_DIR}/implementation/plan.md`

# Lensmor Monitor 实现计划（SSOT）

> **必需技能：** `spec-execute`（按批次执行本计划）
> **上下文获取：** 必须先执行 `spec-context` 获取上下文，定位 `{FEATURE_DIR}`，失败即停止

**目标：** 交付 Lensmor Monitor MVP——自动化竞品情报监控 Web 平台的核心情报闭环
**范围：** In = 引导+竞品管理+采集+分析+收件箱+反馈；Out = 历史差异分析/战略总结/社媒分析/公司基本面自动提取
**架构：** React SPA 前端（Vite + TypeScript）+ Supabase（PostgreSQL + Auth + Storage）+ Node.js Worker（采集/分析）。前端直连 Supabase（RLS 保障数据隔离），Worker 独立进程处理异步任务。部署：Vercel（前端）+ Supabase（后端服务）。
**验收口径：** `requirements/prd.md` AC-001~AC-020；`requirements/prototype.md` 走查脚本 3 个
**影响范围：** 全新项目，无存量模块约束。`solution.md#impact-analysis` 标注所有 Context Gaps 为 Evidence Gaps。
**需遵守的不变量：** 无现有不变量（项目初始化阶段）。新建设计决策见下文。
**子仓范围：** 无（仓库不含 `.gitmodules`）

---

## TL;DR

- 一句话目标：从零构建 Lensmor Monitor Web 平台，实现"引导→监控→采集→分析→收件箱→反馈"核心闭环
- In/Out：见 PRD #2.1 范围
- 关键路径：基础架构 → 竞品管理域 → 采集分析管道 → 收件箱消费 → 反馈闭环
- 最大风险：AI 分析质量（V-002）、采集性能（V-003）、竞品发现数据源（V-001）

---

## 范围与边界

- **In**：用户注册/登录、3 步引导、竞品 CRUD+暂停/恢复/刷新、竞品详情 Overview、网站采集 Worker、数据清洗管道、AI 差异分析、分析报告收件箱（筛选/已读/详情）、情报反馈（3 种类型）
- **Out**：历史差异分析(90天)、战略总结、社媒品牌分析、公司基本面自动提取、通知推送、SSO
- **不变量/关键约束**：
  - 用户数据隔离：所有查询按 `user_id` 过滤
  - 竞品状态机：监控中 ↔ 已暂停（用户操作）；监控中 → 采集进行中 → 监控中（系统触发）
  - 反馈闭环：有误反馈需记录错误类型，后续可回溯
- **影响面**：全新项目，零模块→ 14 模块（见任务拆分）

---

## 代码工作区清单

无 submodule。单一仓库，目录结构：

```
workshop_zx/
  packages/
    web/          # React SPA (Vite + TypeScript) → Vercel
    worker/       # Node.js Worker (TypeScript) — 采集+分析
    shared/       # 共享类型/常量
  supabase/
    migrations/   # 数据库迁移 SQL
```

---

## 里程碑与节奏

- **M0（MVP）**：完成 T0–T22（23 个任务），核心情报闭环可用
  - **阶段 0（T0）**：通路验证——Supabase 建表 + 前端读写 + Vercel 部署确认
  - 阶段 1（T1–T5）：基础设施——项目脚手架、DB Schema、认证、路由框架
  - 阶段 2（T6–T10）：竞品管理域——引导流程、竞品 CRUD、详情 Overview
  - 阶段 3（T11–T15）：情报管道——采集 Worker、清洗、AI 分析、任务队列
  - 阶段 4（T16–T20）：情报消费——收件箱、报告详情、反馈
  - 阶段 5（T21–T22）：体验打磨——空状态/加载态/错误态/lint 通过

- **M1（后续）**：历史差异分析 + 战略总结 + 社媒分析（不在本计划内）

---

## 依赖与资源

- 环境/权限：Node.js 20+、Supabase 账号（已创建项目）、Vercel 账号（用于前端部署）
- 外部系统/团队：Supabase（DB + Auth + Storage）、Vercel（静态托管）
- 数据/样本：需准备 5–10 个测试竞品网站 URL 用于采集验证
- AI 服务：OpenAI API key（或其他兼容 LLM API）

---

## 风险与验证

| # | 风险/假设 | 验证方式 | 成功信号 | 失败信号 | Owner | 截止 | 下一步动作 |
|---|----------|---------|---------|---------|-------|------|-----------|
| R1 | AI 差异分析准确率不足（V-002） | 5 有变更+5 无变更网站测试 | 准确率 ≥80% | <80% | DEV | T14 完成后 | 调整 prompt / 引入人工审核 |
| R2 | 网站采集被封或超时（V-003） | 10 个竞品网站实测 | p95<30s, ≥90% 成功率 | 不达标 | DEV | T11 完成后 | 引入代理池 / 降级为静态 HTML |
| R3 | 竞品推荐数据源不可用（V-001） | 调研 2+ 数据源 API | ≥1 可用 | 0 可用 | DEV | T7 前 | 降级为手动添加 |
| R4 | 引导流程角色差异实现复杂（V-005） | prompt 参数化方案评估 | 可参数化 | 需独立管道 | DEV | T7 前 | 降级为"角色仅影响筛选视图" |

---

## 验收口径

- 追溯：`requirements/solution.md` #8 Mini-PRD（MVP In/Out + 8 AC + 交互变化结论）
- 追溯：`requirements/prd.md` #6 AC-001~AC-020
- 关键验收点：
  - 新用户 5 分钟内完成引导+添加竞品（AC-001~005）
  - 收件箱≤2s 加载，详情≤3s 展示（AC-006, AC-008）
  - 反馈流程完整（3 种类型 + 8 种错误类型）（AC-010）
  - 竞品状态机完整（暂停/恢复/刷新）（AC-013~015）
  - 用户数据隔离（AC-017）

---

## NEEDS CLARIFICATION

- C1：AI 分析模型选择
  - 缺什么：使用哪个 LLM（OpenAI GPT-4o / Claude / 其他）及 prompt 策略
  - 取证/验证方式：对比 2 个模型在 5 个样本上的分析质量和成本
  - 成功/失败信号：选定模型+ prompt 模板可稳定产出结构化分析结果
  - 下一步动作：T13 实现前确定

- C2：~~数据采集通道（4.1）详情~~ ✅ 已解决 — 4 通道确认：MVP 仅网站内容采集（文字+截图）；历史快照/社媒(Reddit)/关键词为 M1

- C3：竞品发现数据源
  - 缺什么：自动推荐竞品的数据源 API（V-001）
  - 取证/验证方式：调研 SimilarWeb/Crunchbase/Clearbit API
  - 成功/失败信号：≥1 可用
  - 下一步动作：T7（引导第3步）实现前确定；失败则手动添加

---

## 任务清单（SSOT）

> 命令默认面向 PowerShell；同一行多命令请用 `;` 分隔。

### Task T0: Supabase + Vercel 通路验证

- [ ] **状态**：未开始

**代码仓范围：** 根项目

**目的**：在铺量开发前，用最小功能验证 Supabase DB + Auth + Vercel 部署全链路通畅。

**文件：**
- 创建：`supabase/migrations/00001_health_check.sql`（一张简单表）
- 创建：`packages/web/src/lib/supabase.ts`（Supabase 客户端初始化）
- 创建：`packages/web/src/pages/Verify.tsx`（验证页面：读写一条数据）

**验收点：**
- Supabase 项目创建成功，拿到 `SUPABASE_URL` + `SUPABASE_ANON_KEY`
- `supabase/migrations/00001_health_check.sql` 在 Supabase 上执行成功
- 前端 `Verify.tsx` 页面能写入一条记录并读回展示
- 前端部署到 Vercel 后，访问线上 URL 同样能读写成功
- 验证完成后可删除 `Verify.tsx` 和 `health_check` 表（或保留用于后续 CI 冒烟测试）

**步骤 1：创建 Supabase 项目并执行迁移**
- 在 [supabase.com](https://supabase.com) 创建项目
- 创建：`supabase/migrations/00001_health_check.sql`，内容：`CREATE TABLE IF NOT EXISTS health_check (id SERIAL PRIMARY KEY, message TEXT, created_at TIMESTAMPTZ DEFAULT NOW());`
- Run: `supabase db push` 或在 Supabase Dashboard SQL Editor 中执行
- Expected: 表在 Supabase 中创建成功

**步骤 2：初始化 Supabase 客户端**
- 修改点：`packages/web/src/lib/supabase.ts`
- 内容：`import { createClient } from '@supabase/supabase-js'; export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);`
- Run: `tsc --noEmit` 编译通过
- Expected: 无类型错误

**步骤 3：创建验证页面**
- 修改点：`packages/web/src/pages/Verify.tsx`
- 功能：一个输入框 + "写入"按钮（INSERT 到 health_check）+ 下方展示最新 5 条记录（SELECT）
- Run: `npm run dev -w packages/web` → 打开 `localhost:5173/verify`
- Expected: 写一条 "Hello Lensmor"，下方列表刷新显示该记录

**步骤 4：部署到 Vercel**
- Run: `vercel --prod`（或通过 Vercel GitHub 集成自动部署）
- Expected: 访问线上 URL `/verify` 同样能读写
- 验证完成标志：线上读写链路全通

**步骤 5：提交**
- Commit message: `通路验证：Supabase + Vercel 读写链路确认通畅`
- 审计信息：
  - repo: `root`, branch: `001-lensmor-monitor`, commit: `<TBD>`, pr: `<TBD>`, changed_files: 见上

---

### Task T1: 项目脚手架与 monorepo 配置

- [ ] **状态**：未开始

**代码仓范围：** 根项目

**文件：**
- 创建：`package.json`（workspaces: web, worker, shared）、`packages/web/package.json`、`packages/worker/package.json`、`packages/shared/package.json`、`tsconfig.base.json`、各包 `tsconfig.json`、`packages/web/vite.config.ts`、`packages/web/index.html`、`.gitignore`

**验收点：**
- `npm install` 在根目录成功
- `npm run dev -w packages/web` 启动 Vite dev server (port 5173)
- shared 包可被 web/worker import

**步骤 1：初始化 monorepo**
- Run: `npm init -y`
- Expected: `package.json` created

**步骤 2：创建 packages 目录结构**
- 创建：`packages/web/`、`packages/api/`、`packages/worker/`、`packages/shared/`

**步骤 3：配置 TypeScript 共享配置与各包**
- 创建：`tsconfig.base.json` + 各包 `tsconfig.json`

**步骤 4：配置 Vite (web) + Express dev (api)**
- Run: `npm run dev`
- Expected: web on localhost:5173, api on localhost:3001

**步骤 5：提交**
- Commit message: `初始化 monorepo 项目脚手架（web/api/worker/shared）`
- 审计信息：
  - repo: `root`, branch: `001-lensmor-monitor`, commit: `<TBD>`, pr: `<TBD>`, changed_files: 见上

---

### Task T2: 数据库 Schema（Supabase Migration）

- [ ] **状态**：未开始

**文件：**
- 创建：`supabase/migrations/00002_schema.sql`
- 创建：`packages/shared/src/types/database.ts`（Supabase 生成的数据库类型）

**验收点：**
- Migration 在 Supabase 上执行成功，表全部创建
- 启用 Row Level Security (RLS)，所有表按 `user_id` 隔离
- `supabase gen types typescript` 生成数据库类型定义

**表设计：**
- `profiles` (id uuid PK, email text, role text, created_at timestamptz)
- `products` (id uuid PK, user_id uuid FK→profiles, name text, url text, description text, …)
- `competitors` (id uuid PK, user_id uuid FK→profiles, name text, domain text, status text, related_links jsonb, company_info jsonb, …)
- `analysis_reports` (id uuid PK, competitor_id uuid FK→competitors, user_id uuid FK→profiles, change_summary jsonb, strategic_intent text, action_suggestions jsonb, priority text, source_url text, read_at timestamptz, …)
- `feedbacks` (id uuid PK, report_id uuid FK→analysis_reports, user_id uuid FK→profiles, type text, error_type text, …)
- `collection_jobs` (id uuid PK, competitor_id uuid FK→competitors, status text, error text, started_at timestamptz, completed_at timestamptz)

**RLS 策略**：每张表 `CREATE POLICY "user_isolation" ON <table> USING (auth.uid() = user_id);`

**步骤 1：写 Supabase migration SQL**
- 创建：`supabase/migrations/00002_schema.sql`

**步骤 2：执行迁移**
- Run: `supabase db push` 或在 Dashboard SQL Editor 执行
- Expected: 所有表和 RLS 策略创建成功

**步骤 3：生成类型定义**
- Run: `npx supabase gen types typescript --linked > packages/shared/src/types/database.ts`
- Expected: 类型文件生成

**步骤 4：提交**
- Commit message: `创建 Supabase 数据库 Schema 与 RLS 策略`
- 审计信息：repo: `root`, branch: `001-lensmor-monitor`, commit: `<TBD>`, pr: `<TBD>`

---

### Task T3: 用户认证系统（Supabase Auth）

- [ ] **状态**：未开始

**文件：**
- 创建：`packages/web/src/lib/supabase.ts`（Supabase 客户端）
- 创建：`packages/web/src/hooks/useAuth.ts`（认证 hook：登录/注册/登出/获取 session）
- 修改：`packages/web/src/components/ProtectedRoute.tsx`（对接真实 auth）
- 修改：`packages/web/src/pages/Login.tsx`（对接 Supabase Auth）

**验收点：**
- AC-017：未登录访问任意页面 → 重定向 `/login`
- 注册成功 → Supabase 创建用户 + profiles 行 → 自动登录 → 跳转引导页
- 登录成功 → session 存储 → 后续请求自动携带
- 错误处理：邮箱格式/密码长度校验、重复注册提示、密码错误提示

**步骤 1：初始化 Supabase 客户端（如 T0 已创建则复用）**
- 修改点：`packages/web/src/lib/supabase.ts`
- Run: 导入 `createClient` → TypeScript 编译无错

**步骤 2：实现 useAuth hook**
- 修改点：`packages/web/src/hooks/useAuth.ts`
- 方法：`signUp(email, password)` / `signIn(email, password)` / `signOut()` / `getSession()`
- Run: 浏览器 console 测试 signUp → signIn → signOut 流程
- Expected: Supabase Auth 回调正常返回 user + session

**步骤 3：实现前端登录/注册页（P-001）**
- 修改点：`packages/web/src/pages/Login.tsx`
- 对齐 `prototype.md#4.1 P-001` 线框：Tab 切换登录/注册 + 邮箱密码表单 + 校验提示

**步骤 4：实现 ProtectedRoute 对接真实 auth**
- 修改点：`packages/web/src/components/ProtectedRoute.tsx`
- 检查 `supabase.auth.getSession()` 而非 localStorage

**步骤 5：运行验证**
- Run: `npm run dev`；浏览器验证：注册→自动登录→进入引导/主界面
- Expected: Supabase Auth 全流程走通

**步骤 6：提交**
- Commit message: `实现 Supabase Auth 认证系统（注册/登录/登出/路由守卫）`
- 审计信息：repo: `root`, branch: `001-lensmor-monitor`, commit: `<TBD>`

---

### Task T4: 前端路由与布局框架

- [ ] **状态**：未开始

**文件：**
- 创建：`packages/web/src/App.tsx`、`packages/web/src/router.tsx`、`packages/web/src/layouts/MainLayout.tsx`

**验收点：**
- `/login` → P-001 登录页
- `/onboarding/step-1` → P-002（需已登录+未引导）
- `/onboarding/step-2` → P-003
- `/onboarding/step-3` → P-004
- `/dashboard` → P-005（需已登录+已引导）
- `/dashboard/competitors/:id` → P-006
- `/inbox` → P-007
- `/inbox/:reportId` → P-008
- 所有受保护路由未登录 → 重定向 `/login`

**步骤 1：安装 react-router-dom**
- Run: `npm install react-router-dom -w packages/web`

**步骤 2：创建路由配置**
- 修改点：`packages/web/src/router.tsx`

**步骤 3：创建 MainLayout（header+sidebar+content）**
- 修改点：`packages/web/src/layouts/MainLayout.tsx`
- 对齐 `prototype.md#4.5 P-005` 布局（左侧 280px + 右侧内容区）

**步骤 4：运行验证**
- Run: `npm run dev`；直接访问 `/dashboard` → 重定向 `/login`
- Expected: 路由守卫生效

**步骤 5：提交**
- Commit message: `添加前端路由框架与 MainLayout 布局`
- 审计信息：repo: `root`, branch: `001-lensmor-monitor`, commit: `<TBD>`

---

### Task T5: 共享类型与 API 客户端

- [ ] **状态**：未开始

**文件：**
- 创建：`packages/shared/src/types/index.ts`（User/Product/Competitor/AnalysisReport/Feedback 类型定义）
- 创建：`packages/web/src/api/client.ts`（axios/fetch 封装 + JWT 注入）
- 创建：`packages/web/src/api/competitors.ts`、`packages/web/src/api/reports.ts`、`packages/web/src/api/onboarding.ts`

**验收点：**
- shared types 可被 web/api/worker import
- API client 自动注入 JWT token
- API client 401 时清除 token 并跳转登录页

**步骤 1：定义共享类型**
- 修改点：`packages/shared/src/types/index.ts`

**步骤 2：创建 API client**
- 修改点：`packages/web/src/api/client.ts`
- Run: import 测试 → TypeScript 编译无错
- Expected: types and client usable

**步骤 3：提交**
- Commit message: `添加共享类型定义与前端 API 客户端`
- 审计信息：repo: `root`, branch: `001-lensmor-monitor`, commit: `<TBD>`

---

### Task T6: 引导流程——后端 API

- [ ] **状态**：未开始

**文件：**
- 创建：`packages/api/src/routes/onboarding.ts`

**验收点：**
- POST `/api/onboarding/role` → 更新用户角色
- POST `/api/onboarding/product` → 创建产品信息（URL 格式校验）
- GET `/api/onboarding/competitor-suggestions?url=xxx` → 返回推荐列表（MVP 可为空数组）
- POST `/api/onboarding/competitors` → 批量添加竞品
- GET `/api/onboarding/status` → 返回用户引导状态
- 所有端点需认证

**步骤 1：实现 onboarding 路由**
- 修改点：`packages/api/src/routes/onboarding.ts`
- Run: 用 curl 测试各端点
- Expected: 各端点返回正确数据或校验错误

**步骤 2：提交**
- Commit message: `实现引导流程后端 API（角色/产品/竞品导入）`
- 审计信息：repo: `root`, branch: `001-lensmor-monitor`, commit: `<TBD>`

---

### Task T7: 引导流程——前端 3 步页面

- [ ] **状态**：未开始

**文件：**
- 创建：`packages/web/src/pages/onboarding/Step1Role.tsx`、`packages/web/src/pages/onboarding/Step2Product.tsx`、`packages/web/src/pages/onboarding/Step3Competitors.tsx`、`packages/web/src/components/onboarding/ProgressIndicator.tsx`
- 修改：`packages/web/src/router.tsx`（添加 onboarding 路由）

**验收点：**
- AC-001：第 1 步 6 角色选项卡片，未选择不可下一步
- AC-002：第 2 步必填项校验（名称+URL），URL 格式校验
- AC-003：第 3 步推荐列表（可降级为空）+ 手动添加内联表单，≥1 竞品才能完成
- AC-004：完成后进入 P-005 主界面，侧边栏显示竞品
- 对齐 `prototype.md#4.2-4.4` ASCII 线框

**步骤 1：实现 Step1Role**
- 修改点：`packages/web/src/pages/onboarding/Step1Role.tsx`

**步骤 2：实现 Step2Product**
- 修改点：`packages/web/src/pages/onboarding/Step2Product.tsx`

**步骤 3：实现 Step3Competitors**
- 修改点：`packages/web/src/pages/onboarding/Step3Competitors.tsx`

**步骤 4：实现 ProgressIndicator**
- 修改点：`packages/web/src/components/onboarding/ProgressIndicator.tsx`

**步骤 5：运行验证**
- Run: 浏览器完成完整引导流程
- Expected: 3 步流程走通，完成后进入 P-005

**步骤 6：提交**
- Commit message: `实现 3 步新用户引导页面（角色→产品→竞品导入）`
- 审计信息：repo: `root`, branch: `001-lensmor-monitor`, commit: `<TBD>`

---

### Task T8: 竞品管理——后端 CRUD API

- [ ] **状态**：未开始

**文件：**
- 创建：`packages/api/src/routes/competitors.ts`

**验收点：**
- AC-012：POST `/api/competitors` 创建竞品（名称必填+URL格式校验+关联链接≤10）
- GET `/api/competitors` 返回用户竞品列表（含状态）
- PUT `/api/competitors/:id` 更新竞品
- DELETE `/api/competitors/:id` 删除竞品及关联数据
- POST `/api/competitors/:id/pause` 暂停 → 状态"已暂停"
- POST `/api/competitors/:id/resume` 恢复 → 状态"监控中"
- POST `/api/competitors/:id/refresh` 触发手动刷新 → 创建 CollectionJob
- 数据隔离：仅返回当前用户的竞品

**步骤 1：实现 competitors 路由**
- 修改点：`packages/api/src/routes/competitors.ts`
- Run: curl 测试 CRUD + 暂停/恢复/刷新
- Expected: 各端点返回正确，竞品状态机正确转换

**步骤 2：提交**
- Commit message: `实现竞品管理后端 API（CRUD+暂停/恢复/刷新+状态机）`
- 审计信息：repo: `root`, branch: `001-lensmor-monitor`, commit: `<TBD>`

---

### Task T9: 竞品管理——前端侧边栏+弹窗

- [ ] **状态**：未开始

**文件：**
- 创建：`packages/web/src/components/competitors/CompetitorSidebar.tsx`、`packages/web/src/components/competitors/CompetitorStatusBadge.tsx`
- 创建：`packages/web/src/components/dialogs/AddCompetitorDialog.tsx`、`packages/web/src/components/dialogs/PauseConfirmDialog.tsx`、`packages/web/src/components/dialogs/RefreshConfirmDialog.tsx`、`packages/web/src/components/dialogs/DeleteConfirmDialog.tsx`
- 修改：`packages/web/src/pages/Dashboard.tsx`

**验收点：**
- AC-012：D-001 添加表单校验，提交后列表刷新
- AC-013：暂停确认 D-004 → 状态标签变为"已暂停"
- AC-014：已暂停显示"恢复"按钮 → 点击恢复
- AC-015：手动刷新 D-005 → 状态"采集进行中"→"监控中"
- 删除二次确认 D-003 → 竞品移除
- 对齐 `prototype.md#4.5 P-005` + D-001~D-005 线框

**步骤 1：实现 CompetitorSidebar**
- 修改点：`packages/web/src/components/competitors/CompetitorSidebar.tsx`

**步骤 2：实现 AddCompetitorDialog (D-001)**
- 修改点：`packages/web/src/components/dialogs/AddCompetitorDialog.tsx`

**步骤 3：实现确认弹窗 (D-003/D-004/D-005)**
- 修改点：dialogs 目录

**步骤 4：实现 Dashboard 页面组合**
- 修改点：`packages/web/src/pages/Dashboard.tsx`

**步骤 5：运行验证**
- Run: 浏览器操作：添加竞品→暂停→恢复→刷新→删除
- Expected: 全部操作即时生效，状态标签正确切换

**步骤 6：提交**
- Commit message: `实现竞品管理前端（侧边栏+CRUD弹窗+状态切换）`
- 审计信息：repo: `root`, branch: `001-lensmor-monitor`, commit: `<TBD>`

---

### Task T10: 竞品详情——Overview 面板

- [ ] **状态**：未开始

**文件：**
- 创建：`packages/api/src/routes/competitors.ts`（追加 GET `/:id` 详情端点）
- 创建：`packages/web/src/pages/CompetitorDetail.tsx`、`packages/web/src/components/competitors/CompanyOverview.tsx`、`packages/web/src/components/competitors/IntelligenceTimeline.tsx`

**验收点：**
- AC-016：点击侧边栏竞品 → 右侧展示 P-006 Overview 面板
- 公司基本面字段展示（允许部分为空显示"—"）
- 最新情报时间线展示（按时间倒序，卡片摘要+优先级标签）
- 对齐 `prototype.md#4.6 P-006` 线框

**步骤 1：实现竞品详情 API**
- 修改点：`packages/api/src/routes/competitors.ts`
- Run: `curl localhost:3001/api/competitors/1`
- Expected: 返回竞品详情 + 关联报告列表

**步骤 2：实现 CompetitorDetail 页面**
- 修改点：`packages/web/src/pages/CompetitorDetail.tsx`

**步骤 3：运行验证**
- Run: 浏览器点击竞品 → 查看 Overview
- Expected: 基本面+时间线正确展示

**步骤 4：提交**
- Commit message: `实现竞品详情 Overview 面板（基本面+情报时间线）`
- 审计信息：repo: `root`, branch: `001-lensmor-monitor`, commit: `<TBD>`

---

### Task T11: 网站采集 Worker

- [ ] **状态**：未开始

**文件：**
- 创建：`packages/worker/src/scraper.ts`、`packages/worker/src/index.ts`
- 创建：`packages/api/src/routes/jobs.ts`（任务状态查询）

**验收点：**
- Worker 启动后监听 Redis 队列
- 创建采集任务（CollectionJob）→ Worker 拾取 → 抓取 HTML + 截图 → 更新 job 状态
- 超时/错误处理：job 标记 failed，记录 error
- 关联链接也可被采集（上限 10 条）
- R2 验证：10 个网站测试 p95<30s, ≥90% 成功率

**步骤 1：实现 scraper 模块（Puppeteer/Playwright — HTML + 全页截图）**
- 修改点：`packages/worker/src/scraper.ts`
- Run: 单文件测试抓取 httpbin.org
- Expected: 返回 HTML 内容

**步骤 2：实现 Worker 入口 + BullMQ 集成**
- 修改点：`packages/worker/src/index.ts`
- Run: `npm run dev -w packages/worker`
- Expected: Worker connected to Redis, processing jobs

**步骤 3：实现任务触发 API**
- 修改点：`packages/api/src/routes/jobs.ts` + T8 refresh 端点对接

**步骤 4：性能验证（V-003）**
- Run: 10 个真实竞品网站采集测试
- Expected: p95<30s, ≥90% success rate

**步骤 5：提交**
- Commit message: `实现网站采集 Worker（Puppeteer+BullMQ+错误处理）`
- 审计信息：repo: `root`, branch: `001-lensmor-monitor`, commit: `<TBD>`

---

### Task T12: 数据清洗管道

- [ ] **状态**：未开始

**文件：**
- 创建：`packages/worker/src/cleaner.ts`

**验收点：**
- HTML → Markdown 转换
- 文本去噪（移除 script/style/注释/空白）
- 内容摘要提取（保留正文段落，截断过长内容）
- 与上次采集结果做 diff，生成变更标记

**步骤 1：实现 cleaner 模块**
- 修改点：`packages/worker/src/cleaner.ts`
- Run: 用 2 个版本的 HTML 输入测试
- Expected: 输出 cleaned markdown + diff result

**步骤 2：集成到采集 pipeline**
- 修改点：`packages/worker/src/index.ts`（采集→清洗串联）

**步骤 3：提交**
- Commit message: `实现数据清洗管道（HTML→MD→去噪→差异标注）`
- 审计信息：repo: `root`, branch: `001-lensmor-monitor`, commit: `<TBD>`

---

### Task T13: AI 分析管道

- [ ] **状态**：未开始

**文件：**
- 创建：`packages/worker/src/analyzer.ts`、`packages/worker/src/prompts/diff-analysis.ts`

**验收点：**
- 输入：清洗后的差异数据 + 用户角色 + 产品信息
- 输出：结构化 JSON（changeSummary[]、strategicIntent、actionSuggestions[]、priority）
- prompt 参数化支持角色差异（V-005）
- 超时/API 错误重试处理

**步骤 1：设计 prompt 模板**
- 修改点：`packages/worker/src/prompts/diff-analysis.ts`
- 内容：系统 prompt + user prompt 模板（注入角色和产品上下文）

**步骤 2：实现 analyzer 模块**
- 修改点：`packages/worker/src/analyzer.ts`
- Run: 用真实竞品差异数据测试
- Expected: 返回结构化分析结果

**步骤 3：质量验证（V-002）**
- Run: 5 有变更+5 无变更网站测试
- Expected: 准确率 ≥80%, 假阳性率 ≤20%

**步骤 4：集成到 pipeline**
- 修改点：`packages/worker/src/index.ts`（采集→清洗→分析→保存 Report）

**步骤 5：提交**
- Commit message: `实现 AI 网站差异分析管道（prompt模板+OpenAI集成+质量验证）`
- 审计信息：repo: `root`, branch: `001-lensmor-monitor`, commit: `<TBD>`

---

### Task T14: 任务队列与定时调度

- [ ] **状态**：未开始

**文件：**
- 创建：`packages/worker/src/scheduler.ts`
- 修改：`packages/worker/src/index.ts`（添加 scheduler 启动）

**验收点：**
- 新竞品添加后自动创建首次采集任务
- 定时调度按配置间隔（默认 24h）触发采集
- 暂停的竞品不加入调度
- 队列支持排队/重试(3次)/取消/暂停
- 并发控制：单用户同时最多 N 个采集任务

**步骤 1：实现 scheduler 模块**
- 修改点：`packages/worker/src/scheduler.ts`
- Run: 启动 worker，观察定时任务创建
- Expected: 竞品按间隔自动加入队列

**步骤 2：实现队列生命周期管理**
- 修改点：`packages/worker/src/index.ts`

**步骤 3：提交**
- Commit message: `实现异步任务队列与定时调度（BullMQ+配置化间隔）`
- 审计信息：repo: `root`, branch: `001-lensmor-monitor`, commit: `<TBD>`

---

### Task T15: 竞品详情——公司基本面编辑

- [ ] **状态**：未开始

**文件：**
- 创建：`packages/web/src/components/dialogs/EditCompetitorDialog.tsx`（复用 D-001 结构，追加基本面字段）
- 修改：`packages/api/src/routes/competitors.ts`（PUT 端点追加基本面字段）

**验收点：**
- 竞品详情页可编辑公司基本面字段
- 保存后即时更新展示

**步骤 1：实现编辑弹窗 D-002**
- 修改点：`packages/web/src/components/dialogs/EditCompetitorDialog.tsx`

**步骤 2：实现后端更新**
- 修改点：`packages/api/src/routes/competitors.ts`

**步骤 3：提交**
- Commit message: `实现竞品详情编辑（基本面字段+D-002弹窗）`
- 审计信息：repo: `root`, branch: `001-lensmor-monitor`, commit: `<TBD>`

---

### Task T16: 收件箱——后端 API

- [ ] **状态**：未开始

**文件：**
- 创建：`packages/api/src/routes/reports.ts`

**验收点：**
- GET `/api/reports?priority=&dateFrom=&dateTo=&competitorId=` 分页+筛选
- GET `/api/reports/:id` 返回完整报告详情
- 打开详情 → 自动标记已读（`readAt` 字段更新）
- 数据隔离

**步骤 1：实现 reports 路由**
- 修改点：`packages/api/src/routes/reports.ts`
- Run: curl 测试分页+筛选+已读标记
- Expected: 返回正确数据，筛选条件生效

**步骤 2：提交**
- Commit message: `实现收件箱后端 API（分页+筛选+已读标记）`
- 审计信息：repo: `root`, branch: `001-lensmor-monitor`, commit: `<TBD>`

---

### Task T17: 收件箱——前端卡片列表+筛选

- [ ] **状态**：未开始

**文件：**
- 创建：`packages/web/src/pages/Inbox.tsx`、`packages/web/src/components/inbox/ReportCard.tsx`、`packages/web/src/components/inbox/InboxFilters.tsx`、`packages/web/src/components/inbox/PriorityBadge.tsx`

**验收点：**
- AC-006：卡片列表展示标题/竞品/时间/优先级标签（3 色），≤2s 加载
- AC-007：优先级下拉+日期选择器+竞品多选组合筛选，即时刷新
- AC-011：空收件箱引导文案+插画
- 对齐 `prototype.md#4.7 P-007` 线框

**步骤 1：实现 ReportCard 和 PriorityBadge**
- 修改点：`packages/web/src/components/inbox/`

**步骤 2：实现 InboxFilters**
- 修改点：`packages/web/src/components/inbox/InboxFilters.tsx`

**步骤 3：实现 Inbox 页面（左侧卡片列表+右侧占位）**
- 修改点：`packages/web/src/pages/Inbox.tsx`

**步骤 4：运行验证**
- Run: 浏览器查看收件箱
- Expected: 卡片列表正确渲染，筛选生效，空状态文案

**步骤 5：提交**
- Commit message: `实现收件箱前端（卡片列表+筛选栏+优先级标签）`
- 审计信息：repo: `root`, branch: `001-lensmor-monitor`, commit: `<TBD>`

---

### Task T18: 报告详情页

- [ ] **状态**：未开始

**文件：**
- 创建：`packages/web/src/components/inbox/ReportDetail.tsx`、`packages/web/src/components/inbox/ActionSuggestions.tsx`

**验收点：**
- AC-008：变更摘要（≤3行/条）+ 战略意图（1段）+ 行动建议（分级+理由）+ 原始链接
- AC-009：打开详情 → 对应卡片已读状态切换
- 对齐 `prototype.md#4.8 P-008` 线框

**步骤 1：实现 ReportDetail 组件**
- 修改点：`packages/web/src/components/inbox/ReportDetail.tsx`

**步骤 2：实现 ActionSuggestions**
- 修改点：`packages/web/src/components/inbox/ActionSuggestions.tsx`

**步骤 3：运行验证**
- Run: 浏览器点击收件箱卡片
- Expected: 详情 4 区域完整展示，已读状态切换

**步骤 4：提交**
- Commit message: `实现报告详情页（变更摘要+战略意图+行动建议+原始链接）`
- 审计信息：repo: `root`, branch: `001-lensmor-monitor`, commit: `<TBD>`

---

### Task T19: 情报反馈系统

- [ ] **状态**：未开始

**文件：**
- 创建：`packages/api/src/routes/feedback.ts`
- 创建：`packages/web/src/components/feedback/FeedbackButtons.tsx`、`packages/web/src/components/dialogs/ErrorTypeDialog.tsx`（D-006）

**验收点：**
- AC-010：有用/不重要 → toast 即时确认
- 有误 → D-006 弹出 8 种错误类型（必选 1）→ 提交 → toast 确认
- 反馈持久化存储
- 对齐 `prototype.md#4.8 P-008` 底部 + D-006 线框

**步骤 1：实现 feedback API**
- 修改点：`packages/api/src/routes/feedback.ts`
- Run: curl POST `/api/reports/:id/feedback`
- Expected: 201 + 反馈记录

**步骤 2：实现 FeedbackButtons + ErrorTypeDialog**
- 修改点：`packages/web/src/components/feedback/FeedbackButtons.tsx`
- 修改点：`packages/web/src/components/dialogs/ErrorTypeDialog.tsx`

**步骤 3：集成到 ReportDetail**
- 修改点：`packages/web/src/components/inbox/ReportDetail.tsx`

**步骤 4：运行验证**
- Run: 浏览器测试 3 种反馈类型
- Expected: 有用/不重要即时确认；有误弹窗 8 选 1 后提交

**步骤 5：提交**
- Commit message: `实现情报反馈系统（3种反馈类型+8种错误类型选择器）`
- 审计信息：repo: `root`, branch: `001-lensmor-monitor`, commit: `<TBD>`

---

### Task T20: 状态与反馈打磨（加载/空/错误）

- [ ] **状态**：未开始

**文件：**
- 修改：全局组件增强

**验收点：**
- AC-018：所有异步操作有 loading 状态反馈
- AC-019：所有空数据场景有引导文案
- AC-020：异常场景有友好提示+重试按钮

**步骤 1：逐页添加 loading/empty/error 状态**
- 覆盖 P-005（空竞品）/ P-007（空收件箱/空筛选结果）/ P-006（空情报）/ 全局网络错误

**步骤 2：运行验证**
- Run: 逐页触发各状态
- Expected: loading 骨架屏、空插画+文案、错误提示+重试

**步骤 3：提交**
- Commit message: `添加全局加载态/空状态/错误态处理`
- 审计信息：repo: `root`, branch: `001-lensmor-monitor`, commit: `<TBD>`

---

### Task T21: 性能优化（首屏+列表分页）

- [ ] **状态**：未开始

**文件：**
- 修改：`packages/web/vite.config.ts`、`packages/web/src/pages/Inbox.tsx`、`packages/web/src/pages/Dashboard.tsx`

**验收点：**
- 首屏加载 ≤3s
- 收件箱列表分页 ≤2s/批
- 竞品详情 ≤3s

**步骤 1：代码分割（React.lazy + Suspense）**
- 修改点：router.tsx — 各页面 lazy import

**步骤 2：列表虚拟化/分页优化**
- 修改点：Inbox.tsx、CompetitorSidebar.tsx

**步骤 3：运行验证**
- Run: Lighthouse 或 DevTools Performance 面板测量
- Expected: 首屏 ≤3s，列表 ≤2s

**步骤 4：提交**
- Commit message: `性能优化（代码分割+列表分页+首屏加载）`
- 审计信息：repo: `root`, branch: `001-lensmor-monitor`, commit: `<TBD>`

---

### Task T22: Lint + Type Check 通过

- [ ] **状态**：未开始

**文件：**
- 修改：所有 `.ts`/`.tsx` 文件中的 lint/type 错误

**验收点：**
- `npm run lint` 零错误零警告
- `npm run typecheck` 零错误（所有包）

**步骤 1：运行 lint**
- Run: `npm run lint`
- Expected: 零错误零警告（修复所有问题）

**步骤 2：运行 typecheck**
- Run: `npm run typecheck -w packages/web; npm run typecheck -w packages/api; npm run typecheck -w packages/worker`
- Expected: 零错误

**步骤 3：提交**
- Commit message: `修复所有 lint 与 TypeScript 类型错误`
- 审计信息：repo: `root`, branch: `001-lensmor-monitor`, commit: `<TBD>`

---

## Merge-back 待办清单

- MB-001：将技术栈选型晋升到 `.aisdlc/project/memory/tech.md`（项目首次技术栈确定后）
- MB-002：将模块结构回写到 `.aisdlc/project/components/index.md`（实现完成后 Delta Discover）
- MB-003：将 API 契约不变量回写到各模块页（`components/{module}.md`）
- ⚠️ MB-004：**生产上线前恢复 Supabase 邮箱确认**。当前 MVP 阶段关闭了邮箱确认以加快开发。存在垃圾注册和邮箱冒用风险。需在正式发布前重新启用（Supabase Dashboard → Authentication → Settings → Enable email confirmations）。
