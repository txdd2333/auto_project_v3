import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Play, Trash2, Settings, Eye } from 'lucide-react'
import { dataService } from '../services'
import { useAuth } from '../contexts/AuthContext'
import { useToastContext } from '../contexts/ToastContext'
import type { Scenario, Workflow } from '../lib/database.types'

interface ScenarioWithWorkflow extends Scenario {
  workflows?: Workflow | null
}

export default function ScenariosPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToastContext()
  const [scenarios, setScenarios] = useState<ScenarioWithWorkflow[]>([])
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null)

  useEffect(() => {
    fetchScenarios()
    fetchWorkflows()
  }, [])

  const fetchScenarios = async () => {
    try {
      const { data, error } = await dataService.query<ScenarioWithWorkflow>('scenarios', {
        select: '*, workflows!scenarios_workflow_id_fkey(*)',
        order: { column: 'created_at', ascending: false }
      })

      if (error) throw error
      setScenarios(data as any || [])
    } catch (error) {
      console.error('Error fetching scenarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkflows = async () => {
    try {
      const { data, error } = await dataService.query<Workflow>('workflows', {
        order: { column: 'name', ascending: true }
      })

      if (error) throw error
      setWorkflows(data || [])
    } catch (error) {
      console.error('Error fetching workflows:', error)
    }
  }

  const deleteScenario = async (id: string) => {
    if (!confirm('确定要删除这个应急场景吗？')) return

    try {
      const { error } = await dataService.delete('scenarios', id)

      if (error) throw error
      fetchScenarios()
    } catch (error) {
      console.error('Error deleting scenario:', error)
    }
  }

  const executeScenario = async (scenario: ScenarioWithWorkflow) => {
    if (!scenario.workflow_id) {
      toast.warning('该场景还没有关联工作流')
      return
    }

    if (!user?.id) {
      toast.error('用户信息错误，请重新登录')
      return
    }

    const parameters: Record<string, string> = {}
    const scenarioParams = scenario.parameters as any[] || []

    for (const param of scenarioParams) {
      const value = prompt(`请输入 ${param.label}:`, param.default || '')
      if (value === null) return
      parameters[param.name] = value
    }

    try {
      const result = await dataService.insert('execution_logs', {
        scenario_id: scenario.id,
        workflow_id: scenario.workflow_id,
        parameters,
        status: 'pending',
        started_at: new Date().toISOString(),
        user_id: user.id,
      })

      if (result.error) {
        console.error('Error executing scenario:', result.error)
        throw result.error
      }

      toast.success('工作流已启动！')
      toast.info('请查看浏览器中打开的新标签页', 5000)

      console.log('Execution log created:', result.data)
    } catch (error: any) {
      console.error('Error executing scenario:', error)
      toast.error(`启动失败：${error.message || '未知错误'}`)
    }
  }

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">应急场景</h1>
          <p className="mt-1 text-sm text-gray-500">一键启动预配置的应急处置流程</p>
        </div>
        <button
          onClick={() => {
            setEditingScenario(null)
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建场景
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {scenario.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {scenario.description}
                  </p>
                </div>
              </div>

              {scenario.workflows && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs text-gray-500">工作流:</span>
                  <span className="text-xs font-medium text-blue-600">
                    {scenario.workflows.name}
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => navigate(`/scenarios/${scenario.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  查看详情
                </button>
                <button
                  onClick={() => executeScenario(scenario)}
                  disabled={!scenario.workflow_id}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="启动"
                >
                  <Play className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingScenario(scenario)
                    setShowModal(true)
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="编辑基本信息"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteScenario(scenario.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && scenarios.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p>还没有应急场景</p>
          <p className="text-sm mt-1">点击上方按钮创建第一个场景</p>
        </div>
      )}

      {showModal && (
        <ScenarioModal
          scenario={editingScenario}
          workflows={workflows}
          toast={toast}
          onClose={() => {
            setShowModal(false)
            setEditingScenario(null)
          }}
          onSave={() => {
            fetchScenarios()
            setShowModal(false)
            setEditingScenario(null)
          }}
        />
      )}
    </div>
  )
}

interface ScenarioModalProps {
  scenario: Scenario | null
  workflows: Workflow[]
  toast: any
  onClose: () => void
  onSave: () => void
}

function ScenarioModal({ scenario, workflows, toast, onClose, onSave }: ScenarioModalProps) {
  const { user } = useAuth()
  const [name, setName] = useState(scenario?.name || '')
  const [description, setDescription] = useState(scenario?.description || '')
  const [workflowId, setWorkflowId] = useState(scenario?.workflow_id || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    if (!user?.id) {
      toast.error('用户信息错误，请重新登录')
      return
    }

    setSaving(true)
    try {
      if (scenario) {
        const { error } = await dataService.update('scenarios', scenario.id, {
          name,
          description,
          workflow_id: workflowId || null
        })

        if (error) {
          console.error('Update error:', error)
          throw error
        }
      } else {
        const result = await dataService.insert('scenarios', {
          name,
          description,
          workflow_id: workflowId || null,
          user_id: user.id
        })

        if (result.error) {
          console.error('Insert error:', result.error)
          throw result.error
        }
      }

      toast.success('场景保存成功！')
      onSave()
    } catch (error: any) {
      console.error('Error saving scenario:', error)
      toast.error(`保存失败：${error.message || '未知错误'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {scenario ? '编辑场景' : '新建场景'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                场景名称
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：OB集群故障处置"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                场景描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="描述这个场景的用途"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                关联工作流
              </label>
              <select
                value={workflowId}
                onChange={(e) => setWorkflowId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">选择工作流...</option>
                {workflows.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
