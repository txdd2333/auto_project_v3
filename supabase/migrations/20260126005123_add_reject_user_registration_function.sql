/*
  # 添加拒绝用户注册功能

  1. 功能说明
    - 当管理员拒绝用户注册申请时，彻底删除该用户账号
    - 与 permanent_delete_user 不同，此函数不检查用户状态
    - 专门用于审批场景，删除 pending 或 locked 状态的用户

  2. 删除顺序
    - 1. 删除用户创建的业务数据（如果有）
    - 2. 删除 user_profiles
    - 3. 删除 auth.users（确保无法登录）

  3. 权限
    - 只有管理员可以调用
    - 使用 SECURITY DEFINER 以便访问 auth schema

  4. 返回值
    - 成功返回 JSON 对象，包含用户信息和删除记录数
*/

CREATE OR REPLACE FUNCTION public.reject_user_registration(target_user_id uuid)
RETURNS json AS $$
DECLARE
  user_email text;
  user_status text;
  deleted_count integer := 0;
  temp_count integer;
BEGIN
  -- 检查调用者是否是管理员
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permission denied: only admins can reject user registration';
  END IF;

  -- 获取用户信息
  SELECT email, status INTO user_email, user_status
  FROM public.user_profiles
  WHERE id = target_user_id;

  -- 检查用户是否存在
  IF user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- 删除用户创建的业务数据（虽然待审批用户应该没有数据，但为了安全起见还是删除）
  DELETE FROM public.execution_logs WHERE user_id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  DELETE FROM public.scenarios WHERE user_id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  DELETE FROM public.workflows WHERE user_id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  DELETE FROM public.modules WHERE user_id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  DELETE FROM public.ai_configs WHERE user_id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  DELETE FROM public.sop_documents WHERE user_id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;

  -- 删除用户资料
  DELETE FROM public.user_profiles WHERE id = target_user_id;

  -- 关键：删除 auth.users 中的认证信息
  DELETE FROM auth.users WHERE id = target_user_id;

  -- 返回结果
  RETURN json_build_object(
    'success', true,
    'user_id', target_user_id,
    'email', user_email,
    'previous_status', user_status,
    'deleted_records', deleted_count,
    'message', 'User registration rejected and account permanently deleted. The email can now be re-registered.'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to reject user registration: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 函数说明
COMMENT ON FUNCTION public.reject_user_registration IS '拒绝用户注册并彻底删除账号。用于审批场景，无状态检查。只有管理员可以调用。';

-- 授予执行权限给已认证用户（实际权限在函数内部通过 is_admin 检查）
GRANT EXECUTE ON FUNCTION public.reject_user_registration TO authenticated;

-- 验证
DO $$
BEGIN
  RAISE NOTICE '===== Reject User Registration Function Created =====';
  RAISE NOTICE 'Function: reject_user_registration(uuid)';
  RAISE NOTICE 'Purpose: Permanently delete user account when rejecting registration';
  RAISE NOTICE 'Permission: Admin only';
  RAISE NOTICE 'Usage: SELECT reject_user_registration(''user-id'');';
END $$;
