/*
  # 修复用户注册触发器和RLS策略

  1. 问题修复
    - 重新创建 handle_new_user 触发器，确保新用户注册时自动创建 user_profiles 记录
    - 使用正确的角色值 'read_only'（不是 'readonly'）
    - 重新启用 RLS 并创建完整的安全策略

  2. 安全策略
    - super_admin 可以查看、创建、更新、删除所有用户
    - admin 可以查看和更新所有用户
    - 普通用户只能查看和更新自己的资料
    - 新用户注册时自动创建为 read_only + pending 状态

  3. 重要说明
    - 角色值必须使用下划线格式: super_admin, admin, read_write, read_only
    - 状态值: active, locked, pending, deleted
*/

-- 1. 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. 创建触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 检查是否已存在该用户的 profile（避免重复创建）
  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- 为新用户创建 profile 记录
  INSERT INTO public.user_profiles (
    id,
    email,
    role,
    status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    'read_only',  -- 默认只读角色
    'pending',    -- 默认待审批状态
    NOW(),
    NOW()
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 记录错误但不阻止用户创建
    RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. 创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. 启用 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. 删除所有旧的 RLS 策略
DROP POLICY IF EXISTS "super_admin_all_access" ON user_profiles;
DROP POLICY IF EXISTS "admin_view_all" ON user_profiles;
DROP POLICY IF EXISTS "admin_update_all" ON user_profiles;
DROP POLICY IF EXISTS "users_view_own" ON user_profiles;
DROP POLICY IF EXISTS "users_update_own" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can insert all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can delete all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- 6. 创建新的 RLS 策略

-- Super Admin: 完全访问权限
CREATE POLICY "super_admin_select_all"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.role = 'super_admin'
        AND up.status = 'active'
    )
  );

CREATE POLICY "super_admin_insert_all"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.role = 'super_admin'
        AND up.status = 'active'
    )
  );

CREATE POLICY "super_admin_update_all"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.role = 'super_admin'
        AND up.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.role = 'super_admin'
        AND up.status = 'active'
    )
  );

CREATE POLICY "super_admin_delete_all"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.role = 'super_admin'
        AND up.status = 'active'
    )
  );

-- Admin: 查看和更新权限
CREATE POLICY "admin_select_all"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.role IN ('admin', 'super_admin')
        AND up.status = 'active'
    )
  );

CREATE POLICY "admin_update_all"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.role IN ('admin', 'super_admin')
        AND up.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.role IN ('admin', 'super_admin')
        AND up.status = 'active'
    )
  );

-- 普通用户: 只能查看和更新自己的资料
CREATE POLICY "users_select_own"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM user_profiles WHERE id = auth.uid())  -- 不能修改自己的角色
    AND status = (SELECT status FROM user_profiles WHERE id = auth.uid())  -- 不能修改自己的状态
  );

-- 7. 验证触发器和策略
DO $$
BEGIN
  RAISE NOTICE '===== Migration Completed =====';
  RAISE NOTICE 'Trigger: on_auth_user_created created on auth.users';
  RAISE NOTICE 'RLS: Enabled on user_profiles';
  RAISE NOTICE 'Policies: Created for super_admin, admin, and regular users';
  RAISE NOTICE 'Default role for new users: read_only';
  RAISE NOTICE 'Default status for new users: pending';
END $$;
