import { DragEvent } from 'react';
import {
  PlayCircle,
  StopCircle,
  Globe,
  MousePointer,
  CheckCircle,
  GitBranch,
  Clock,
  Send,
  Zap,
  Repeat,
  GitMerge,
  Package,
  MessageCircle,
  Plus
} from 'lucide-react';

interface WorkflowElementPanelProps {
  onDragStart: (event: DragEvent, nodeType: string, defaultData: any) => void;
}

const nodeCategories = [
  {
    title: '基础节点',
    nodes: [
      {
        type: 'start',
        label: '开始',
        icon: PlayCircle,
        color: 'from-green-400 to-green-600',
        defaultData: { label: '开始' }
      },
      {
        type: 'end',
        label: '结束',
        icon: StopCircle,
        color: 'from-red-400 to-red-600',
        defaultData: { label: '结束' }
      },
      {
        type: 'task',
        label: '任务',
        icon: CheckCircle,
        color: 'from-blue-400 to-blue-600',
        defaultData: { label: '任务', color: '#3b82f6' }
      }
    ]
  },
  {
    title: 'Playwright 自动化',
    nodes: [
      {
        type: 'playwright',
        label: '打开页面',
        icon: Globe,
        color: 'from-purple-400 to-purple-600',
        defaultData: { label: '打开页面', properties: { action: 'open_tabs', url: '' } }
      },
      {
        type: 'playwright',
        label: '点击元素',
        icon: MousePointer,
        color: 'from-green-400 to-green-600',
        defaultData: { label: '点击元素', properties: { action: 'click', selector: '' } }
      }
    ]
  },
  {
    title: '流程控制',
    nodes: [
      {
        type: 'decision',
        label: '判断',
        icon: GitBranch,
        color: 'from-amber-400 to-amber-600',
        defaultData: { label: '判断', properties: { condition: '' } }
      },
      {
        type: 'loop',
        label: '循环',
        icon: Repeat,
        color: 'from-emerald-400 to-emerald-600',
        defaultData: { label: '循环', properties: { iterations: 1 } }
      },
      {
        type: 'merge',
        label: '合并',
        icon: GitMerge,
        color: 'from-orange-400 to-orange-600',
        defaultData: { label: '合并' }
      },
      {
        type: 'parallelGateway',
        label: '并行网关',
        icon: Plus,
        color: 'from-yellow-400 to-yellow-600',
        defaultData: { label: '并行网关' }
      }
    ]
  },
  {
    title: '高级功能',
    nodes: [
      {
        type: 'delay',
        label: '延时',
        icon: Clock,
        color: 'from-indigo-400 to-indigo-600',
        defaultData: { label: '延时', properties: { duration: 1 } }
      },
      {
        type: 'notification',
        label: '通知',
        icon: Send,
        color: 'from-cyan-400 to-cyan-600',
        defaultData: { label: '通知', properties: { message: '' } }
      },
      {
        type: 'apiCall',
        label: 'API调用',
        icon: Zap,
        color: 'from-violet-400 to-violet-600',
        defaultData: { label: 'API调用', properties: { method: 'GET', url: '' } }
      },
      {
        type: 'subprocess',
        label: '子流程',
        icon: Package,
        color: 'from-slate-400 to-slate-600',
        defaultData: { label: '子流程', properties: { workflowId: '' } }
      },
      {
        type: 'approval',
        label: '审批',
        icon: MessageCircle,
        color: 'from-rose-400 to-rose-600',
        defaultData: { label: '审批', properties: { approver: '' } }
      }
    ]
  }
];

export const WorkflowElementPanel = ({ onDragStart }: WorkflowElementPanelProps) => {
  return (
    <div className="absolute left-4 top-20 z-10 bg-white rounded-xl shadow-lg border border-gray-200 w-64 max-h-[calc(100vh-120px)] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 rounded-t-xl z-10">
        <h3 className="font-semibold text-sm text-gray-900">节点面板</h3>
        <p className="text-xs text-gray-500 mt-0.5">拖拽节点到画布中</p>
      </div>

      <div className="p-3 space-y-4">
        {nodeCategories.map((category) => (
          <div key={category.title}>
            <h4 className="text-xs font-semibold text-gray-600 mb-2 px-1">{category.title}</h4>
            <div className="space-y-1.5">
              {category.nodes.map((node) => {
                const Icon = node.icon;
                return (
                  <div
                    key={`${node.type}-${node.label}`}
                    draggable
                    onDragStart={(e) => onDragStart(e, node.type, node.defaultData)}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-move hover:shadow-md transition-all border border-transparent hover:border-gray-200 bg-gradient-to-r ${node.color} bg-opacity-10`}
                  >
                    <div className={`p-1.5 rounded-md bg-gradient-to-br ${node.color}`}>
                      <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{node.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
