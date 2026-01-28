# OceanBase Windows 快速部署指南

> Windows 环境 5 分钟快速部署！详细步骤查看 [完整 Windows 部署指南](./readme/OCEANBASE_WINDOWS_DEPLOYMENT.md)

---

## 🎯 部署环境

- **部署服务器**: Windows Server / Windows 10/11（IP: `192.168.1.2`）
- **OceanBase**: `192.168.1.70:2883`
- **数据库租户**: `Tianji4_MySQL#Tianji4`

---

## ⚡ 快速部署步骤

### 步骤 1: 安装 Node.js

1. 访问：https://nodejs.org/
2. 下载 **LTS 版本 20.x**（Windows Installer .msi）
3. 双击安装，**务必勾选**：
   - ✅ Add to PATH
   - ✅ Automatically install necessary tools（自动安装编译工具）
4. 等待安装完成（2-5 分钟）

**验证安装**（打开命令提示符）：

```powershell
node --version  # v20.x.x
npm --version   # 10.x.x
```

### 步骤 2: 安装 MySQL 客户端

**方法 1: MySQL Workbench（推荐，带 GUI）**
- 下载：https://dev.mysql.com/downloads/workbench/
- 安装后可以用 GUI 连接 OceanBase

**方法 2: MySQL 命令行**
- 下载 MySQL Community Server ZIP 版
- 解压到 `C:\mysql\`
- 添加 `C:\mysql\bin` 到系统 PATH

**测试连接**：

```powershell
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__
```

### 步骤 3: 安装编译工具（bcrypt 依赖）

**以管理员身份运行 PowerShell**：

```powershell
# 方法 1: 使用 windows-build-tools（推荐）
npm install --global windows-build-tools

# 方法 2: 手动安装 Visual Studio Build Tools
# 访问：https://visualstudio.microsoft.com/downloads/
# 下载 Build Tools for Visual Studio 2022
# 选择 "C++ build tools" 工作负载
```

### 步骤 4: 进入项目目录并安装依赖

```powershell
# 进入项目目录（假设代码已上传到 C:\）
cd C:\ops-workflow-center

# 安装所有依赖（必须！预计 3-10 分钟）
npm install

# 如果 bcrypt 编译失败，使用预编译版本：
npm install bcrypt@latest --save
```

### 步骤 5: 配置环境变量

```powershell
# 复制配置模板
copy .env.mysql .env

# 编辑配置文件
notepad .env
```

**确认以下配置**（默认已配置好）：

```env
VITE_SERVICE_PROVIDER=custom
VITE_API_URL=http://192.168.1.2:3000
VITE_PLAYWRIGHT_URL=http://192.168.1.2:3001

DB_HOST=192.168.1.70
DB_PORT=2883
DB_USER=root@Tianji4_MySQL#Tianji4
DB_PASSWORD=aaAA11__
DB_DATABASE=ops_workflow_center

JWT_SECRET=change-this-to-a-random-secret-key-in-production-environment
```

### 步骤 6: 初始化数据库

```powershell
# 1. 创建数据库
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ -e "CREATE DATABASE IF NOT EXISTS ops_workflow_center CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. 导入表结构（注意 Windows 路径使用反斜杠）
cd C:\ops-workflow-center
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center < windows_scripts\scripts\init-database.sql

# 3. 验证
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center -e "SHOW TABLES;"
```

**预期输出**（8 张表）：
```
+--------------------------------+
| Tables_in_ops_workflow_center  |
+--------------------------------+
| ai_configs                     |
| execution_logs                 |
| modules                        |
| scenarios                      |
| sop_documents                  |
| user_profiles                  |
| users                          |
| workflows                      |
+--------------------------------+
```

### 步骤 7: 构建项目

```powershell
# 构建前端和后端（必须！）
npm run build

# 预计耗时 30-60 秒
# 输出到 dist\ 目录
```

### 步骤 8: 启动服务

#### 方式 A: 使用 PM2（生产环境推荐）

```powershell
# 安装 PM2
npm install -g pm2

# 启动服务
cd C:\ops-workflow-center
pm2 start dist\server\index.js --name "ops-api"
pm2 start dist\server\api-server.js --name "ops-playwright"

# 查看状态
pm2 status

# 配置开机自启（可选）
npm install -g pm2-windows-service
pm2-service-install -n "PM2-OpsWorkflow"
```

#### 方式 B: 手动启动（开发/测试）

**需要打开 3 个命令提示符窗口：**

```powershell
# 窗口 1: API 服务器
cd C:\ops-workflow-center
npm run server

# 窗口 2: Playwright 服务器
cd C:\ops-workflow-center
npm run api-server

