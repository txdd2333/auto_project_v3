import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock, Play } from 'lucide-react'
import { dataService } from '../services'
import type { ExecutionLog, Scenario, Workflow } from '../lib/database.types'

interface ExecutionLogWithRelations extends ExecutionLog {
  scenarios?: Scenario | null
  workflows?: Workflow | null
}

export default function ExecutionLogsPage() {
  const [logs, setLogs] = useState<ExecutionLogWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()

    const unsubscribe = dataService.subscribe('execution_logs', () => {
      fetchLogs()
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const fetchLogs = async () => {
    try {
      const { data, error } = await dataService.query<ExecutionLogWithRelations>('execution_logs', {
        select: '*, scenarios(*), workflows(*)',
        order: { column: 'created_at', ascending: false },
        limit: 50
      })

      if (error) throw error
      setLogs(data as any || [])
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'running':
        return <Play className="w-5 h-5 text-blue-600 animate-pulse" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成'
      case 'failed':
        return '失败'
      case 'running':
        return '执行中'
      default:
        return '待执行'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700'
      case 'failed':
        return 'bg-red-50 text-red-700'
      case 'running':
        return 'bg-blue-50 text-blue-700'
      default:
        return 'bg-gray-50 text-gray-700'
    }
  }

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">执行日志</h1>
        <p className="mt-1 text-sm text-gray-500">查看工作流执行记录和状态</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  场景
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  工作流
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  参数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  开始时间
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          log.status
                        )}`}
                      >
                        {getStatusText(log.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {log.scenarios?.name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {log.workflows?.name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {log.parameters && typeof log.parameters === 'object'
                        ? JSON.stringify(log.parameters)
                        : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {log.started_at
                        ? new Date(log.started_at).toLocaleString('zh-CN')
                        : '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {logs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <p>还没有执行记录</p>
              <p className="text-sm mt-1">启动一个场景后将在此显示执行日志</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
