# OceanBase MySQL 租户部署指南

本文档专门针对 **OceanBase MySQL 租户**环境的本地部署，详细说明如何将项目迁移到本地并对接 OceanBase 数据库。

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
- **部署服务器**: `192.168.1.2`
- **OceanBase 服务器**: `192.168.1.70:2883`
- **数据库租户**: `Tianji4_MySQL#Tianji4`
- **数据库用户**: `root@Tianji4_MySQL#Tianji4`

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

### 第一步：环境准备

#### 1.1 安装 Node.js

```bash
# 下载并安装 Node.js 20.x LTS 版本
# 访问: https://nodejs.org/

# 验证安装
node --version  # 应输出: v20.x.x
npm --version   # 应输出: 10.x.x
```

**推荐安装方式（Linux）：**

```bash
# 使用 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证
node --version
npm --version
```

#### 1.2 安装系统依赖（Linux）

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y \
    build-essential \
    python3 \
    git \
    mysql-client

# CentOS/RHEL
sudo yum groupinstall -y "Development Tools"
sudo yum install -y python3 git mysql
```

**依赖说明**：
- `build-essential` / `Development Tools`: 编译 native 模块（如 bcrypt）
- `python3`: node-gyp 编译依赖
- `git`: 版本控制（可选）
- `mysql-client`: OceanBase 命令行工具

#### 1.3 安装 Playwright 浏览器依赖（可选）

```bash
# 如果需要使用 Playwright 自动化功能
npx playwright install-deps
```

---

### 第二步：获取项目代码

```bash
# 方法 1: 使用 Git
cd /opt
sudo git clone <repository-url> ops-workflow-center
sudo chown -R $USER:$USER ops-workflow-center
cd ops-workflow-center

# 方法 2: 上传 ZIP 文件
cd /opt
sudo unzip ops-workflow-center.zip
sudo chown -R $USER:$USER ops-workflow-center
cd ops-workflow-center

# 方法 3: 使用 rsync 从其他服务器同步
rsync -avz --progress user@source-server:/path/to/ops-workflow-center /opt/
cd /opt/ops-workflow-center
```

---

### 第三步：安装项目依赖

```bash
# 进入项目目录
cd /opt/ops-workflow-center

# 安装所有依赖（预计 2-5 分钟）
npm install

# 如果网络较慢，使用国内镜像（可选）
npm config set registry https://registry.npmmirror.com
npm install

# 验证依赖安装
ls -l node_modules/ | wc -l  # 应输出 500+ 个包
```

**依赖清单（关键包）**：
- ✅ `express`: API 服务器
- ✅ `mysql2`: OceanBase 数据库驱动
- ✅ `bcrypt`: 密码加密（需要编译）
- ✅ `playwright`: 浏览器自动化
- ✅ `react`, `vite`: 前端框架
- ✅ `@logicflow/core`: 流程图编辑器

**常见问题**：

如果 `bcrypt` 安装失败：
```bash
# 方法 1: 清理缓存重试
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 方法 2: 使用预编译版本
npm install bcrypt@latest --build-from-source
```

---

### 第四步：配置环境变量

```bash
# 1. 复制 OceanBase 配置模板
cp .env.mysql .env

# 2. 编辑配置文件
nano .env  # 或使用 vim .env
```

**完整配置内容**：

```env
# ========== 服务提供商 ==========
VITE_SERVICE_PROVIDER=custom

# ========== API 服务器地址 ==========
# 前端访问后端的地址（使用部署服务器地址）
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
- `JWT_SECRET` 在生产环境务必修改为随机字符串

---

### 第五步：初始化 OceanBase 数据库

#### 5.1 连接到 OceanBase

```bash
# 使用 MySQL 客户端连接
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__

# 或使用交互式输入密码（更安全）
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -p
# 然后输入: aaAA11__
```

#### 5.2 创建数据库

```sql
-- 创建数据库（使用 utf8mb4 字符集）
CREATE DATABASE IF NOT EXISTS ops_workflow_center
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 验证
SHOW DATABASES LIKE 'ops_workflow_center';

-- 切换到数据库
USE ops_workflow_center;
```

