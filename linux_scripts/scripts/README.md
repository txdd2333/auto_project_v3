# Linux 本地部署指南

本目录包含在 **Linux 系统**上部署项目所需的所有脚本，使用 **MySQL/OceanBase** 作为数据库后端。

## 📋 目录结构

```
linux_scripts/scripts/
├── init-database.sql          # 数据库初始化 SQL 脚本
├── switch-to-mysql.sh         # 环境切换脚本
├── create-super-admin.js      # 超级管理员创建脚本
├── deploy.sh                  # 一键部署脚本
└── README.md                  # 本文档
```

## 🎯 部署前准备

### 1. 系统要求

- **操作系统**: Ubuntu 20.04+, CentOS 7+, Debian 10+, 或其他主流 Linux 发行版
- **Node.js**: 18.x 或更高版本
- **npm**: 9.x 或更高版本
- **数据库**: MySQL 5.7+ 或 OceanBase MySQL 兼容模式

### 2. 安装必需软件

#### 安装 Node.js（Ubuntu/Debian）

```bash
# 使用 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

#### 安装 Node.js（CentOS/RHEL）

```bash
# 使用 NodeSource 仓库
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node --version
npm --version
```

#### 使用 nvm 安装（推荐）

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载配置
source ~/.bashrc

# 安装 Node.js
nvm install 20
nvm use 20
nvm alias default 20

# 验证安装
node --version
npm --version
```

#### 安装 MySQL 客户端（Ubuntu/Debian）

```bash
sudo apt-get update
sudo apt-get install -y mysql-client
```

#### 安装 MySQL 客户端（CentOS/RHEL）

```bash
sudo yum install -y mysql
```

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

```bash
cd /opt/ops-workflow-center
chmod +x linux_scripts/scripts/*.sh
./linux_scripts/scripts/deploy.sh
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

```bash
cd /opt
# 如果使用 Git
git clone <repository-url> ops-workflow-center
cd ops-workflow-center

# 或者解压 TAR 文件
tar -xzf ops-workflow-center.tar.gz
cd ops-workflow-center
```

### 步骤 2: 安装依赖

```bash
npm install
```

预计时间：2-5 分钟，取决于网络速度。

### 步骤 3: 配置环境变量

#### 方式 1: 使用切换脚本

```bash
chmod +x linux_scripts/scripts/switch-to-mysql.sh
./linux_scripts/scripts/switch-to-mysql.sh
```

#### 方式 2: 手动配置

```bash
cp .env.mysql .env
vi .env  # 或使用 nano
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
- 设置合适的文件权限：`chmod 600 .env`

### 步骤 4: 初始化数据库

```bash
mysql -h 192.168.1.100 -P 3306 -u ops_user -p ops_workflow_center < linux_scripts/scripts/init-database.sql
```

输入密码后，脚本会自动创建所有表。

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

```bash
node linux_scripts/scripts/create-super-admin.js admin@company.com SecurePassword123
```

**参数说明：**
- 第一个参数：管理员邮箱
- 第二个参数：密码（至少 8 位）

### 步骤 6: 启动应用

#### 开发环境

**终端 1 - 启动 API 服务器：**
```bash
npm run server
```

**终端 2 - 启动前端：**
```bash
npm run dev
```

**访问应用：**
- 打开浏览器
- 访问 http://localhost:5173
- 使用超级管理员账号登录

#### 生产环境

**1. 构建前端：**
```bash
npm run build
```

**2. 构建后端：**
```bash
npm run server:build
```

**3. 配置 Nginx：**

创建配置文件 `/etc/nginx/sites-available/ops-workflow`:

