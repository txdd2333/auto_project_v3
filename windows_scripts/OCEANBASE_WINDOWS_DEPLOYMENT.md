# OceanBase MySQL 租户 - Windows 部署指南

本文档专门针对 **Windows 环境**对接 **OceanBase MySQL 租户**的完整部署流程。

---

## ✅ 重要说明：代码已预先配置

**本项目已内置完整的数据库切换支持，无需修改任何代码文件！**

- ✅ 已安装 `dotenv` 依赖包
- ✅ 服务器代码已集成 `.env` 自动加载
- ✅ 支持 Supabase 和 MySQL/OceanBase 无缝切换
- ✅ 只需修改 `.env` 配置文件即可完成切换

**您只需要**：
1. 安装 Node.js
2. 安装项目依赖 `npm install`
3. 配置 `.env` 文件
4. 启动服务

---

## 📋 环境信息

### 部署环境
- **部署服务器**: Windows Server / Windows 10/11（IP: `192.168.1.2`）
- **OceanBase 服务器**: `192.168.1.70:2883`
- **数据库租户**: `Tianji4_MySQL#Tianji4`
- **数据库用户**: `root@Tianji4_MySQL#Tianji4`
- **数据库密码**: `aaAA11__`

### OceanBase 连接串
```bash
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__
```

**重要说明**：
- 用户名格式为 `user@tenant#cluster`，必须完整保留 `@` 和 `#` 符号
- OceanBase MySQL 租户完全兼容 MySQL 5.7/8.0 协议
- 项目使用 `mysql2` 驱动，天然支持 OceanBase

---

## 🚀 完整部署步骤

### 第一步：安装 Node.js

#### 1.1 下载 Node.js

1. 访问 Node.js 官网：https://nodejs.org/
2. 下载 **LTS 版本**（推荐 20.x 版本）
3. 选择 **Windows Installer (.msi)** - 64-bit

**直接下载链接**：
- Node.js 20.x LTS: https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi

#### 1.2 安装 Node.js

1. 双击下载的 `.msi` 文件
2. 点击 "Next" 继续
3. 接受许可协议
4. 选择安装路径（默认：`C:\Program Files\nodejs\`）
5. **重要**：确保勾选以下选项：
   - ✅ Node.js runtime
   - ✅ npm package manager
   - ✅ Add to PATH（将 Node.js 添加到系统环境变量）
   - ✅ Automatically install necessary tools（自动安装编译工具）
6. 点击 "Next"，然后点击 "Install"
7. 等待安装完成（2-5 分钟）
8. 如果提示安装编译工具（Python、Visual Studio Build Tools），点击"是"

#### 1.3 验证安装

打开 **命令提示符（CMD）** 或 **PowerShell**：

```powershell
# 按 Win + R，输入 cmd，按回车

# 验证 Node.js 版本
node --version
# 应输出: v20.11.0

# 验证 npm 版本
npm --version
# 应输出: 10.2.4 或更高

# 验证 npm 全局路径
npm config get prefix
# 应输出: C:\Users\YourUsername\AppData\Roaming\npm
```

**如果命令无效**：
- 关闭并重新打开命令提示符（刷新环境变量）
- 检查环境变量 PATH 是否包含 `C:\Program Files\nodejs\`

#### 1.4 配置 npm 国内镜像（可选，加速下载）

```powershell
# 使用淘宝镜像（可选）
npm config set registry https://registry.npmmirror.com

# 验证
npm config get registry
```

---

### 第二步：安装 MySQL 客户端（用于连接 OceanBase）

#### 2.1 方法 1：安装 MySQL Workbench（推荐，带 GUI）

1. 访问：https://dev.mysql.com/downloads/workbench/
2. 下载 **MySQL Workbench** for Windows
3. 安装后，可以使用 GUI 连接 OceanBase

**连接配置**：
- Connection Name: `OceanBase-Tianji4`
- Hostname: `192.168.1.70`
- Port: `2883`
- Username: `root@Tianji4_MySQL#Tianji4`
- Password: `aaAA11__`

#### 2.2 方法 2：安装 MySQL 命令行工具（轻量级）

1. 访问：https://dev.mysql.com/downloads/mysql/
2. 选择 **MySQL Community Server** - Windows (x86, 64-bit), ZIP Archive
3. 下载并解压到 `C:\mysql\`
4. 添加到环境变量：
   - 右键"此电脑" → 属性 → 高级系统设置 → 环境变量
   - 在"系统变量"中找到 `Path`，点击"编辑"
   - 点击"新建"，添加 `C:\mysql\bin`
   - 点击"确定"保存
5. 重新打开命令提示符，测试：

```powershell
mysql --version
# 应输出: mysql  Ver 8.0.xx for Win64
```

#### 2.3 测试连接 OceanBase

```powershell
# 使用命令行连接
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__

# 如果连接成功，应该看到：
# Welcome to the MySQL monitor...
# Type 'help;' or '\h' for help.
# mysql>

