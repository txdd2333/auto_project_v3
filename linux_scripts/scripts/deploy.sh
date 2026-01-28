#!/bin/bash

# =========================================
#  Linux 一键部署脚本
# =========================================

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║  运维中心应急工作流平台 - Linux 部署    ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
  echo "❌ 错误：请在项目根目录执行此脚本"
  echo ""
  exit 1
fi

# =========================================
# 步骤 1: 环境检查
# =========================================
echo "[1/7] 检查运行环境..."
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
  echo "❌ 未安装 Node.js"
  echo "   请先安装 Node.js: https://nodejs.org/"
  echo ""
  exit 1
fi
echo "✅ Node.js 已安装"
echo "   版本: $(node --version)"

# 检查 npm
if ! command -v npm &> /dev/null; then
  echo "❌ 未安装 npm"
  echo ""
  exit 1
fi
echo "✅ npm 已安装"
echo "   版本: $(npm --version)"

# 检查 MySQL 客户端（可选）
if command -v mysql &> /dev/null; then
  echo "✅ MySQL 客户端已安装"
  echo "   版本: $(mysql --version)"
else
  echo "⚠️  未找到 MySQL 客户端（可选）"
  echo "   如需使用脚本初始化数据库，请安装 mysql-client"
fi

echo ""
read -p "按 Enter 继续..."

# =========================================
# 步骤 2: 安装依赖
# =========================================
echo ""
echo "[2/7] 安装项目依赖..."
echo ""

if [ ! -d "node_modules" ]; then
  echo "正在安装依赖，请稍候..."
  npm install
  if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    echo ""
    exit 1
  fi
  echo "✅ 依赖安装成功"
else
  echo "✅ 依赖已安装（跳过）"
fi

echo ""
read -p "按 Enter 继续..."

# =========================================
# 步骤 3: 配置环境变量
# =========================================
echo ""
echo "[3/7] 配置环境变量..."
echo ""

if [ ! -f ".env" ]; then
  if [ -f ".env.mysql" ]; then
    cp .env.mysql .env
    echo "✅ 已创建 .env 文件（基于 .env.mysql）"
  else
    echo "❌ 错误：找不到 .env.mysql 模板文件"
    echo ""
    exit 1
  fi
else
  echo "✅ .env 文件已存在"
fi

echo ""
echo "当前配置："
echo "─────────────────────────────────────"
grep "VITE_SERVICE_PROVIDER\|DB_HOST\|DB_PORT\|DB_DATABASE" .env
echo "─────────────────────────────────────"
echo ""
echo "⚠️  请确保数据库配置正确！"
echo "    如需修改，请编辑 .env 文件"
echo ""
read -p "按 Enter 继续..."

# =========================================
# 步骤 4: 数据库初始化
# =========================================
echo ""
echo "[4/7] 数据库初始化..."
echo ""

# 读取数据库配置
source .env

echo "数据库信息："
echo "   主机: ${DB_HOST}:${DB_PORT}"
echo "   数据库: ${DB_DATABASE}"
echo "   用户: ${DB_USER}"
echo ""

read -p "是否初始化数据库？（y/n，如果已初始化请输入 n）: " INIT_DB
if [ "$INIT_DB" = "y" ] || [ "$INIT_DB" = "Y" ]; then
  echo ""
  echo "正在初始化数据库..."
  echo ""

  if command -v mysql &> /dev/null; then
    mysql -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p${DB_PASSWORD} ${DB_DATABASE} < linux_scripts/scripts/init-database.sql
    if [ $? -ne 0 ]; then
      echo "❌ 数据库初始化失败"
      echo "   请检查数据库配置和网络连接"
      echo ""
      exit 1
    fi
    echo "✅ 数据库初始化成功"
  else
    echo "❌ 未找到 MySQL 客户端"
    echo "   请手动执行 SQL 文件："
    echo "   mysql -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p ${DB_DATABASE} < linux_scripts/scripts/init-database.sql"
    echo ""
  fi
else
  echo "✅ 跳过数据库初始化"
fi

echo ""
read -p "按 Enter 继续..."

# =========================================
# 步骤 5: 创建超级管理员
# =========================================
echo ""
echo "[5/7] 创建超级管理员账号..."
echo ""

read -p "是否创建超级管理员？（y/n）: " CREATE_ADMIN
if [ "$CREATE_ADMIN" = "y" ] || [ "$CREATE_ADMIN" = "Y" ]; then
  echo ""
  read -p "请输入管理员邮箱: " ADMIN_EMAIL
  read -sp "请输入管理员密码（至少8位）: " ADMIN_PASSWORD
  echo ""
  echo ""

  echo "正在创建超级管理员..."
  node linux_scripts/scripts/create-super-admin.js "$ADMIN_EMAIL" "$ADMIN_PASSWORD"

  if [ $? -ne 0 ]; then
    echo ""
    echo "❌ 超级管理员创建失败"
    echo "   请稍后手动创建："
    echo "   node linux_scripts/scripts/create-super-admin.js <email> <password>"
    echo ""
  fi
else
  echo "✅ 跳过创建超级管理员"
fi

echo ""
read -p "按 Enter 继续..."

# =========================================
# 步骤 6: 构建项目
# =========================================
echo ""
echo "[6/7] 构建项目..."
echo ""

read -p "是否构建生产版本？（y/n，开发环境可输入 n）: " BUILD_PROJECT
if [ "$BUILD_PROJECT" = "y" ] || [ "$BUILD_PROJECT" = "Y" ]; then
  echo ""
  echo "正在构建，请稍候..."
  npm run build

  if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    echo ""
    exit 1
  fi

  echo "✅ 构建成功"
else
  echo "✅ 跳过构建"
fi

echo ""
read -p "按 Enter 继续..."

# =========================================
# 步骤 7: 部署完成
# =========================================
echo ""
echo "[7/7] 部署完成！"
echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║        ✅ 部署成功！                      ║"
echo "╚═══════════════════════════════════════════╝"
echo ""
echo "📋 下一步操作："
echo ""
echo "   【开发环境】"
echo "   1. 打开终端 1，运行：npm run server"
echo "   2. 打开终端 2，运行：npm run dev"
echo "   3. 浏览器访问：http://localhost:5173"
echo ""
echo "   【生产环境】"
echo "   1. 配置 Nginx 指向 dist 目录"
echo "   2. 启动 API 服务器：npm run server:build && node dist/server/index.js"
echo "   3. 配置进程守护（PM2 或 systemd）"
echo ""
echo "📖 更多信息请查看："
echo "    linux_scripts/scripts/README.md"
echo ""
