import { PlaywrightExecutor, ExecutionContext, PlaywrightAction } from './playwright-executor.js'
import { EventEmitter } from 'events'

export interface WorkflowNode {
  id: string
  type: string
  properties?: {
    action?: string
    browserType?: string
    count?: number
    urls?: string
    url?: string
    selector?: string
    text?: string
    milliseconds?: number
    pageIndex?: number
    moduleName?: string
    useCurrentUrl?: boolean
    fillItems?: any[]
    value?: string
    properties?: any
  }
}

export interface WorkflowEdge {
  id: string
  sourceNodeId: string
  targetNodeId: string
  source?: string
  target?: string
}

export interface Workflow {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
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

export interface ExecutionLog {
  timestamp: number
  nodeId: string
  nodeName: string
  action: string
  status: 'success' | 'error'
  message: string
  details?: any
}

export class WorkflowRunner {
  private executor: PlaywrightExecutor
  private executions: Map<string, ExecutionStatus> = new Map()
  private eventEmitters: Map<string, EventEmitter> = new Map()

  constructor(executor: PlaywrightExecutor) {
    this.executor = executor
  }

  async startExecution(workflow: Workflow, variables: Record<string, any> = {}): Promise<string> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log(`\n🚀 Starting workflow execution: ${executionId}`)
    console.log(`📊 Workflow nodes:`, workflow.nodes.length)
    console.log(`🔗 Workflow edges:`, workflow.edges.length)

    const status: ExecutionStatus = {
      id: executionId,
      status: 'running',
      completedNodes: [],
      logs: [],
      startTime: Date.now()
    }

    this.executions.set(executionId, status)
    const emitter = new EventEmitter()
    this.eventEmitters.set(executionId, emitter)

    this.executeWorkflow(executionId, workflow, variables).catch((error) => {
      console.error(`❌ Workflow ${executionId} failed:`, error)
      const currentStatus = this.executions.get(executionId)
      if (currentStatus) {
        currentStatus.status = 'failed'
        currentStatus.error = error.message
        currentStatus.endTime = Date.now()
        this.emitUpdate(executionId, currentStatus)
      }
    })

    return executionId
  }

  private async executeWorkflow(
    executionId: string,
    workflow: Workflow,
    variables: Record<string, any>
  ) {
    const status = this.executions.get(executionId)
    if (!status) return

    let context: ExecutionContext | null = null

    try {
      const firstPlaywrightNode = workflow.nodes.find(n =>
        n.type === 'playwright-node' || n.type === 'playwright' || n.type === 'task'
      )
      const browserType = firstPlaywrightNode?.properties?.browserType || 'chromium'

      context = await this.executor.createExecutionContext(browserType)
      context.variables = variables

      const startNode = workflow.nodes.find(n => n.type === 'start' || n.type === 'start-node')
      if (!startNode) {
        throw new Error('No start node found in workflow')
      }

      await this.executeNode(executionId, startNode, workflow, context)

      status.status = 'completed'
      status.endTime = Date.now()
      this.emitUpdate(executionId, status)
    } catch (error: any) {
      status.status = 'failed'
      status.error = error.message
      status.endTime = Date.now()
      this.emitUpdate(executionId, status)
    } finally {
      // 注释掉清理逻辑，让浏览器在执行完成后保持打开状态
      // 这样用户可以看到执行结果
      // if (context) {
      //   await this.executor.cleanup(context)
      // }
    }
  }