# 测试查询
mysql> SHOW DATABASES;
mysql> EXIT;
```

**常见错误排查**：
- `ERROR 2003 (HY000): Can't connect to MySQL server`
  - 检查网络：`ping 192.168.1.70`
  - 检查端口：`telnet 192.168.1.70 2883`（需要先启用 telnet 功能）
- `ERROR 1045 (28000): Access denied`
  - 检查用户名是否完整：`root@Tianji4_MySQL#Tianji4`
  - 检查密码是否正确

---

### 第三步：安装 Python 和编译工具（bcrypt 依赖）

项目依赖 `bcrypt` 模块，需要在 Windows 上编译。

#### 3.1 方法 1：使用 windows-build-tools（推荐）

```powershell
# 以管理员身份运行 PowerShell
# 右键"开始菜单" → Windows PowerShell (管理员)

# 安装编译工具（包含 Python 和 Visual Studio Build Tools）
npm install --global windows-build-tools

# 等待安装完成（可能需要 10-30 分钟）
# 这会安装：
# - Python 2.7
# - Visual Studio Build Tools
```

#### 3.2 方法 2：手动安装 Visual Studio Build Tools

如果方法 1 失败，手动安装：

1. 访问：https://visualstudio.microsoft.com/downloads/
2. 找到 **Build Tools for Visual Studio 2022**（免费）
3. 下载并运行安装程序
4. 选择 **C++ build tools** 工作负载
5. 确保勾选：
   - ✅ MSVC v143 - VS 2022 C++ x64/x86 build tools
   - ✅ Windows 10 SDK
6. 安装（需要 5-10 GB 磁盘空间）

#### 3.3 验证编译环境

```powershell
# 检查 Python
python --version
# 应输出: Python 2.7.x 或 Python 3.x

# 检查 node-gyp
npm install -g node-gyp
node-gyp --version
```

---

### 第四步：获取项目代码

#### 4.1 方法 1：从 Git 克隆（推荐）

```powershell
# 先安装 Git for Windows
# 下载：https://git-scm.com/download/win

# 克隆项目
cd C:\
git clone <repository-url> ops-workflow-center
cd ops-workflow-center
```

#### 4.2 方法 2：上传 ZIP 文件

```powershell
# 1. 将项目 ZIP 文件上传到 Windows 服务器（如 C:\ops-workflow-center.zip）
# 2. 解压到 C:\ops-workflow-center\
# 3. 进入项目目录

cd C:\ops-workflow-center
```

#### 4.3 方法 3：使用网络共享

```powershell
# 从其他服务器复制项目文件夹
# 使用 Windows 文件共享或 robocopy 命令

robocopy \\source-server\share\ops-workflow-center C:\ops-workflow-center /E /Z /R:3 /W:5
cd C:\ops-workflow-center
```

---

### 第五步：安装项目依赖

```powershell
# 进入项目目录
cd C:\ops-workflow-center

# 清理可能存在的旧依赖
if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
if (Test-Path package-lock.json) { Remove-Item -Force package-lock.json }

# 安装所有依赖（预计 3-10 分钟）
npm install

# 依赖安装过程中可能会看到：
# - [1/4] Resolving packages...
# - [2/4] Fetching packages...
# - [3/4] Linking dependencies...
# - [4/4] Building fresh packages... (编译 bcrypt、playwright 等)
```

**依赖清单（关键包）**：
- ✅ `express`: API 服务器
- ✅ `mysql2`: OceanBase 数据库驱动
- ✅ `bcrypt`: 密码加密（需要编译，可能较慢）
- ✅ `playwright`: 浏览器自动化
- ✅ `react`, `vite`: 前端框架
- ✅ `@logicflow/core`: 流程图编辑器
- ✅ 共 500+ 个包

#### 常见安装问题

**问题 1: bcrypt 编译失败**

```powershell
# 错误信息：
# gyp ERR! stack Error: Could not find any Visual Studio installation to use

# 解决方案：
# 1. 确保已安装 Visual Studio Build Tools（见第三步）
# 2. 使用预编译版本
npm install bcrypt@latest --save

# 3. 或者跳过 bcrypt 使用其他加密方式（不推荐）
```

**问题 2: 权限错误**

```powershell
# 错误信息：
# EACCES: permission denied

# 解决方案：以管理员身份运行
# 右键"命令提示符" → 以管理员身份运行
```

**问题 3: 网络超时**

```powershell
# 使用国内镜像
npm config set registry https://registry.npmmirror.com
npm install
```

#### 验证依赖安装

```powershell
# 检查 node_modules 目录
dir node_modules | measure-object -line
# 应显示 500+ 个文件夹

# 检查关键依赖
npm list bcrypt
npm list mysql2
npm list playwright
npm list express
```

---

### 第六步：配置环境变量

#### 6.1 复制配置模板

```powershell
# 复制 OceanBase 配置模板
copy .env.mysql .env

# 或使用 PowerShell
Copy-Item .env.mysql .env
```

