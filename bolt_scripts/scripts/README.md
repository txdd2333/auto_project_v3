# Bolt 环境脚本说明

本目录包含在 **Bolt 云端开发环境**中使用 **Supabase** 作为后端时的初始化和管理脚本。

## 📋 目录结构

```
bolt_scripts/scripts/
├── switch-to-supabase.sh      # Linux/Mac 环境切换脚本
├── switch-to-supabase.bat     # Windows 环境切换脚本
├── verify-database.ts         # 数据库验证脚本
├── create-super-admin.ts      # 超级管理员创建脚本
└── README.md                  # 本文档
```

## 🚀 快速开始

### 1. 切换到 Supabase 环境

**Linux/Mac:**
```bash
cd /path/to/project
bash bolt_scripts/scripts/switch-to-supabase.sh
```

**Windows:**
```cmd
cd C:\path\to\project
bolt_scripts\scripts\switch-to-supabase.bat
```

**作用：**
- 将 `.env.supabase` 复制为 `.env`
- 设置 `VITE_SERVICE_PROVIDER=supabase`
- 配置 Supabase URL 和 API Key

### 2. 验证数据库

```bash
tsx bolt_scripts/scripts/verify-database.ts
```

**检查内容：**
- ✅ Supabase 连接状态
- ✅ 所有必需的数据表是否存在
- ✅ 用户数据统计
- ✅ 是否已有超级管理员

**输出示例：**
```
=========================================
   验证 Supabase 数据库
=========================================

✅ 环境变量检查通过
   URL: https://xxxxx.supabase.co
   Key: eyJhbGciOiJIUzI1NiI...

📡 测试数据库连接...
✅ 数据库连接成功

📋 检查数据表...
✅ user_profiles
✅ account_requests
✅ scenarios
✅ workflows
✅ modules
✅ execution_logs
✅ ai_configs
✅ sop_documents

👥 检查用户数据...
   总用户数: 0
   超级管理员: 0
   管理员: 0
   活跃用户: 0

⚠️  警告：尚未创建超级管理员
   请运行：tsx bolt_scripts/scripts/create-super-admin.ts

=========================================
   ✅ 数据库验证完成
=========================================
```

### 3. 创建超级管理员

```bash
tsx bolt_scripts/scripts/create-super-admin.ts admin@company.com SecurePassword123
```

**参数说明：**
- 第一个参数：管理员邮箱
- 第二个参数：密码（至少 8 位）

**执行过程：**
1. 检查用户是否已存在
2. 使用 Supabase Auth API 创建用户
3. 触发器自动创建 `user_profiles` 记录
4. 设置 role = `super_admin`, status = `active`

**输出示例：**
```
=========================================
   创建超级管理员账号
=========================================

📧 邮箱: admin@company.com
🔐 密码: ********************

📋 步骤 1: 检查用户是否已存在...
✅ 用户不存在，继续创建

📋 步骤 2: 创建新用户账号...
✅ 用户创建成功
   User ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

📋 步骤 3: 验证用户资料...
✅ 用户资料验证通过

=========================================
   ✅ 超级管理员创建成功！
=========================================

登录信息：
   邮箱: admin@company.com
   密码: SecurePassword123
   角色: super_admin
   状态: active

下一步：
   1. 启动应用: npm run dev
   2. 访问: http://localhost:5173
   3. 使用上述凭据登录
```

## 📖 详细说明

### Supabase 架构特点

1. **认证系统**
   - 使用 Supabase Auth（内置的 `auth.users` 表）
   - 支持邮箱/密码登录
   - 自动处理 JWT 令牌

2. **用户资料表**
   - `user_profiles` 表存储扩展信息
   - 通过 `id` 字段外键引用 `auth.users(id)`
   - 触发器自动在用户注册时创建 profile

3. **角色系统**
   - `super_admin` - 超级管理员（最高权限）
   - `admin` - 管理员
   - `read_write` - 读写用户
   - `read_only` - 只读用户

4. **账号状态**
   - `active` - 活跃
   - `pending` - 待审批
   - `locked` - 锁定
   - `deleted` - 已删除（软删除）

5. **安全策略**
   - 所有表启用 RLS（Row Level Security）
   - 基于角色的访问控制
   - 自动注入当前用户 ID（`auth.uid()`）

