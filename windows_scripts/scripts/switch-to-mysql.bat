@echo off
chcp 65001 >nul

REM 切换到 MySQL/OceanBase 环境
REM 适用于本地 Windows 部署

echo =========================================
echo    切换到 MySQL/OceanBase 环境
echo =========================================
echo.

REM 检查 .env.mysql 是否存在
if not exist ".env.mysql" (
  echo ❌ 错误：找不到 .env.mysql 文件
  echo 请确保在项目根目录执行此脚本
  pause
  exit /b 1
)

REM 备份当前 .env 文件
if exist ".env" (
  copy /Y .env .env.backup >nul
  echo ✅ 已备份当前 .env 文件到 .env.backup
)

REM 复制 MySQL 配置
copy /Y .env.mysql .env >nul
echo ✅ 已切换到 MySQL/OceanBase 环境
echo.

REM 显示当前配置
echo 当前环境配置：
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
findstr "VITE_SERVICE_PROVIDER DB_HOST DB_PORT DB_DATABASE" .env
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo 📋 下一步操作：
echo   1. 确保数据库已初始化（运行 init-database.sql）
echo   2. 终端 1: npm run server（启动 API 服务器）
echo   3. 终端 2: npm run dev（启动前端）
echo   4. 访问 http://localhost:5173
echo.
echo ⚠️  注意：MySQL 环境需要启动 API 服务器
echo.
pause