#### 6.2 编辑配置文件

使用记事本或其他文本编辑器打开 `.env` 文件：

```powershell
# 使用记事本
notepad .env

# 或使用 VS Code（如果已安装）
code .env
```

**完整配置内容**：

```env
# ========== 服务提供商 ==========
VITE_SERVICE_PROVIDER=custom

# ========== API 服务器地址 ==========
# 前端访问后端的地址（使用 Windows 服务器地址）
VITE_API_URL=http://192.168.1.2:3000
VITE_PLAYWRIGHT_URL=http://192.168.1.2:3001

# ========== OceanBase MySQL 租户数据库配置 ==========
# 连接串: mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__
DB_HOST=192.168.1.70
DB_PORT=2883
DB_USER=root@Tianji4_MySQL#Tianji4
DB_PASSWORD=aaAA11__
DB_DATABASE=ops_workflow_center

# ========== JWT 密钥（生产环境必须修改！）==========
JWT_SECRET=change-this-to-a-random-secret-key-in-production-environment

# ========== 文件上传目录 ==========
UPLOAD_DIR=./uploads
```

**配置说明**：

| 配置项 | 说明 | 必须修改 |
|-------|------|---------|
| `VITE_SERVICE_PROVIDER` | 服务类型，固定为 `custom` | ❌ |
| `VITE_API_URL` | 前端访问后端的地址 | ✅ 已改为 192.168.1.2 |
| `DB_HOST` | OceanBase 服务器地址 | ✅ 已配置 |
| `DB_PORT` | OceanBase 端口 | ✅ 已配置 |
| `DB_USER` | OceanBase 用户名（含租户信息）| ✅ 已配置 |
| `DB_PASSWORD` | 数据库密码 | ✅ 已配置 |
| `DB_DATABASE` | 数据库名称 | ❌ |
| `JWT_SECRET` | JWT 签名密钥 | ⚠️ 生产环境必须改 |

**⚠️ 重要提醒**：
- `DB_USER` 必须完整包含 `@Tianji4_MySQL#Tianji4`，不能简化
- 密码中的特殊字符（如 `_`）无需转义
- Windows 路径使用 `\` 或 `/` 都可以，但推荐使用 `/`

#### 6.3 验证配置文件

```powershell
# 查看配置内容
type .env

# 或使用 PowerShell
Get-Content .env
```

---

### 第七步：初始化 OceanBase 数据库

#### 7.1 创建数据库

```powershell
# 方法 1：使用命令行（一条命令）
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ -e "CREATE DATABASE IF NOT EXISTS ops_workflow_center CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 方法 2：交互式创建
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__
```

在 MySQL 提示符下执行：

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS ops_workflow_center
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 验证
SHOW DATABASES LIKE 'ops_workflow_center';

-- 切换到数据库
USE ops_workflow_center;

-- 退出
EXIT;
```

#### 7.2 导入数据库结构

**方法 1：使用命令行导入（推荐）**

```powershell
# 进入项目目录
cd C:\ops-workflow-center

# 导入 SQL 文件（使用 Windows 脚本目录）
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center < windows_scripts\scripts\init-database.sql

# 注意：Windows 使用反斜杠 \ 作为路径分隔符
```

**如果上面的命令出错，使用绝对路径**：

```powershell
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center < C:\ops-workflow-center\windows_scripts\scripts\init-database.sql
```

**方法 2：使用 MySQL Workbench（GUI 方式）**

1. 打开 MySQL Workbench
2. 连接到 OceanBase（配置见第二步）
3. 点击菜单：`Server` → `Data Import`
4. 选择 `Import from Self-Contained File`
5. 浏览并选择：`C:\ops-workflow-center\windows_scripts\scripts\init-database.sql`
6. 选择目标数据库：`ops_workflow_center`
7. 点击 `Start Import`
8. 等待导入完成

**方法 3：手动执行 SQL**

```powershell
# 1. 打开 SQL 文件
notepad windows_scripts\scripts\init-database.sql

# 2. 连接到 OceanBase
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center

# 3. 在 MySQL 提示符下执行 SOURCE 命令
mysql> SOURCE C:/ops-workflow-center/windows_scripts/scripts/init-database.sql;
# 注意：Windows 路径需要使用正斜杠 / 或双反斜杠 \\
```

#### 7.3 验证表结构

```powershell
# 连接到数据库
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center
```

在 MySQL 提示符下执行：

```sql
-- 查看所有表
SHOW TABLES;

-- 应输出以下 8 张表：
-- +--------------------------------+
-- | Tables_in_ops_workflow_center  |
-- +--------------------------------+
-- | ai_configs                     |
-- | execution_logs                 |
-- | modules                        |
-- | scenarios                      |
-- | sop_documents                  |
-- | user_profiles                  |
-- | users                          |
-- | workflows                      |
-- +--------------------------------+

-- 查看 users 表结构
DESCRIBE users;

-- 查看表数量
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'ops_workflow_center';
-- 应返回: 8

-- 退出
EXIT;
```

