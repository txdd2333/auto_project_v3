import { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import {
  PlayCircle,
  StopCircle,
  Globe,
  MousePointer,
  Type,
  Clock,
  Camera,
  Eye,
  XCircle,
  CheckCircle,
  Send,
  MessageCircle,
  GitBranch,
  Repeat,
  GitMerge,
  Package,
  Zap
} from 'lucide-react';

export interface WorkflowNodeData {
  label: string;
  description?: string;
  action?: string;
  color?: string;
  properties?: Record<string, any>;
}

const CommonHandles = ({ color = '#6b7280' }: { color?: string }) => (
  <>
    <Handle
      type="target"
      position={Position.Top}
      id="top"
      className="!w-3 !h-3"
      style={{ backgroundColor: color }}
      isConnectable={true}
    />
    <Handle
      type="target"
      position={Position.Left}
      id="left"
      className="!w-3 !h-3"
      style={{ backgroundColor: color }}
      isConnectable={true}
    />
    <Handle
      type="source"
      position={Position.Right}
      id="right"
      className="!w-3 !h-3"
      style={{ backgroundColor: color }}
      isConnectable={true}
    />
    <Handle
      type="source"
      position={Position.Bottom}
      id="bottom"
      className="!w-3 !h-3"
      style={{ backgroundColor: color }}
      isConnectable={true}
    />
  </>
);

const StartNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <>
      <NodeResizer
        color="#10b981"
        isVisible={selected}
        minWidth={80}
        minHeight={80}
      />
      <div
        className="relative bg-gradient-to-br from-green-400 to-green-600 text-white rounded-full w-full h-full flex flex-col items-center justify-center shadow-lg transition-all"
      >
        <CommonHandles color="#10b981" />
        <PlayCircle className="w-10 h-10 mb-1" strokeWidth={2.5} />
        <span className="text-sm font-bold">{data.label || '开始'}</span>
      </div>
    </>
  );
});

const EndNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <>
      <NodeResizer
        color="#ef4444"
        isVisible={selected}
        minWidth={80}
        minHeight={80}
      />
      <div
        className="relative bg-gradient-to-br from-red-400 to-red-600 text-white rounded-full w-full h-full flex flex-col items-center justify-center shadow-lg transition-all"
      >
        <CommonHandles color="#ef4444" />
        <StopCircle className="w-10 h-10 mb-1" strokeWidth={2.5} />
        <span className="text-sm font-bold">{data.label || '结束'}</span>
      </div>
    </>
  );
});

const PlaywrightNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  const action = data.properties?.action || 'open_tabs';

  const actionConfig: Record<string, { icon: any; bgFrom: string; bgTo: string; label: string }> = {
    open_tabs: { icon: Globe, bgFrom: '#a78bfa', bgTo: '#7c3aed', label: '打开标签页' },
    navigate: { icon: Globe, bgFrom: '#60a5fa', bgTo: '#2563eb', label: '导航' },
    click: { icon: MousePointer, bgFrom: '#34d399', bgTo: '#059669', label: '点击' },
    fill: { icon: Type, bgFrom: '#fbbf24', bgTo: '#d97706', label: '填充' },
    wait: { icon: Clock, bgFrom: '#818cf8', bgTo: '#4f46e5', label: '等待' },
    screenshot: { icon: Camera, bgFrom: '#f472b6', bgTo: '#db2777', label: '截图' },
    extract_text: { icon: Eye, bgFrom: '#2dd4bf', bgTo: '#0d9488', label: '提取文本' },
    close_tab: { icon: XCircle, bgFrom: '#f87171', bgTo: '#dc2626', label: '关闭标签页' }
  };

  const config = actionConfig[action] || actionConfig.open_tabs;
  const Icon = config.icon;

  return (
    <>
      <NodeResizer
        color="#8b5cf6"
        isVisible={selected}
        minWidth={180}
        minHeight={60}
      />
      <div
        className="relative text-white rounded-lg px-4 py-3 w-full h-full shadow-lg transition-all flex flex-col justify-center"
        style={{
          background: `linear-gradient(to bottom right, ${config.bgFrom}, ${config.bgTo})`
        }}
      >
        <CommonHandles color="#ffffff" />
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-5 h-5" strokeWidth={2.5} />
          <span className="font-semibold text-sm">{config.label}</span>
        </div>
        {data.label && data.label !== config.label && (
          <div className="text-xs opacity-90 line-clamp-2">{data.label}</div>
        )}
      </div>
    </>
  );
});

const TaskNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  const color = data.color || '#3b82f6';

  return (
    <>
      <NodeResizer
        color={color}
        isVisible={selected}
        minWidth={160}
        minHeight={60}
      />
      <div
        className="relative rounded-lg px-4 py-3 w-full h-full shadow-md border-2 transition-all flex flex-col justify-center"
        style={{
          borderColor: color,
          background: `linear-gradient(to bottom right, #eff6ff, #dbeafe)`
        }}
      >
        <CommonHandles color={color} />
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle className="w-4 h-4" style={{ color }} strokeWidth={2.5} />
          <span className="font-semibold text-sm text-gray-900">{data.label || '任务'}</span>
        </div>
        {data.description && (
          <div className="text-xs text-gray-600 line-clamp-2">{data.description}</div>
        )}
      </div>
    </>
  );
});

const DecisionNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <>
      <NodeResizer
        color="#f59e0b"
        isVisible={selected}
        minWidth={140}
        minHeight={140}
      />
      <div
        className="relative border-2 border-amber-500 text-gray-900 rounded-lg w-full h-full shadow-md transition-all flex flex-col items-center justify-center"
        style={{ background: 'linear-gradient(to bottom right, #fef3c7, #fde68a)' }}
      >
        <CommonHandles color="#f59e0b" />
        <GitBranch className="w-5 h-5 mb-1 text-amber-700" strokeWidth={2.5} />
        <span className="font-semibold text-sm text-amber-900">{data.label || '判断'}</span>
      </div>
    </>
  );
});

const DelayNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <>
      <NodeResizer
        color="#6366f1"
        isVisible={selected}
        minWidth={140}
        minHeight={60}
      />
      <div
        className="relative border-2 border-indigo-500 rounded-lg px-4 py-3 w-full h-full shadow-md transition-all flex flex-col justify-center"
        style={{ background: 'linear-gradient(to bottom right, #e0e7ff, #c7d2fe)' }}
      >
        <CommonHandles color="#6366f1" />
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-700" strokeWidth={2.5} />
          <span className="font-semibold text-sm text-indigo-900">{data.label || '延时'}</span>
        </div>
        {data.properties?.duration && (
          <div className="text-xs text-indigo-700 mt-1">{data.properties.duration}秒</div>
        )}
      </div>
    </>
  );
});

const NotificationNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <>
      <NodeResizer
        color="#06b6d4"
        isVisible={selected}
        minWidth={160}
        minHeight={60}
      />
      <div
        className="relative border-2 border-cyan-500 rounded-lg px-4 py-3 w-full h-full shadow-md transition-all flex flex-col justify-center"
        style={{ background: 'linear-gradient(to bottom right, #cffafe, #a5f3fc)' }}
      >
        <CommonHandles color="#06b6d4" />
        <div className="flex items-center gap-2 mb-1">
          <Send className="w-5 h-5 text-cyan-700" strokeWidth={2.5} />
          <span className="font-semibold text-sm text-cyan-900">{data.label || '通知'}</span>
        </div>
        {data.description && (
          <div className="text-xs text-cyan-700 line-clamp-2">{data.description}</div>
        )}
      </div>
    </>
  );
});

const ApiCallNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <>
      <NodeResizer
        color="#8b5cf6"
        isVisible={selected}
        minWidth={160}
        minHeight={60}
      />
      <div
        className="relative border-2 border-violet-500 rounded-lg px-4 py-3 w-full h-full shadow-md transition-all flex flex-col justify-center"
        style={{ background: 'linear-gradient(to bottom right, #ede9fe, #ddd6fe)' }}
      >
        <CommonHandles color="#8b5cf6" />
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-violet-700" strokeWidth={2.5} />
          <span className="font-semibold text-sm text-violet-900">{data.label || 'API调用'}</span>
        </div>
        {data.properties?.method && (
          <div className="text-xs text-violet-700">{data.properties.method.toUpperCase()}</div>
        )}
      </div>
    </>
  );
});

const LoopNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <>
      <NodeResizer
        color="#10b981"
        isVisible={selected}
        minWidth={140}
        minHeight={60}
      />
      <div
        className="relative border-2 border-emerald-500 rounded-lg px-4 py-3 w-full h-full shadow-md transition-all flex flex-col justify-center"
        style={{ background: 'linear-gradient(to bottom right, #d1fae5, #a7f3d0)' }}
      >
        <CommonHandles color="#10b981" />
        <div className="flex items-center gap-2">
          <Repeat className="w-5 h-5 text-emerald-700" strokeWidth={2.5} />
          <span className="font-semibold text-sm text-emerald-900">{data.label || '循环'}</span>
        </div>
      </div>
    </>
  );
});

const MergeNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <>
      <NodeResizer
        color="#f97316"
        isVisible={selected}
        minWidth={120}
        minHeight={60}
      />
      <div
        className="relative border-2 border-orange-500 rounded-lg px-4 py-3 w-full h-full shadow-md transition-all flex flex-col justify-center"
        style={{ background: 'linear-gradient(to bottom right, #fed7aa, #fdba74)' }}
      >
        <CommonHandles color="#f97316" />
        <div className="flex items-center gap-2">
          <GitMerge className="w-5 h-5 text-orange-700" strokeWidth={2.5} />
          <span className="font-semibold text-sm text-orange-900">{data.label || '合并'}</span>
        </div>
      </div>
    </>
  );
});

const SubprocessNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <>
      <NodeResizer
        color="#64748b"
        isVisible={selected}
        minWidth={160}
        minHeight={60}
      />
      <div
        className="relative border-2 border-slate-500 rounded-lg px-4 py-3 w-full h-full shadow-md transition-all flex flex-col justify-center"
        style={{ background: 'linear-gradient(to bottom right, #e2e8f0, #cbd5e1)' }}
      >
        <CommonHandles color="#64748b" />
        <div className="flex items-center gap-2 mb-1">
          <Package className="w-5 h-5 text-slate-700" strokeWidth={2.5} />
          <span className="font-semibold text-sm text-slate-900">{data.label || '子流程'}</span>
        </div>
        {data.description && (
          <div className="text-xs text-slate-700 line-clamp-2">{data.description}</div>
        )}
      </div>
    </>
  );
});

const ApprovalNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <>
      <NodeResizer
        color="#f43f5e"
        isVisible={selected}
        minWidth={140}
        minHeight={60}
      />
      <div
        className="relative border-2 border-rose-500 rounded-lg px-4 py-3 w-full h-full shadow-md transition-all flex flex-col justify-center"
        style={{ background: 'linear-gradient(to bottom right, #fecdd3, #fda4af)' }}
      >
        <CommonHandles color="#f43f5e" />
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-rose-700" strokeWidth={2.5} />
          <span className="font-semibold text-sm text-rose-900">{data.label || '审批'}</span>
        </div>
      </div>
    </>
  );
});

const ParallelGatewayNode = memo(({ selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <>
      <NodeResizer
        color="#eab308"
        isVisible={selected}
        minWidth={100}
        minHeight={100}
      />
      <div
        className="relative border-2 border-yellow-500 text-gray-900 rounded-lg w-full h-full shadow-md transition-all flex flex-col items-center justify-center"
        style={{ background: 'linear-gradient(to bottom right, #fef08a, #fde047)' }}
      >
        <CommonHandles color="#eab308" />
        <div className="text-2xl font-bold text-yellow-700">+</div>
        <span className="font-semibold text-xs text-yellow-900">并行</span>
      </div>
    </>
  );
});

StartNode.displayName = 'StartNode';
EndNode.displayName = 'EndNode';
PlaywrightNode.displayName = 'PlaywrightNode';
TaskNode.displayName = 'TaskNode';
DecisionNode.displayName = 'DecisionNode';
DelayNode.displayName = 'DelayNode';
NotificationNode.displayName = 'NotificationNode';
ApiCallNode.displayName = 'ApiCallNode';
LoopNode.displayName = 'LoopNode';
MergeNode.displayName = 'MergeNode';
SubprocessNode.displayName = 'SubprocessNode';
ApprovalNode.displayName = 'ApprovalNode';
ParallelGatewayNode.displayName = 'ParallelGatewayNode';

export const workflowNodeTypes = {
  start: StartNode,
  end: EndNode,
  playwright: PlaywrightNode,
  task: TaskNode,
  decision: DecisionNode,
  delay: DelayNode,
  notification: NotificationNode,
  apiCall: ApiCallNode,
  loop: LoopNode,
  merge: MergeNode,
  subprocess: SubprocessNode,
  approval: ApprovalNode,
  parallelGateway: ParallelGatewayNode,
};
