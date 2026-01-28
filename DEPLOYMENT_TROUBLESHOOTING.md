# 部署故障排查指南

## 问题 1：页面空白，无法加载

### 症状
访问 `http://192.168.1.2:5173` 后，页面完全空白，没有任何内容显示。

### 可能原因及解决方案

#### 原因 1：前端服务未启动
```bash
# 检查 Vite 开发服务器是否运行
ps aux | grep vite

# 如果没有运行，启动前端服务
npm run dev
```

#### 原因 2：后端 API 服务未启动
```bash
# 检查 API 服务器是否运行
ps aux | grep api-server

# 如果没有运行，启动 API 服务
npm run server       # API 服务器（端口 3000）
npm run api-server   # Playwright 服务器（端口 3001）
```

#### 原因 3：环境变量配置错误
```bash
# 检查 .env 文件是否存在
ls -la .env

# 如果不存在，复制模板
cp .env.mysql .env

# 检查环境变量内容
cat .env

# 确保包含以下必需项：
# VITE_SERVICE_PROVIDER=custom
# VITE_API_URL=http://192.168.1.2:3000
# VITE_PLAYWRIGHT_URL=http://192.168.1.2:3001
# DB_HOST=192.168.1.70
# DB_PORT=2883
# DB_USER=root@Tianji4_MySQL#Tianji4
# DB_PASSWORD=aaAA11__
# DB_DATABASE=ops_workflow_center
# JWT_SECRET=change-this-to-a-random-secret-key
# VITE_SUPABASE_URL=https://placeholder.supabase.co
# VITE_SUPABASE_ANON_KEY=placeholder-key
```

#### 原因 4：数据库连接失败
```bash
# 测试数据库连接
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__

# 检查数据库是否存在
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ -e "SHOW DATABASES LIKE 'ops_workflow_center'"

# 如果数据库不存在，创建数据库
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ -e "CREATE DATABASE IF NOT EXISTS ops_workflow_center CHARACTER SET utf8mb4"

# 初始化数据库表
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center < windows_scripts/scripts/init-database.sql
```

#### 原因 5：依赖包未安装
```bash
# 检查 node_modules 目录是否存在
ls -la node_modules

# 如果不存在或不完整，重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

#### 原因 6：浏览器缓存问题
```bash
# 清除浏览器缓存
# Chrome/Edge: Ctrl+Shift+Delete，选择"缓存的图片和文件"
# Firefox: Ctrl+Shift+Delete，选择"缓存"

# 或者使用无痕/隐私模式访问
```

### 完整的故障排查流程

按照以下顺序逐步检查：

```bash
# 1. 检查 Node.js 版本
node -v  # 应该是 v18.x 或 v20.x

# 2. 检查项目目录
cd /path/to/ops-workflow-center
pwd

# 3. 检查并安装依赖
npm install

# 4. 检查环境变量配置
cat .env
# 如果不存在或内容不正确：
cp .env.mysql .env

# 5. 测试数据库连接
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ -e "SELECT 1"

# 6. 初始化数据库（如果还没有）
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ -e "CREATE DATABASE IF NOT EXISTS ops_workflow_center CHARACTER SET utf8mb4"
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center < windows_scripts/scripts/init-database.sql

# 7. 构建项目
npm run build

# 8. 启动服务（需要 3 个终端）
# 终端 1：API 服务器
npm run server

# 终端 2：Playwright 服务器
npm run api-server

# 终端 3：前端开发服务器
npm run dev

# 9. 访问系统
# 打开浏览器访问: http://192.168.1.2:5173
```

### 查看服务器日志

#### 查看 API 服务器日志
```bash
# 如果使用 npm run server
# 日志会直接显示在终端

# 如果使用 PM2
pm2 logs ops-api
```

#### 查看 Playwright 服务器日志
```bash
# 如果使用 npm run api-server
# 日志会直接显示在终端

