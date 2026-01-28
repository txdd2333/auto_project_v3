# 运维流程中心

> 企业级运维自动化平台 - OceanBase MySQL / MySQL 本地部署
> 版本：v1.0 | 更新时间：2026-01-24

---

## 系统简介

**运维流程中心**是一个完全本地化部署的企业级运维自动化平台，支持：

- ✅ **SOP 文档管理** - 富文本编辑、图片管理、多格式导出（PDF/Word/图片）
- ✅ **流程图设计** - 4 种专业流程图编辑器（ReactFlow/LogicFlow/BPMN/Draw.io）
- ✅ **工作流自动化** - 基于 Playwright 的 RPA 机器人流程自动化
- ✅ **权限管理** - 超级管理员、管理员、用户三级权限体系
- ✅ **本地部署** - 完全内网部署，无外网依赖，数据安全可控

---

## ✅ 重要说明：代码已预先配置

**本项目已内置完整的数据库切换支持，无需修改任何代码文件！**

- ✅ 已安装 `dotenv` 依赖包
- ✅ 服务器代码已集成 `.env` 自动加载
- ✅ 支持 Supabase 和 MySQL/OceanBase 无缝切换
- ✅ 只需修改 `.env` 配置文件即可完成切换

**部署时您只需要**：
1. 安装 Node.js
2. 运行 `npm install` 安装依赖
3. 配置 `.env` 文件（从 `.env.mysql` 或 `.env.supabase` 复制）
4. 初始化数据库
5. 启动服务

---

## 快速导航

### 管理员部署文档

#### OceanBase 部署（推荐）

| 文档 | 说明 | 阅读时间 |
|------|------|----------|
| **[OCEANBASE_QUICKSTART.md](OCEANBASE_QUICKSTART.md)** | ⚡ OceanBase Linux 快速部署（5 分钟）| 5 分钟 |
| **[OCEANBASE_DEPLOYMENT_GUIDE.md](readme/OCEANBASE_DEPLOYMENT_GUIDE.md)** | 📖 OceanBase Linux 完整部署指南（192.168.1.2）| 30 分钟 |
| **[OCEANBASE_WINDOWS_QUICKSTART.md](OCEANBASE_WINDOWS_QUICKSTART.md)** | ⚡ OceanBase Windows 快速部署（5 分钟）| 10 分钟 |
| **[OCEANBASE_WINDOWS_DEPLOYMENT.md](readme/OCEANBASE_WINDOWS_DEPLOYMENT.md)** | 📖 OceanBase Windows 完整部署指南（192.168.1.2）| 30 分钟 |

#### 通用部署

| 文档 | 说明 | 阅读时间 |
|------|------|----------|
| **[MANUAL_DEPLOYMENT_GUIDE.md](readme/MANUAL_DEPLOYMENT_GUIDE.md)** | 📖 通用手动部署指南（Windows/Linux）| 30 分钟 |
| **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** | ✅ 部署检查清单 | 5 分钟 |
| **[DEPLOYMENT_TROUBLESHOOTING.md](DEPLOYMENT_TROUBLESHOOTING.md)** | 🔧 部署故障排查指南 | 10 分钟 |

**OceanBase Linux 快速开始：**

```bash
# 1. 安装依赖（必须！包含 500+ 个包）
npm install

# 2. 配置环境变量（已包含 OceanBase 连接信息）
cp .env.mysql .env

# 3. 初始化 OceanBase 数据库
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ -e \
  "CREATE DATABASE IF NOT EXISTS ops_workflow_center CHARACTER SET utf8mb4"
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ \
  ops_workflow_center < linux_scripts/scripts/init-database.sql

# 4. 构建项目
npm run build

# 5. 启动服务（使用 PM2）
sudo npm install -g pm2
pm2 start dist/server/index.js --name "ops-api"
pm2 start dist/server/api-server.js --name "ops-playwright"

# 6. 访问系统
# http://192.168.1.2 (需配置 Nginx)
# 或 http://192.168.1.2:5173 (开发模式: npm run dev)
```

**OceanBase Windows 快速开始：**