---

### 第八步：构建项目

```powershell
# 进入项目根目录
cd C:\ops-workflow-center

# 构建项目（TypeScript 编译 + Vite 打包）
npm run build

# 构建过程说明：
# 1. TypeScript 编译 (tsc) - 编译 server 和 src 代码
# 2. Vite 打包前端 (vite build) - 生成生产环境静态文件
# 3. 输出到 dist\ 目录

# 预期输出：
# > ops-workflow-center@0.1.0 build
# > tsc && vite build
#
# vite v6.4.1 building for production...
# ✓ 2688 modules transformed.
# ✓ built in 29.37s
```

#### 验证构建产物

```powershell
# 查看 dist 目录
dir dist

# 应该包含：
# dist\
# ├── assets\         # 前端静态资源（JS、CSS、图片）
# ├── index.html      # 入口 HTML
# └── server\         # 后端编译产物
#     ├── index.js    # API 服务器
#     └── api-server.js  # Playwright 服务器

# 查看 server 编译产物
dir dist\server

# 应该包含：
# - index.js
# - api-server.js
# - playwright-executor.js
# - workflow-runner.js
```

---

### 第九步：启动服务

#### 方式 A：开发模式（调试用）

需要打开 **3 个命令提示符窗口**：

**窗口 1：API 服务器**
```powershell
cd C:\ops-workflow-center
npm run server

# 预期输出：
# 🚀 API Server running on http://localhost:3000
```

**窗口 2：Playwright 服务器**
```powershell
cd C:\ops-workflow-center
npm run api-server

# 预期输出：
# 🚀 Playwright Backend Server running on http://localhost:3001
# 📊 Health check: http://localhost:3001/health
```

**窗口 3：前端开发服务器**
```powershell
cd C:\ops-workflow-center
npm run dev

# 预期输出：
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

#### 方式 B：生产模式（使用 PM2，推荐）

**9.1 安装 PM2**

```powershell
# 全局安装 PM2
npm install -g pm2

# 验证安装
pm2 --version
```

**9.2 启动服务**

```powershell
# 进入项目目录
cd C:\ops-workflow-center

# 启动 API 服务器
pm2 start dist\server\index.js --name "ops-api"

# 启动 Playwright 服务器
pm2 start dist\server\api-server.js --name "ops-playwright"

# 查看运行状态
pm2 status

# 应显示类似输出：
# ┌────┬─────────────────┬─────────┬─────────┬──────────┐
# │ id │ name            │ mode    │ ↺      │ status   │
# ├────┼─────────────────┼─────────┼─────────┼──────────┤
# │ 0  │ ops-api         │ fork    │ 0       │ online   │
# │ 1  │ ops-playwright  │ fork    │ 0       │ online   │
# └────┴─────────────────┴─────────┴─────────┴──────────┘
```

**9.3 PM2 常用命令**

```powershell
# 查看所有服务状态
pm2 status

# 查看日志
pm2 logs ops-api
pm2 logs ops-playwright
pm2 logs --lines 100  # 查看最近 100 行

# 重启服务
pm2 restart ops-api
pm2 restart ops-playwright
pm2 restart all  # 重启所有

# 停止服务
pm2 stop ops-api
pm2 stop all

# 删除服务
pm2 delete ops-api
pm2 delete all

# 实时监控
pm2 monit

# 保存 PM2 配置
pm2 save
```

**9.4 配置 PM2 开机自启（Windows）**

```powershell
# 安装 pm2-windows-service
npm install -g pm2-windows-service

# 配置服务（以管理员身份运行）
pm2-service-install -n "PM2-OpsWorkflow"

# 按提示输入：
# PM2_HOME: C:\ProgramData\pm2\home  （默认即可）
# PM2_SERVICE_SCRIPTS: (留空)
# PM2_SERVICE_PM2_DIR: (自动检测)

# 启动 PM2 服务
pm2-service-start

# 重启服务后验证
pm2 status
```

#### 方式 C：使用 Windows 服务（高级）

**使用 NSSM（Non-Sucking Service Manager）**

```powershell
# 1. 下载 NSSM
# 访问：https://nssm.cc/download
# 下载并解压到 C:\nssm\

# 2. 添加到系统 PATH
# 系统属性 → 环境变量 → Path → 添加 C:\nssm\win64

# 3. 创建服务
nssm install ops-api "C:\Program Files\nodejs\node.exe" "C:\ops-workflow-center\dist\server\index.js"

# 4. 配置服务工作目录
nssm set ops-api AppDirectory "C:\ops-workflow-center"

# 5. 配置服务启动类型
nssm set ops-api Start SERVICE_AUTO_START

# 6. 启动服务
nssm start ops-api

# 7. 查看服务状态
nssm status ops-api

