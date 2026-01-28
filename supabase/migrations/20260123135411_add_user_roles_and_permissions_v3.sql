/*
  # 用户角色和权限系统

  1. 表结构修改
    - 创建 `user_profiles` 表存储扩展用户信息
    - 创建 `account_requests` 表存储注册申请

  2. 用户角色
    - `admin` - 超级管理员（全部权限）
    - `read_write` - 读写用户（查看和编辑所有SOP）
    - `read_only` - 只读用户（仅查看所有SOP）

  3. 账号状态
    - `active` - 活跃
    - `locked` - 锁定
    - `pending` - 待审批
    - `deleted` - 已删除（软删除）

  4. 安全设置
    - 启用 RLS
    - 根据角色配置访问策略
    - 只有管理员可以管理用户
*/

-- 创建用户资料表
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'read_only' CHECK (role IN ('admin', 'read_write', 'read_only')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'locked', 'pending', 'deleted')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  last_login_at timestamptz
);

-- 创建注册申请表
CREATE TABLE IF NOT EXISTS account_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  phone text,
  requested_role text NOT NULL DEFAULT 'read_only' CHECK (requested_role IN ('read_write', 'read_only')),
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  review_notes text,
  user_id uuid REFERENCES auth.users(id)
);

-- 启用 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_requests ENABLE ROW LEVEL SECURITY;

-- user_profiles 的 RLS 策略

-- 用户可以查看自己的资料
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 管理员可以查看所有用户资料
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- 用户可以更新自己的部分信息（不包括角色和状态）
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM user_profiles WHERE id = auth.uid())
    AND status = (SELECT status FROM user_profiles WHERE id = auth.uid())
  );

-- 管理员可以插入新用户资料
CREATE POLICY "Admins can insert profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- 管理员可以更新所有用户资料
CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- 管理员可以删除用户资料
CREATE POLICY "Admins can delete profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- account_requests 的 RLS 策略

-- 任何人可以创建注册申请
CREATE POLICY "Anyone can create account request"
  ON account_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 用户可以查看自己的申请
CREATE POLICY "Users can view own requests"
  ON account_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR email = auth.jwt()->>'email');

-- 管理员可以查看所有申请
CREATE POLICY "Admins can view all requests"
  ON account_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- 管理员可以更新申请（审批）
CREATE POLICY "Admins can update requests"
  ON account_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- 更新 scenarios 表的 RLS 策略以支持基于角色的访问

-- 删除旧的策略
DROP POLICY IF EXISTS "Users can view their own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can create scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can update their own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can delete their own scenarios" ON scenarios;

-- 所有活跃用户可以查看所有场景
CREATE POLICY "Active users can view all scenarios"
  ON scenarios FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND status = 'active'
    )
  );

-- 所有活跃用户可以创建场景
CREATE POLICY "Active users can create scenarios"
  ON scenarios FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND status = 'active'
    )
  );

-- 只有读写权限和管理员可以更新场景
CREATE POLICY "Read-write users and admins can update scenarios"
  ON scenarios FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND status = 'active'
      AND role IN ('admin', 'read_write')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND status = 'active'
      AND role IN ('admin', 'read_write')
    )
  );

-- 只有管理员和场景创建者可以删除场景
CREATE POLICY "Admins and creators can delete scenarios"
  ON scenarios FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- 更新 workflows 表的 RLS 策略

DROP POLICY IF EXISTS "Users can view their own workflows" ON workflows;
DROP POLICY IF EXISTS "Users can create workflows" ON workflows;
DROP POLICY IF EXISTS "Users can update their own workflows" ON workflows;
DROP POLICY IF EXISTS "Users can delete their own workflows" ON workflows;

CREATE POLICY "Active users can view all workflows"
  ON workflows FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Active users can create workflows"
  ON workflows FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Read-write users and admins can update workflows"
  ON workflows FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND status = 'active'
      AND role IN ('admin', 'read_write')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND status = 'active'
      AND role IN ('admin', 'read_write')
    )
  );

CREATE POLICY "Admins and creators can delete workflows"
  ON workflows FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- 更新 modules 表的 RLS 策略

DROP POLICY IF EXISTS "Users can view their own modules" ON modules;
DROP POLICY IF EXISTS "Users can create modules" ON modules;
DROP POLICY IF EXISTS "Users can update their own modules" ON modules;
DROP POLICY IF EXISTS "Users can delete their own modules" ON modules;

CREATE POLICY "Active users can view all modules"
  ON modules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Active users can create modules"
  ON modules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Read-write users and admins can update modules"
  ON modules FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND status = 'active'
      AND role IN ('admin', 'read_write')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND status = 'active'
      AND role IN ('admin', 'read_write')
    )
  );

CREATE POLICY "Admins and creators can delete modules"
  ON modules FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- 更新 sop_documents 表的 RLS 策略

DROP POLICY IF EXISTS "Users can view their own documents" ON sop_documents;
DROP POLICY IF EXISTS "Users can create documents" ON sop_documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON sop_documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON sop_documents;

CREATE POLICY "Active users can view all documents"
  ON sop_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Active users can create documents"
  ON sop_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Read-write users and admins can update documents"
  ON sop_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND status = 'active'
      AND role IN ('admin', 'read_write')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND status = 'active'
      AND role IN ('admin', 'read_write')
    )
  );

CREATE POLICY "Admins and creators can delete documents"
  ON sop_documents FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- 更新 ai_configs 表的 RLS 策略

DROP POLICY IF EXISTS "Users can view their own AI configs" ON ai_configs;
DROP POLICY IF EXISTS "Users can create AI configs" ON ai_configs;
DROP POLICY IF EXISTS "Users can update their own AI configs" ON ai_configs;
DROP POLICY IF EXISTS "Users can delete their own AI configs" ON ai_configs;

CREATE POLICY "Active users can view all AI configs"
  ON ai_configs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Read-write users and admins can create AI configs"
  ON ai_configs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND status = 'active'
      AND role IN ('admin', 'read_write')
    )
  );

CREATE POLICY "Read-write users and admins can update AI configs"
  ON ai_configs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND status = 'active'
      AND role IN ('admin', 'read_write')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND status = 'active'
      AND role IN ('admin', 'read_write')
    )
  );

CREATE POLICY "Admins can delete AI configs"
  ON ai_configs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- 执行日志表的 RLS 策略
CREATE POLICY "Active users can view all execution logs"
  ON execution_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND status = 'active'
    )
  );

-- 创建函数：自动创建用户资料
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_app_metadata->>'role', 'pending'),
    COALESCE(NEW.raw_app_metadata->>'status', 'pending')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：用户注册时自动创建资料
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_account_requests_status ON account_requests(status);
CREATE INDEX IF NOT EXISTS idx_account_requests_email ON account_requests(email);
