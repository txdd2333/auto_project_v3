#!/bin/bash

# 切换到 MySQL/OceanBase 环境
# 适用于本地 Linux 部署

echo "========================================="
echo "   切换到 MySQL/OceanBase 环境"
echo "========================================="
echo ""

# 检查 .env.mysql 是否存在
if [ ! -f ".env.mysql" ]; then
  echo "❌ 错误：找不到 .env.mysql 文件"
  echo "请确保在项目根目录执行此脚本"
  exit 1
fi

# 备份当前 .env 文件
if [ -f ".env" ]; then
  cp .env .env.backup
  echo "✅ 已备份当前 .env 文件到 .env.backup"
fi

# 复制 MySQL 配置
cp .env.mysql .env
echo "✅ 已切换到 MySQL/OceanBase 环境"
echo ""

# 显示当前配置
echo "当前环境配置："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep "VITE_SERVICE_PROVIDER\|DB_HOST\|DB_PORT\|DB_DATABASE" .env
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📋 下一步操作："
echo "  1. 确保数据库已初始化（运行 init-database.sql）"
echo "  2. 终端 1: npm run server（启动 API 服务器）"
echo "  3. 终端 2: npm run dev（启动前端）"
echo "  4. 访问 http://localhost:5173"
echo ""
echo "⚠️  注意：MySQL 环境需要启动 API 服务器"
echo ""
