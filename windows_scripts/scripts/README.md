# Windows 本地部署指南

本目录包含在 **Windows 系统**上部署项目所需的所有脚本，使用 **MySQL/OceanBase** 作为数据库后端。

## 📋 目录结构

```
windows_scripts/scripts/
├── init-database.sql          # 数据库初始化 SQL 脚本
├── switch-to-mysql.bat        # 环境切换脚本
├── create-super-admin.js      # 超级管理员创建脚本
├── deploy.bat                 # 一键部署脚本
└── README.md                  # 本文档
```

## 🎯 部署前准备

### 1. 系统要求

- **操作系统**: Windows 10/11 或 Windows Server 2016+
- **Node.js**: 18.x 或更高版本
- **npm**: 9.x 或更高版本
- **数据库**: MySQL 5.7+ 或 OceanBase MySQL 兼容模式

### 2. 安装必需软件

#### 安装 Node.js

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 LTS 版本（推荐 18.x 或 20.x）
3. 运行安装程序，保持默认选项
4. 打开命令提示符，验证安装：
   ```cmd
   node --version
   npm --version
   ```

#### 安装 MySQL 客户端（可选但推荐）

1. 下载 [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)
2. 安装时选择"Custom"，只安装 MySQL Client
3. 或者直接下载 MySQL Shell

### 3. 准备数据库

#### 创建数据库

连接到 MySQL/OceanBase 服务器，执行：

```sql
CREATE DATABASE ops_workflow_center CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 创建数据库用户（可选）

```sql
CREATE USER 'ops_user'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON ops_workflow_center.* TO 'ops_user'@'%';
FLUSH PRIVILEGES;
```

## 🚀 快速部署（推荐）

### 使用一键部署脚本

```cmd
cd C:\path\to\project
windows_scripts\scripts\deploy.bat
```

**脚本会自动完成：**
1. ✅ 检查运行环境（Node.js, npm, MySQL）
2. ✅ 安装项目依赖
3. ✅ 配置环境变量
4. ✅ 初始化数据库
5. ✅ 创建超级管理员
6. ✅ 构建项目（可选）
7. ✅ 显示启动说明

**交互式操作：**
- 脚本会在关键步骤暂停，等待确认
- 可以选择跳过已完成的步骤
- 所有操作都有详细提示

## 📝 手动部署步骤

如果不使用一键部署脚本，可以按照以下步骤手动操作。

### 步骤 1: 克隆或解压项目

```cmd
cd C:\Projects
REM 如果使用 Git
git clone <repository-url> ops-workflow-center
cd ops-workflow-center

REM 或者解压 ZIP 文件
unzip ops-workflow-center.zip
cd ops-workflow-center
```

### 步骤 2: 安装依赖

```cmd
npm install
```

预计时间：2-5 分钟，取决于网络速度。

### 步骤 3: 配置环境变量

#### 方式 1: 使用切换脚本

```cmd
windows_scripts\scripts\switch-to-mysql.bat
```

#### 方式 2: 手动配置

```cmd
copy .env.mysql .env
notepad .env
```

**必须修改的配置项：**

```env
# 服务提供商（不要修改）
VITE_SERVICE_PROVIDER=custom

# API 服务器地址
VITE_API_URL=http://localhost:3000
VITE_PLAYWRIGHT_URL=http://localhost:3001

# 数据库配置（根据实际情况修改）
DB_HOST=192.168.1.100
DB_PORT=3306
DB_USER=ops_user
DB_PASSWORD=your_password_here
DB_DATABASE=ops_workflow_center

# JWT 密钥（生产环境务必修改）
JWT_SECRET=change-this-to-a-strong-random-key-in-production

# 文件上传目录
UPLOAD_DIR=./uploads
```

**安全建议：**
- 生产环境必须修改 `JWT_SECRET`
- 使用强密码
- 限制数据库用户权限

### 步骤 4: 初始化数据库

#### 方式 1: 使用 MySQL 命令行

```cmd
mysql -h 192.168.1.100 -P 3306 -u ops_user -p ops_workflow_center < windows_scripts\scripts\init-database.sql
```

输入密码后，脚本会自动创建所有表。

#### 方式 2: 使用图形化工具

如果使用 Navicat、HeidiSQL、MySQL Workbench 等工具：
1. 连接到数据库
2. 选择 `ops_workflow_center` 数据库
3. 打开 `windows_scripts/scripts/init-database.sql`
4. 执行整个文件

**创建的表：**
- `user_profiles` - 用户资料表
- `account_requests` - 注册申请表
- `modules` - 模块表
- `workflows` - 工作流表
- `workflow_nodes` - 工作流节点表
- `workflow_edges` - 工作流连接表
- `scenarios` - 应急场景表
- `execution_logs` - 执行日志表
- `ai_configs` - AI 配置表
- `sop_documents` - SOP 文档表

### 步骤 5: 创建超级管理员

```cmd
node windows_scripts\scripts\create-super-admin.js admin@company.com SecurePassword123
```

**参数说明：**
- 第一个参数：管理员邮箱
- 第二个参数：密码（至少 8 位）

**输出示例：**
```
=========================================
   创建超级管理员账号
