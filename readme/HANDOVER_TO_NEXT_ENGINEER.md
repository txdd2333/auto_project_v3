# 项目交接文档 - 运维工作流中心

**交接日期**: 2026-01-27
**项目状态**: 开发中（核心功能已完成，PDF 导入功能正在优化）
**下一步工作**: PDF 文档导入功能优化与测试

---

## 📋 项目概述

**运维工作流中心**是一个综合性的企业级运维自动化平台，支持：
- SOP 文档管理（富文本编辑器）
- 工作流可视化编辑（React Flow）
- 自动化任务执行（Playwright）
- 用户权限管理（角色-权限体系）
- 文档导入导出（Word、PDF、Markdown）

---

## 🏗️ 技术架构

### 前端技术栈
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 6
- **UI 框架**: Tailwind CSS
- **富文本编辑器**: WangEditor 5
- **流程图编辑器**: React Flow 11 + Logic Flow 2 + BPMN.js
- **路由**: React Router 6
- **状态管理**: Zustand 4
- **图标**: Lucide React

### 后端技术栈
- **运行时**: Node.js + Express
- **数据库**: Supabase (PostgreSQL) / MySQL 2（双数据库支持）
- **自动化引擎**: Playwright
- **文档处理**:
  - PDF: `pdfjs-dist` + `unpdf`
  - Word: `mammoth` + `docx`
  - Markdown: `marked` + `turndown`

### 服务层架构
项目采用**服务工厂模式**，通过环境变量切换数据库：

```typescript
// src/services/ServiceFactory.ts
- IAuthService (Supabase / Custom)
- IDataService (Supabase / Custom)
- IStorageService (Supabase / Custom)
- AIService
- PlaywrightService
```

**切换数据库**:
- Supabase: `npm run switch:supabase` (或执行 `switch-to-supabase.sh`)
- MySQL: `npm run switch:mysql` (或执行 `switch-to-mysql.sh`)

---

## 🚀 快速启动

### 1. 环境准备
```bash
# 安装依赖
npm install

# 选择数据库
# 方式1: Supabase (推荐)
./switch-to-supabase.sh

# 方式2: MySQL
./switch-to-mysql.sh
```

### 2. 环境变量配置

**Supabase 模式** (`.env.supabase`):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_DATABASE_TYPE=supabase
```

**MySQL 模式** (`.env.mysql`):
```env
VITE_MYSQL_HOST=localhost
VITE_MYSQL_PORT=3306
VITE_MYSQL_USER=root
VITE_MYSQL_PASSWORD=your_password
VITE_MYSQL_DATABASE=ops_workflow
VITE_DATABASE_TYPE=mysql
```

### 3. 数据库初始化

**Supabase**:
```bash
# 已有 40+ 个迁移文件在 supabase/migrations/
# Supabase 会自动执行

# 创建超级管理员
npm run init:admin
```

**MySQL**:
```bash
# 执行初始化脚本
mysql -u root -p < scripts/init-mysql-database.sql

# 创建超级管理员
node scripts/create-super-admin-mysql.ts
```

### 4. 启动服务
```bash
# 启动前端开发服务器
npm run dev

# 启动后端 API 服务器（另一个终端）
npm run api-server

