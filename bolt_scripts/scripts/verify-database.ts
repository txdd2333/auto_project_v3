/**
 * 验证 Supabase 数据库连接和表结构
 *
 * 使用方法：
 *   tsx bolt_scripts/scripts/verify-database.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// 加载环境变量
dotenv.config({ path: resolve(process.cwd(), '.env') });

const REQUIRED_TABLES = [
  'user_profiles',
  'account_requests',
  'scenarios',
  'workflows',
  'modules',
  'execution_logs',
  'ai_configs',
  'sop_documents'
];

async function verifyDatabase() {
  console.log('=========================================');
  console.log('   验证 Supabase 数据库');
  console.log('=========================================\n');

  // 检查环境变量
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const provider = process.env.VITE_SERVICE_PROVIDER;

  if (provider !== 'supabase') {
    console.error('❌ 错误：当前不是 Supabase 环境');
    console.error(`   VITE_SERVICE_PROVIDER = ${provider}`);
    console.error('\n请先运行切换脚本：');
    console.error('   bash bolt_scripts/scripts/switch-to-supabase.sh');
    process.exit(1);
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 错误：缺少 Supabase 配置');
    console.error('   请确保 .env 文件包含：');
    console.error('   - VITE_SUPABASE_URL');
    console.error('   - VITE_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  console.log('✅ 环境变量检查通过');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseKey.substring(0, 20)}...\n`);

  // 创建 Supabase 客户端
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 测试连接
  try {
    console.log('📡 测试数据库连接...');
    const { error } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true });

    if (error && error.message !== 'JWT expired') {
      throw error;
    }

    console.log('✅ 数据库连接成功\n');
  } catch (error: any) {
    console.error('❌ 数据库连接失败：', error.message);
    process.exit(1);
  }

  // 检查表结构
  console.log('📋 检查数据表...');
  let allTablesExist = true;

  for (const table of REQUIRED_TABLES) {
    try {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table} - 不存在或无法访问`);
        allTablesExist = false;
      } else {
        console.log(`✅ ${table}`);
      }
    } catch (error: any) {
      console.log(`❌ ${table} - ${error.message}`);
      allTablesExist = false;
    }
  }

  console.log('');

  if (!allTablesExist) {
    console.error('❌ 部分表不存在或无法访问');
    console.error('\n请确保已运行所有 Supabase migrations：');
    console.error('   在 Supabase Dashboard 中应用所有 migration 文件');
    process.exit(1);
  }

  // 检查用户表数据
  console.log('👥 检查用户数据...');
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, role, status', { count: 'exact' });

    if (error) throw error;

    console.log(`   总用户数: ${data?.length || 0}`);

    if (data && data.length > 0) {
      const superAdmins = data.filter(u => u.role === 'super_admin');
      const admins = data.filter(u => u.role === 'admin');
      const activeUsers = data.filter(u => u.status === 'active');

      console.log(`   超级管理员: ${superAdmins.length}`);
      console.log(`   管理员: ${admins.length}`);
      console.log(`   活跃用户: ${activeUsers.length}`);

      if (superAdmins.length === 0) {
        console.log('\n⚠️  警告：尚未创建超级管理员');
        console.log('   请运行：tsx bolt_scripts/scripts/create-super-admin.ts');
      }
    } else {
      console.log('\n⚠️  警告：数据库中没有用户');
      console.log('   请运行：tsx bolt_scripts/scripts/create-super-admin.ts');
    }
  } catch (error: any) {
    console.error(`❌ 无法查询用户数据：${error.message}`);
  }

  console.log('\n=========================================');
  console.log('   ✅ 数据库验证完成');
  console.log('=========================================\n');
}

verifyDatabase().catch(console.error);