# 如果使用 PM2
pm2 logs ops-playwright
```

#### 查看前端开发服务器日志
```bash
# 日志会直接显示在终端
# 注意查看是否有错误信息
```

### 浏览器开发者工具检查

打开浏览器开发者工具（F12），查看：

#### Console 标签
查看是否有 JavaScript 错误，常见错误：
- `Missing Supabase environment variables` - 环境变量配置问题
- `Failed to fetch` - API 服务器未启动或地址不正确
- `Network Error` - 网络连接问题

#### Network 标签
查看网络请求状态：
- 检查是否有失败的请求（红色）
- 检查 API 请求的响应状态码
- 确认 API 请求的地址是否正确（应该是 `http://192.168.1.2:3000`）

## 问题 2：登录失败

### 症状
输入用户名和密码后，无法登录。

### 解决方案

#### 检查超级管理员账号是否存在
```bash
# 使用 MySQL 客户端检查
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center

# 查询用户表
SELECT id, email, role, status FROM user_profiles;

# 如果没有超级管理员，创建一个
# 退出 MySQL，然后运行：
cd windows_scripts/scripts
node create-super-admin.js admin@example.com Admin123456
```

#### 检查用户状态
```bash
# 用户状态必须是 'active'
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ ops_workflow_center -e "UPDATE user_profiles SET status='active' WHERE email='admin@example.com'"
```

## 问题 3：API 请求失败

### 症状
前端显示"连接失败"或"网络错误"。

### 解决方案

#### 检查 API 服务器状态
```bash
# 测试 API 服务器健康检查
curl http://192.168.1.2:3000/health

# 应该返回：
# {"status":"ok"}
```

#### 检查端口占用
```bash
# 检查 3000 端口是否被占用
netstat -ano | grep :3000

# 检查 3001 端口是否被占用
netstat -ano | grep :3001

# 检查 5173 端口是否被占用
netstat -ano | grep :5173
```

#### 检查防火墙
```bash
# Windows
# 打开 Windows Defender 防火墙
# 添加入站规则，允许 3000、3001、5173 端口

# Linux
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --add-port=3001/tcp --permanent
sudo firewall-cmd --add-port=5173/tcp --permanent
sudo firewall-cmd --reload
```

## 问题 4：生产环境部署

### 使用 PM2 管理服务

```bash
# 1. 构建项目
npm run build

# 2. 启动服务
pm2 start dist/server/api-server.js --name "ops-api"
pm2 start dist/server/index.js --name "ops-playwright"

# 3. 设置开机自启
pm2 startup
pm2 save

# 4. 查看服务状态
pm2 list

# 5. 查看日志
pm2 logs ops-api
pm2 logs ops-playwright

# 6. 重启服务
pm2 restart ops-api
pm2 restart ops-playwright

# 7. 停止服务
pm2 stop ops-api
pm2 stop ops-playwright

# 8. 删除服务
pm2 delete ops-api
pm2 delete ops-playwright
```

### 配置 Nginx 反向代理

创建 Nginx 配置文件 `/etc/nginx/conf.d/ops-workflow.conf`：

```nginx
server {
    listen 80;
    server_name 192.168.1.2;

    # 静态文件
    location / {
        root /path/to/ops-workflow-center/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Playwright 代理
    location /playwright {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

重启 Nginx：
```bash
# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

## 常用调试命令

```bash
# 查看 Node.js 进程
ps aux | grep node

# 查看端口占用
netstat -ano | grep :3000
netstat -ano | grep :3001
netstat -ano | grep :5173

# 查看系统日志（Linux）
journalctl -u nginx -f
journalctl -xe

# 测试数据库连接
mysql -h192.168.1.70 -P2883 -uroot@Tianji4_MySQL#Tianji4 -paaAA11__ -e "SELECT 1"

# 测试 API 服务器
curl http://192.168.1.2:3000/health

# 测试 Playwright 服务器
curl http://192.168.1.2:3001/health
```

## 联系支持

如果以上方法都无法解决问题，请联系技术支持并提供以下信息：

1. **系统环境**：操作系统版本、Node.js 版本
2. **错误信息**：浏览器控制台错误、服务器日志
3. **配置文件**：`.env` 文件内容（请隐藏敏感信息如密码）
4. **网络拓扑**：服务器IP地址、数据库IP地址
5. **已尝试的步骤**：列出您已经尝试过的故障排查步骤
