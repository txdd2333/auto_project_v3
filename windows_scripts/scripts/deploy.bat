@echo off
chcp 65001 >nul

REM =========================================
REM  Windows 一键部署脚本
REM =========================================

echo.
echo ╔═══════════════════════════════════════════╗
echo ║  运维中心应急工作流平台 - Windows 部署  ║
echo ╚═══════════════════════════════════════════╝
echo.

REM 检查是否在项目根目录
if not exist "package.json" (
  echo ❌ 错误：请在项目根目录执行此脚本
  echo.
  pause
  exit /b 1
)

REM =========================================
REM 步骤 1: 环境检查
REM =========================================
echo [1/7] 检查运行环境...
echo.

REM 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
  echo ❌ 未安装 Node.js
  echo    请先安装 Node.js: https://nodejs.org/
  echo.
  pause
  exit /b 1
)
echo ✅ Node.js 已安装
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo    版本: %NODE_VERSION%

REM 检查 npm
npm --version >nul 2>&1
if errorlevel 1 (
  echo ❌ 未安装 npm
  echo.
  pause
  exit /b 1
)
echo ✅ npm 已安装
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo    版本: %NPM_VERSION%

REM 检查 MySQL 客户端（可选）
mysql --version >nul 2>&1
if errorlevel 1 (
  echo ⚠️  未找到 MySQL 客户端（可选）
) else (
  echo ✅ MySQL 客户端已安装
  for /f "tokens=*" %%i in ('mysql --version') do set MYSQL_VERSION=%%i
  echo    版本: %MYSQL_VERSION%
)

echo.
pause

REM =========================================
REM 步骤 2: 安装依赖
REM =========================================
echo.
echo [2/7] 安装项目依赖...
echo.

if not exist "node_modules" (
  echo 正在安装依赖，请稍候...
  call npm install
  if errorlevel 1 (
    echo ❌ 依赖安装失败
    echo.
    pause
    exit /b 1
  )
  echo ✅ 依赖安装成功
) else (
  echo ✅ 依赖已安装（跳过）
)

echo.
pause

REM =========================================
REM 步骤 3: 配置环境变量
REM =========================================
echo.
echo [3/7] 配置环境变量...
echo.

if not exist ".env" (
  if exist ".env.mysql" (
    copy /Y .env.mysql .env >nul
    echo ✅ 已创建 .env 文件（基于 .env.mysql）
  ) else (
    echo ❌ 错误：找不到 .env.mysql 模板文件
    echo.
    pause
    exit /b 1
  )
) else (
  echo ✅ .env 文件已存在
)

echo.
echo 当前配置：
echo ─────────────────────────────────────
type .env | findstr "VITE_SERVICE_PROVIDER DB_HOST DB_PORT DB_DATABASE"
echo ─────────────────────────────────────
echo.
echo ⚠️  请确保数据库配置正确！
echo    如需修改，请编辑 .env 文件
echo.
pause

REM =========================================
REM 步骤 4: 数据库初始化
REM =========================================
echo.
echo [4/7] 数据库初始化...
echo.

REM 读取数据库配置
for /f "tokens=2 delims==" %%i in ('type .env ^| findstr "^DB_HOST="') do set DB_HOST=%%i
for /f "tokens=2 delims==" %%i in ('type .env ^| findstr "^DB_PORT="') do set DB_PORT=%%i
for /f "tokens=2 delims==" %%i in ('type .env ^| findstr "^DB_USER="') do set DB_USER=%%i
for /f "tokens=2 delims==" %%i in ('type .env ^| findstr "^DB_PASSWORD="') do set DB_PASSWORD=%%i
for /f "tokens=2 delims==" %%i in ('type .env ^| findstr "^DB_DATABASE="') do set DB_DATABASE=%%i

echo 数据库信息：
echo    主机: %DB_HOST%:%DB_PORT%
echo    数据库: %DB_DATABASE%
echo    用户: %DB_USER%
echo.

set /p INIT_DB="是否初始化数据库？（y/n，如果已初始化请选 n）: "
if /i "%INIT_DB%"=="y" (
  echo.
  echo 正在初始化数据库...
  echo.

  mysql --version >nul 2>&1
  if errorlevel 1 (
    echo ❌ 未找到 MySQL 客户端
    echo    请手动执行 SQL 文件：
    echo    mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p %DB_DATABASE% ^< windows_scripts/scripts/init-database.sql
    echo.
  ) else (
    mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% %DB_DATABASE% < windows_scripts\scripts\init-database.sql
    if errorlevel 1 (
      echo ❌ 数据库初始化失败
      echo    请检查数据库配置和网络连接
      echo.
      pause
      exit /b 1
    )
    echo ✅ 数据库初始化成功
  )
) else (
  echo ✅ 跳过数据库初始化
)

echo.
pause

REM =========================================
REM 步骤 5: 创建超级管理员
REM =========================================
echo.
echo [5/7] 创建超级管理员账号...
echo.

set /p CREATE_ADMIN="是否创建超级管理员？（y/n）: "
if /i "%CREATE_ADMIN%"=="y" (
  echo.
  set /p ADMIN_EMAIL="请输入管理员邮箱: "
  set /p ADMIN_PASSWORD="请输入管理员密码（至少8位）: "

  echo.
  echo 正在创建超级管理员...
  node windows_scripts\scripts\create-super-admin.js %ADMIN_EMAIL% %ADMIN_PASSWORD%

  if errorlevel 1 (
    echo.
    echo ❌ 超级管理员创建失败
    echo    请稍后手动创建：
    echo    node windows_scripts\scripts\create-super-admin.js ^<email^> ^<password^>
    echo.
  )
) else (
  echo ✅ 跳过创建超级管理员
)

echo.
pause

REM =========================================
REM 步骤 6: 构建项目
REM =========================================
echo.
echo [6/7] 构建项目...
echo.

set /p BUILD_PROJECT="是否构建生产版本？（y/n，开发环境可选 n）: "
if /i "%BUILD_PROJECT%"=="y" (
  echo.
  echo 正在构建，请稍候...
  call npm run build

  if errorlevel 1 (
    echo ❌ 构建失败
    echo.
    pause
    exit /b 1
  )

  echo ✅ 构建成功
) else (
  echo ✅ 跳过构建
)

echo.
pause

REM =========================================
REM 步骤 7: 部署完成
REM =========================================
echo.
echo [7/7] 部署完成！
echo.
echo ╔═══════════════════════════════════════════╗
echo ║        ✅ 部署成功！                      ║
echo ╚═══════════════════════════════════════════╝
echo.
echo 📋 下一步操作：
echo.
echo   【开发环境】
echo   1. 打开终端 1，运行：npm run server
echo   2. 打开终端 2，运行：npm run dev
echo   3. 浏览器访问：http://localhost:5173
echo.
echo   【生产环境】
echo   1. 配置 Nginx/Apache 指向 dist 目录
echo   2. 启动 API 服务器：npm run server:build ^&^& node dist/server/index.js
echo   3. 配置进程守护（PM2 或 Windows Service）
echo.
echo 📖 更多信息请查看：
echo    windows_scripts/scripts/README.md
echo.
pause