#### 5.3 执行初始化脚本

**方法 1: 使用命令行导入（推荐）**

```bash
# 在项目目录下执行
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center < linux_scripts/scripts/init-database.sql

# 或使用交互式输入密码
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -p ops_workflow_center < linux_scripts/scripts/init-database.sql
```

**方法 2: 手动执行 SQL**

```sql
-- 连接到数据库后
USE ops_workflow_center;

-- 复制 linux_scripts/scripts/init-database.sql 的内容
-- 粘贴到 MySQL 客户端执行
SOURCE /opt/ops-workflow-center/linux_scripts/scripts/init-database.sql;
```

#### 5.4 验证表结构

```sql
-- 查看已创建的表
SHOW TABLES;

-- 应输出以下表（共 8 张）：
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
```

---

### 第六步：构建项目

```bash
# 在项目根目录执行构建
npm run build

# 构建过程说明：
# 1. TypeScript 编译 (tsc)
# 2. Vite 打包前端 (vite build)
# 3. 输出到 dist/ 目录

# 验证构建产物
ls -lh dist/
# dist/
# ├── assets/         # 前端静态资源（JS、CSS、图片）
# ├── index.html      # 入口 HTML
# └── server/         # 后端编译产物
#     ├── index.js    # API 服务器
#     └── api-server.js  # Playwright 服务器
```

**预期输出**：
```
vite v6.4.1 building for production...
✓ 2688 modules transformed.
✓ built in 29.37s
```

---

### 第七步：启动服务

#### 方式 A: 开发模式（调试用）

```bash
# 使用 tmux 或 screen 管理多个终端

# 终端 1: 启动 API 服务器
npm run server
# 输出: 🚀 API Server running on http://192.168.1.2:3000

# 终端 2: 启动 Playwright 服务器
npm run api-server
# 输出: 🚀 Playwright Backend Server running on http://192.168.1.2:3001

# 终端 3: 启动前端开发服务器
npm run dev
# 输出: ➜  Local:   http://localhost:5173/
```

**使用 tmux 示例**：

```bash
# 创建新会话
tmux new -s ops-workflow

# 创建窗口并启动服务
# 窗口 0: API 服务器
npm run server

# Ctrl+B, C 创建新窗口
# 窗口 1: Playwright 服务器
npm run api-server

# Ctrl+B, C 创建新窗口
# 窗口 2: 前端开发服务器
npm run dev

# 切换窗口: Ctrl+B, 0/1/2
# 分离会话: Ctrl+B, D
# 重新连接: tmux attach -t ops-workflow
```

#### 方式 B: 生产模式（推荐）

```bash
# 1. 安装 PM2 进程管理器
sudo npm install -g pm2

# 2. 启动后端服务
pm2 start dist/server/index.js --name "ops-api" \
    --log /var/log/pm2/ops-api.log \
    --error /var/log/pm2/ops-api-error.log

pm2 start dist/server/api-server.js --name "ops-playwright" \
    --log /var/log/pm2/ops-playwright.log \
    --error /var/log/pm2/ops-playwright-error.log

# 3. 查看运行状态
pm2 status

# 应显示类似输出：
# ┌────┬─────────────────┬─────────┬─────────┬──────────┐
# │ id │ name            │ mode    │ ↺      │ status   │
# ├────┼─────────────────┼─────────┼─────────┼──────────┤
# │ 0  │ ops-api         │ fork    │ 0       │ online   │
# │ 1  │ ops-playwright  │ fork    │ 0       │ online   │
# └────┴─────────────────┴─────────┴─────────┴──────────┘

# 4. 查看日志
pm2 logs ops-api
pm2 logs ops-playwright

# 5. 设置开机自启
pm2 startup systemd
# 复制输出的命令并以 sudo 执行，例如：
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username

pm2 save

# 6. 其他常用命令
pm2 restart all      # 重启所有服务
pm2 stop all         # 停止所有服务
pm2 delete all       # 删除所有服务
pm2 monit            # 实时监控
```

