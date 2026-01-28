/*
  # 修复 permanent_delete_user 函数权限问题

  1. 问题
    - 函数使用 SECURITY DEFINER 调用 is_admin() 时权限检查失败
    - 导致前端调用时无法正确删除用户

  2. 修复
    - 直接在函数内部检查调用者角色
    - 不再依赖 is_admin() 辅助函数
    - 保持 SECURITY DEFINER 以便删除 auth.users

  3. 功能
    - 验证调用者是 admin 或 super_admin
    - 只能删除 status = 'deleted' 的用户
    - 删除所有业务数据
    - 删除 user_profiles
    - 删除 auth.users（关键：让邮箱可以重新注册）
*/

-- 修复 permanent_delete_user 函数
CREATE OR REPLACE FUNCTION public.permanent_delete_user(target_user_id uuid)
RETURNS json AS $$
DECLARE
  user_email text;
  user_status text;
  deleted_count integer := 0;
  temp_count integer;
  caller_role text;
BEGIN
  -- 直接检查调用者角色（不使用 is_admin 函数）
  SELECT role INTO caller_role
  FROM public.user_profiles
  WHERE id = auth.uid()
    AND status = 'active';

  -- 验证调用者是管理员
  IF caller_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Permission denied: only admins can permanently delete users';
  END IF;

  -- 获取目标用户信息
  SELECT email, status INTO user_email, user_status
  FROM public.user_profiles
  WHERE id = target_user_id;

  -- 检查用户是否存在
  IF user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- 检查用户状态是否为 deleted
  IF user_status != 'deleted' THEN
    RAISE EXCEPTION 'Only users with deleted status can be permanently removed. Current status: %', user_status;
  END IF;

  -- 删除用户创建的业务数据
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
    'deleted_records', deleted_count,
    'message', 'User permanently deleted including auth record. The email can now be re-registered.'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to permanently delete user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.permanent_delete_user IS '彻底删除用户及其所有相关数据，包括认证信息。只能删除状态为 deleted 的用户，只有管理员可以调用。';

GRANT EXECUTE ON FUNCTION public.permanent_delete_user TO authenticated;