# 8. 其他命令
nssm stop ops-api    # 停止
nssm restart ops-api # 重启
nssm remove ops-api  # 删除
```

---

### 第十步：配置前端静态文件服务

在 Windows 上，有几种方式提供静态文件服务：

#### 方式 A：使用 IIS（Windows Server 推荐）

**10.1 启用 IIS**

1. 打开"服务器管理器"
2. 点击"添加角色和功能"
3. 选择"Web 服务器 (IIS)"
4. 确保勾选以下功能：
   - ✅ 静态内容
   - ✅ 默认文档
   - ✅ HTTP 错误
   - ✅ HTTP 重定向
   - ✅ 应用程序初始化（可选）
5. 完成安装

**10.2 创建网站**

1. 打开"Internet Information Services (IIS) 管理器"
2. 右键"网站" → "添加网站"
3. 配置：
   - 网站名称: `ops-workflow-center`
   - 物理路径: `C:\ops-workflow-center\dist`
   - 绑定:
     - 类型: `http`
     - IP 地址: `192.168.1.2`（或"全部未分配"）
     - 端口: `80`
4. 点击"确定"

**10.3 配置 URL 重写（SPA 路由支持）**

1. 在 IIS 管理器中选择网站
2. 双击"URL 重写"（如果没有，需要安装 URL Rewrite 模块）
   - 下载：https://www.iis.net/downloads/microsoft/url-rewrite
3. 点击"添加规则" → "空白规则"
4. 配置：
   - 名称: `SPA Fallback`
   - 模式: `^(?!api/|playwright/).*`
   - 条件:
     - 添加条件：`{REQUEST_FILENAME}` 不是文件
     - 添加条件：`{REQUEST_FILENAME}` 不是目录
   - 操作:
     - 操作类型: `重写`
     - 重写 URL: `/index.html`
5. 点击"应用"

**10.4 配置反向代理（API 转发）**

在 `C:\ops-workflow-center\dist\` 目录创建 `web.config` 文件：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <!-- URL 重写规则 -->
    <rewrite>
      <rules>
        <!-- API 代理 -->
        <rule name="API Proxy" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://127.0.0.1:3000/api/{R:1}" />
        </rule>

        <!-- Playwright 代理 -->
        <rule name="Playwright Proxy" stopProcessing="true">
          <match url="^playwright/(.*)" />
          <action type="Rewrite" url="http://127.0.0.1:3001/api/playwright/{R:1}" />
        </rule>

        <!-- SPA 路由回退 -->
        <rule name="SPA Fallback" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>

    <!-- 静态内容缓存 -->
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" />
    </staticContent>

    <!-- 文件上传大小限制 -->
    <security>
      <requestFiltering>
        <requestLimits maxAllowedContentLength="52428800" /> <!-- 50 MB -->
      </requestFiltering>
    </security>
  </system.webServer>
</configuration>
```

#### 方式 B：使用 Nginx for Windows（轻量级）

**10.1 下载 Nginx**

1. 访问：https://nginx.org/en/download.html
2. 下载 Stable version - Windows 版本（如 nginx-1.24.0）
3. 解压到 `C:\nginx\`

**10.2 配置 Nginx**

编辑 `C:\nginx\conf\nginx.conf`：

```nginx
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;

    server {
        listen       80;
        server_name  192.168.1.2;

        root   C:/ops-workflow-center/dist;
        index  index.html;

        # SPA 路由支持
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API 代理
        location /api/ {
            proxy_pass http://127.0.0.1:3000/api/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Playwright 代理
        location /playwright/ {
            proxy_pass http://127.0.0.1:3001/api/playwright/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_connect_timeout 120s;
            proxy_send_timeout 120s;
            proxy_read_timeout 120s;
        }

        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

**10.3 启动 Nginx**

```powershell
# 进入 Nginx 目录
cd C:\nginx

# 测试配置
nginx.exe -t

# 启动 Nginx
start nginx.exe

# 或在命令行运行（可以看到错误信息）
nginx.exe

# 重新加载配置
nginx.exe -s reload

# 停止 Nginx
nginx.exe -s stop

# 快速停止
nginx.exe -s quit
```

**10.4 配置 Nginx 为 Windows 服务**

```powershell
# 使用 NSSM 将 Nginx 注册为服务
nssm install nginx "C:\nginx\nginx.exe"
nssm set nginx AppDirectory "C:\nginx"
nssm set nginx Start SERVICE_AUTO_START

# 启动服务
nssm start nginx

# 查看状态
nssm status nginx
```

#### 方式 C：使用 Node.js 提供静态文件（简单）

在项目中添加一个简单的静态文件服务器：

创建 `serve-static.js`：

```javascript
const express = require('express');
const path = require('path');

const app = express();
const PORT = 80;

// 静态文件
app.use(express.static(path.join(__dirname, 'dist')));

// SPA 路由回退
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`静态文件服务运行在: http://192.168.1.2:${PORT}`);
});
```

```powershell
# 启动静态文件服务
node serve-static.js

