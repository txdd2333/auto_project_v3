import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Phone,
  Shield,
  AlertCircle,
  Check,
  Search,
  XCircle,
  Eraser,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import type { UserProfile } from '../lib/database.types';
import ConfirmDialog from '../components/ConfirmDialog';

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  type: 'info' | 'warning' | 'danger' | 'success';
  onConfirm: () => void;
  confirmText?: string;
}

export default function UserManagementPage() {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active_only');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {},
  });

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/');
      toast.error('无权访问此页面');
      return;
    }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const isSupabase = import.meta.env.VITE_SERVICE_PROVIDER === 'supabase';

      if (isSupabase) {
        const { supabase } = await import('../lib/supabase');
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .neq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUsers(data || []);
      } else {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users?status=ne:pending&order=created_at:desc`,
          {
            headers: {
              'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth_session') || '{}').access_token}`,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to load users');

        const result = await response.json();
        const rawUsers = result.data || [];

        const formattedUsers = rawUsers.map((u: any) => ({
          id: u.id,
          email: u.email,
          phone: u.full_name,
          role: u.role,
          status: u.status,
          created_at: u.created_at,
          last_login_at: u.last_sign_in_at
        }));

        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    // 状态过滤逻辑
    let matchesStatus = false;
    if (statusFilter === 'active_only') {
      // 默认：只显示活跃和锁定的用户，不显示已删除的
      matchesStatus = u.status === 'active' || u.status === 'locked';
    } else if (statusFilter === 'all') {
      // 显示所有用户（包括已删除）
      matchesStatus = true;
    } else {
      // 特定状态筛选
      matchesStatus = u.status === statusFilter;
    }

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = async (formData: {
    email: string;
    password: string;
    phone?: string;
    role: string;
    status: string;
  }) => {
    try {
      const isSupabase = import.meta.env.VITE_SERVICE_PROVIDER === 'supabase';

      if (isSupabase) {
        const { supabase } = await import('../lib/supabase');

        // 1. Create user in auth.users
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error('Failed to create user');

        // 2. Create user profile with specified role and status
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            email: formData.email,
            phone: formData.phone || null,
            role: formData.role as 'super_admin' | 'admin' | 'read_write' | 'read_only',
            status: formData.status as 'active' | 'locked' | 'pending' | 'deleted',
          });

        if (profileError) throw profileError;
      } else {
        // For MySQL: use admin create user API
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth_session') || '{}').access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create user');
        }
      }

      toast.success('用户创建成功');
      setShowCreateDialog(false);
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to create user:', error);
      toast.error(error.message || '创建用户失败');
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      const isSupabase = import.meta.env.VITE_SERVICE_PROVIDER === 'supabase';

      if (isSupabase) {
        const { supabase } = await import('../lib/supabase');
        const { error } = await supabase
          .from('user_profiles')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', userId);

        if (error) throw error;
      } else {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/${userId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth_session') || '{}').access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          }
        );

        if (!response.ok) throw new Error('Failed to update user');
      }

      toast.success('用户信息已更新');
      setShowEditDialog(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      toast.error(error.message || '更新用户失败');
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'locked' ? 'active' : 'locked';
    await handleUpdateUser(userId, { status: newStatus });
  };

  const handleDeleteUser = (userId: string) => {
    setConfirmState({
      isOpen: true,
      title: '删除用户',
      message: (
        <div className="space-y-3">
          <p>确定要删除此用户吗？</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
            <p className="font-medium text-yellow-800 mb-1">注意</p>
            <p className="text-yellow-700">这是软删除，用户将被标记为"已删除"状态，但数据仍保留在系统中。</p>
            <p className="text-yellow-700 mt-1">如需彻底清理，请在已删除用户列表中使用"彻底清理"功能。</p>
          </div>
        </div>
      ),
      type: 'warning',
      confirmText: '删除',
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        await executeDeleteUser(userId);
      },
    });
  };

  const executeDeleteUser = async (userId: string) => {
    try {
      const isSupabase = import.meta.env.VITE_SERVICE_PROVIDER === 'supabase';

      if (isSupabase) {
        const { supabase } = await import('../lib/supabase');
        const { error } = await supabase
          .from('user_profiles')
          .update({ status: 'deleted', updated_at: new Date().toISOString() })
          .eq('id', userId);

        if (error) throw error;
      } else {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/${userId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth_session') || '{}').access_token}`,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to delete user');
      }

      toast.success('用户已标记为删除状态');
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      toast.error(error.message || '删除用户失败');
    }
  };

  const handlePermanentDelete = (userId: string, userEmail: string) => {
    setConfirmState({
      isOpen: true,
      title: '⚠️ 彻底删除用户',
      message: (
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="font-semibold text-red-800 mb-2">邮箱</p>
            <p className="text-red-900 font-mono bg-white px-3 py-2 rounded border border-red-300">{userEmail}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm space-y-2">
            <p className="font-medium text-red-800">此操作将：</p>
            <ul className="list-disc list-inside text-red-700 space-y-1">
              <li>永久删除该用户的所有数据</li>
              <li>删除认证信息（auth.users）</li>
              <li>该邮箱可以重新注册</li>
            </ul>
            <p className="font-bold text-red-900 mt-3">⚠️ 此操作不可恢复！</p>
          </div>
        </div>
      ),
      type: 'danger',
      confirmText: '确认彻底删除',
      onConfirm: () => {
        // 先关闭当前对话框
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        // 延迟显示二次确认对话框，确保第一个对话框完全关闭
        setTimeout(() => {
          setConfirmState({
            isOpen: true,
            title: '最后确认',
            message: '您真的要彻底删除此用户吗？\n\n此操作不可撤销！',
            type: 'danger',
            confirmText: '是的，彻底删除',
            onConfirm: async () => {
              setConfirmState(prev => ({ ...prev, isOpen: false }));
              await executePermanentDelete(userId, userEmail);
            },
          });
        }, 200);
      },
    });
  };

  const executePermanentDelete = async (userId: string, userEmail: string) => {
    console.log('开始彻底删除用户:', userId, userEmail);
    try {
      const isSupabase = import.meta.env.VITE_SERVICE_PROVIDER === 'supabase';

      if (isSupabase) {
        const { supabase } = await import('../lib/supabase');

        console.log('调用 RPC 函数 permanent_delete_user...');
        // 使用 RPC 函数彻底删除用户（包括 auth.users）
        const result = await (supabase as any).rpc('permanent_delete_user', {
          target_user_id: userId
        });

        console.log('RPC 调用结果:', result);

        if (result.error) {
          console.error('RPC 错误:', result.error);
          throw result.error;
        }

        // 如果成功，显示删除的记录数
        if (result.data) {
          console.log('删除成功，数据:', result.data);
          if (result.data.deleted_records > 0) {
            console.log(`已删除用户及其 ${result.data.deleted_records} 条相关记录`);
          }
        }
      } else {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/${userId}/permanent`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth_session') || '{}').access_token}`,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to permanently delete user');
      }

      console.log('删除成功，准备刷新用户列表...');
      toast.success('用户已彻底删除（包括认证信息），该邮箱现在可以重新注册');

      console.log('正在刷新用户列表...');
      await loadUsers();
      console.log('用户列表刷新完成');
    } catch (error: any) {
      console.error('彻底删除用户失败:', error);
      toast.error(error.message || '彻底删除用户失败');
    }
  };

  const handleCleanupOrphanedAuthUsers = () => {
    setConfirmState({
      isOpen: true,
      title: '清理孤立的认证记录',
      message: (
        <div className="space-y-3">
          <p>此操作将删除那些在认证系统中存在，但用户资料已被删除的账号。</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <p className="font-medium text-blue-800 mb-1">说明</p>
            <p className="text-blue-700">这些账号通常是之前删除时出现问题导致的。</p>
            <p className="text-blue-700 mt-1">清理后，这些邮箱可以重新注册。</p>
          </div>
        </div>
      ),
      type: 'info',
      confirmText: '开始清理',
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        await executeCleanupOrphanedAuthUsers();
      },
    });
  };

  const executeCleanupOrphanedAuthUsers = async () => {
    try {
      const isSupabase = import.meta.env.VITE_SERVICE_PROVIDER === 'supabase';

      if (isSupabase) {
        const { supabase } = await import('../lib/supabase');

        // 调用清理函数
        const result = await (supabase as any).rpc('cleanup_orphaned_auth_users');

        if (result.error) throw result.error;

        // 显示清理结果
        if (result.data) {
          const { cleanup_count, cleaned_users } = result.data;
          if (cleanup_count > 0) {
            const emails = cleaned_users.map((u: any) => u.email).join('\n- ');
            toast.success(`已清理 ${cleanup_count} 个孤立的认证记录:\n- ${emails}`);
            console.log('清理详情:', cleaned_users);
          } else {
            toast.success('没有发现孤立的认证记录');
          }
        }
      } else {
        toast.warning('MySQL 环境暂不支持此功能');
      }

      await loadUsers();
    } catch (error: any) {
      console.error('Failed to cleanup orphaned auth users:', error);
      toast.error(error.message || '清理失败');
    }
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      super_admin: 'bg-red-100 text-red-700 border-red-200',
      admin: 'bg-red-100 text-red-700 border-red-200',
      read_write: 'bg-blue-100 text-blue-700 border-blue-200',
      read_only: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    const labels = {
      super_admin: '超级管理员',
      admin: '管理员',
      read_write: '读写权限',
      read_only: '只读权限',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded border ${styles[role as keyof typeof styles]}`}>
        {labels[role as keyof typeof labels]}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      locked: 'bg-red-100 text-red-700',
      pending: 'bg-yellow-100 text-yellow-700',
      deleted: 'bg-gray-100 text-gray-700',
    };
    const labels = {
      active: '活跃',
      locked: '锁定',
      pending: '待审批',
      deleted: '已删除',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (!isAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页头 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              用户管理
            </h1>
            <p className="text-gray-600 mt-2">管理系统用户和权限</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCleanupOrphanedAuthUsers}
              className="flex items-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-md font-medium"
              title="清理孤立的认证记录（用户资料已删除但认证信息还在）"
            >
              <Eraser className="w-5 h-5" />
              清理孤立记录
            </button>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium"
            >
              <UserPlus className="w-5 h-5" />
              创建用户
            </button>
          </div>
        </div>

        {/* 筛选和搜索 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索邮箱或手机号..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有角色</option>
                <option value="super_admin">超级管理员</option>
                <option value="admin">管理员</option>
                <option value="read_write">读写权限</option>
                <option value="read_only">只读权限</option>
              </select>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active_only">活跃用户（默认）</option>
                <option value="all">所有状态</option>
                <option value="active">活跃</option>
                <option value="locked">锁定</option>
                <option value="pending">待审批</option>
                <option value="deleted">已删除</option>
              </select>
            </div>
          </div>
        </div>

        {/* 用户列表 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-500">加载中...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无用户</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      用户信息
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      角色
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      最后登录
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Shield className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{u.email}</p>
                              {u.id === user?.id && (
                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">当前</span>
                              )}
                            </div>
                            {u.phone && (
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                {u.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(u.role)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(u.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(u.created_at).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleString('zh-CN') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {u.status === 'deleted' ? (
                            <>
                              {/* 已删除用户显示彻底清理按钮 */}
                              <button
                                onClick={() => handlePermanentDelete(u.id, u.email)}
                                className="px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-1.5"
                                title="彻底清理 - 永久删除所有数据"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>彻底清理</span>
                              </button>
                            </>
                          ) : (
                            <>
                              {/* 正常用户显示常规操作按钮 */}
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setShowEditDialog(true);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="编辑用户"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(u.id, u.status)}
                                className={`p-2 rounded-lg transition-colors ${
                                  u.status === 'locked'
                                    ? 'text-green-600 hover:bg-green-50'
                                    : 'text-orange-600 hover:bg-orange-50'
                                }`}
                                title={u.status === 'locked' ? '解锁用户' : '锁定用户'}
                                disabled={u.id === user?.id}
                              >
                                {u.status === 'locked' ? (
                                  <Unlock className="w-4 h-4" />
                                ) : (
                                  <Lock className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="删除用户（软删除）"
                                disabled={u.id === user?.id}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="总用户数"
            value={users.filter(u => u.status !== 'deleted').length}
            color="blue"
          />
          <StatCard
            icon={<Check className="w-6 h-6" />}
            label="活跃用户"
            value={users.filter(u => u.status === 'active').length}
            color="green"
          />
          <StatCard
            icon={<Lock className="w-6 h-6" />}
            label="锁定用户"
            value={users.filter(u => u.status === 'locked').length}
            color="red"
          />
          <StatCard
            icon={<AlertCircle className="w-6 h-6" />}
            label="待审批"
            value={users.filter(u => u.status === 'pending').length}
            color="yellow"
          />
        </div>
      </div>

      {/* 创建用户对话框 */}
      {showCreateDialog && (
        <CreateUserDialog
          onClose={() => setShowCreateDialog(false)}
          onCreate={handleCreateUser}
        />
      )}

      {/* 编辑用户对话框 */}
      {showEditDialog && selectedUser && (
        <EditUserDialog
          user={selectedUser}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedUser(null);
          }}
          onUpdate={handleUpdateUser}
        />
      )}

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText={confirmState.confirmText}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className={`inline-flex p-3 rounded-lg ${colors[color as keyof typeof colors]} mb-4`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  );
}

function CreateUserDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    role: 'read_only',
    status: 'active',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">创建新用户</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邮箱 *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码 *
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="至少8位"
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              手机号
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="可选"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              角色 *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="read_only">只读权限</option>
              <option value="read_write">读写权限</option>
              <option value="admin">管理员</option>
              <option value="super_admin">超级管理员</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              状态 *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">活跃</option>
              <option value="pending">待审批</option>
              <option value="locked">锁定</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserDialog({
  user,
  onClose,
  onUpdate,
}: {
  user: UserProfile;
  onClose: () => void;
  onUpdate: (userId: string, updates: Partial<UserProfile>) => void;
}) {
  const [formData, setFormData] = useState({
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    status: user.status,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(user.id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">编辑用户</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邮箱
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              手机号
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              角色
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="read_only">只读权限</option>
              <option value="read_write">读写权限</option>
              <option value="admin">管理员</option>
              <option value="super_admin">超级管理员</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              状态
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">活跃</option>
              <option value="pending">待审批</option>
              <option value="locked">锁定</option>
              <option value="deleted">已删除</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