```nginx
server {
    listen 80;
    server_name ops.company.com;

    # 前端静态文件
    location / {
        root /opt/ops-workflow-center/dist;
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Playwright 代理
    location /playwright {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/ops-workflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**4. 使用 PM2 管理进程：**

安装 PM2：
```bash
sudo npm install -g pm2
```

创建 PM2 配置文件 `ecosystem.config.js`：
```javascript
module.exports = {
  apps: [{
    name: 'ops-server',
    script: './dist/server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

启动服务：
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**5. 使用 systemd 管理进程（替代方案）：**

创建服务文件 `/etc/systemd/system/ops-server.service`：
```ini
[Unit]
Description=Ops Workflow Center API Server
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/ops-workflow-center
ExecStart=/usr/bin/node dist/server/index.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=ops-server
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

启用服务：
```bash
sudo systemctl daemon-reload
sudo systemctl enable ops-server
sudo systemctl start ops-server
sudo systemctl status ops-server
```

## 🔧 故障排除

### 问题 1: 无法连接数据库

**错误信息：**
```
❌ 发生错误： connect ECONNREFUSED
```

**解决方案：**

1. 检查数据库服务状态：
   ```bash
   sudo systemctl status mysql
   # 或
   sudo systemctl status mariadb
   ```

2. 验证数据库配置：
   ```bash
   mysql -h <host> -P <port> -u <user> -p
   ```

3. 检查防火墙规则：
   ```bash
   # Ubuntu/Debian
   sudo ufw status
   sudo ufw allow 3306/tcp

   # CentOS/RHEL
   sudo firewall-cmd --list-all
   sudo firewall-cmd --add-port=3306/tcp --permanent
   sudo firewall-cmd --reload
   ```

4. 检查 MySQL 绑定地址：
   ```bash
   sudo vi /etc/mysql/mysql.conf.d/mysqld.cnf
   # 确保 bind-address = 0.0.0.0 或注释掉
   sudo systemctl restart mysql
   ```

### 问题 2: 端口被占用

**错误信息：**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案：**

查找并终止占用端口的进程：
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

或修改 `.env` 中的端口配置。

### 问题 3: 权限问题

**错误信息：**
```
EACCES: permission denied
```

**解决方案：**

1. 修改项目文件所有者：
   ```bash
   sudo chown -R $USER:$USER /opt/ops-workflow-center
   ```

2. 确保上传目录可写：
   ```bash
   mkdir -p uploads
   chmod 755 uploads
   ```

3. 如果使用 systemd，确保服务用户有权限：
   ```bash
   sudo chown -R www-data:www-data /opt/ops-workflow-center
   ```

### 问题 4: npm install 失败

**解决方案：**

1. 使用国内镜像：
   ```bash
   npm config set registry https://registry.npmmirror.com
   npm install
   ```

2. 清理缓存重试：
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. 使用 cnpm：
   ```bash
   npm install -g cnpm --registry=https://registry.npmmirror.com
   cnpm install
   ```

### 问题 5: SELinux 阻止（CentOS/RHEL）

**解决方案：**

1. 临时禁用 SELinux（测试用）：
   ```bash
   sudo setenforce 0
   ```

2. 配置 SELinux 策略：
   ```bash
   sudo setsebool -P httpd_can_network_connect 1
   sudo chcon -Rt httpd_sys_content_t /opt/ops-workflow-center/dist
   ```

3. 永久禁用 SELinux（不推荐）：
   ```bash
   sudo vi /etc/selinux/config
   # 设置 SELINUX=disabled
   sudo reboot
   ```

## 🔐 安全最佳实践

### 1. 系统安全

```bash
# 创建专用用户
sudo useradd -r -s /bin/false ops-user

# 设置文件权限
sudo chown -R ops-user:ops-user /opt/ops-workflow-center
sudo chmod 750 /opt/ops-workflow-center
sudo chmod 600 /opt/ops-workflow-center/.env

# 配置防火墙
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 2. 数据库安全

```sql
-- 限制访问 IP
CREATE USER 'ops_user'@'192.168.1.%' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON ops_workflow_center.* TO 'ops_user'@'192.168.1.%';

-- 启用 SSL
-- ALTER USER 'ops_user'@'192.168.1.%' REQUIRE SSL;

-- 定期备份
0 2 * * * /usr/bin/mysqldump -u ops_user -p'password' ops_workflow_center > /backup/ops_$(date +\%Y\%m\%d).sql
```

### 3. Nginx 安全

```nginx
# 添加安全头
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;

# 限制请求大小
client_max_body_size 10M;

# 限制请求速率
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req zone=api burst=20;

# 配置 SSL（生产环境必须）
listen 443 ssl http2;
ssl_certificate /etc/ssl/certs/ops.crt;
ssl_certificate_key /etc/ssl/private/ops.key;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
```

### 4. 应用安全

```bash
# 设置环境变量
echo "NODE_ENV=production" >> .env
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env

# 禁用调试模式
# 确保 .env 中没有 DEBUG=* 或类似配置

# 限制日志大小
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## 📊 性能优化

### 1. Node.js 优化

```bash
# 设置 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=2048"

# 使用 PM2 集群模式
pm2 start dist/server/index.js -i max --name ops-server
```

### 2. MySQL 优化

```sql
-- 添加索引
CREATE INDEX idx_user_email ON user_profiles(email);
CREATE INDEX idx_scenario_user ON scenarios(user_id);
CREATE INDEX idx_workflow_user ON workflows(user_id);

-- 优化查询
ANALYZE TABLE user_profiles, scenarios, workflows;
```

### 3. Nginx 缓存

```nginx
# 静态文件缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# 启用 gzip
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

## 🔄 更新和维护

### 更新应用

```bash
#!/bin/bash
# update.sh

# 1. 备份数据库
mysqldump -u ops_user -p ops_workflow_center > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. 停止服务
pm2 stop ops-server

# 3. 拉取最新代码
git pull origin main

# 4. 安装新依赖
npm install

# 5. 运行数据库迁移（如有）
# mysql -u ops_user -p ops_workflow_center < migrations/new_migration.sql

# 6. 重新构建
npm run build
npm run server:build

# 7. 重启服务
pm2 restart ops-server

echo "更新完成！"
```

### 数据库备份

**自动备份脚本：**

创建 `/opt/backup/db-backup.sh`：
```bash
#!/bin/bash
BACKUP_DIR="/opt/backup/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="ops_workflow_center"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
mysqldump -u ops_user -p'password' $DB_NAME > $BACKUP_DIR/ops_$DATE.sql

# 压缩备份
gzip $BACKUP_DIR/ops_$DATE.sql

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "备份完成: $BACKUP_DIR/ops_$DATE.sql.gz"
```

添加到 crontab：
```bash
chmod +x /opt/backup/db-backup.sh
crontab -e
# 添加：每天凌晨 2 点备份
0 2 * * * /opt/backup/db-backup.sh >> /var/log/db-backup.log 2>&1
```

### 监控和日志

**查看应用日志：**
```bash
# PM2 日志
pm2 logs ops-server
pm2 logs ops-server --lines 100

# systemd 日志
sudo journalctl -u ops-server -f
sudo journalctl -u ops-server --since today
```

**监控资源使用：**
```bash
# PM2 监控
pm2 monit

# 系统监控
htop
iostat -x 1
```

**配置日志轮转：**

创建 `/etc/logrotate.d/ops-server`：
```
/opt/ops-workflow-center/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ops-user ops-user
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

## 📚 相关文档

- [项目架构文档](../../docs/ARCHITECTURE.md)
- [用户手册](../../USER_GUIDE.md)
- [Windows 部署指南](../../windows_scripts/scripts/README.md)
- [Bolt 环境指南](../../bolt_scripts/scripts/README.md)

## 📞 技术支持

### 常见命令

```bash
# 查看服务状态
pm2 status
sudo systemctl status ops-server

# 重启服务
pm2 restart ops-server
sudo systemctl restart ops-server

# 查看日志
pm2 logs --lines 100
sudo journalctl -u ops-server -n 100

# 检查端口
sudo lsof -i :3000
sudo netstat -tulpn | grep :3000

# 检查进程
ps aux | grep node
top -u ops-user
```

### 获取帮助

- 查看项目文档
- 检查系统日志和应用日志
- 使用 `pm2 describe ops-server` 查看详细信息
- 联系技术支持团队