```powershell
# 1. 安装 Node.js 20.x LTS（https://nodejs.org/）
# 2. 安装 MySQL 客户端（https://dev.mysql.com/downloads/workbench/）
# 3. 以管理员身份运行 PowerShell，安装编译工具
npm install --global windows-build-tools

# 4. 安装依赖
cd C:\ops-workflow-center
npm install

# 5. 配置环境变量
copy .env.mysql .env

# 6. 初始化数据库
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ -e "CREATE DATABASE IF NOT EXISTS ops_workflow_center CHARACTER SET utf8mb4"
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center < windows_scripts\scripts\init-database.sql

# 7. 构建项目
npm run build

# 8. 启动服务（使用 PM2）
npm install -g pm2
pm2 start dist\server\index.js --name "ops-api"
pm2 start dist\server\api-server.js --name "ops-playwright"

# 9. 访问系统
# http://192.168.1.2 (需配置 IIS/Nginx)
```

---

### 用户使用文档

| 文档 | 说明 | 阅读时间 |
|------|------|----------|
| **[USER_GUIDE.md](USER_GUIDE.md)** | 用户使用完整指南 | 20 分钟 |

**包含内容：**
- 角色与权限说明
- SOP 文档编辑技巧
- 流程图绘制方法
- 工作流创建与执行（含 Playwright 详解）
- 常见问题解答

---

## 核心功能

### 1. SOP 文档管理

- 富文本编辑器（支持 Markdown、代码高亮、表格）
- 图片管理（粘贴、拖拽、批量上传）
- 导出功能（PDF、Word、图片）
- 版本控制

### 2. 流程图设计

- **React Flow**：现代化、易用
- **LogicFlow**：专业流程图、支持泳道
- **BPMN.js**：符合 BPMN 2.0 标准
- **Draw.io**：功能最强大

### 3. 工作流自动化

- 可视化工作流编辑器
- Playwright RPA 引擎（支持 Chromium/Firefox/WebKit）
- 节点类型：任务、API 调用、决策、延时、通知、Playwright 自动化
- 执行日志追踪

### 4. 权限管理

| 角色 | 权限 |
|------|------|
| 超级管理员 | 全部权限（用户管理、AI 配置） |
| 管理员 | 创建模块、场景、工作流 |
| 用户 | 查看 SOP、执行工作流 |

---

## 技术栈

### 前端

- **框架**：React 18 + TypeScript + Vite
- **UI**：Tailwind CSS
- **编辑器**：
  - 富文本：WangEditor 5
  - 流程图：React Flow、LogicFlow、BPMN.js、Draw.io
- **状态管理**：Zustand

### 后端

- **运行时**：Node.js 18+
- **框架**：Express
- **数据库**：OceanBase MySQL / MySQL 5.7+
- **ORM**：mysql2
- **自动化**：Playwright

---

## 系统架构

```
运维流程中心
├── 前端 (React + TypeScript)
│   ├── SOP 编辑器
│   ├── 流程图编辑器（4 种）
│   ├── 工作流编辑器
│   └── 执行日志查看
├── 后端 (Express + Node.js)
│   ├── API 服务
│   ├── 文件上传服务
│   ├── Playwright 执行引擎
│   └── 工作流调度器
└── 数据库 (OceanBase MySQL / MySQL)
    ├── 用户和权限
    ├── 模块和场景
    ├── 工作流定义
    ├── 执行日志
    ├── SOP 文档
    └── AI 配置
```

---

## 部署架构

```
┌─────────────────────────────────────────┐
│            用户浏览器                     │
│    http://your-server-ip:80             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Nginx (反向代理)                 │
│  - 静态文件服务 (/dist)                  │
│  - API 代理 (/api -> :3000)              │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Node.js API Server (:3000)         │
│  - Express 服务                          │
│  - 文件上传服务                          │
│  - Playwright 执行引擎                   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│    OceanBase MySQL / MySQL              │
│  - 业务数据存储                          │
│  - 用户权限管理                          │
└─────────────────────────────────────────┘

文件系统：
  ./uploads/sop-images/
```

---

## 环境要求

### 硬件要求

| 组件 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 2 核 | 4 核+ |
| 内存 | 4 GB | 8 GB+ |
| 磁盘 | 20 GB | 50 GB+ |

### 软件要求

| 软件 | 版本 |
|------|------|
| Node.js | 18.x / 20.x |
| npm | 9.x+ |
| OceanBase | 4.x+ (MySQL 模式) |
| MySQL | 5.7+ / 8.0+ |