=========================================

📧 邮箱: admin@company.com
🔐 密码: ********************

📋 步骤 1: 连接数据库...
   主机: 192.168.1.100:3306
   数据库: ops_workflow_center

✅ 数据库连接成功

📋 步骤 2: 检查用户是否已存在...
✅ 用户不存在，继续创建

📋 步骤 3: 加密密码...
✅ 密码加密完成

📋 步骤 4: 创建超级管理员...
✅ 超级管理员创建成功

   User ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

=========================================
   ✅ 超级管理员创建成功！
=========================================

登录信息：
   邮箱: admin@company.com
   密码: SecurePassword123
   角色: super_admin
   状态: active

下一步：
   1. 启动 API 服务器: npm run server
   2. 启动前端: npm run dev
   3. 访问: http://localhost:5173
   4. 使用上述凭据登录
```

### 步骤 6: 启动应用

#### 开发环境

**终端 1 - 启动 API 服务器：**
```cmd
npm run server
```

输出示例：
```
API Server running on http://localhost:3000
Playwright Server running on http://localhost:3001
Database connected successfully
```

**终端 2 - 启动前端：**
```cmd
npm run dev
```

输出示例：
```
  VITE v6.0.7  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**访问应用：**
- 打开浏览器
- 访问 http://localhost:5173
- 使用超级管理员账号登录

#### 生产环境

**1. 构建前端：**
```cmd
npm run build
```

生成的文件在 `dist/` 目录。

**2. 构建后端：**
```cmd
npm run server:build
```

生成的文件在 `dist/server/` 目录。

**3. 配置 Web 服务器（IIS）：**

创建 `web.config` 文件：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

**4. 使用进程管理器：**

安装 PM2（推荐）：
```cmd
npm install -g pm2
pm2 start dist/server/index.js --name ops-server
pm2 save
pm2 startup
```

或者使用 Windows Service：
```cmd
npm install -g node-windows
node-windows-install.js
```

## 🔧 故障排除

### 问题 1: 无法连接数据库

**错误信息：**
```
❌ 发生错误： connect ECONNREFUSED
```

**可能原因：**
- 数据库服务未启动
- 数据库配置错误（主机、端口、用户名、密码）
- 防火墙阻止连接

**解决方案：**
1. 检查数据库服务状态：
   ```cmd
   sc query MySQL80
   ```
2. 验证配置：
   ```cmd
   mysql -h <host> -P <port> -u <user> -p
   ```
3. 检查防火墙规则：
   ```cmd
   netsh advfirewall firewall show rule name=all | findstr 3306
   ```

### 问题 2: 数据库不存在

**错误信息：**
```
❌ 发生错误： ER_BAD_DB_ERROR
   错误代码: ER_BAD_DB_ERROR
```