#### 方式 C: 使用 systemd（高级）

```bash
# 创建 systemd 服务文件
sudo nano /etc/systemd/system/ops-workflow-api.service
```

```ini
[Unit]
Description=Ops Workflow API Server
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/opt/ops-workflow-center
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/server/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=ops-workflow-api

[Install]
WantedBy=multi-user.target
```

```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start ops-workflow-api
sudo systemctl start ops-workflow-playwright

# 开机自启
sudo systemctl enable ops-workflow-api
sudo systemctl enable ops-workflow-playwright

# 查看状态
sudo systemctl status ops-workflow-api
```

---

### 第八步：配置前端静态文件服务（Nginx）

#### 8.1 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt-get install -y nginx

# CentOS/RHEL
sudo yum install -y nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 8.2 配置站点

```bash
# 创建站点配置文件
sudo nano /etc/nginx/sites-available/ops-workflow
```

**Nginx 配置内容**：

```nginx
server {
    listen 80;
    server_name 192.168.1.2;  # 部署服务器地址

    root /opt/ops-workflow-center/dist;
    index index.html;

    # 日志配置
    access_log /var/log/nginx/ops-workflow-access.log;
    error_log /var/log/nginx/ops-workflow-error.log;

    # SPA 路由支持（所有路由返回 index.html）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理（转发到 Node.js 后端）
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Playwright API 代理
    location /playwright/ {
        proxy_pass http://127.0.0.1:3001/api/playwright/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }

    # 静态资源缓存优化
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # 文件上传大小限制
    client_max_body_size 50M;
}
```

#### 8.3 启用站点

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/ops-workflow /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 应输出：
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# 重新加载 Nginx
sudo systemctl reload nginx

# 或重启
sudo systemctl restart nginx
```

#### 8.4 配置防火墙

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

### 第九步：创建超级管理员账号

#### 9.1 方法 1: 注册 + SQL 提权（推荐）

```bash
# 1. 打开浏览器访问注册页面
http://192.168.1.2/register

# 2. 填写管理员信息注册
# 邮箱: admin@yourcompany.com
# 密码: YourStrongPassword123!

# 3. 连接到 OceanBase
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center
```

```sql
-- 4. 查询刚注册的用户
SELECT id, email, role, status, created_at
FROM users
ORDER BY created_at DESC
LIMIT 1;

-- 5. 提升为超级管理员（替换 USER_ID）
UPDATE users
SET
    role = 'super_admin',
    status = 'active',
    updated_at = NOW()
WHERE id = 'USER_ID_FROM_ABOVE';

-- 6. 验证
SELECT id, email, role, status
FROM users
WHERE role = 'super_admin';

-- 应输出：
-- +--------------------------------------+-------------------------+--------------+--------+
-- | id                                   | email                   | role         | status |
-- +--------------------------------------+-------------------------+--------------+--------+
-- | xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | admin@yourcompany.com   | super_admin  | active |
-- +--------------------------------------+-------------------------+--------------+--------+
```

#### 9.2 方法 2: 使用脚本创建

```bash
# 运行创建脚本
node linux_scripts/scripts/create-super-admin.js

# 按提示输入信息：
# Email: admin@yourcompany.com
# Password: YourStrongPassword123!

# 脚本会自动：
# 1. 连接 OceanBase
# 2. 创建用户
# 3. 设置为超级管理员
```

#### 9.3 方法 3: 直接插入（仅测试环境）

```sql
-- 生成密码哈希（在 Node.js 中）
-- node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourPassword123!', 10).then(hash => console.log(hash));"

-- 插入超级管理员
INSERT INTO users (
    id,
    email,
    encrypted_password,
    role,
    status,
    created_at
) VALUES (
    UUID(),
    'admin@yourcompany.com',
    '$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',  -- 替换为实际哈希
    'super_admin',
    'active',
    NOW()
);
```

---

### 第十步：验证部署

#### 10.1 检查服务状态

```bash
# 检查后端服务
pm2 status