---

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置数据库

```bash
# 复制配置模板
cp .env.mysql .env

# 编辑配置文件
vim .env
```

配置内容：

```env
# 数据库配置
MYSQL_HOST=localhost
MYSQL_PORT=2881
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=ops_workflow_center

# 服务器配置
API_PORT=3000
JWT_SECRET=your_random_secret_here

# 文件上传
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# 数据库引擎
DB_ENGINE=mysql
```

### 3. 初始化数据库

```bash
# 自动初始化（推荐）
./scripts/init-oceanbase.sh

# 或手动执行
mysql -h localhost -P 2881 -u root -p < scripts/init-oceanbase-database.sql
tsx scripts/create-super-admin-mysql.ts admin@example.com Admin123456
```

### 4. 启动服务

**开发模式：**

```bash
# 终端 1：API Server
npm run api-server

# 终端 2：前端开发服务器
npm run dev
```

访问：http://localhost:5173

**生产模式（使用 PM2）：**

```bash
# 构建前端
npm run build

# 安装 PM2
npm install -g pm2

# 启动 API Server
pm2 start npm --name "ops-api" -- run api-server

# 配置 Nginx 代理（参考 readme/PRODUCTION_DEPLOYMENT.md）
```

---

## 常用命令

```bash
# 开发
npm run dev              # 启动前端 (http://localhost:5173)
npm run api-server       # 启动后端 (http://localhost:3000)

# 构建
npm run build            # 构建生产版本

# Playwright
npx playwright install   # 安装浏览器（首次运行）
npx playwright install-deps  # 安装系统依赖（Linux）

# 数据库
./scripts/init-oceanbase.sh  # 初始化数据库
tsx scripts/create-super-admin-mysql.ts  # 创建超级管理员
```

---

## 项目结构

```
ops-workflow-center/
├── src/                        # 前端源码
│   ├── components/             # React 组件
│   │   ├── BpmnEditor/         # BPMN 编辑器
│   │   ├── DrawioEditor/       # Draw.io 编辑器
│   │   ├── LogicFlowEditor/    # LogicFlow 编辑器
│   │   ├── ReactFlowEditor/    # React Flow 编辑器
│   │   ├── WorkflowFlowEditor/ # 工作流编辑器
│   │   ├── CodeBlock.tsx       # 代码高亮组件
│   │   ├── Layout.tsx          # 布局组件
│   │   └── MarkdownEditor.tsx  # Markdown 编辑器
│   ├── pages/                  # 页面组件
│   │   ├── AIConfigPage.tsx    # AI 配置页面
│   │   ├── AccountApprovalPage.tsx  # 账号审批
│   │   ├── ExecutionLogsPage.tsx   # 执行日志
│   │   ├── LoginPage.tsx       # 登录页面
│   │   ├── ModulesPage.tsx     # 模块管理
│   │   ├── ScenarioDetailPage.tsx  # 场景详情
│   │   ├── ScenariosPage.tsx   # 场景列表
│   │   ├── SOPLibraryPage.tsx  # SOP 文档库
│   │   ├── SOPViewerPage.tsx   # SOP 查看器
│   │   ├── UserManagementPage.tsx  # 用户管理
│   │   ├── WorkflowEditorPage.tsx  # 工作流编辑
│   │   └── WorkflowsPage.tsx   # 工作流列表
│   ├── services/               # 服务层（双引擎）
│   │   ├── auth/               # 认证服务
│   │   ├── data/               # 数据服务
│   │   ├── ai/                 # AI 服务
│   │   ├── playwright/         # Playwright 服务
│   │   └── storage/            # 存储服务
│   └── lib/                    # 工具库
├── server/                     # 后端服务
│   ├── api-server.ts           # API 服务器
│   ├── playwright-executor.ts  # Playwright 执行器
│   └── workflow-runner.ts      # 工作流运行器
├── scripts/                    # 部署脚本
│   ├── init-oceanbase-database.sql    # 数据库初始化
│   ├── init-oceanbase.sh              # 一键初始化脚本
│   ├── create-super-admin-mysql.sql   # 创建超管（SQL）
│   └── create-super-admin-mysql.ts    # 创建超管（Node.js）
├── switch-to-mysql.sh          # 切换到 MySQL 模式
├── switch-to-supabase.sh       # 切换到 Supabase 模式
├── PRODUCTION_DEPLOYMENT.md    # 生产部署指南
├── USER_GUIDE.md               # 用户使用指南
└── README.md                   # 本文件
```