**解决方案：**
创建数据库：
```sql
CREATE DATABASE ops_workflow_center CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 问题 3: 数据表不存在

**错误信息：**
```
❌ 发生错误： ER_NO_SUCH_TABLE
```

**解决方案：**
运行初始化脚本：
```cmd
mysql -h <host> -P <port> -u <user> -p ops_workflow_center < windows_scripts\scripts\init-database.sql
```

### 问题 4: 端口被占用

**错误信息：**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案：**

查找占用端口的进程：
```cmd
netstat -ano | findstr :3000
```

终止进程：
```cmd
taskkill /PID <进程ID> /F
```

或修改 `.env` 中的端口配置。

### 问题 5: npm install 失败

**可能原因：**
- 网络问题
- npm 仓库访问慢
- 权限问题

**解决方案：**

使用国内镜像：
```cmd
npm config set registry https://registry.npmmirror.com
npm install
```

清理缓存重试：
```cmd
npm cache clean --force
rd /s /q node_modules
npm install
```

## 📊 数据库架构说明

### 用户系统

**`user_profiles` 表：**
- 存储用户账号、密码（bcrypt 加密）、角色、状态
- 角色类型：
  - `super_admin` - 超级管理员（最高权限）
  - `admin` - 管理员
  - `read_write` - 读写用户
  - `read_only` - 只读用户
- 状态类型：
  - `active` - 活跃
  - `pending` - 待审批
  - `locked` - 锁定
  - `deleted` - 已删除

**`account_requests` 表：**
- 存储用户注册申请
- 管理员可审批或拒绝

### 工作流系统

**`modules` 表：**
- 可复用的自动化模块
- 类型：`open_url`, `fill_form`, `click_element`, `wait`, `execute_command`

**`workflows` 表：**
- 工作流定义
- 包含完整的 React Flow 定义（JSON 格式）

**`workflow_nodes` 和 `workflow_edges` 表：**
- 工作流的节点和连接关系
- 与 React Flow 集成

### 应急场景

**`scenarios` 表：**
- 应急处置场景
- 关联工作流
- 包含 SOP 文档和流程图

### 执行日志

**`execution_logs` 表：**
- 工作流执行历史
- 状态追踪：`pending`, `running`, `completed`, `failed`

### AI 配置

**`ai_configs` 表：**
- AI 模型配置
- 支持互联网和内网 AI 服务
- 用户级和全局级配置

### SOP 文档

**`sop_documents` 表：**
- 标准操作程序文档库
- 支持 Markdown/HTML 格式
- 分类和标签管理

## 🔐 安全最佳实践

### 1. 数据库安全

- ✅ 使用强密码
- ✅ 限制数据库用户权限
- ✅ 只允许特定 IP 访问
- ✅ 定期备份数据库
- ✅ 启用 SSL/TLS 连接（生产环境）

### 2. 应用安全

- ✅ 修改默认的 JWT_SECRET
- ✅ 使用 HTTPS（生产环境）
- ✅ 设置强密码策略
- ✅ 定期更新依赖包
- ✅ 禁用不必要的端口

### 3. 服务器安全

- ✅ 配置防火墙
- ✅ 只开放必需端口（80, 443, 3000）
- ✅ 定期更新系统补丁
- ✅ 使用非 Administrator 账号运行应用
- ✅ 启用日志审计

## 📦 生产环境部署

### 使用 IIS 部署

1. 安装 IIS 和 URL Rewrite 模块
2. 创建新的网站，指向 `dist/` 目录
3. 配置 `web.config` 文件
4. 绑定域名和 SSL 证书

### 使用 PM2 管理进程

```cmd
REM 安装 PM2
npm install -g pm2

REM 启动服务
pm2 start dist/server/index.js --name ops-server

REM 开机自启
pm2 startup
pm2 save

REM 查看日志
pm2 logs ops-server

REM 监控
pm2 monit
```

### 反向代理配置

如果使用 Nginx（通过 WSL）：

```nginx
server {
    listen 80;
    server_name ops.company.com;

    # 前端静态文件
    location / {
        root C:/Projects/ops-workflow-center/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔄 更新和维护

### 更新应用

```cmd
REM 1. 备份数据库
mysqldump -h <host> -u <user> -p ops_workflow_center > backup_%date:~0,10%.sql

REM 2. 拉取最新代码
git pull origin main

REM 3. 安装新依赖
npm install

REM 4. 运行数据库迁移（如有）
mysql -h <host> -u <user> -p ops_workflow_center < migrations/new_migration.sql

REM 5. 重新构建
npm run build
npm run server:build

REM 6. 重启服务
pm2 restart ops-server
```

### 数据库备份

**手动备份：**
```cmd
mysqldump -h <host> -u <user> -p ops_workflow_center > backup_%date:~0,10%.sql
```

**定时备份（使用 Windows 任务计划程序）：**
1. 创建备份脚本 `backup.bat`：
   ```cmd
   @echo off
   set TIMESTAMP=%date:~0,10%_%time:~0,2%%time:~3,2%
   mysqldump -h localhost -u root -pYourPassword ops_workflow_center > C:\Backups\ops_backup_%TIMESTAMP%.sql
   ```

2. 打开"任务计划程序"
3. 创建基本任务
4. 设置每天凌晨执行

### 日志管理

**查看应用日志：**
```cmd
REM PM2 日志
pm2 logs ops-server

REM 或查看日志文件
type %USERPROFILE%\.pm2\logs\ops-server-out.log
type %USERPROFILE%\.pm2\logs\ops-server-error.log
```

## 📞 技术支持

### 常见问题

1. **端口冲突**：修改 `.env` 中的端口配置
2. **数据库连接超时**：检查防火墙和网络配置
3. **构建失败**：清理 node_modules 重新安装
4. **性能问题**：检查数据库索引和查询优化

### 获取帮助

- 查看项目 README.md
- 查看 docs/ARCHITECTURE.md
- 检查系统日志和应用日志
- 联系技术支持团队

## 📚 相关文档

- [项目架构文档](../../docs/ARCHITECTURE.md)
- [用户手册](../../USER_GUIDE.md)
- [API 文档](../../docs/API.md)（如有）
- [Linux 部署指南](../../linux_scripts/scripts/README.md)
- [Bolt 环境指南](../../bolt_scripts/scripts/README.md)