# 检查端口监听
netstat -tuln | grep 3000
netstat -tuln | grep 3001

# 应输出：
# tcp        0      0 0.0.0.0:3000            0.0.0.0:*               LISTEN
# tcp        0      0 0.0.0.0:3001            0.0.0.0:*               LISTEN

# 检查 Nginx 状态
sudo systemctl status nginx
```

#### 10.2 测试 API 端点

```bash
# 测试 API 服务器健康检查
curl http://192.168.1.2:3000/health

# 应返回：
# {"status":"ok"}

# 测试 Playwright 服务健康检查
curl http://192.168.1.2:3001/health

# 应返回：
# {"status":"ok","service":"playwright-backend"}

# 测试通过 Nginx 访问
curl http://192.168.1.2/api/health
```

#### 10.3 测试数据库连接

```sql
-- 连接到 OceanBase
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center

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

#### 10.4 测试前端访问

```bash
# 在浏览器中打开
http://192.168.1.2

# 应该看到：
# ✅ 登录页面正常显示
# ✅ 样式加载正常
# ✅ 无控制台错误（F12 查看）
```

#### 10.5 测试登录流程

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

---

## 🔒 生产环境安全加固

### 1. 修改敏感配置

```bash
# 生成强 JWT 密钥
openssl rand -base64 32

# 修改 .env 文件
nano .env

# 更新 JWT_SECRET
JWT_SECRET=生成的随机密钥
```

### 2. 配置 HTTPS（推荐）

```bash
# 安装 Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 获取 SSL 证书（需要域名）
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo systemctl enable certbot.timer
```

### 3. 限制数据库访问

```sql
-- 创建专用数据库用户（在 OceanBase 中）
CREATE USER 'ops_app'@'192.168.1.2' IDENTIFIED BY 'StrongPassword123!';

-- 授予必要权限
GRANT SELECT, INSERT, UPDATE, DELETE ON ops_workflow_center.* TO 'ops_app'@'192.168.1.2';
FLUSH PRIVILEGES;

-- 更新 .env 配置
DB_USER=ops_app@Tianji4_MySQL#Tianji4
DB_PASSWORD=StrongPassword123!
```

### 4. 配置日志轮转

```bash
# PM2 日志轮转
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### 5. 备份策略

```bash
# 创建备份脚本
sudo nano /opt/backup-ops-workflow.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/ops-workflow"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
mysqldump -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ \
    ops_workflow_center > $BACKUP_DIR/db_$DATE.sql

# 压缩
gzip $BACKUP_DIR/db_$DATE.sql

# 备份上传文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/ops-workflow-center/uploads

# 保留最近 7 天的备份
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# 设置执行权限
sudo chmod +x /opt/backup-ops-workflow.sh

# 添加到 crontab（每天凌晨 2 点执行）
crontab -e
# 添加：
0 2 * * * /opt/backup-ops-workflow.sh >> /var/log/backup-ops-workflow.log 2>&1
```

---

## 🔧 故障排查

### 问题 1: npm install 失败

```bash
# 错误: bcrypt 编译失败
# 解决方案 1: 安装编译工具
sudo apt-get install build-essential python3

# 解决方案 2: 清理缓存重试
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 问题 2: 无法连接 OceanBase

```bash
# 测试连接
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__

# 常见错误及解决：
# 1. ERROR 1045: Access denied
#    - 检查用户名格式是否完整（必须包含 @tenant#cluster）
#    - 检查密码是否正确

# 2. ERROR 2003: Can't connect
#    - 检查网络连接: ping 192.168.1.70
#    - 检查防火墙: telnet 192.168.1.70 2883
#    - 检查 OceanBase 服务状态

# 3. ERROR 1049: Unknown database
#    - 创建数据库: CREATE DATABASE ops_workflow_center;
```

### 问题 3: PM2 服务启动失败