---

## 双引擎架构

系统支持两种数据库引擎，可灵活切换：

| 引擎 | 适用场景 | 切换命令 |
|------|---------|---------|
| **Supabase** | 云端开发、快速原型 | `./switch-to-supabase.sh` |
| **MySQL/OceanBase** | 生产部署、内网环境 | `./switch-to-mysql.sh` |

**切换后需重启服务。**

---

## 默认账号

初始化后，使用以下账号登录：

- **邮箱**：admin@example.com
- **密码**：Admin123456

**登录后请立即修改密码！**

---

## 快速诊断工具

如果遇到部署问题，可以使用快速诊断工具：

```bash
# Linux/Mac
./diagnose.sh

# Windows
diagnose.bat
```

诊断工具会自动检查：
- ✅ Node.js 环境
- ✅ 项目文件完整性
- ✅ 环境变量配置
- ✅ 数据库连接
- ✅ 服务运行状态
- ✅ 构建文件

详细的故障排查指南请参考：**[DEPLOYMENT_TROUBLESHOOTING.md](DEPLOYMENT_TROUBLESHOOTING.md)**

---

## 故障排查

### 问题 1：数据库连接失败

```bash
# 检查数据库服务
systemctl status mysqld

# 测试连接
mysql -h localhost -P 2881 -u root -p

# 检查配置
cat .env | grep MYSQL
```

### 问题 2：API Server 无法启动

```bash
# 检查端口占用
lsof -i :3000

# 停止占用进程
kill -9 <PID>

# 或修改端口（.env 中的 API_PORT）
```

### 问题 3：Playwright 执行失败

```bash
# 安装浏览器
npx playwright install

# 安装系统依赖（Linux）
npx playwright install-deps

# 测试 Playwright
npx playwright --version
```

**更多问题请查看：[PRODUCTION_DEPLOYMENT.md](readme/PRODUCTION_DEPLOYMENT.md#故障排查)**

---

## 文档索引

### 主要文档（根目录）

| 文档 | 用途 |
|------|------|
| [USER_GUIDE.md](USER_GUIDE.md) | 用户使用完整指南 |

### 核心技术文档（readme/ 目录）

| 文档 | 用途 |
|------|------|
| [PRODUCTION_DEPLOYMENT.md](readme/PRODUCTION_DEPLOYMENT.md) | 生产环境部署完整指南 |
| [MYSQL_QUICK_START.md](readme/MYSQL_QUICK_START.md) | MySQL 快速开始 |
| [DEVELOPMENT.md](readme/DEVELOPMENT.md) | 开发规范和指南 |
| [SOP_EDITOR_GUIDE.md](readme/SOP_EDITOR_GUIDE.md) | SOP 编辑器使用指南 |
| [PLAYWRIGHT_GUIDE.md](readme/PLAYWRIGHT_GUIDE.md) | Playwright 使用指南 |

### 其他文档（readme/bak/ 目录）

更多交接文档、部署文档、迁移记录等归档在 [readme/bak/](readme/bak/) 目录

---

## 联系支持

- 📧 邮箱：support@your-company.com
- 📱 电话：400-xxx-xxxx
- 💬 企业微信：xxx

---

## 版本信息

- **当前版本**：v1.0
- **发布日期**：2026-01-24
- **状态**：生产就绪

---

## 更新日志

### v1.0 (2026-01-24)

**完整功能：**
- ✅ SOP 文档管理（富文本、图片、导出）
- ✅ 流程图设计（4 种编辑器）
- ✅ 工作流自动化（Playwright RPA）
- ✅ 权限管理（三级权限）
- ✅ 执行日志追踪
- ✅ AI 配置管理
- ✅ 完全本地部署

**技术改进：**
- ✅ 双引擎架构（Supabase / MySQL）
- ✅ 图片管理优化（4 种上传方式）
- ✅ 生产环境优化
- ✅ 安全性增强

---

**祝您使用愉快！**

开始您的运维自动化之旅吧！
