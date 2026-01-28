import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Play, X } from 'lucide-react'
import { dataService } from '../services'
import type { Module } from '../lib/database.types'
import ModuleDialog from '../components/ModuleDialog'
import { useAuth } from '../contexts/AuthContext'

interface TestResult {
  success: boolean
  logs: any[]
  error?: string
}

export default function ModulesPage() {
  const { user } = useAuth()
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [testingModule, setTestingModule] = useState<Module | null>(null)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [testing, setTesting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)

  useEffect(() => {
    fetchModules()
  }, [])

  const fetchModules = async () => {
    try {
      const { data, error } = await dataService.query<Module>('modules', {
        order: { column: 'created_at', ascending: false }
      })

      if (error) throw error
      setModules(data || [])
    } catch (error) {
      console.error('Error fetching modules:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteModule = async (id: string) => {
    if (!confirm('确定要删除这个模块吗？')) return

    try {
      const { error } = await dataService.delete('modules', id)

      if (error) throw error
      fetchModules()
    } catch (error) {
      console.error('Error deleting module:', error)
    }
  }

  const testModule = async (module: Module) => {
    setTestingModule(module)
    setTestResult(null)
    setTesting(true)

    try {
      const workflow = {
        nodes: [
          {
            id: 'start-1',
            type: 'start',
            properties: {}
          },
          {
            id: 'module-test-1',
            type: 'task',
            properties: module.config
          },
          {
            id: 'end-1',
            type: 'end',
            properties: {}
          }
        ],
        edges: [
          { id: 'e1', sourceNodeId: 'start-1', targetNodeId: 'module-test-1' },
          { id: 'e2', sourceNodeId: 'module-test-1', targetNodeId: 'end-1' }
        ]
      }

      const response = await fetch('http://localhost:3001/api/playwright/test-module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module, workflow })
      })

      const data = await response.json()

      if (data.success) {
        const statusResponse = await fetch(`http://localhost:3001/api/playwright/execution/${data.executionId}`)
        const statusData = await statusResponse.json()

        setTestResult({
          success: statusData.status === 'completed',
          logs: statusData.logs || [],
          error: statusData.error
        })
      } else {
        setTestResult({
          success: false,
          logs: [],
          error: data.error || '测试失败'
        })
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        logs: [],
        error: error.message || '无法连接到后端服务'
      })
    } finally {
      setTesting(false)
    }
  }

  const closeTestModal = () => {
    setTestingModule(null)
    setTestResult(null)
    setTesting(false)
  }

  const handleCreateModule = () => {
    setEditingModule(null)
    setIsDialogOpen(true)
  }

  const handleEditModule = (module: Module) => {
    setEditingModule(module)
    setIsDialogOpen(true)
  }

  const handleSaveModule = async (moduleData: Partial<Module>) => {
    try {
      if (!user) {
        throw new Error('用户未登录')
      }

      if (moduleData.id) {
        const { error } = await dataService.update('modules', moduleData.id, moduleData)
        if (error) throw error
      } else {
        const dataWithUser = {
          ...moduleData,
          user_id: user.id
        }
        const { error } = await dataService.insert('modules', dataWithUser)
        if (error) throw error
      }

      await fetchModules()
      setIsDialogOpen(false)
      setEditingModule(null)
    } catch (error) {
      console.error('Error saving module:', error)
      throw error
    }
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingModule(null)
  }

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">模块管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理可复用的自动化操作模块</p>
        </div>
        <button
          onClick={handleCreateModule}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建模块
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <div
              key={module.id}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: module.color }}
                  >
                    {module.icon?.substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {module.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {module.description}
                    </p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded">
                        {module.type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => testModule(module)}
                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="测试模块"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditModule(module)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="编辑"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteModule(module.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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

      {!loading && modules.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p>还没有模块</p>
          <p className="text-sm mt-1">点击上方按钮创建第一个模块</p>
        </div>
      )}

      <ModuleDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveModule}
        module={editingModule}
      />

      {testingModule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                测试模块：{testingModule.name}
              </h2>
              <button
                onClick={closeTestModal}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {testing ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">正在测试模块...</p>
                  </div>
                </div>
              ) : testResult ? (
                <div>
                  <div className={`p-4 rounded-lg mb-4 ${
                    testResult.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <h3 className={`font-semibold mb-2 ${
                      testResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {testResult.success ? '✓ 测试成功' : '✗ 测试失败'}
                    </h3>
                    {testResult.error && (
                      <p className="text-red-700 text-sm">{testResult.error}</p>
                    )}
                  </div>

                  {testResult.logs.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">执行日志：</h4>
                      <div className="space-y-2">
                        {testResult.logs.map((log, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded text-sm ${
                              log.status === 'success'
                                ? 'bg-green-50 text-green-800'
                                : 'bg-red-50 text-red-800'
                            }`}
                          >
                            <div className="font-medium">{log.action}</div>
                            <div className="text-xs mt-1">{log.message}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={closeTestModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
