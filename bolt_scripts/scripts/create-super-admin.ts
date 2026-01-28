/**
 * 创建超级管理员账号（Supabase 版本）
 *
 * 使用方法：
 *   tsx bolt_scripts/scripts/create-super-admin.ts <email> <password>
 *
 * 示例：
 *   tsx bolt_scripts/scripts/create-super-admin.ts admin@company.com SecurePassword123
 *
 * 注意：
 *   1. 此脚本使用 Supabase Admin API
 *   2. 需要 SUPABASE_SERVICE_ROLE_KEY（非 ANON_KEY）
 *   3. 会自动创建 auth.users 和 user_profiles 记录
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

async function createSuperAdmin() {
  console.log('=========================================');
  console.log('   创建超级管理员账号');
  console.log('=========================================\n');

  // 获取命令行参数
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('❌ 错误：缺少必需参数\n');
    console.error('使用方法：');
    console.error('  tsx bolt_scripts/scripts/create-super-admin.ts <email> <password>\n');
    console.error('示例：');
    console.error('  tsx bolt_scripts/scripts/create-super-admin.ts admin@company.com SecurePass123\n');
    process.exit(1);
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('❌ 错误：邮箱格式无效\n');
    process.exit(1);
  }

  // 验证密码强度
  if (password.length < 8) {
    console.error('❌ 错误：密码长度至少 8 位\n');
    process.exit(1);
  }

  // 检查环境变量
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 错误：缺少 Supabase 配置');
    console.error('   请确保 .env 文件包含：');
    console.error('   - VITE_SUPABASE_URL');
    console.error('   - VITE_SUPABASE_ANON_KEY\n');
    process.exit(1);
  }

  console.log(`📧 邮箱: ${email}`);
  console.log(`🔐 密码: ${'*'.repeat(password.length)}\n`);

  // 创建 Supabase 客户端
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 步骤 1: 检查用户是否已存在
    console.log('📋 步骤 1: 检查用户是否已存在...');
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id, email, role, status')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      console.log('⚠️  用户已存在');
      console.log(`   ID: ${existingProfile.id}`);
      console.log(`   角色: ${existingProfile.role}`);
      console.log(`   状态: ${existingProfile.status}\n`);

      if (existingProfile.role === 'super_admin' && existingProfile.status === 'active') {
        console.log('✅ 该用户已经是活跃的超级管理员\n');
        process.exit(0);
      }

      // 更新为超级管理员
      console.log('🔄 更新用户为超级管理员...');
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          role: 'super_admin',
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProfile.id);

      if (updateError) {
        console.error('❌ 更新用户失败：', updateError.message);
        console.error('\n⚠️  如果您是第一次创建超级管理员，请手动操作：');
        console.error('   1. 访问 Supabase Dashboard');
        console.error('   2. 进入 Table Editor -> user_profiles');
        console.error(`   3. 找到邮箱 ${email} 的记录`);
        console.error('   4. 将 role 设置为 super_admin');
        console.error('   5. 将 status 设置为 active\n');
        process.exit(1);
      }

      console.log('✅ 用户已更新为超级管理员\n');
      process.exit(0);
    }

    // 步骤 2: 创建新用户
    console.log('📋 步骤 2: 创建新用户账号...');
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'super_admin',
          status: 'active'
        }
      }
    });

    if (signUpError) {
      console.error('❌ 创建用户失败：', signUpError.message);

      if (signUpError.message.includes('User already registered')) {
        console.error('\n⚠️  用户已在 auth.users 中存在');
        console.error('   可能需要在 user_profiles 中手动创建记录');
      }

      process.exit(1);
    }

    if (!authData.user) {
      console.error('❌ 创建用户失败：无法获取用户数据\n');
      process.exit(1);
    }

    console.log(`✅ 用户创建成功`);
    console.log(`   User ID: ${authData.user.id}\n`);

    // 步骤 3: 验证 user_profile 是否自动创建
    console.log('📋 步骤 3: 验证用户资料...');

    // 等待触发器执行
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('❌ 查询用户资料失败：', profileError.message);
      process.exit(1);
    }

    if (!profile) {
      console.error('❌ 用户资料未自动创建');
      console.error('\n⚠️  触发器可能未正常工作，请手动操作：');
      console.error('   1. 访问 Supabase Dashboard');
      console.error('   2. 进入 Table Editor -> user_profiles');
      console.error('   3. 手动插入一条记录：');
      console.error(`      - id: ${authData.user.id}`);
      console.error(`      - email: ${email}`);
      console.error('      - role: super_admin');
      console.error('      - status: active\n');
      process.exit(1);
    }

    if (profile.role !== 'super_admin' || profile.status !== 'active') {
      console.log('⚠️  用户资料需要更新');
      console.log(`   当前角色: ${profile.role}`);
      console.log(`   当前状态: ${profile.status}\n`);

      console.log('🔄 更新为超级管理员...');
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          role: 'super_admin',
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', authData.user.id);

      if (updateError) {
        console.error('❌ 更新失败：', updateError.message);
        console.error('\n⚠️  请手动在 Supabase Dashboard 中更新用户资料\n');
        process.exit(1);
      }
    }

    console.log('✅ 用户资料验证通过\n');

    // 完成
    console.log('=========================================');
    console.log('   ✅ 超级管理员创建成功！');
    console.log('=========================================\n');
    console.log('登录信息：');
    console.log(`   邮箱: ${email}`);
    console.log(`   密码: ${password}`);
    console.log(`   角色: super_admin`);
    console.log(`   状态: active\n`);
    console.log('下一步：');
    console.log('   1. 启动应用: npm run dev');
    console.log('   2. 访问: http://localhost:5173');
    console.log('   3. 使用上述凭据登录\n');

  } catch (error: any) {
    console.error('❌ 发生错误：', error.message);
    if (error.stack) {
      console.error('\n堆栈信息：');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

createSuperAdmin().catch(console.error);
