import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import LogicFlow from '@logicflow/core'
import {
  DndPanel,
  Menu,
  MiniMap,
  SelectionSelect,
  Snapshot,
  Control,
} from '@logicflow/extension'

import StartNode from './nodes/StartNode'
import EndNode from './nodes/EndNode'
import PlaywrightNode from './nodes/PlaywrightNode'

import '@logicflow/core/es/index.css'
import '@logicflow/extension/es/index.css'
import './styles.css'

export interface LogicFlowEditorProps {
  initialData?: {
    nodes: any[]
    edges: any[]
  }
  modules?: Array<{
    id: string
    name: string
    type: string
    color: string
    description: string
    config?: any
  }>
  onDataChange?: (data: { nodes: any[]; edges: any[] }) => void
}

export interface LogicFlowEditorRef {
  getData: () => { nodes: any[]; edges: any[] }
  setData: (data: { nodes: any[]; edges: any[] }) => void
  getLogicFlowInstance: () => LogicFlow | null
}

const LogicFlowEditor = forwardRef<LogicFlowEditorRef, LogicFlowEditorProps>(
  ({ initialData, modules = [], onDataChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const lfRef = useRef<LogicFlow | null>(null)

    useImperativeHandle(ref, () => ({
      getData: () => {
        if (!lfRef.current) return { nodes: [], edges: [] }
        const data = lfRef.current.getGraphData() as { nodes: any[]; edges: any[] }
        return data
      },
      setData: (data) => {
        if (lfRef.current) {
          lfRef.current.render(data)
        }
      },
      getLogicFlowInstance: () => lfRef.current,
    }))

    useEffect(() => {
      if (!containerRef.current || lfRef.current) return

      const lf = new LogicFlow({
        container: containerRef.current,
        grid: {
          size: 10,
          visible: true,
          type: 'dot',
          config: {
            color: '#e5e7eb',
            thickness: 1,
          },
        },
        background: {
          backgroundImage: 'none',
          backgroundColor: '#fafafa',
        },
        keyboard: {
          enabled: true,
          shortcuts: [
            {
              keys: ['backspace'],
              callback: () => {
                const elements = lf.getSelectElements(true)
                lf.clearSelectElements()
                elements.edges.forEach((edge) => lf.deleteEdge(edge.id))
                elements.nodes.forEach((node) => lf.deleteNode(node.id))
              },
            },
            {
              keys: ['ctrl+c', 'cmd+c'],
              callback: () => {
                lf.getSelectElements()
              },
            },
            {
              keys: ['ctrl+v', 'cmd+v'],
              callback: () => {
                // 粘贴逻辑
              },
            },
            {
              keys: ['ctrl+z', 'cmd+z'],
              callback: () => {
                lf.undo()
              },
            },
            {
              keys: ['ctrl+shift+z', 'cmd+shift+z'],
              callback: () => {
                lf.redo()
              },
            },
          ],
        },
        plugins: [
          DndPanel,
          Menu,
          MiniMap,
          SelectionSelect,
          Snapshot,
          Control,
        ],
        pluginsOptions: {
          MiniMap: {
            isShowHeader: true,
            isShowCloseIcon: true,
            width: 200,
            height: 120,
          },
        },
        style: {
          rect: {
            rx: 8,
            ry: 8,
            strokeWidth: 2,
            fill: '#ffffff',
            fillOpacity: 1,
          },
          circle: {
            strokeWidth: 2,
            fill: '#ffffff',
            fillOpacity: 1,
          },
          diamond: {
            strokeWidth: 2,
            fill: '#ffffff',
            fillOpacity: 1,
          },
          polyline: {
            stroke: '#94a3b8',
            strokeWidth: 2,
            strokeDasharray: '',
          },
          line: {
            stroke: '#94a3b8',
            strokeWidth: 2,
            strokeDasharray: '',
          },
          bezier: {
            stroke: '#94a3b8',
            strokeWidth: 2,
            strokeDasharray: '',
          },
          text: {
            fontSize: 13,
            fill: '#1f2937',
            fontWeight: 500,
          },
          edgeText: {
            fontSize: 12,
            fill: '#64748b',
            textWidth: 100,
            background: {
              fill: '#ffffff',
              stroke: '#e5e7eb',
              rx: 4,
              ry: 4,
            },
          },
          arrow: {
            offset: 10,
            verticalLength: 8,
          },
          anchor: {
            stroke: '#3b82f6',
            fill: '#ffffff',
            r: 4,
            strokeWidth: 2,
          },
          nodeText: {
            fontSize: 13,
            overflowMode: 'ellipsis',
            lineHeight: 1.5,
            fontWeight: 500,
          },
        },
        edgeTextDraggable: true,
        adjustEdge: true,
        adjustEdgeStartAndEnd: true,
        hoverOutline: true,
        nodeSelectedOutline: true,
        edgeSelectedOutline: true,
        hideAnchors: false,
        autoExpand: true,
      })

      lf.register(StartNode)
      lf.register(EndNode)
      lf.register(PlaywrightNode)

      const defaultPatternItems = [
        {
          type: 'start',
          text: '开始',
          label: '工作流起点',
          icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiMxMGI5ODEiLz48L3N2Zz4=',
        },
        {
          type: 'playwright',
          text: '浏览器自动化',
          label: 'Playwright 浏览器操作',
          icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iMiIgeT0iOCIgd2lkdGg9IjM2IiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iIzhiNWNmNiIgc3Ryb2tlPSIjN2M0ZGZmIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
          properties: {
            action: 'open_tabs',
            count: 1
          }
        },
        {
          type: 'end',
          text: '结束',
          label: '工作流终点',
          icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiNlZjQ0NDQiLz48L3N2Zz4=',
        },
      ]

      const modulePatternItems = modules.map((module) => ({
        type: 'task',
        text: module.name,
        label: module.name,
        properties: {
          moduleId: module.id,
          moduleName: module.name,
          moduleType: module.type,
          color: module.color,
          description: module.description,
          ...(module.config as any)
        },
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iMiIgeT0iOCIgd2lkdGg9IjM2IiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iJyArIG1vZHVsZS5jb2xvciArICciLz48L3N2Zz4=',
      }))

      const allPatternItems = [
        ...defaultPatternItems,
        ...(modulePatternItems.length > 0 ? [{
          type: 'group',
          text: '--- 我的模块 ---',
          label: '我的模块',
          className: 'pattern-group-divider'
        }] : []),
        ...modulePatternItems
      ]

      lf.setPatternItems(allPatternItems as any)

      lf.setMenuConfig({
        nodeMenu: [
          {
            text: '删除',
            callback(node: any) {
              lf.deleteNode(node.id)
            },
          },
          {
            text: '编辑文本',
            callback(node: any) {
              lf.graphModel.editText(node.id)
            },
          },
          {
            text: '复制',
            callback(node: any) {
              lf.cloneNode(node.id)
            },
          },
        ],
        edgeMenu: [
          {
            text: '删除',
            callback(edge: any) {
              lf.deleteEdge(edge.id)
            },
          },
          {
            text: '编辑文本',
            callback(edge: any) {
              lf.graphModel.editText(edge.id)
            },
          },
        ],
        graphMenu: [
          {
            text: '全选',
            callback() {
              lf.selectAll()
            },
          },
        ],
      })

      if (initialData && initialData.nodes.length > 0) {
        lf.render(initialData)
      } else {
        lf.render({ nodes: [], edges: [] })
      }

      lf.on('history:change', () => {
        if (onDataChange) {
          const data = lf.getGraphData() as { nodes: any[]; edges: any[] }
          onDataChange(data)
        }
      })

      lfRef.current = lf

      return () => {
        if (lfRef.current) {
          lfRef.current.destroy()
          lfRef.current = null
        }
      }
    }, [])

    useEffect(() => {
      if (lfRef.current && modules.length > 0) {
        const defaultPatternItems = [
          {
            type: 'start',
            text: '开始',
            label: '工作流起点',
            icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiMxMGI5ODEiLz48L3N2Zz4=',
          },
          {
            type: 'playwright',
            text: '浏览器自动化',
            label: 'Playwright 浏览器操作',
            icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iMiIgeT0iOCIgd2lkdGg9IjM2IiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iIzhiNWNmNiIgc3Ryb2tlPSIjN2M0ZGZmIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
            properties: {
              action: 'open_tabs',
              count: 1
            }
          },
          {
            type: 'end',
            text: '结束',
            label: '工作流终点',
            icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiNlZjQ0NDQiLz48L3N2Zz4=',
          },
        ]

        const modulePatternItems = modules.map((module) => ({
          type: 'task',
          text: module.name,
          label: module.name,
          properties: {
            moduleId: module.id,
            moduleName: module.name,
            moduleType: module.type,
            color: module.color,
            description: module.description,
            ...(module.config as any)
          },
          icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iMiIgeT0iOCIgd2lkdGg9IjM2IiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iJyArIG1vZHVsZS5jb2xvciArICciLz48L3N2Zz4=',
        }))

        const allPatternItems = [
          ...defaultPatternItems,
          ...(modulePatternItems.length > 0 ? [{
            type: 'group',
            text: '--- 我的模块 ---',
            label: '我的模块',
            className: 'pattern-group-divider'
          }] : []),
          ...modulePatternItems
        ]

        lfRef.current.setPatternItems(allPatternItems as any)
      }
    }, [modules])

    return (
      <div className="logicflow-editor-container">
        <div ref={containerRef} className="logicflow-canvas" />
      </div>
    )
  }
)

LogicFlowEditor.displayName = 'LogicFlowEditor'

export default LogicFlowEditor
