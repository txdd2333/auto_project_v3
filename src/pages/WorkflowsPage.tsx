import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { dataService } from '../services'
import { useAuth } from '../contexts/AuthContext'
import { useToastContext } from '../contexts/ToastContext'
import type { Workflow } from '../lib/database.types'

export default function WorkflowsPage() {
  const { user } = useAuth()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const toast = useToastContext()

  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    try {
      const { data, error } = await dataService.query<Workflow>('workflows', {
        order: { column: 'created_at', ascending: false }
      })

      if (error) throw error
      setWorkflows(data || [])
    } catch (error) {
      console.error('Error fetching workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const createWorkflow = async () => {
    const name = prompt('请输入工作流名称：')
    if (!name) return

    if (!user?.id) {
      toast.error('用户信息错误，请重新登录')
      return
    }

    try {
      const result = await dataService.insert<Workflow>('workflows', {
        name,
        description: '',
        user_id: user.id
      })

      if (result.error) {
        console.error('Error creating workflow:', result.error)
        toast.error(`创建失败：${result.error.message || '未知错误'}`)
        return
      }

      if (result.data && !Array.isArray(result.data)) {
        toast.success('工作流创建成功！')
        navigate(`/workflows/${result.data.id}`)
      }
    } catch (error: any) {
      console.error('Error creating workflow:', error)
      toast.error(`创建失败：${error.message || '未知错误'}`)
    }
  }

  const deleteWorkflow = async (id: string) => {
    if (!confirm('确定要删除这个工作流吗？所有关联的节点和连接也会被删除。')) return

    try {
      const { error } = await dataService.delete('workflows', id)

      if (error) throw error
      fetchWorkflows()
    } catch (error) {
      console.error('Error deleting workflow:', error)
    }
  }

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工作流管理</h1>
          <p className="mt-1 text-sm text-gray-500">创建和管理应急处置工作流</p>
        </div>
        <button
          onClick={createWorkflow}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建工作流
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {workflow.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {workflow.description || '暂无描述'}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    创建于 {new Date(workflow.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/workflows/${workflow.id}`)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    编辑
                  </button>
                  <button
                    onClick={() => deleteWorkflow(workflow.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && workflows.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p>还没有工作流</p>
          <p className="text-sm mt-1">点击上方按钮创建第一个工作流</p>
        </div>
      )}
    </div>
  )
}