# 构建生产版本
npm run build
```

---

## 🔑 核心功能模块

### 1. 用户认证与权限管理
**位置**: `src/contexts/AuthContext.tsx` + `src/services/auth/`

**角色系统**:
- `super_admin`: 超级管理员（全部权限）
- `admin`: 普通管理员
- `editor`: 编辑者
- `viewer`: 查看者

**审批流程**:
- 新用户注册后状态为 `pending`
- 超级管理员在"账户审批"页面批准/拒绝
- 批准后用户才能登录使用系统

**关键文件**:
- `src/pages/AccountApprovalPage.tsx` - 账户审批页面
- `src/pages/UserManagementPage.tsx` - 用户管理页面
- `supabase/migrations/20260123135411_add_user_roles_and_permissions_v3.sql` - RLS 策略

### 2. SOP 文档管理
**位置**: `src/pages/SOPLibraryPage.tsx`

**功能**:
- ✅ 富文本编辑（WangEditor）
- ✅ 文档导入（Word、PDF、Markdown）
- ✅ 文档导出（Word、PDF、HTML、Markdown）
- ✅ 图片上传到 Supabase Storage
- ✅ 版本控制（created_at / updated_at）

**关键文件**:
- `src/lib/documentUtils.ts` - 文档导入/导出核心逻辑
- `src/pages/SOPViewerPage.tsx` - 文档查看页面
- `src/styles/sop-content.css` - 文档样式

### 3. 工作流编辑器
**位置**: `src/pages/WorkflowEditorPage.tsx`

**支持的编辑器**:
1. **React Flow** (推荐) - 自定义节点，功能最强
2. **Logic Flow** - 国产流程图库
3. **BPMN.js** - 标准 BPMN 2.0
4. **Draw.io** - 嵌入式绘图工具

**节点类型**:
- Start/End 节点
- Task 任务节点
- Decision 决策节点
- Playwright 自动化节点
- API Call 节点
- Approval 审批节点
- Loop 循环节点
- Parallel Gateway 并行网关

**关键文件**:
- `src/components/ReactFlowEditor/` - React Flow 编辑器
- `src/components/WorkflowFlowEditor/` - 工作流专用编辑器
- `src/pages/WorkflowsPage.tsx` - 工作流列表页面

### 4. 场景管理
**位置**: `src/pages/ScenariosPage.tsx` + `src/pages/ScenarioDetailPage.tsx`

**功能**:
- 场景与模块关联
- SOP 文档绑定
- 流程图可视化
- AI 配置集成

**数据库表**: `scenarios` + `scenario_modules`

### 5. Playwright 自动化执行
**位置**: `server/playwright-executor.ts` + `server/workflow-runner.ts`

**功能**:
- 浏览器自动化（Chromium/Firefox/WebKit）
- 支持录制与回放
- 执行日志记录
- 截图与视频录制

**API 端点**:
- `POST /api/playwright/execute` - 执行 Playwright 脚本
- `POST /api/workflows/:id/execute` - 执行工作流

### 6. AI 配置管理
**位置**: `src/pages/AIConfigPage.tsx`

**支持模型**:
- OpenAI GPT-4 / GPT-3.5
- Claude (Anthropic)
- 通义千问 (Alibaba)
- 文心一言 (Baidu)
- 豆包 (ByteDance)

**功能**:
- 全局 AI 配置
- 场景级 AI 配置（优先级更高）
- 测试连接功能

---

## ⚠️ 当前进行中的工作

### PDF 文档导入优化

**背景**:
用户反馈 PDF 导入后，图片和表格显示不正确：
- 图片只显示"图片"两个字，没有显示实际图片
- 表格布局混乱

**已实现的方案**:
```typescript
// src/lib/documentUtils.ts - importPdf()

1. 使用 unpdf 快速提取文本和图片
2. 使用 PDF.js getOperatorList() 检测页面内容类型
3. 如果检测到复杂内容（图片/表格/图形），渲染整页为高清图片
4. 智能决策：简单文本用文本提取，复杂内容用图片渲染
```

**检测逻辑**:
```typescript
const imageOps = operators.fnArray.filter(fn => [85, 86, 87].includes(fn));
const formOps = operators.fnArray.filter(fn => fn === 83);
const pathOps = operators.fnArray.filter(fn => [76, 77, 78, 79, 92, 93].includes(fn));
const hasTable = pageContent.some(c => c.type === 'table');

const needRender = imageOps.length > 0 || formOps.length > 0 ||
                   hasTable || pathOps.length > 30;
