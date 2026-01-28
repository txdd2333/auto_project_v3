# OceanBase 快速部署指南

> 快速参考版，5 分钟完成部署！详细步骤查看 [完整 OceanBase 部署指南](./readme/OCEANBASE_DEPLOYMENT_GUIDE.md)

---

## 🎯 部署环境

- **部署服务器**: `192.168.1.2`
- **OceanBase**: `192.168.1.70:2883`
- **数据库租户**: `Tianji4_MySQL#Tianji4`

---

## ⚡ 一键部署（复制粘贴即可）

### 步骤 1: 安装 Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential python3 git mysql-client

# 验证
node --version  # v20.x.x
npm --version   # 10.x.x
```

### 步骤 2: 获取项目并安装依赖

```bash
# 进入项目目录（假设代码已上传到 /opt）
cd /opt/ops-workflow-center

# 安装所有依赖（必须！包含 bcrypt, mysql2 等 500+ 个包）
npm install

# 预计耗时 2-5 分钟，请耐心等待
```

### 步骤 3: 配置环境变量

```bash
# 复制配置模板
cp .env.mysql .env

# 配置已包含正确的 OceanBase 连接信息：
# - DB_HOST=192.168.1.70
# - DB_PORT=2883
# - DB_USER=root@Tianji4_MySQL#Tianji4
# - DB_PASSWORD=aaAA11__
# - VITE_API_URL=http://192.168.1.2:3000

# 如需修改，编辑 .env 文件
nano .env
```

### 步骤 4: 初始化数据库

```bash
# 连接到 OceanBase 并创建数据库
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ -e "CREATE DATABASE IF NOT EXISTS ops_workflow_center CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 导入数据库结构（8 张表）
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center < linux_scripts/scripts/init-database.sql

# 验证表结构
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

### 步骤 5: 构建项目

```bash
# 构建前端和后端（必须！）
npm run build

# 预计耗时 30-60 秒
# 输出到 dist/ 目录
```

### 步骤 6: 启动服务

#### 方式 A: 使用 PM2（生产环境推荐）

```bash
# 安装 PM2
sudo npm install -g pm2

# 启动服务
pm2 start dist/server/index.js --name "ops-api"
pm2 start dist/server/api-server.js --name "ops-playwright"

# 查看状态
pm2 status

# 开机自启
pm2 startup systemd
pm2 save
```

#### 方式 B: 使用 tmux（开发/调试）

```bash
# 创建会话
tmux new -s ops

# 窗口 0: API 服务器
npm run server

# 新建窗口（Ctrl+B, C）
npm run api-server

# 新建窗口（Ctrl+B, C）
npm run dev

# 分离会话: Ctrl+B, D
# 重新连接: tmux attach -t ops
```

### 步骤 7: 配置 Nginx（可选，生产环境推荐）

```bash
# 安装 Nginx
sudo apt-get install -y nginx

# 创建配置文件
sudo tee /etc/nginx/sites-available/ops-workflow > /dev/null <<'EOF'
server {
    listen 80;
    server_name 192.168.1.2;
    root /opt/ops-workflow-center/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    client_max_body_size 50M;
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/ops-workflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 配置防火墙
sudo ufw allow 80/tcp
```

### 步骤 8: 创建超级管理员

```bash
# 1. 浏览器打开注册页面
# http://192.168.1.2/register

# 2. 注册账号
# 邮箱: admin@yourcompany.com
# 密码: YourPassword123!

# 3. 连接数据库提权
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center
```

```sql
-- 查询刚注册的用户 ID
SELECT id, email FROM users ORDER BY created_at DESC LIMIT 1;

-- 提升为超级管理员（替换 USER_ID）
UPDATE users SET role = 'super_admin', status = 'active' WHERE id = 'USER_ID';

-- 验证
SELECT id, email, role, status FROM users WHERE role = 'super_admin';
```

---

## ✅ 验证部署

```bash
# 1. 检查服务状态
pm2 status

# 2. 测试 API
curl http://192.168.1.2:3000/health
# 应返回: {"status":"ok"}

# 3. 浏览器访问
# http://192.168.1.2

# 4. 登录测试
# 使用超级管理员账号登录
```

---

## 🔧 常用命令

```bash
# ========== 服务管理 ==========
pm2 status                  # 查看状态
pm2 logs                    # 查看日志
pm2 restart all             # 重启服务
pm2 stop all                # 停止服务

# ========== 数据库操作 ==========
# 连接 OceanBase
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center

# 查看表
SHOW TABLES;

# 查看用户
SELECT * FROM users;

# ========== 重新部署 ==========
cd /opt/ops-workflow-center
git pull                    # 更新代码
npm install                 # 更新依赖
npm run build               # 重新构建
pm2 restart all             # 重启服务
```

---

## 🐛 常见问题

| 问题 | 解决方案 |
|-----|---------|
| **npm install 失败** | `sudo apt-get install build-essential python3` |
| **bcrypt 编译错误** | `npm cache clean --force && npm install` |
| **无法连接 OceanBase** | 检查用户名是否完整：`root@Tianji4_MySQL#Tianji4` |
| **端口被占用** | `lsof -i :3000` 查找进程并 `kill -9 <PID>` |
| **前端白屏** | F12 查看控制台，检查 `VITE_API_URL` 配置 |
| **无法登录** | SQL: `UPDATE users SET status='active' WHERE email='xxx'` |

---

## 📚 详细文档

- [完整 OceanBase 部署指南](./readme/OCEANBASE_DEPLOYMENT_GUIDE.md) - 10 步详细流程
- [用户使用指南](./USER_GUIDE.md) - 系统功能介绍
- [管理员设置指南](./readme/POST_HANDOVER_ADMIN_SETUP.md) - 权限配置

---

## 🆘 获取帮助

```bash
# 查看后端日志
pm2 logs ops-api

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/ops-workflow-error.log

# 查看浏览器控制台
# F12 -> Console

# 测试数据库连接
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__
```

---

**快速参考版本**: 1.0
**更新日期**: 2026-01-27
**预计部署时间**: 5-10 分钟
