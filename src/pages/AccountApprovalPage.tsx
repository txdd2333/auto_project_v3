import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  CheckCircle,
  XCircle,
  Phone,
  Calendar,
  MessageSquare,
  Shield,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import type { AccountRequest } from '../lib/database.types';

export default function AccountApprovalPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AccountRequest | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/');
      toast.error('无权访问此页面');
      return;
    }
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const isSupabase = import.meta.env.VITE_SERVICE_PROVIDER === 'supabase';

      if (isSupabase) {
        const { supabase } = await import('../lib/supabase');
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedRequests = (data || []).map((u: any) => ({
          id: u.id,
          email: u.email,
          phone: u.phone,
          requested_role: u.role,
          requested_at: u.created_at,
          reason: null,
          status: u.status,
          reviewed_at: null,
          reviewed_by: null,
          review_notes: null,
          user_id: u.id
        }));

        setRequests(formattedRequests);
      } else {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users?status=pending&order=created_at:desc`,
          {
            headers: {
              'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth_session') || '{}').access_token}`,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to load users');

        const result = await response.json();
        const users = result.data || [];

        const formattedRequests = users.map((u: any) => ({
          id: u.id,
          email: u.email,
          phone: u.full_name,
          requested_role: u.role,
          requested_at: u.created_at,
          reason: null,
          status: u.status,
          reviewed_at: null,
          reviewed_by: null,
          review_notes: null,
          user_id: u.id
        }));

        setRequests(formattedRequests);
      }
    } catch (error) {
      console.error('Failed to load requests:', error);
      toast.error('加载注册申请失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (requestId: string, action: 'approve' | 'reject', _notes: string) => {
    try {
      const isSupabase = import.meta.env.VITE_SERVICE_PROVIDER === 'supabase';

      if (action === 'approve') {
        if (isSupabase) {
          const { supabase } = await import('../lib/supabase');
          const { error } = await supabase
            .from('user_profiles')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', requestId);

          if (error) throw error;
        } else {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/${requestId}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth_session') || '{}').access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ status: 'active' }),
            }
          );

          if (!response.ok) throw new Error('Failed to update user');
        }
        toast.success('申请已批准');
      } else {
        if (isSupabase) {
          const { supabase } = await import('../lib/supabase');
          const { error } = await (supabase as any).rpc('reject_user_registration', {
            target_user_id: requestId
          });

          if (error) throw error;
        } else {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/${requestId}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth_session') || '{}').access_token}`,
              },
            }
          );

          if (!response.ok) throw new Error('Failed to delete user');
        }
        toast.success('申请已拒绝，账号已删除');
      }

      setShowApprovalDialog(false);
      setSelectedRequest(null);
      await loadRequests();
    } catch (error: any) {
      console.error('Failed to process request:', error);
      toast.error(error.message || '处理申请失败');
    }
  };

  if (!isAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 页头 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-blue-600" />
            账号审批
          </h1>
          <p className="text-gray-600 mt-2">审批待处理的注册申请</p>
        </div>

        {/* 申请列表 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-500">加载中...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无待审批的申请</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {requests.map((request) => (
                <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Shield className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{request.email}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(request.requested_at).toLocaleString('zh-CN')}
                            </span>
                            {request.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {request.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="ml-15 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">申请角色：</span>
                          <span className={`text-sm px-2 py-1 rounded ${
                            request.requested_role === 'read_write'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {request.requested_role === 'read_write' ? '读写权限' : '只读权限'}
                          </span>
                        </div>

                        {request.reason && (
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              申请理由
                            </p>
                            <p className="text-sm text-gray-600 ml-6">{request.reason}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setApprovalAction('approve');
                          setShowApprovalDialog(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        批准
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setApprovalAction('reject');
                          setShowApprovalDialog(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        拒绝
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 审批对话框 */}
      {showApprovalDialog && selectedRequest && (
        <ApprovalDialog
          request={selectedRequest}
          action={approvalAction}
          onClose={() => {
            setShowApprovalDialog(false);
            setSelectedRequest(null);
          }}
          onConfirm={handleApproval}
        />
      )}
    </div>
  );
}

function ApprovalDialog({
  request,
  action,
  onClose,
  onConfirm,
}: {
  request: AccountRequest;
  action: 'approve' | 'reject';
  onClose: () => void;
  onConfirm: (requestId: string, action: 'approve' | 'reject', notes: string) => void;
}) {
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(request.id, action, notes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {action === 'approve' ? '批准申请' : '拒绝申请'}
        </h2>
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">申请用户</p>
          <p className="font-medium text-gray-900">{request.email}</p>
          {request.phone && (
            <>
              <p className="text-sm text-gray-600 mt-3 mb-1">联系电话</p>
              <p className="font-medium text-gray-900">{request.phone}</p>
            </>
          )}
          <p className="text-sm text-gray-600 mt-3 mb-1">申请角色</p>
          <p className="font-medium text-gray-900">
            {request.requested_role === 'read_write' ? '读写权限' : '只读权限'}
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {action === 'approve' ? '批准说明（可选）' : '拒绝原因'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              required={action === 'reject'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={action === 'approve' ? '可以添加欢迎信息或使用说明...' : '请说明拒绝原因...'}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                action === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              确认{action === 'approve' ? '批准' : '拒绝'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