# 或使用 PM2
pm2 start serve-static.js --name "ops-frontend"
```

---

### 第十一步：配置防火墙规则

```powershell
# 以管理员身份运行 PowerShell

# 允许 HTTP (80)
New-NetFirewallRule -DisplayName "OPS-Workflow-HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow

# 允许 API 服务器 (3000)
New-NetFirewallRule -DisplayName "OPS-Workflow-API" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# 允许 Playwright 服务器 (3001)
New-NetFirewallRule -DisplayName "OPS-Workflow-Playwright" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow

# 查看防火墙规则
Get-NetFirewallRule -DisplayName "OPS-Workflow-*"
```

---

### 第十二步：创建超级管理员账号

#### 12.1 方法 1：注册 + SQL 提权（推荐）

**1. 打开浏览器访问注册页面**

```
http://192.168.1.2/register
```

**2. 填写管理员信息注册**
- 邮箱: `admin@yourcompany.com`
- 密码: `YourStrongPassword123!`

**3. 连接到 OceanBase 提权**

```powershell
# 连接数据库
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center
```

在 MySQL 提示符下执行：

```sql
-- 查询刚注册的用户
SELECT id, email, role, status, created_at
FROM users
ORDER BY created_at DESC
LIMIT 1;

-- 记录返回的 ID，然后执行提权（替换 USER_ID）
UPDATE users
SET
    role = 'super_admin',
    status = 'active',
    updated_at = NOW()
WHERE id = 'USER_ID_FROM_ABOVE';

-- 验证
SELECT id, email, role, status
FROM users
WHERE role = 'super_admin';

-- 应输出：
-- +--------------------------------------+-------------------------+--------------+--------+
-- | id                                   | email                   | role         | status |
-- +--------------------------------------+-------------------------+--------------+--------+
-- | xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | admin@yourcompany.com   | super_admin  | active |
-- +--------------------------------------+-------------------------+--------------+--------+

-- 退出
EXIT;
```

#### 12.2 方法 2：使用脚本创建

```powershell
# 进入项目目录
cd C:\ops-workflow-center

# 运行创建脚本
node windows_scripts\scripts\create-super-admin.js

# 按提示输入信息：
# Email: admin@yourcompany.com
# Password: YourStrongPassword123!

# 脚本会自动：
# 1. 连接 OceanBase
# 2. 创建用户
# 3. 设置为超级管理员
```

---

## ✅ 验证部署

### 1. 检查服务状态

```powershell
# 检查 PM2 服务
pm2 status

# 检查端口监听
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :80

# 应该看到 LISTENING 状态
```

### 2. 测试 API 端点

```powershell
# 测试 API 服务器健康检查（使用 PowerShell）
Invoke-WebRequest -Uri http://192.168.1.2:3000/health

# 或使用 curl（如果已安装）
curl http://192.168.1.2:3000/health

# 应返回：{"status":"ok"}

# 测试 Playwright 服务
curl http://192.168.1.2:3001/health

# 应返回：{"status":"ok","service":"playwright-backend"}
```

### 3. 测试前端访问

在浏览器中打开：

```
http://192.168.1.2
```

应该看到：
- ✅ 登录页面正常显示
- ✅ 样式加载正常
- ✅ 无控制台错误（F12 查看 Console）

### 4. 测试登录流程

```
1. 访问 http://192.168.1.2/login
2. 输入超级管理员账号
   - 邮箱: admin@yourcompany.com
   - 密码: YourStrongPassword123!
3. 点击登录
4. 应该跳转到首页
5. 查看右上角用户信息
6. 验证菜单权限（超级管理员应看到所有菜单）
```

### 5. 测试数据库连接

```powershell
# 连接到 OceanBase
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center
```

```sql
-- 查看表数量
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'ops_workflow_center';
-- 应返回: 8

-- 查看用户数量
SELECT COUNT(*) as user_count FROM users;

-- 查看超级管理员
SELECT id, email, role, status FROM users WHERE role = 'super_admin';
```

---

## 🔒 生产环境安全加固

### 1. 修改 JWT 密钥

```powershell
# 生成随机密钥（使用 PowerShell）
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
$secret = [Convert]::ToBase64String($bytes)
Write-Host "New JWT Secret: $secret"

# 编辑 .env 文件
notepad .env

# 更新 JWT_SECRET
JWT_SECRET=生成的随机密钥
```

### 2. 配置 HTTPS（可选）

**使用 IIS 配置 SSL：**

1. 获取 SSL 证书（通过 CA 或自签名）
2. 在 IIS 管理器中选择网站
3. 右键 → "编辑绑定"
4. 添加 HTTPS 绑定（端口 443）
5. 选择 SSL 证书
6. 更新防火墙规则允许 443 端口

### 3. 限制数据库访问

```sql
-- 在 OceanBase 中创建专用用户
CREATE USER 'ops_app'@'192.168.1.2' IDENTIFIED BY 'StrongPassword123!';

