import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Trash2,
  Copy,
  Network,
  Grid3x3,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  AlignCenterHorizontal,
  AlignCenterVertical,
  Eraser,
} from 'lucide-react';

interface WorkflowToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onClear: () => void;
  onAutoLayout: () => void;
  onToggleGrid: () => void;
  onAlignLeft?: () => void;
  onAlignCenter?: () => void;
  onAlignTop?: () => void;
  onAlignMiddle?: () => void;
  onDistributeHorizontal?: () => void;
  onDistributeVertical?: () => void;
  showGrid: boolean;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  hasMultiSelection?: boolean;
  hasNodes: boolean;
}

export const WorkflowToolbar = ({
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFitView,
  onDelete,
  onCopy,
  onClear,
  onAutoLayout,
  onToggleGrid,
  onAlignLeft,
  onAlignCenter,
  onAlignTop,
  onAlignMiddle,
  onDistributeHorizontal,
  onDistributeVertical,
  showGrid,
  canUndo,
  canRedo,
  hasSelection,
  hasMultiSelection = false,
  hasNodes,
}: WorkflowToolbarProps) => {
  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2 flex flex-col gap-1">
        <div className="text-xs font-semibold text-gray-500 px-2 py-1">历史</div>
        <div className="flex flex-col gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 text-sm group"
            title="撤销 (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4 text-gray-700" />
            <span className="text-gray-700 text-xs">撤销</span>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 text-sm group"
            title="重做 (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4 text-gray-700" />
            <span className="text-gray-700 text-xs">重做</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2 flex flex-col gap-1">
        <div className="text-xs font-semibold text-gray-500 px-2 py-1">视图</div>
        <div className="flex flex-col gap-1">
          <button
            onClick={onZoomIn}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-sm"
            title="放大"
          >
            <ZoomIn className="w-4 h-4 text-gray-700" />
            <span className="text-gray-700 text-xs">放大</span>
          </button>
          <button
            onClick={onZoomOut}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-sm"
            title="缩小"
          >
            <ZoomOut className="w-4 h-4 text-gray-700" />
            <span className="text-gray-700 text-xs">缩小</span>
          </button>
          <button
            onClick={onFitView}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-sm"
            title="适应画布"
          >
            <Maximize className="w-4 h-4 text-gray-700" />
            <span className="text-gray-700 text-xs">适应</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2 flex flex-col gap-1">
        <div className="text-xs font-semibold text-gray-500 px-2 py-1">编辑</div>
        <div className="flex flex-col gap-1">
          <button
            onClick={onCopy}
            disabled={!hasSelection}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            title="复制"
          >
            <Copy className="w-4 h-4 text-gray-700" />
            <span className="text-gray-700 text-xs">复制</span>
          </button>
          <button
            onClick={onDelete}
            disabled={!hasSelection}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            title="删除"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span className="text-red-600 text-xs">删除</span>
          </button>
          <button
            onClick={onClear}
            disabled={!hasNodes}
            className="p-2 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            title="清空画布"
          >
            <Eraser className="w-4 h-4 text-orange-600" />
            <span className="text-orange-600 text-xs">清空</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2 flex flex-col gap-1">
        <div className="text-xs font-semibold text-gray-500 px-2 py-1">布局</div>
        <div className="flex flex-col gap-1">
          <button
            onClick={onAutoLayout}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-sm"
            title="自动排版"
          >
            <Network className="w-4 h-4 text-gray-700" />
            <span className="text-gray-700 text-xs">自动排版</span>
          </button>
          <button
            onClick={onToggleGrid}
            className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
              showGrid ? 'bg-blue-50' : 'hover:bg-gray-100'
            }`}
            title="切换网格"
          >
            <Grid3x3 className={`w-4 h-4 ${showGrid ? 'text-blue-600' : 'text-gray-700'}`} />
            <span className={`text-xs ${showGrid ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>网格</span>
          </button>
        </div>
      </div>

      {hasMultiSelection && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2 flex flex-col gap-1">
          <div className="text-xs font-semibold text-gray-500 px-2 py-1">对齐</div>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={onAlignLeft}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="左对齐"
            >
              <AlignCenterHorizontal className="w-4 h-4 text-gray-700 rotate-90" />
            </button>
            <button
              onClick={onAlignCenter}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="水平居中"
            >
              <AlignCenterHorizontal className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={onAlignTop}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="上对齐"
            >
              <AlignCenterVertical className="w-4 h-4 text-gray-700 rotate-90" />
            </button>
            <button
              onClick={onAlignMiddle}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="垂直居中"
            >
              <AlignCenterVertical className="w-4 h-4 text-gray-700" />
            </button>
          </div>
          <div className="text-xs font-semibold text-gray-500 px-2 py-1 mt-1">分布</div>
          <div className="flex flex-col gap-1">
            <button
              onClick={onDistributeHorizontal}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-sm"
              title="水平均匀分布"
            >
              <AlignHorizontalDistributeCenter className="w-4 h-4 text-gray-700" />
              <span className="text-gray-700 text-xs">水平</span>
            </button>
            <button
              onClick={onDistributeVertical}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-sm"
              title="垂直均匀分布"
            >
              <AlignVerticalDistributeCenter className="w-4 h-4 text-gray-700" />
              <span className="text-gray-700 text-xs">垂直</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
