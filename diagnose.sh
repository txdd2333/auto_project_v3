#!/bin/bash

# 运维流程中心 - 快速诊断脚本
# 用于快速定位部署问题

echo "========================================="
echo "运维流程中心 - 快速诊断工具"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查项计数
PASS=0
FAIL=0
WARN=0

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}!${NC} $1"
    ((WARN++))
}

echo "1. 检查 Node.js 环境"
echo "-------------------"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    check_pass "Node.js 已安装: $NODE_VERSION"
else
    check_fail "Node.js 未安装"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    check_pass "npm 已安装: $NPM_VERSION"
else
    check_fail "npm 未安装"
fi
echo ""

echo "2. 检查项目文件"
echo "-------------------"
if [ -f "package.json" ]; then
    check_pass "package.json 存在"
else
    check_fail "package.json 不存在"
fi

if [ -d "node_modules" ]; then
    check_pass "node_modules 目录存在"
else
    check_warn "node_modules 目录不存在，需要运行 npm install"
fi

if [ -f ".env" ]; then
    check_pass ".env 文件存在"
else
    check_fail ".env 文件不存在，需要从 .env.mysql 复制"
fi
echo ""

echo "3. 检查环境变量配置"
echo "-------------------"
if [ -f ".env" ]; then
    if grep -q "VITE_SERVICE_PROVIDER=custom" .env; then
        check_pass "VITE_SERVICE_PROVIDER 配置正确"
    else
        check_fail "VITE_SERVICE_PROVIDER 未设置为 custom"
    fi

    if grep -q "VITE_API_URL=" .env; then
        API_URL=$(grep "VITE_API_URL=" .env | cut -d '=' -f2)
        check_pass "VITE_API_URL 已配置: $API_URL"
    else
        check_fail "VITE_API_URL 未配置"
    fi

    if grep -q "DB_HOST=" .env; then
        DB_HOST=$(grep "DB_HOST=" .env | cut -d '=' -f2)
        check_pass "DB_HOST 已配置: $DB_HOST"
    else
        check_fail "DB_HOST 未配置"
    fi

    if grep -q "VITE_SUPABASE_URL=" .env; then
        check_pass "VITE_SUPABASE_URL 已配置（占位符）"
    else
        check_warn "VITE_SUPABASE_URL 未配置，可能导致前端加载失败"
    fi
else
    check_fail "无法检查环境变量，.env 文件不存在"
fi
echo ""

echo "4. 检查数据库连接"
echo "-------------------"
if [ -f ".env" ]; then
    DB_HOST=$(grep "DB_HOST=" .env | cut -d '=' -f2)
    DB_PORT=$(grep "DB_PORT=" .env | cut -d '=' -f2)
    DB_USER=$(grep "DB_USER=" .env | cut -d '=' -f2)
    DB_PASSWORD=$(grep "DB_PASSWORD=" .env | cut -d '=' -f2)
    DB_DATABASE=$(grep "DB_DATABASE=" .env | cut -d '=' -f2)

    if command -v mysql &> /dev/null; then
        if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" &> /dev/null; then
            check_pass "数据库连接成功"

            # 检查数据库是否存在
            if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_DATABASE" &> /dev/null; then
                check_pass "数据库 $DB_DATABASE 存在"

                # 检查表是否存在
                TABLE_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_DATABASE" -e "SHOW TABLES" 2>/dev/null | wc -l)
                if [ "$TABLE_COUNT" -gt 1 ]; then
                    check_pass "数据库包含 $((TABLE_COUNT-1)) 张表"
                else
                    check_warn "数据库为空，需要初始化"
                fi
            else
                check_fail "数据库 $DB_DATABASE 不存在"
            fi
        else
            check_fail "数据库连接失败"
        fi
    else
        check_warn "MySQL 客户端未安装，跳过数据库检查"
    fi
else
    check_fail "无法检查数据库，.env 文件不存在"
fi
echo ""

echo "5. 检查服务运行状态"
echo "-------------------"
if lsof -Pi :3000 -sTCP:LISTEN -t &> /dev/null; then
    check_pass "API 服务器正在运行（端口 3000）"
else
    check_warn "API 服务器未运行（端口 3000）"
fi

if lsof -Pi :3001 -sTCP:LISTEN -t &> /dev/null; then
    check_pass "Playwright 服务器正在运行（端口 3001）"
else
    check_warn "Playwright 服务器未运行（端口 3001）"
fi

if lsof -Pi :5173 -sTCP:LISTEN -t &> /dev/null; then
    check_pass "前端开发服务器正在运行（端口 5173）"
else
    check_warn "前端开发服务器未运行（端口 5173）"
fi
echo ""

echo "6. 检查构建文件"
echo "-------------------"
if [ -d "dist" ]; then
    check_pass "dist 目录存在"
    if [ -f "dist/index.html" ]; then
        check_pass "前端构建文件存在"
    else
        check_warn "前端构建文件不完整"
    fi
else
    check_warn "dist 目录不存在，需要运行 npm run build"
fi
echo ""

echo "========================================="
echo "诊断结果汇总"
echo "========================================="
echo -e "通过: ${GREEN}$PASS${NC}"
echo -e "失败: ${RED}$FAIL${NC}"
echo -e "警告: ${YELLOW}$WARN${NC}"
echo ""

if [ $FAIL -gt 0 ]; then
    echo -e "${RED}发现 $FAIL 个严重问题，系统可能无法正常运行${NC}"
    echo ""
    echo "建议操作："
    echo "1. 检查上述失败项"
    echo "2. 参考故障排查文档: DEPLOYMENT_TROUBLESHOOTING.md"
    echo "3. 运行修复命令:"
    echo "   cp .env.mysql .env"
    echo "   npm install"
    echo "   npm run build"
    exit 1
elif [ $WARN -gt 0 ]; then
    echo -e "${YELLOW}发现 $WARN 个警告，建议检查${NC}"
    echo ""
    echo "建议操作："
    if ! [ -d "node_modules" ]; then
        echo "- 运行: npm install"
    fi
    if ! lsof -Pi :3000 -sTCP:LISTEN -t &> /dev/null; then
        echo "- 启动 API 服务器: npm run server"
    fi
    if ! lsof -Pi :3001 -sTCP:LISTEN -t &> /dev/null; then
        echo "- 启动 Playwright 服务器: npm run api-server"
    fi
    if ! lsof -Pi :5173 -sTCP:LISTEN -t &> /dev/null; then
        echo "- 启动前端服务器: npm run dev"
    fi
    exit 0
else
    echo -e "${GREEN}所有检查通过，系统运行正常！${NC}"
    echo ""
    echo "访问系统："
    if [ -f ".env" ]; then
        API_URL=$(grep "VITE_API_URL=" .env | cut -d '=' -f2)
        echo "- 前端: http://$(echo $API_URL | cut -d ':' -f2 | tr -d '/'):5173"
        echo "- API: $API_URL"
    fi
    exit 0
fi