### 环境变量说明

**必需的环境变量：**
```env
VITE_SERVICE_PROVIDER=supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**不需要的配置：**
- ❌ 不需要本地数据库
- ❌ 不需要 API 服务器（`npm run server`）
- ❌ 不需要 MySQL/OceanBase 配置

## 🛠️ 故障排除

### 问题 1: 验证数据库时提示表不存在

**原因：** Supabase migrations 未应用

**解决方案：**
1. 访问 Supabase Dashboard
2. 进入 SQL Editor
3. 依次执行 `supabase/migrations/` 目录下的所有 SQL 文件
4. 按文件名顺序执行（时间戳排序）

### 问题 2: 创建超级管理员失败（无权限）

**原因：** 使用了 ANON_KEY 而不是 SERVICE_ROLE_KEY

**解决方案：**

方法一（推荐）：手动在 Dashboard 中操作
1. 先使用正常注册流程创建用户
2. 访问 Supabase Dashboard
3. 进入 Table Editor -> `user_profiles`
4. 找到刚创建的用户
5. 手动修改：
   - `role` = `super_admin`
   - `status` = `active`

方法二：使用 SERVICE_ROLE_KEY
1. 在 Supabase Dashboard 获取 SERVICE_ROLE_KEY
2. 临时添加到 `.env`：
   ```env
   VITE_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. 修改 `create-super-admin.ts` 使用 SERVICE_ROLE_KEY
4. 执行脚本后删除该环境变量

### 问题 3: 用户创建成功但无法登录

**可能原因：**
1. 邮箱未验证（如果启用了邮箱验证）
2. 用户状态不是 `active`
3. 用户角色不是 `super_admin`

**解决方案：**
1. 在 Supabase Dashboard 中检查 `auth.users` 表
2. 确认 `email_confirmed_at` 字段有值
3. 检查 `user_profiles` 表的 `status` 和 `role`
4. 手动修正错误的值

### 问题 4: RLS 策略导致无法访问数据

**症状：** 登录后看不到任何数据或无法操作

**原因：** RLS 策略过于严格或用户 profile 不正确

**解决方案：**
1. 确认用户 `status = 'active'`
2. 确认用户 `role` 是有效值（super_admin/admin/read_write/read_only）
3. 检查 RLS 策略是否正确应用
4. 临时禁用 RLS 测试（生产环境不推荐）：
   ```sql
   ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
   ```

## 📝 注意事项

### ⚠️ 安全建议

1. **超级管理员密码**
   - 使用强密码（至少 8 位，包含大小写字母、数字）
   - 不要在代码中硬编码密码
   - 定期更换密码

2. **API Keys**
   - 不要泄露 ANON_KEY
   - 绝对不要泄露 SERVICE_ROLE_KEY
   - 不要将 `.env` 提交到版本控制

3. **RLS 策略**
   - 不要禁用 RLS（除非测试）
   - 确保策略覆盖所有操作（SELECT/INSERT/UPDATE/DELETE）
   - 定期审查策略是否合理

### ✅ 最佳实践

1. **第一次部署**
   ```bash
   # 步骤 1: 切换环境
   bash bolt_scripts/scripts/switch-to-supabase.sh

   # 步骤 2: 验证数据库
   tsx bolt_scripts/scripts/verify-database.ts

   # 步骤 3: 创建管理员
   tsx bolt_scripts/scripts/create-super-admin.ts admin@company.com YourPassword123

   # 步骤 4: 启动应用
   npm run dev
   ```

2. **日常开发**
   ```bash
   # 直接启动即可
   npm run dev
   ```

3. **添加新管理员**
   ```bash
   # 方式 1: 使用脚本
   tsx bolt_scripts/scripts/create-super-admin.ts newadmin@company.com Password123

   # 方式 2: 在应用中操作
   # 登录后进入"用户管理"页面，审批新用户并设置角色
   ```

## 🔗 相关链接

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [Row Level Security 文档](https://supabase.com/docs/guides/auth/row-level-security)
- [项目架构文档](../../docs/ARCHITECTURE.md)

## 📞 技术支持

如遇问题，请查看：
1. Supabase Dashboard 的 Logs 功能
2. 浏览器控制台的错误信息
3. 项目根目录的 `README.md`
4. `docs/ARCHITECTURE.md` 架构文档
