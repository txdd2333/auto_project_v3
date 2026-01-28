import { Node, Edge } from 'reactflow';
import { X } from 'lucide-react';
import { CustomNodeData } from './nodes/CustomNodes';

interface PropertiesPanelProps {
  selectedNode: Node<CustomNodeData> | null;
  selectedEdge: Edge | null;
  onNodeUpdate: (nodeId: string, data: Partial<CustomNodeData>) => void;
  onEdgeUpdate: (edgeId: string, data: any) => void;
  onClose: () => void;
}

export const PropertiesPanel = ({
  selectedNode,
  selectedEdge,
  onNodeUpdate,
  onEdgeUpdate,
  onClose,
}: PropertiesPanelProps) => {
  if (!selectedNode && !selectedEdge) return null;

  const handleNodeChange = (field: keyof CustomNodeData, value: any) => {
    if (selectedNode) {
      onNodeUpdate(selectedNode.id, { [field]: value });
    }
  };

  const handleEdgeChange = (field: string, value: any) => {
    if (selectedEdge) {
      onEdgeUpdate(selectedEdge.id, { [field]: value });
    }
  };

  return (
    <div className="absolute right-4 top-20 z-10 bg-white rounded-lg shadow-lg border border-gray-200 w-72">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-700">
          {selectedNode ? '节点属性' : '连接线属性'}
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto space-y-4">
        {selectedNode && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                文本内容
              </label>
              <input
                type="text"
                value={selectedNode.data.label || ''}
                onChange={(e) => handleNodeChange('label', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                背景颜色
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={selectedNode.data.bgColor || '#ffffff'}
                  onChange={(e) => handleNodeChange('bgColor', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedNode.data.bgColor || '#ffffff'}
                  onChange={(e) => handleNodeChange('bgColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                文字颜色
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={selectedNode.data.textColor || '#000000'}
                  onChange={(e) => handleNodeChange('textColor', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedNode.data.textColor || '#000000'}
                  onChange={(e) => handleNodeChange('textColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                边框颜色
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={selectedNode.data.borderColor || '#000000'}
                  onChange={(e) => handleNodeChange('borderColor', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedNode.data.borderColor || '#000000'}
                  onChange={(e) => handleNodeChange('borderColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                边框宽度
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={selectedNode.data.borderWidth || 2}
                onChange={(e) => handleNodeChange('borderWidth', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                字体大小
              </label>
              <input
                type="number"
                min="8"
                max="48"
                value={selectedNode.data.fontSize || 14}
                onChange={(e) => handleNodeChange('fontSize', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                字体粗细
              </label>
              <select
                value={selectedNode.data.fontWeight || 'normal'}
                onChange={(e) => handleNodeChange('fontWeight', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="normal">普通</option>
                <option value="bold">粗体</option>
                <option value="600">半粗体</option>
                <option value="300">细体</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  宽度
                </label>
                <input
                  type="number"
                  min="50"
                  max="500"
                  value={selectedNode.data.width || 120}
                  onChange={(e) => handleNodeChange('width', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  高度
                </label>
                <input
                  type="number"
                  min="50"
                  max="500"
                  value={selectedNode.data.height || 60}
                  onChange={(e) => handleNodeChange('height', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </>
        )}

        {selectedEdge && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                连接线标签
              </label>
              <input
                type="text"
                value={selectedEdge.label as string || ''}
                onChange={(e) => handleEdgeChange('label', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                连接线类型
              </label>
              <select
                value={selectedEdge.type || 'default'}
                onChange={(e) => handleEdgeChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="default">直线</option>
                <option value="straight">直线（无曲线）</option>
                <option value="step">阶梯线</option>
                <option value="smoothstep">平滑阶梯</option>
                <option value="simplebezier">简单贝塞尔</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                线条颜色
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={(selectedEdge.style as any)?.stroke || '#b1b1b7'}
                  onChange={(e) => handleEdgeChange('stroke', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={(selectedEdge.style as any)?.stroke || '#b1b1b7'}
                  onChange={(e) => handleEdgeChange('stroke', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                线条宽度
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={(selectedEdge.style as any)?.strokeWidth || 2}
                onChange={(e) => handleEdgeChange('strokeWidth', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                是否动画
              </label>
              <select
                value={selectedEdge.animated ? 'true' : 'false'}
                onChange={(e) => handleEdgeChange('animated', e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="false">否</option>
                <option value="true">是</option>
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
