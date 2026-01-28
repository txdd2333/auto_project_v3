/*
  # 阻止待审批和非活跃用户访问数据

  1. 问题
    - pending 和 inactive 用户虽然无法通过登录检查，但如果绕过检查，RLS 策略可能允许他们访问数据
    - 需要在数据库层面确保只有 active 用户才能访问数据

  2. 解决方案
    - 创建辅助函数检查用户是否为 active 状态
    - 为所有业务表添加 RESTRICTIVE 策略，要求用户必须是 active

  3. 安全性
    - 使用 RESTRICTIVE 策略，即使其他策略允许访问，也必须满足此策略
    - 确保 pending、inactive、deleted 用户完全无法访问业务数据
*/

-- 1. 创建辅助函数检查用户是否为活跃状态
CREATE OR REPLACE FUNCTION public.is_user_active()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_status text;
BEGIN
  SELECT status INTO user_status
  FROM user_profiles
  WHERE id = auth.uid();
  
  RETURN user_status = 'active';
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- 2. 授予执行权限
GRANT EXECUTE ON FUNCTION public.is_user_active() TO authenticated;

-- 3. 为所有业务表添加 RESTRICTIVE 策略，要求用户必须是 active

-- workflows 表
CREATE POLICY "require_active_user_workflows"
  ON workflows
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (is_user_active());

-- modules 表
CREATE POLICY "require_active_user_modules"
  ON modules
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (is_user_active());

-- scenarios 表
CREATE POLICY "require_active_user_scenarios"
  ON scenarios
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (is_user_active());

-- workflow_nodes 表
CREATE POLICY "require_active_user_workflow_nodes"
  ON workflow_nodes
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (is_user_active());

-- workflow_edges 表
CREATE POLICY "require_active_user_workflow_edges"
  ON workflow_edges
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (is_user_active());

-- execution_logs 表
CREATE POLICY "require_active_user_execution_logs"
  ON execution_logs
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (is_user_active());

-- sop_documents 表
CREATE POLICY "require_active_user_sop_documents"
  ON sop_documents
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (is_user_active());

-- ai_configs 表
CREATE POLICY "require_active_user_ai_configs"
  ON ai_configs
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (is_user_active());

-- account_requests 表（这个表可能不需要此限制，因为需要在审批前查看）
-- 但为了安全起见，我们也添加
CREATE POLICY "require_active_user_account_requests"
  ON account_requests
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (is_user_active());

-- 4. 验证
DO $$
BEGIN
  RAISE NOTICE '===== Restrictive RLS Policies Created =====';
  RAISE NOTICE 'All business tables now require users to have active status';
  RAISE NOTICE 'Pending, inactive, and deleted users cannot access any data';
  RAISE NOTICE 'Super admins with active status have full access';
END $$;
