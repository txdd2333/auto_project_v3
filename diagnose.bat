@echo off
REM 运维流程中心 - Windows 快速诊断脚本
REM 用于快速定位部署问题

setlocal enabledelayedexpansion
echo =========================================
echo 运维流程中心 - 快速诊断工具
echo =========================================
echo.

set PASS=0
set FAIL=0
set WARN=0

echo 1. 检查 Node.js 环境
echo -------------------
where node >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo [OK] Node.js 已安装: !NODE_VERSION!
    set /a PASS+=1
) else (
    echo [FAIL] Node.js 未安装
    set /a FAIL+=1
)

where npm >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
    echo [OK] npm 已安装: !NPM_VERSION!
    set /a PASS+=1
) else (
    echo [FAIL] npm 未安装
    set /a FAIL+=1
)
echo.

echo 2. 检查项目文件
echo -------------------
if exist "package.json" (
    echo [OK] package.json 存在
    set /a PASS+=1
) else (
    echo [FAIL] package.json 不存在
    set /a FAIL+=1
)

if exist "node_modules" (
    echo [OK] node_modules 目录存在
    set /a PASS+=1
) else (
    echo [WARN] node_modules 目录不存在，需要运行 npm install
    set /a WARN+=1
)

if exist ".env" (
    echo [OK] .env 文件存在
    set /a PASS+=1
) else (
    echo [FAIL] .env 文件不存在，需要从 .env.mysql 复制
    set /a FAIL+=1
)
echo.

echo 3. 检查环境变量配置
echo -------------------
if exist ".env" (
    findstr /C:"VITE_SERVICE_PROVIDER=custom" .env >nul
    if !errorlevel! equ 0 (
        echo [OK] VITE_SERVICE_PROVIDER 配置正确
        set /a PASS+=1
    ) else (
        echo [FAIL] VITE_SERVICE_PROVIDER 未设置为 custom
        set /a FAIL+=1
    )

    findstr /C:"VITE_API_URL=" .env >nul
    if !errorlevel! equ 0 (
        echo [OK] VITE_API_URL 已配置
        set /a PASS+=1
    ) else (
        echo [FAIL] VITE_API_URL 未配置
        set /a FAIL+=1
    )

    findstr /C:"DB_HOST=" .env >nul
    if !errorlevel! equ 0 (
        echo [OK] DB_HOST 已配置
        set /a PASS+=1
    ) else (
        echo [FAIL] DB_HOST 未配置
        set /a FAIL+=1
    )

    findstr /C:"VITE_SUPABASE_URL=" .env >nul
    if !errorlevel! equ 0 (
        echo [OK] VITE_SUPABASE_URL 已配置（占位符）
        set /a PASS+=1
    ) else (
        echo [WARN] VITE_SUPABASE_URL 未配置，可能导致前端加载失败
        set /a WARN+=1
    )
) else (
    echo [FAIL] 无法检查环境变量，.env 文件不存在
    set /a FAIL+=1
)
echo.

echo 4. 检查数据库连接
echo -------------------
where mysql >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] MySQL 客户端已安装
    set /a PASS+=1
    REM 这里可以添加更详细的数据库连接测试
) else (
    echo [WARN] MySQL 客户端未安装，跳过数据库检查
    set /a WARN+=1
)
echo.

echo 5. 检查服务运行状态
echo -------------------
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if !errorlevel! equ 0 (
    echo [OK] API 服务器正在运行（端口 3000）
    set /a PASS+=1
) else (
    echo [WARN] API 服务器未运行（端口 3000）
    set /a WARN+=1
)

netstat -ano | findstr ":3001" | findstr "LISTENING" >nul
if !errorlevel! equ 0 (
    echo [OK] Playwright 服务器正在运行（端口 3001）
    set /a PASS+=1
) else (
    echo [WARN] Playwright 服务器未运行（端口 3001）
    set /a WARN+=1
)

netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if !errorlevel! equ 0 (
    echo [OK] 前端开发服务器正在运行（端口 5173）
    set /a PASS+=1
) else (
    echo [WARN] 前端开发服务器未运行（端口 5173）
    set /a WARN+=1
)
echo.

echo 6. 检查构建文件
echo -------------------
if exist "dist" (
    echo [OK] dist 目录存在
    set /a PASS+=1
    if exist "dist\index.html" (
        echo [OK] 前端构建文件存在
        set /a PASS+=1
    ) else (
        echo [WARN] 前端构建文件不完整
        set /a WARN+=1
    )
) else (
    echo [WARN] dist 目录不存在，需要运行 npm run build
    set /a WARN+=1
)
echo.

echo =========================================
echo 诊断结果汇总
echo =========================================
echo 通过: !PASS!
echo 失败: !FAIL!
echo 警告: !WARN!
echo.

if !FAIL! gtr 0 (
    echo [错误] 发现 !FAIL! 个严重问题，系统可能无法正常运行
    echo.
    echo 建议操作：
    echo 1. 检查上述失败项
    echo 2. 参考故障排查文档: DEPLOYMENT_TROUBLESHOOTING.md
    echo 3. 运行修复命令:
    echo    copy .env.mysql .env
    echo    npm install
    echo    npm run build
    pause
    exit /b 1
) else if !WARN! gtr 0 (
    echo [警告] 发现 !WARN! 个警告，建议检查
    echo.
    echo 建议操作：
    if not exist "node_modules" (
        echo - 运行: npm install
    )
    netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
    if !errorlevel! neq 0 (
        echo - 启动 API 服务器: npm run server
    )
    netstat -ano | findstr ":3001" | findstr "LISTENING" >nul
    if !errorlevel! neq 0 (
        echo - 启动 Playwright 服务器: npm run api-server
    )
    netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
    if !errorlevel! neq 0 (
        echo - 启动前端服务器: npm run dev
    )
    pause
    exit /b 0
) else (
    echo [成功] 所有检查通过，系统运行正常！
    echo.
    echo 访问系统：
    echo - 前端: http://192.168.1.2:5173
    echo - API: http://192.168.1.2:3000
    pause
    exit /b 0
)