# 窗口 3: 前端开发服务器（可选）
cd C:\ops-workflow-center
npm run dev
```

### 步骤 9: 配置前端静态文件（可选）

#### 使用 IIS（推荐）

1. 启用 IIS：
   - 控制面板 → 程序和功能 → 启用或关闭 Windows 功能
   - 勾选 "Internet Information Services"

2. 创建网站：
   - 打开"IIS 管理器"
   - 右键"网站" → "添加网站"
   - 物理路径：`C:\ops-workflow-center\dist`
   - 绑定：IP `192.168.1.2`，端口 `80`

#### 使用 Nginx for Windows

```powershell
# 1. 下载 Nginx：https://nginx.org/en/download.html
# 2. 解压到 C:\nginx\
# 3. 编辑配置：notepad C:\nginx\conf\nginx.conf
# 4. 启动：cd C:\nginx && nginx.exe
```

### 步骤 10: 配置防火墙

```powershell
# 以管理员身份运行
New-NetFirewallRule -DisplayName "OPS-Workflow-HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "OPS-Workflow-API" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "OPS-Workflow-Playwright" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

### 步骤 11: 创建超级管理员

```powershell
# 1. 浏览器打开
http://192.168.1.2/register

# 2. 注册账号
邮箱: admin@yourcompany.com
密码: YourPassword123!

# 3. 连接数据库提权
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center
```

```sql
-- 查询用户 ID
SELECT id, email FROM users ORDER BY created_at DESC LIMIT 1;

-- 提升为超级管理员（替换 USER_ID）
UPDATE users SET role = 'super_admin', status = 'active' WHERE id = 'USER_ID';

-- 验证
SELECT id, email, role, status FROM users WHERE role = 'super_admin';

-- 退出
EXIT;
```

---

## ✅ 验证部署

```powershell
# 1. 检查服务
pm2 status

# 2. 测试 API
# PowerShell:
Invoke-WebRequest -Uri http://192.168.1.2:3000/health

# 或 curl（如果已安装）:
curl http://192.168.1.2:3000/health
# 应返回: {"status":"ok"}

# 3. 浏览器访问
# http://192.168.1.2

# 4. 登录测试
# 使用超级管理员账号登录
```

---

## 🔧 常用命令

```powershell
# ========== 服务管理 ==========
pm2 status                  # 查看状态
pm2 logs                    # 查看日志
pm2 restart all             # 重启服务
pm2 stop all                # 停止服务

# ========== 数据库操作 ==========
# 连接 OceanBase
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center

# 在 MySQL 提示符下：
SHOW TABLES;                # 查看所有表
SELECT * FROM users;        # 查看用户

# ========== IIS 管理 ==========
iisreset                    # 重启 IIS
iisreset /start             # 启动 IIS
iisreset /stop              # 停止 IIS

# ========== 重新部署 ==========
cd C:\ops-workflow-center
git pull                    # 更新代码（如果使用 Git）
npm install                 # 更新依赖
npm run build               # 重新构建
pm2 restart all             # 重启服务
```

---

## 🐛 常见问题

| 问题 | 解决方案 |
|-----|---------|
| **npm install 失败** | 以管理员身份运行 PowerShell，安装 windows-build-tools |
| **bcrypt 编译错误** | `npm install bcrypt@latest --save` |
| **无法连接 OceanBase** | 检查用户名完整性：`root@Tianji4_MySQL#Tianji4` |
| **端口被占用** | `netstat -ano \| findstr :3000`，然后 `taskkill /PID <PID> /F` |
| **前端白屏** | F12 查看控制台，检查 `VITE_API_URL` 配置 |
| **无法登录** | SQL: `UPDATE users SET status='active' WHERE email='xxx'` |
| **Windows 路径错误** | 使用正斜杠 `/` 或双反斜杠 `\\` |

---

## 📚 详细文档

- [完整 Windows 部署指南](./readme/OCEANBASE_WINDOWS_DEPLOYMENT.md) - 12 步详细流程（含 IIS/Nginx 配置）
- [用户使用指南](./USER_GUIDE.md) - 系统功能介绍
- [管理员设置指南](./readme/POST_HANDOVER_ADMIN_SETUP.md) - 权限配置

---

## 🆘 获取帮助

```powershell
# 查看后端日志
pm2 logs ops-api

# 查看 IIS 日志
type C:\inetpub\logs\LogFiles\W3SVC1\u_ex*.log

# 查看浏览器控制台
# F12 → Console

# 测试数据库连接
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__
```

---

**快速参考版本**: 1.0
**更新日期**: 2026-01-27
**预计部署时间**: 10-15 分钟（含编译工具安装）
**适用环境**: Windows Server / Windows 10/11 + OceanBase MySQL 租户
