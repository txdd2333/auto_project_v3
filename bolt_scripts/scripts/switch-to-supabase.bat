@echo off
chcp 65001 >nul

REM 切换到 Supabase 环境
REM 适用于 Bolt 云端开发环境

echo =========================================
echo    切换到 Supabase 开发环境
echo =========================================
echo.

REM 检查 .env.supabase 是否存在
if not exist ".env.supabase" (
  echo ❌ 错误：找不到 .env.supabase 文件
  echo 请确保在项目根目录执行此脚本
  pause
  exit /b 1
)

REM 备份当前 .env 文件
if exist ".env" (
  copy /Y .env .env.backup >nul
  echo ✅ 已备份当前 .env 文件到 .env.backup
)

REM 复制 Supabase 配置
copy /Y .env.supabase .env >nul
echo ✅ 已切换到 Supabase 环境
echo.

REM 显示当前配置
echo 当前环境配置：
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
findstr "VITE_SERVICE_PROVIDER VITE_SUPABASE_URL" .env
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo 📋 下一步操作：
echo   1. 运行 'npm run dev' 启动前端
echo   2. 访问 http://localhost:5173
echo.
echo ⚠️  注意：Supabase 环境不需要启动 API 服务器
echo.
pause