-- 授予必要权限
GRANT SELECT, INSERT, UPDATE, DELETE ON ops_workflow_center.* TO 'ops_app'@'192.168.1.2';
FLUSH PRIVILEGES;

-- 更新 .env 配置
DB_USER=ops_app@Tianji4_MySQL#Tianji4
DB_PASSWORD=StrongPassword123!
```

### 4. 配置日志轮转

```powershell
# PM2 日志轮转
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:workerInterval 30
```

### 5. 创建备份脚本

创建 `backup-ops-workflow.bat`：

```batch
@echo off
REM OceanBase 数据库备份脚本

SET BACKUP_DIR=C:\backups\ops-workflow
SET DATE=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
SET DATE=%DATE: =0%

REM 创建备份目录
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM 备份数据库
mysqldump -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center > "%BACKUP_DIR%\db_%DATE%.sql"

REM 压缩备份文件（需要安装 7-Zip）
"C:\Program Files\7-Zip\7z.exe" a -tgzip "%BACKUP_DIR%\db_%DATE%.sql.gz" "%BACKUP_DIR%\db_%DATE%.sql"
del "%BACKUP_DIR%\db_%DATE%.sql"

REM 备份上传文件
"C:\Program Files\7-Zip\7z.exe" a "%BACKUP_DIR%\uploads_%DATE%.zip" "C:\ops-workflow-center\uploads\*"

REM 删除 7 天前的备份
forfiles /P "%BACKUP_DIR%" /S /M db_*.sql.gz /D -7 /C "cmd /c del @path"
forfiles /P "%BACKUP_DIR%" /S /M uploads_*.zip /D -7 /C "cmd /c del @path"

echo Backup completed: %DATE%
```

**配置计划任务（每天凌晨 2 点执行）**：

1. 打开"任务计划程序"
2. 创建基本任务
3. 名称：`OPS-Workflow-Backup`
4. 触发器：每天凌晨 2:00
5. 操作：启动程序
6. 程序：`C:\ops-workflow-center\backup-ops-workflow.bat`
7. 完成创建

---

## 🔧 故障排查

### 问题 1: npm install 失败

**错误信息**：
```
gyp ERR! stack Error: Could not find any Visual Studio installation to use
```

**解决方案**：
```powershell
# 1. 安装 Visual Studio Build Tools（见第三步）
# 2. 或使用预编译版本
npm install bcrypt@latest --save

# 3. 清理缓存重试
npm cache clean --force
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

### 问题 2: 无法连接 OceanBase

**测试连接**：
```powershell
# 测试网络
ping 192.168.1.70

# 测试端口（需要先启用 telnet）
# 控制面板 → 程序和功能 → 启用或关闭 Windows 功能 → Telnet 客户端
telnet 192.168.1.70 2883

# 测试 MySQL 连接
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__
```

**常见错误**：
- `ERROR 1045: Access denied`
  - 检查用户名格式是否完整（必须包含 `@tenant#cluster`）
  - 检查密码是否正确
- `ERROR 2003: Can't connect`
  - 检查网络连接
  - 检查 OceanBase 服务状态
  - 检查防火墙规则

### 问题 3: PM2 服务启动失败

```powershell
# 查看详细错误日志
pm2 logs ops-api --lines 100

# 常见错误：
# 1. Cannot find module 'xxx'
#    - 重新安装依赖: npm install
#    - 重新构建: npm run build

# 2. Port 3000 already in use
#    - 查找占用进程: netstat -ano | findstr :3000
#    - 杀死进程: taskkill /PID <PID> /F

# 3. Database connection failed
#    - 检查 .env 配置
#    - 测试数据库连接
```

### 问题 4: 前端白屏

```powershell
# 1. 查看浏览器控制台（F12 → Console）
# 常见错误：
# - Failed to fetch: 检查 VITE_API_URL 配置
# - 404 Not Found: 检查 IIS/Nginx 配置

# 2. 检查 IIS 日志
# C:\inetpub\logs\LogFiles\W3SVC1\

# 3. 重新构建前端
npm run build

# 4. 重启 IIS
iisreset

# 5. 或重启 Nginx
cd C:\nginx
nginx.exe -s reload
```

### 问题 5: 用户无法登录

```powershell
# 连接数据库检查
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center
```

```sql
-- 检查用户状态
SELECT id, email, role, status FROM users WHERE email = 'admin@yourcompany.com';

-- 激活用户
UPDATE users SET status = 'active' WHERE email = 'admin@yourcompany.com';

-- 重置密码（需要先生成哈希）
-- 在 Node.js 中生成：
-- node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourPassword123!', 10).then(hash => console.log(hash));"

UPDATE users
SET encrypted_password = '$2b$10$...'
WHERE email = 'admin@yourcompany.com';
```

### 问题 6: Windows 路径问题