```

**当前状态**:
- ✅ 代码已优化
- ✅ 详细日志已添加
- ⏳ **需要用户测试并提供控制台日志**

**下一步行动**:
1. 让用户刷新页面，重新导入 PDF
2. 查看浏览器控制台的详细日志
3. 根据日志输出调整检测阈值
4. 如果仍然失败，考虑：
   - 调整 Canvas 渲染分辨率（当前 scale: 2.0）
   - 检查 Base64 编码是否正确
   - 验证 HTML 生成逻辑

**关键日志标识**:
- `📄 PDF 解析成功` - PDF 打开成功
- `📖 处理第 X 页` - 页面处理开始
- `✅ 检测到复杂内容，渲染整页为图片` - 触发整页渲染
- `✅ 页面渲染成功` - Canvas 渲染完成
- `✅ 有src, 大小: XXXKB` - 图片 Base64 已生成

---

## 📁 重要文件索引

### 配置文件
- `vite.config.ts` - Vite 构建配置
- `tailwind.config.js` - Tailwind CSS 配置
- `tsconfig.json` - TypeScript 配置
- `.env.*` - 环境变量模板

### 数据库
- `supabase/migrations/*.sql` - Supabase 迁移文件（40+ 个）
- `scripts/init-mysql-database.sql` - MySQL 初始化脚本
- `docs/mysql-schema.sql` - MySQL 完整表结构

### 文档
- `README.md` - 项目主文档
- `DEVELOPMENT.md` - 开发指南
- `DEPLOYMENT_GUIDE.md` - 部署指南
- `USER_GUIDE.md` - 用户使用手册
- `ADMIN_SETUP_MYSQL.md` - MySQL 管理员设置
- `QUICK_START_FOR_AI_ASSISTANT.md` - AI 助手快速指南

### 核心代码
- `src/lib/documentUtils.ts` - 文档处理（**PDF 导入在这里**）
- `src/lib/supabase.ts` - Supabase 客户端
- `src/services/ServiceFactory.ts` - 服务工厂
- `server/api-server.ts` - Express API 服务器
- `server/playwright-executor.ts` - Playwright 执行器

---

## 🐛 已知问题

### 1. PDF 导入 - 图片和表格显示问题 ⚠️
**优先级**: 🔴 高
**状态**: 正在调试
**位置**: `src/lib/documentUtils.ts` - `importPdf()` 函数
**详情**: 见上文"当前进行中的工作"

### 2. 构建警告 - Chunk 过大
**优先级**: 🟡 中
**状态**: 已知，不影响功能
**详情**:
```
Some chunks are larger than 500 kB after minification.
- index-XXX.js: 2,798 kB
- pdfjs-XXX.js: 1,428 kB
```
**建议**: 使用 `build.rollupOptions.output.manualChunks` 拆分代码块

### 3. Browserslist 过期
**优先级**: 🟢 低
**状态**: 不影响功能
**修复**: `npx update-browserslist-db@latest`

### 4. Supabase 动态导入警告
**优先级**: 🟢 低
**状态**: 不影响功能
**详情**: `src/lib/supabase.ts` 既被静态导入又被动态导入

---

## 🔧 调试技巧

### 查看 PDF 导入日志
```javascript
// 打开浏览器控制台 (F12)
// 导入 PDF 后会看到：
📄 PDF 解析成功，共 X 页
📖 处理第 1/1 页...
   unpdf 提取到 X 张图片
   operators 数量: XXX
   - 图像操作符: X
   - 表单对象: X
   - 路径/图形操作符: X
   - 检测到表格: 是/否
   ✅ 检测到复杂内容，渲染整页为图片...
```

### 切换数据库模式
```bash
# 查看当前数据库类型
cat .env | grep VITE_DATABASE_TYPE

# 快速切换
./switch-to-supabase.sh  # 或 .bat (Windows)
./switch-to-mysql.sh     # 或 .bat (Windows)
```

### 重置数据库
```bash
# Supabase: 在 Dashboard 中删除并重新创建项目

# MySQL:
mysql -u root -p
DROP DATABASE ops_workflow;
CREATE DATABASE ops_workflow;
exit;
mysql -u root -p ops_workflow < scripts/init-mysql-database.sql
```

### 查看 RLS 策略
```sql
-- Supabase Dashboard -> SQL Editor
SELECT * FROM user_profiles;
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
```

---

## 📦 部署清单

### 前端部署 (Vercel/Netlify)
1. 构建命令: `npm run build`
2. 输出目录: `dist/`
3. 环境变量: 复制 `.env.production` 的内容

### 后端部署 (Node.js 服务器)
1. 安装依赖: `npm install --production`
2. 构建服务器: `npm run api-server:build`
3. 启动: `node dist/server/api-server.js`
4. 端口: 默认 3000 (可配置)

### 数据库部署
- **Supabase**: 使用托管服务（推荐）
- **MySQL**: 自建或使用 RDS

### Playwright 依赖
```bash
# 安装浏览器
npx playwright install chromium

# 或安装所有浏览器
npx playwright install
```

---

## 🔐 安全注意事项

1. **永远不要提交敏感信息**:
   - `.env` 文件已在 `.gitignore` 中
   - 确保 Supabase keys 和数据库密码安全

2. **RLS 策略已启用**:
   - 所有表都有 Row Level Security
   - `pending` 状态用户无法访问数据
   - 超级管理员有完全访问权限

3. **API 安全**:
   - 后端 API 需要 JWT 验证
   - CORS 已配置
   - 密码使用 bcrypt 加密（MySQL 模式）

4. **文件上传安全**:
   - 限制文件类型（PDF、DOCX、MD）
   - 限制文件大小（50MB）
   - Supabase Storage 有 RLS 策略

---

## 📚 参考资源

### 官方文档
- [React Flow](https://reactflow.dev/) - 流程图编辑器
- [WangEditor](https://www.wangeditor.com/) - 富文本编辑器
- [Playwright](https://playwright.dev/) - 浏览器自动化
- [Supabase](https://supabase.com/docs) - 数据库与认证
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF 解析

### 项目文档
- 数据库设计: `DATABASE.md`
- 架构文档: `docs/ARCHITECTURE.md`
- 部署指南: `DEPLOYMENT_GUIDE.md`
- MySQL 迁移报告: `readme/MYSQL_MIGRATION_COMPATIBILITY_REPORT.md`

---

## 🎯 下一步开发建议

### 短期（1-2 周）
1. ✅ **修复 PDF 导入问题**（当前最高优先级）
2. 优化表格识别算法
3. 添加 PDF 导入进度条
4. 完善错误提示信息

### 中期（1 个月）
1. 实现工作流调度功能（定时执行）
2. 添加工作流执行历史详情页
3. 实现 SOP 文档版本对比
4. 优化前端性能（代码分割）

### 长期（3 个月+）
1. 多租户支持（团队/组织隔离）
2. 工作流模板市场
3. 移动端响应式优化
4. 实时协作编辑（WebSocket）
5. 审计日志系统

---

## 💬 联系与支持

**遇到问题？**
1. 查看项目文档（`README.md` 和其他 `.md` 文件）
2. 检查控制台日志和网络请求
3. 查看 GitHub Issues（如果项目已托管）
4. 回滚到上一个稳定版本测试

**提交代码前**:
```bash
# 运行构建测试
npm run build

# 检查 TypeScript 错误
npx tsc --noEmit

# 清理无用代码
# 确保所有功能正常
```

---

## ✅ 交接确认清单

- [ ] 已阅读所有项目文档
- [ ] 成功启动开发环境
- [ ] 理解数据库架构和 RLS 策略
- [ ] 熟悉服务工厂模式和数据库切换
- [ ] 了解 PDF 导入的当前状态和待解决问题
- [ ] 可以成功创建超级管理员账户
- [ ] 可以登录并访问所有管理页面
- [ ] 已测试 SOP 文档的创建、编辑、导出
- [ ] 已测试工作流编辑器
- [ ] 已测试用户审批流程
- [ ] 了解部署流程

---

**祝工作顺利！如有疑问，欢迎通过项目文档和代码注释深入了解。** 🚀
