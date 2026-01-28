/**
 * 创建超级管理员账号（MySQL 版本）
 *
 * 使用方法：
 *   node windows_scripts/scripts/create-super-admin.js <email> <password>
 *
 * 示例：
 *   node windows_scripts/scripts/create-super-admin.js admin@company.com SecurePassword123
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// 从环境变量读取数据库配置
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'ops_workflow_center'
};

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
    console.error('  node windows_scripts/scripts/create-super-admin.js <email> <password>\n');
    console.error('示例：');
    console.error('  node windows_scripts/scripts/create-super-admin.js admin@company.com SecurePass123\n');
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

  console.log(`📧 邮箱: ${email}`);
  console.log(`🔐 密码: ${'*'.repeat(password.length)}\n`);

  let connection;

  try {
    // 步骤 1: 连接数据库
    console.log('📋 步骤 1: 连接数据库...');
    console.log(`   主机: ${DB_CONFIG.host}:${DB_CONFIG.port}`);
    console.log(`   数据库: ${DB_CONFIG.database}\n`);

    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ 数据库连接成功\n');

    // 步骤 2: 检查用户是否已存在
    console.log('📋 步骤 2: 检查用户是否已存在...');
    const [existingUsers] = await connection.execute(
      'SELECT id, email, role, status FROM user_profiles WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      const user = existingUsers[0];
      console.log('⚠️  用户已存在');
      console.log(`   ID: ${user.id}`);
      console.log(`   角色: ${user.role}`);
      console.log(`   状态: ${user.status}\n`);

      if (user.role === 'super_admin' && user.status === 'active') {
        console.log('✅ 该用户已经是活跃的超级管理员\n');
        await connection.end();
        process.exit(0);
      }

      // 更新为超级管理员
      console.log('🔄 更新用户为超级管理员...');

      // 加密新密码
      const passwordHash = await bcrypt.hash(password, 10);

      await connection.execute(
        'UPDATE user_profiles SET role = ?, status = ?, password_hash = ?, updated_at = NOW() WHERE id = ?',
        ['super_admin', 'active', passwordHash, user.id]
      );

      console.log('✅ 用户已更新为超级管理员\n');
      await connection.end();
      process.exit(0);
    }

    console.log('✅ 用户不存在，继续创建\n');

    // 步骤 3: 加密密码
    console.log('📋 步骤 3: 加密密码...');
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('✅ 密码加密完成\n');

    // 步骤 4: 创建用户
    console.log('📋 步骤 4: 创建超级管理员...');
    const userId = uuidv4();

    await connection.execute(
      `INSERT INTO user_profiles (id, email, password_hash, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, email, passwordHash, 'super_admin', 'active']
    );

    console.log('✅ 超级管理员创建成功\n');
    console.log(`   User ID: ${userId}\n`);

    // 验证创建结果
    const [newUser] = await connection.execute(
      'SELECT id, email, role, status, created_at FROM user_profiles WHERE id = ?',
      [userId]
    );

    if (newUser.length === 0) {
      throw new Error('用户创建后无法查询到记录');
    }

    console.log('=========================================');
    console.log('   ✅ 超级管理员创建成功！');
    console.log('=========================================\n');
    console.log('登录信息：');
    console.log(`   邮箱: ${email}`);
    console.log(`   密码: ${password}`);
    console.log(`   角色: super_admin`);
    console.log(`   状态: active\n`);
    console.log('下一步：');
    console.log('   1. 启动 API 服务器: npm run server');
    console.log('   2. 启动前端: npm run dev');
    console.log('   3. 访问: http://localhost:5173');
    console.log('   4. 使用上述凭据登录\n');

    await connection.end();

  } catch (error) {
    console.error('❌ 发生错误：', error.message);

    if (error.code) {
      console.error(`   错误代码: ${error.code}`);
    }

    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  无法连接到数据库，请检查：');
      console.error('   1. 数据库服务是否运行');
      console.error('   2. .env 文件中的数据库配置是否正确');
      console.error('   3. 防火墙是否允许连接\n');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n⚠️  数据库不存在，请先创建数据库：');
      console.error(`   CREATE DATABASE ${DB_CONFIG.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`);
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('\n⚠️  数据表不存在，请先初始化数据库：');
      console.error('   mysql -h <host> -P <port> -u <user> -p <database> < windows_scripts/scripts/init-database.sql\n');
    }

    if (connection) {
      await connection.end();
    }

    process.exit(1);
  }
}

// 检查依赖
try {
  require.resolve('mysql2');
  require.resolve('bcrypt');
} catch (error) {
  console.error('❌ 错误：缺少必需的依赖包');
  console.error('请先安装依赖：npm install\n');
  process.exit(1);
}

createSuperAdmin().catch(console.error);