```bash
# 查看详细错误日志
pm2 logs ops-api --lines 100

# 常见错误：
# 1. Cannot find module 'xxx'
#    - 重新安装依赖: npm install
#    - 重新构建: npm run build

# 2. Port 3000 already in use
#    - 查找占用进程: lsof -i :3000
#    - 杀死进程: kill -9 <PID>

# 3. Database connection failed
#    - 检查 .env 配置
#    - 测试数据库连接
```

### 问题 4: 前端白屏

```bash
# 1. 查看浏览器控制台（F12 -> Console）
# 常见错误：
# - Failed to fetch: 检查 VITE_API_URL 配置
# - 404 Not Found: 检查 Nginx 配置

# 2. 检查 Nginx 错误日志
sudo tail -f /var/log/nginx/ops-workflow-error.log

# 3. 重新构建前端
npm run build
sudo systemctl reload nginx
```

### 问题 5: 用户无法登录

```sql
-- 1. 检查用户状态
SELECT id, email, role, status FROM users WHERE email = 'admin@yourcompany.com';

-- 2. 激活用户
UPDATE users SET status = 'active' WHERE email = 'admin@yourcompany.com';

-- 3. 检查密码是否正确
-- 重置密码（需要先生成哈希）
UPDATE users
SET encrypted_password = '$2b$10$...'
WHERE email = 'admin@yourcompany.com';
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

### 2. Nginx 缓存配置

```nginx
# 在 http 块中添加
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

# 在 location /api/ 中添加
proxy_cache api_cache;
proxy_cache_valid 200 302 5m;
proxy_cache_valid 404 1m;
add_header X-Cache-Status $upstream_cache_status;
```

### 3. PM2 集群模式

```bash
# 使用集群模式启动（利用多核 CPU）
pm2 start dist/server/index.js --name "ops-api" -i max

# 查看集群状态
pm2 status
```

---

## 📝 快速命令参考

```bash
# ========== 服务管理 ==========
pm2 status                  # 查看所有服务状态
pm2 logs ops-api            # 查看 API 日志
pm2 restart all             # 重启所有服务
pm2 stop all                # 停止所有服务
pm2 monit                   # 实时监控

# ========== 数据库操作 ==========
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center
SHOW TABLES;                # 查看所有表
SELECT COUNT(*) FROM users; # 查看用户数量

# ========== Nginx 管理 ==========
sudo nginx -t               # 测试配置
sudo systemctl reload nginx # 重新加载配置
sudo systemctl restart nginx# 重启 Nginx
sudo tail -f /var/log/nginx/ops-workflow-error.log  # 查看错误日志

# ========== 日志查看 ==========
pm2 logs                    # 所有服务日志
journalctl -u nginx -f      # Nginx 系统日志
tail -f /var/log/backup-ops-workflow.log  # 备份日志

# ========== 系统监控 ==========
htop                        # 系统资源监控
pm2 monit                   # PM2 监控
sudo iotop                  # 磁盘 I/O 监控
```

---

## 🎉 总结

完成以上步骤后，您应该拥有：

- ✅ **完整的开发环境**（Node.js 20.x + 依赖包）
- ✅ **运行中的服务**
  - API 服务器（192.168.1.2:3000）
  - Playwright 服务器（192.168.1.2:3001）
  - Nginx 前端服务（192.168.1.2:80）
- ✅ **已初始化的 OceanBase 数据库**（8 张表）
- ✅ **超级管理员账号**
- ✅ **生产环境配置**（PM2 守护 + Nginx 反向代理）
- ✅ **监控和备份**（日志轮转 + 定时备份）

**下一步**：
1. 阅读 [用户指南](../USER_GUIDE.md) 了解系统功能
2. 配置权限 [管理员设置指南](./POST_HANDOVER_ADMIN_SETUP.md)
3. 查看 [架构文档](../docs/ARCHITECTURE.md) 理解系统设计

**技术支持**：
- 查看日志：`pm2 logs`
- 检查数据库：`mysql -h192.168.1.70 ...`
- 浏览器控制台：`F12 -> Console`

---

**文档版本**: 1.0
**更新日期**: 2026-01-27
**适用环境**: OceanBase MySQL 租户 + Linux
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