```powershell
# SQL 导入时路径错误
# 错误示例：
mysql ... < C:\ops-workflow-center\scripts\init-database.sql  # 可能失败

# 正确方式 1：使用正斜杠
mysql ... < C:/ops-workflow-center/scripts/init-database.sql

# 正确方式 2：使用 SOURCE 命令
mysql> SOURCE C:/ops-workflow-center/scripts/init-database.sql;

# 正确方式 3：切换到脚本目录
cd C:\ops-workflow-center\windows_scripts\scripts
mysql ... < init-database.sql
```

---

## 📊 性能优化建议

### 1. OceanBase 优化

```sql
-- 创建索引（如果不存在）
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_scenarios_user_id ON scenarios(user_id);
CREATE INDEX idx_execution_logs_workflow_id ON execution_logs(workflow_id);

-- 分析表统计信息
ANALYZE TABLE users;
ANALYZE TABLE workflows;
ANALYZE TABLE scenarios;
```

### 2. IIS 优化

**启用压缩**：
1. IIS 管理器 → 服务器 → 压缩
2. 启用"静态内容压缩"
3. 启用"动态内容压缩"

**配置应用程序池**：
1. 应用程序池 → ops-workflow-center
2. 高级设置：
   - .NET CLR 版本: 无托管代码
   - 启用 32 位应用程序: False
   - 队列长度: 1000
   - 最大工作进程: 1

### 3. PM2 集群模式（多核 CPU）

```powershell
# 停止现有服务
pm2 delete all

# 使用集群模式启动（利用多核 CPU）
pm2 start dist\server\index.js --name "ops-api" -i max

# 查看集群状态
pm2 status
```

---

## 📝 快速命令参考

```powershell
# ========== 服务管理 ==========
pm2 status                  # 查看所有服务状态
pm2 logs ops-api            # 查看 API 日志
pm2 restart all             # 重启所有服务
pm2 stop all                # 停止所有服务
pm2 monit                   # 实时监控

# ========== 数据库操作 ==========
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center
# 在 MySQL 提示符下：
SHOW TABLES;                # 查看所有表
SELECT COUNT(*) FROM users; # 查看用户数量

# ========== IIS 管理 ==========
iisreset                    # 重启 IIS
iisreset /start             # 启动 IIS
iisreset /stop              # 停止 IIS

# ========== Nginx 管理 ==========
cd C:\nginx
nginx.exe -t                # 测试配置
nginx.exe -s reload         # 重新加载配置
nginx.exe -s stop           # 停止 Nginx

# ========== 日志查看 ==========
pm2 logs                    # 所有服务日志
pm2 logs --lines 100        # 最近 100 行
type C:\inetpub\logs\LogFiles\W3SVC1\u_ex*.log  # IIS 日志

# ========== 系统监控 ==========
tasklist | findstr node     # 查看 Node.js 进程
netstat -ano | findstr :3000  # 查看端口占用
pm2 monit                   # PM2 实时监控
```

---

## 🎉 总结

完成以上步骤后，您应该拥有：

- ✅ **完整的 Windows 开发环境**
  - Node.js 20.x + npm
  - MySQL 客户端（连接 OceanBase）
  - Visual Studio Build Tools（编译 native 模块）
  - 所有项目依赖（500+ 包）

- ✅ **运行中的服务**
  - API 服务器（192.168.1.2:3000）
  - Playwright 服务器（192.168.1.2:3001）
  - IIS/Nginx 前端服务（192.168.1.2:80）

- ✅ **已初始化的 OceanBase 数据库**
  - 8 张业务表
  - 完整的表结构和索引

- ✅ **超级管理员账号**
  - 可以管理用户、权限、配置

- ✅ **生产环境配置**
  - PM2 进程守护
  - IIS/Nginx 反向代理
  - Windows 服务配置
  - 开机自启

- ✅ **监控和备份**
  - PM2 日志轮转
  - 数据库定时备份
  - Windows 任务计划

**下一步**：
1. 阅读 [用户指南](../USER_GUIDE.md) 了解系统功能
2. 配置权限 [管理员设置指南](./POST_HANDOVER_ADMIN_SETUP.md)
3. 查看 [架构文档](../docs/ARCHITECTURE.md) 理解系统设计

**技术支持**：
- 查看日志：`pm2 logs`
- 检查数据库：`mysql -h192.168.1.70 ...`
- 浏览器控制台：`F12 → Console`
- IIS 日志：`C:\inetpub\logs\LogFiles\`

---

**文档版本**: 1.0
**更新日期**: 2026-01-27
**适用环境**: OceanBase MySQL 租户 + Windows Server/10/11
**部署地址**: 192.168.1.2

---

## 🔧 故障排查

如果遇到部署问题，请参考详细的故障排查指南：
**[DEPLOYMENT_TROUBLESHOOTING.md](../DEPLOYMENT_TROUBLESHOOTING.md)**

常见问题：
- 页面空白无法加载
- 登录失败
- API 请求失败
- 数据库连接问题
- 服务无法启动

该文档包含完整的诊断步骤和解决方案。