  private async executeNode(
    executionId: string,
    node: WorkflowNode,
    workflow: Workflow,
    context: ExecutionContext
  ) {
    const status = this.executions.get(executionId)
    if (!status) return

    // 检查并处理 useCurrentUrl 标志
    let nodeProps = node.properties || {}
    let updatedProps = { ...nodeProps }
    
    // 检查是否需要使用前面节点的URL
    if (nodeProps.useCurrentUrl) {
      // 从执行上下文中获取当前URL
      const pageIndex = nodeProps.pageIndex || 0
      const currentUrl = context.variables[`currentUrl_${pageIndex}`]
      
      if (currentUrl) {
        // 使用前面节点的URL
        updatedProps.url = currentUrl
        console.log(`🔄 Using current URL from previous node: ${currentUrl}`)
      } else {
        console.log(`⚠️  No current URL found in context, using node URL: ${nodeProps.url}`)
      }
    }
    
    // 更新节点属性
    node.properties = updatedProps

    console.log(`\n🎯 Executing node: ${node.id} (${node.type})`)
    console.log(`   Properties:`, node.properties)

    status.currentNodeId = node.id
    this.emitUpdate(executionId, status)

    const log: ExecutionLog = {
      timestamp: Date.now(),
      nodeId: node.id,
      nodeName: node.type,
      action: updatedProps.action || node.type,
      status: 'success',
      message: ''
    }

    try {
      console.log(`🔧 Executing node type: ${node.type}`)
      console.log(`   Node properties:`, node.properties)
      
      if (node.type === 'playwright-node' || node.type === 'playwright') {
        const action = this.nodeToAction(node)
        console.log(`   Converted action:`, action)
        const result = await this.executor.executeAction(action, context)
        console.log(`   Action result:`, result)

        if (!result.success) {
          throw new Error(result.error || 'Action failed')
        }

        log.message = `Successfully executed ${action.type}`
        log.details = result.result
      } else if (node.type === 'task') {
        const props = node.properties || {}
        console.log(`   Task props:`, props)

        if (props.action) {
          const action = this.nodeToAction(node)
          console.log(`   Converted action:`, action)
          const result = await this.executor.executeAction(action, context)
          console.log(`   Action result:`, result)

          if (!result.success) {
            throw new Error(result.error || 'Module action failed')
          }

          log.message = `Successfully executed module action: ${action.type}`
          log.details = result.result
        } else {
          log.message = `Executed module: ${props.moduleName || 'Unknown'}`
        }
      } else if (node.type === 'start' || node.type === 'start-node') {
        log.message = 'Workflow started'
      } else if (node.type === 'end' || node.type === 'end-node') {
        log.message = 'Workflow completed'
      } else {
        log.message = `Executed node type: ${node.type}`
      }

      log.status = 'success'
      console.log(`   Node execution success: ${log.message}`)
    } catch (error: any) {
      log.status = 'error'
      log.message = error.message
      console.error(`   Node execution error:`, error)
      status.logs.push(log)
      this.emitUpdate(executionId, status)
      throw error
    }

    status.completedNodes.push(node.id)
    status.logs.push(log)
    this.emitUpdate(executionId, status)

    if (node.type !== 'end' && node.type !== 'end-node') {
      // 兼容不同格式的边连接信息
      const nextEdge = workflow.edges.find(e => 
        e.sourceNodeId === node.id || e.source === node.id
      )
      if (nextEdge) {
        const targetNodeId = nextEdge.targetNodeId || nextEdge.target
        const nextNode = workflow.nodes.find(n => n.id === targetNodeId)
        if (nextNode) {
          await this.executeNode(executionId, nextNode, workflow, context)
        }
      }
    }
  }

  private nodeToAction(node: WorkflowNode): PlaywrightAction {
    // 处理嵌套的properties结构，兼容不同编辑器的数据格式
    let props = node.properties || {}
    // 如果properties中还有properties字段，则使用内部的properties
    if (props.properties) {
      props = {
        ...props,
        ...props.properties
      }
      delete props.properties
    }
    const action = props.action || 'open_tabs'

    console.log(`🔧 Converting node to action:`, {
      nodeId: node.id,
      nodeType: node.type,
      action: action,
      properties: props
    })

    const params: Record<string, any> = {}

    switch (action) {
      case 'open_tabs':
        params.count = props.count || 1
        if (props.urls) {
          params.urls = props.urls.split(',').map((u: string) => u.trim())
        }
        if (props.url) {
          params.urls = [props.url]
        }
        console.log(`  ➡️ open_tabs params:`, params)
        break

      case 'navigate':
        params.url = props.url || ''
        params.pageIndex = props.pageIndex || 0
        break

      case 'click':
        params.selector = props.selector || ''
        params.pageIndex = props.pageIndex || 0
        break

      case 'fill':
        // 支持多个选择器和填充内容组合
        if (props.fillItems) {
          const fillItems = Array.isArray(props.fillItems) ? props.fillItems : [props.fillItems]
          // 将前端的value字段映射为后端期望的text字段
          params.fillItems = fillItems.map((item: any) => ({
            selector: item.selector || '',
            text: item.value || item.text || ''
          }))
          console.log(`  ➡️ fill params:`, params)
        } else {
          params.selector = props.selector || ''
          params.text = props.text || props.value || ''
          console.log(`  ➡️ fill params (single):`, params)
        }
        params.pageIndex = props.pageIndex || 0
        break

      case 'wait':
        if (props.selector) {
          params.selector = props.selector
        }
        if (props.milliseconds) {
          params.milliseconds = props.milliseconds
        }
        params.pageIndex = props.pageIndex || 0
        break

      case 'screenshot':
        params.pageIndex = props.pageIndex || 0
        params.fullPage = true
        break

      case 'extract_text':
        params.selector = props.selector || ''
        params.pageIndex = props.pageIndex || 0
        break

      case 'close_tab':
        params.pageIndex = props.pageIndex || 0
        break
    }

    return { type: action, params }
  }

  getExecutionStatus(executionId: string): ExecutionStatus | undefined {
    return this.executions.get(executionId)
  }

  onExecutionUpdate(executionId: string, callback: (status: ExecutionStatus) => void) {
    const emitter = this.eventEmitters.get(executionId)
    if (emitter) {
      emitter.on('update', callback)
    }
  }

  offExecutionUpdate(executionId: string, callback: (status: ExecutionStatus) => void) {
    const emitter = this.eventEmitters.get(executionId)
    if (emitter) {
      emitter.off('update', callback)
    }
  }

  private emitUpdate(executionId: string, status: ExecutionStatus) {
    const emitter = this.eventEmitters.get(executionId)
    if (emitter) {
      emitter.emit('update', status)
    }
  }
}
