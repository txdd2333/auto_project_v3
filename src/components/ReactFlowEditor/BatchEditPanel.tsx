import { X } from 'lucide-react';
import { Node, Edge } from 'reactflow';
import { CustomNodeData } from './nodes/CustomNodes';

interface BatchEditPanelProps {
  selectedNodes: Node<CustomNodeData>[];
  selectedEdges: Edge[];
  onNodesUpdate: (updates: Partial<CustomNodeData>) => void;
  onEdgesUpdate: (updates: Partial<Edge>) => void;
  onClose: () => void;
}

export const BatchEditPanel = ({
  selectedNodes,
  selectedEdges,
  onNodesUpdate,
  onEdgesUpdate,
  onClose,
}: BatchEditPanelProps) => {
  const totalSelected = selectedNodes.length + selectedEdges.length;

  if (totalSelected === 0) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">批量编辑</h3>
          <p className="text-sm text-gray-500">
            已选择 {selectedNodes.length} 个节点，{selectedEdges.length} 条连线
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {selectedNodes.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 text-sm">节点属性</h4>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                背景颜色
              </label>
              <input
                type="color"
                onChange={(e) => onNodesUpdate({ bgColor: e.target.value })}
                className="w-full h-10 rounded border border-gray-300 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                文字颜色
              </label>
              <input
                type="color"
                onChange={(e) => onNodesUpdate({ textColor: e.target.value })}
                className="w-full h-10 rounded border border-gray-300 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                边框颜色
              </label>
              <input
                type="color"
                onChange={(e) => onNodesUpdate({ borderColor: e.target.value })}
                className="w-full h-10 rounded border border-gray-300 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                边框宽度
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                onChange={(e) => onNodesUpdate({ borderWidth: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                宽度 (px)
              </label>
              <input
                type="number"
                min="80"
                max="400"
                step="10"
                placeholder="设置宽度"
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    onNodesUpdate({ width: value });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                高度 (px)
              </label>
              <input
                type="number"
                min="40"
                max="300"
                step="10"
                placeholder="设置高度"
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    onNodesUpdate({ height: value });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        )}

        {selectedEdges.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 text-sm">连线属性</h4>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                线条颜色
              </label>
              <input
                type="color"
                onChange={(e) => {
                  onEdgesUpdate({
                    style: { stroke: e.target.value }
                  });
                }}
                className="w-full h-10 rounded border border-gray-300 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                线条宽度
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                onChange={(e) => {
                  onEdgesUpdate({
                    style: { strokeWidth: parseFloat(e.target.value) }
                  });
                }}
                className="w-full"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    onEdgesUpdate({
                      animated: e.target.checked
                    });
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">启用动画效果</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                线条类型
              </label>
              <select
                onChange={(e) => {
                  onEdgesUpdate({
                    type: e.target.value as any
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="smoothstep">平滑曲线</option>
                <option value="straight">直线</option>
                <option value="default">默认</option>
                <option value="step">阶梯线</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                标签文字
              </label>
              <input
                type="text"
                placeholder="设置连线标签"
                onChange={(e) => {
                  onEdgesUpdate({
                    label: e.target.value
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors text-sm font-medium"
          >
            完成编辑
          </button>
        </div>
      </div>
    </div>
  );
};
