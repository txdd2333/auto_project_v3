# 交接后管理员账号初始化指南

## 文档说明

本文档记录了项目交接后，如何正确初始化和设置管理员账号的完整流程。包括遇到的问题、解决方案以及本地化部署时的处理步骤。

---

## 目录

1. [背景说明](#背景说明)
2. [遇到的问题](#遇到的问题)
3. [解决方案](#解决方案)
4. [完整操作步骤](#完整操作步骤)
5. [本地化部署初始化流程](#本地化部署初始化流程)
6. [常见问题处理](#常见问题处理)

---

## 背景说明

项目使用 Supabase 作为后端数据库，采用了以下架构：
- **认证系统**: Supabase Auth (`auth.users` 表)
- **用户资料**: `user_profiles` 表
- **角色系统**: `super_admin`, `admin`, `read_write`, `readonly`
- **状态管理**: `pending`, `active`, `inactive`

### 关键触发器

项目中有一个 `handle_new_user` 触发器，负责在用户注册时自动创建 `user_profiles` 记录：

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role, status)
  VALUES (
    new.id,
    new.email,
    'readonly',
    'pending'
  );
  RETURN new;
END;
$$;
```

**问题**: 该触发器会将所有新注册用户默认设置为 `readonly` 角色和 `pending` 状态。

---

## 遇到的问题

### 问题 1: 初次注册后无法登录

**现象**:
- 注册成功后，尝试登录显示 "账号等待管理员审批"
- 检查数据库发现用户角色为 `readonly`，状态为 `pending`

**根因**:
- `handle_new_user` 触发器自动将新用户设置为待审批状态
- 没有超级管理员账号来审批第一个用户

### 问题 2: 尝试创建超级管理员失败

**现象**:
- 使用脚本创建超级管理员后，重新注册相同邮箱报错 "Database error finding user"

**根因**:
- `auth.users` 表中已有该用户记录
- `user_profiles` 表中也有记录
- 注册流程检测到重复邮箱导致报错

### 问题 3: 触发器导致权限被覆盖

**现象**:
- 手动设置用户为 `super_admin` 后，重新登录权限恢复为 `readonly`

**根因**:
- 某些操作可能触发了 `handle_new_user` 或其他触发器
- 触发器重写了用户权限

---

## 解决方案

### 方案概述

1. **首次部署**: 使用 SQL 直接创建超级管理员账号
2. **已有数据**: 清理冲突记录，重新注册并手动提升权限
3. **后续用户**: 通过超级管理员审批流程添加

### 技术要点

- 使用 `ON CONFLICT DO UPDATE` 确保幂等性
- 手动插入 `user_profiles` 绕过触发器限制
- 同步 `auth.users` 和 `user_profiles` 两张表

---

## 完整操作步骤

### 步骤 1: 检查现有数据

```sql
-- 查看是否已有用户记录
SELECT
  'auth.users' as source,
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'your-email@example.com'

UNION ALL

SELECT
  'user_profiles' as source,
  id,
  email,
  created_at
FROM user_profiles
WHERE email = 'your-email@example.com';
```

### 步骤 2: 清理冲突数据（如果存在）

```sql
-- 删除 user_profiles 中的记录
DELETE FROM user_profiles WHERE email = 'your-email@example.com';

-- 删除 auth.users 中的记录
DELETE FROM auth.users WHERE email = 'your-email@example.com';

-- 验证删除完成
SELECT COUNT(*) FROM auth.users WHERE email = 'your-email@example.com';
SELECT COUNT(*) FROM user_profiles WHERE email = 'your-email@example.com';
```

### 步骤 3: 注册新账号

1. 打开注册页面
2. 输入邮箱和密码
3. 点击注册按钮
4. 注册成功后**不要立即登录**

### 步骤 4: 提升权限为超级管理员

```sql
-- 查询用户 ID
SELECT id, email, role, status
FROM auth.users
WHERE email = 'your-email@example.com';

-- 使用返回的 ID，手动创建或更新 user_profiles
INSERT INTO user_profiles (id, email, role, status, created_at, updated_at)
VALUES (
  'user-id-from-above',  -- 替换为实际的 UUID
  'your-email@example.com',
  'super_admin',
  'active',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  status = 'active',
  updated_at = now();

-- 验证结果
SELECT id, email, role, status, created_at
FROM user_profiles
WHERE email = 'your-email@example.com';
```

### 步骤 5: 登录验证

1. 返回登录页面
2. 使用刚才注册的邮箱密码登录
3. 验证是否能访问管理功能（用户管理、账号审批等）

---

## 本地化部署初始化流程

### 场景说明

在本地环境或新的生产环境部署时，需要初始化第一个超级管理员账号。

### 方法 1: 使用初始化脚本（推荐）

项目提供了 `init-super-admin.ts` 脚本，但可能需要调整：

```bash
# 使用 npm 命令
npm run init:admin

# 或直接运行
tsx scripts/init-super-admin.ts
```

**注意**: 该脚本可能需要更新，确保它直接操作数据库而不依赖触发器。

### 方法 2: 直接 SQL 初始化（更可靠）

创建初始化 SQL 文件 `scripts/init-first-super-admin.sql`:

```sql
-- ============================================
-- 初始化第一个超级管理员账号
-- 使用方法: 在 Supabase SQL Editor 中执行
-- ============================================

-- 1. 清理可能存在的旧数据（谨慎使用）
DO $$
DECLARE
  admin_email TEXT := 'admin@example.com';  -- 修改为你的邮箱
BEGIN
  DELETE FROM user_profiles WHERE email = admin_email;
  DELETE FROM auth.users WHERE email = admin_email;
END $$;

-- 2. 在 auth.users 中创建用户
-- 注意: 需要手动通过 Supabase Dashboard 创建用户，或使用 auth.admin API
-- 这里假设已经通过注册页面创建了用户

-- 3. 获取用户 ID 并设置为超级管理员
DO $$
DECLARE
  admin_email TEXT := 'admin@example.com';  -- 修改为你的邮箱
  user_id UUID;
BEGIN
  -- 查找用户 ID
  SELECT id INTO user_id FROM auth.users WHERE email = admin_email;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not found. Please register first.';
  END IF;

  -- 插入或更新 user_profiles
  INSERT INTO user_profiles (id, email, role, status, created_at, updated_at)
  VALUES (
    user_id,
    admin_email,
    'super_admin',
    'active',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    status = 'active',
    updated_at = now();

  RAISE NOTICE 'Super admin created successfully: %', admin_email;
END $$;
```

### 方法 3: 两步法（最安全）

**第一步：通过 UI 注册**
1. 启动应用
2. 打开注册页面
3. 注册管理员邮箱
4. 记录注册成功信息

**第二步：数据库提权**
```sql
-- 查询刚注册的用户
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 提升为超级管理员（替换 USER_ID）
UPDATE user_profiles
SET
  role = 'super_admin',
  status = 'active',
  updated_at = now()
WHERE id = 'USER_ID';  -- 替换为上面查询到的 ID

-- 验证
SELECT id, email, role, status
FROM user_profiles
WHERE role = 'super_admin';
```

---

## 常见问题处理

### Q1: 注册后提示 "Database error finding user"

**原因**: 邮箱已存在于 `auth.users` 或 `user_profiles` 表中

**解决**:
```sql
-- 清理该邮箱的所有记录
DELETE FROM user_profiles WHERE email = 'your-email@example.com';
DELETE FROM auth.users WHERE email = 'your-email@example.com';
```

### Q2: 登录后提示 "账号等待管理员审批"

**原因**: 用户状态为 `pending` 或角色为 `readonly`

**解决**:
```sql
-- 激活账号并提升权限
UPDATE user_profiles
SET
  status = 'active',
  role = 'super_admin',
  updated_at = now()
WHERE email = 'your-email@example.com';
```

### Q3: 权限设置后又被重置

**原因**: 可能有触发器或后台任务在修改用户数据

**排查**:
```sql
-- 查看所有触发器
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('user_profiles', 'auth.users');

-- 临时禁用触发器（谨慎操作）
ALTER TABLE user_profiles DISABLE TRIGGER ALL;

-- 重新启用触发器
ALTER TABLE user_profiles ENABLE TRIGGER ALL;
```

### Q4: 无法访问 Supabase SQL Editor

**解决方案**:
1. 使用 Supabase Dashboard 的 SQL Editor
2. 或使用项目中的 MCP 工具执行 SQL
3. 或使用 `psql` 命令行工具连接

### Q5: 忘记超级管理员密码

**解决方案**:
```sql
-- 1. 在 Supabase Dashboard 的 Authentication 页面重置密码
-- 2. 或发送密码重置邮件（如果配置了邮件服务）

-- 3. 或创建新的超级管理员账号
-- 重复本文档的初始化流程
```

---

## 安全建议

### 1. 生产环境部署检查清单

- [ ] 修改默认管理员邮箱和密码
- [ ] 启用 2FA（如果支持）
- [ ] 限制超级管理员账号数量
- [ ] 定期审计管理员操作日志
- [ ] 配置密码强度策略

### 2. 触发器管理建议

```sql
-- 修改触发器，防止超级管理员被降级
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 检查是否已存在该用户的 profile
  IF EXISTS (SELECT 1 FROM user_profiles WHERE id = new.id) THEN
    -- 如果已存在，不做任何操作（保护现有权限）
    RETURN new;
  END IF;

  -- 只为新用户创建 profile
  INSERT INTO public.user_profiles (id, email, role, status)
  VALUES (
    new.id,
    new.email,
    'readonly',
    'pending'
  );
  RETURN new;
END;
$$;
```

### 3. 备份策略

```bash
# 定期备份用户数据
pg_dump -h your-db-host -U postgres -t user_profiles -t auth.users > backup.sql

# 恢复
psql -h your-db-host -U postgres -d your-database < backup.sql
```

---

## 附录

### A. 相关表结构

```sql
-- user_profiles 表
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'readonly',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 角色说明
-- super_admin: 超级管理员，拥有所有权限
-- admin: 管理员，可以审批用户、管理资源
-- read_write: 读写用户，可以创建和编辑内容
-- readonly: 只读用户，只能查看内容

-- 状态说明
-- pending: 待审批
-- active: 已激活
-- inactive: 已停用
```

### B. 环境变量配置

```env
# .env 文件
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### C. 快速命令参考

```bash
# 启动开发服务器
npm run dev

# 启动 API 服务器
npm run api-server

# 初始化管理员（需要更新脚本）
npm run init:admin

# 构建项目
npm run build
```

---

## 版本历史

| 版本 | 日期 | 说明 | 作者 |
|------|------|------|------|
| 1.0 | 2026-01-26 | 初始版本，记录交接后初始化流程 | AI Assistant |

---

## 联系与支持

如有问题，请查看：
1. [项目文档索引](./DOCUMENTATION_INDEX.md)
2. [快速开始指南](./QUICK_START_FOR_AI_ASSISTANT.md)
3. [数据库文档](./DATABASE.md)

---

**重要提示**: 本文档应在每次成功部署和初始化后进行更新，确保记录最新的步骤和遇到的问题。
