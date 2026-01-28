export interface WorkflowNode {
  id: string
  type: string
  properties?: Record<string, any>
}

export interface WorkflowEdge {
  id: string
  sourceNodeId: string
  targetNodeId: string
}

export interface Workflow {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export interface ExecutionLog {
  timestamp: number
  nodeId: string
  nodeName: string
  action: string
  status: 'success' | 'error'
  message: string
  details?: any
}

export interface ExecutionStatus {
  id: string
  status: 'running' | 'completed' | 'failed'
  currentNodeId?: string
  completedNodes: string[]
  logs: ExecutionLog[]
  startTime: number
  endTime?: number
  error?: string
}

export class PlaywrightService {
  private baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || import.meta.env.VITE_PLAYWRIGHT_URL || 'http://localhost:3001'
  }

  async executeWorkflow(
    workflow: Workflow,
    variables: Record<string, any> = {}
  ): Promise<{ executionId: string }> {
    const response = await fetch(`${this.baseUrl}/api/playwright/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workflow, variables }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to execute workflow')
    }

    return response.json()
  }

  async getExecutionStatus(executionId: string): Promise<ExecutionStatus> {
    const response = await fetch(
      `${this.baseUrl}/api/playwright/execution/${executionId}`
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get execution status')
    }

    return response.json()
  }

  createExecutionStream(
    executionId: string,
    onUpdate: (status: ExecutionStatus) => void,
    onError?: (error: Error) => void
  ): () => void {
    const eventSource = new EventSource(
      `${this.baseUrl}/api/playwright/execution/${executionId}/stream`
    )

    eventSource.onmessage = (event) => {
      try {
        const status = JSON.parse(event.data)
        onUpdate(status)
      } catch (error) {
        console.error('Failed to parse execution update:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error)
      if (onError) {
        onError(new Error('Connection to execution stream failed'))
      }
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      return response.ok
    } catch (error) {
      return false
    }
  }
}

export const playwrightService = new PlaywrightService()
