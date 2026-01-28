import { useState, useEffect } from 'react';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Save,
  Download,
  Trash2,
  Copy,
  Eraser,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  Grid3x3,
  Image as ImageIcon,
  Network,
  Palette,
  Sparkles,
  MousePointer2,
  Hand,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoveVertical,
  MoveHorizontal
} from 'lucide-react';

interface ToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onSave: () => void;
  onExportPNG: () => void;
  onExportSVG: () => void;
  onExportJSON: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onClear: () => void;
  onAlignHorizontal: () => void;
  onAlignVertical: () => void;
  onAutoLayout: () => void;
  onSmartLayout?: () => void;
  onToggleGrid: () => void;
  onToggleTheme?: () => void;
  onSetInteractionMode?: (mode: 'select' | 'pan') => void;
  showGrid: boolean;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  hasNodes: boolean;
  interactionMode?: 'select' | 'pan';
}

type Position = 'top' | 'bottom' | 'left' | 'right';

const STORAGE_KEY = 'toolbar-position';

export const Toolbar = ({
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFitView,
  onSave,
  onExportPNG,
  onExportSVG,
  onExportJSON,
  onDelete,
  onCopy,
  onClear,
  onAlignHorizontal,
  onAlignVertical,
  onAutoLayout,
  onSmartLayout,
  onToggleGrid,
  onToggleTheme,
  onSetInteractionMode,
  showGrid,
  canUndo,
  canRedo,
  hasSelection,
  hasNodes,
  interactionMode = 'select',
}: ToolbarProps) => {
  const [position, setPosition] = useState<Position>('top');
  const [showPositionMenu, setShowPositionMenu] = useState(false);

  // 从 localStorage 加载位置
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const pos = JSON.parse(saved) as Position;
        if (['top', 'bottom', 'left', 'right'].includes(pos)) {
          setPosition(pos);
        }
      } catch (e) {
        // 忽略错误，使用默认位置
      }
    }
  }, []);

  // 保存位置到 localStorage
  const savePosition = (pos: Position) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
    setPosition(pos);
    setShowPositionMenu(false);
  };

  const isHorizontal = position === 'top' || position === 'bottom';
  const flexDirection = isHorizontal ? 'flex-row' : 'flex-col';
  const separatorClass = isHorizontal ? 'border-r border-gray-200' : 'border-b border-gray-200';

  // 获取定位样式
  const getPositionStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute' as const,
      zIndex: 1000,
    };

    switch (position) {
      case 'top':
        return {
          ...baseStyle,
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'bottom':
        return {
          ...baseStyle,
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          ...baseStyle,
          top: '50%',
          left: '12px',
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          ...baseStyle,
          top: '50%',
          right: '12px',
          transform: 'translateY(-50%)',
        };
    }
  };

  // 提示框位置类
  const getTooltipClass = () => {
    if (position === 'top') return '-top-9 left-1/2 -translate-x-1/2';
    if (position === 'bottom') return '-bottom-9 left-1/2 -translate-x-1/2';
    if (position === 'left') return 'left-full top-1/2 -translate-y-1/2 ml-2';
    if (position === 'right') return 'right-full top-1/2 -translate-y-1/2 mr-2';
    return '-top-9 left-1/2 -translate-x-1/2';
  };
  const tooltipClass = getTooltipClass();

  return (
    <div
      className={`bg-white rounded-xl shadow-lg border border-gray-200 flex ${flexDirection} overflow-visible`}
      style={getPositionStyle()}
    >
      {/* 位置切换按钮 */}
      <div className={`relative flex items-center justify-center ${isHorizontal ? 'px-2 py-2' : 'px-2 py-2'} ${separatorClass}`}>
        <button
          onClick={() => setShowPositionMenu(!showPositionMenu)}
          className="p-2 hover:bg-blue-50 rounded-md transition-colors group relative"
          title="切换工具栏位置"
        >
          {isHorizontal ? (
            <MoveHorizontal className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
          ) : (
            <MoveVertical className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
          )}
          <span className={`absolute ${tooltipClass} px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10`}>
            切换位置
          </span>
        </button>

        {/* 位置选择菜单 */}
        {showPositionMenu && (
          <>
            <div
              className="fixed inset-0 z-[999]"
              onClick={() => setShowPositionMenu(false)}
            />
            <div className={`absolute ${position === 'top' ? 'top-full mt-2' : position === 'bottom' ? 'bottom-full mb-2' : position === 'left' ? 'left-full ml-2' : 'right-full mr-2'} bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-[1001] min-w-[160px]`}>
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">工具栏位置</div>
              <button
                onClick={() => savePosition('top')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  position === 'top' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <ChevronUp className="w-4 h-4" />
                <span className="text-sm">顶部</span>
              </button>
              <button
                onClick={() => savePosition('bottom')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  position === 'bottom' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <ChevronDown className="w-4 h-4" />
                <span className="text-sm">底部</span>
              </button>
              <button
                onClick={() => savePosition('left')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  position === 'left' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">左侧</span>
              </button>
              <button
                onClick={() => savePosition('right')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  position === 'right' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
                <span className="text-sm">右侧</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* 撤销/重做 */}
      <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} items-center gap-0.5 px-3 py-2 ${separatorClass}`}>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed group relative"
          title="撤销"
        >
          <Undo2 className="w-4 h-4 text-gray-700" />
          <span className={`absolute ${tooltipClass} px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10`}>
            撤销
          </span>
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed group relative"
          title="重做"
        >
          <Redo2 className="w-4 h-4 text-gray-700" />
          <span className={`absolute ${tooltipClass} px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10`}>
            重做
          </span>
        </button>
      </div>

      {/* 交互模式 */}
      {onSetInteractionMode && (
        <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} items-center gap-0.5 px-3 py-2 ${separatorClass}`}>
          <button
            onClick={() => onSetInteractionMode('select')}
            className={`p-2 rounded-md transition-colors group relative ${
              interactionMode === 'select'
                ? 'bg-blue-100 text-blue-600'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="选择模式"
          >
            <MousePointer2 className="w-4 h-4" />
            <span className={`absolute ${tooltipClass} px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10`}>
              选择模式
            </span>
          </button>
          <button
            onClick={() => onSetInteractionMode('pan')}
            className={`p-2 rounded-md transition-colors group relative ${
              interactionMode === 'pan'
                ? 'bg-blue-100 text-blue-600'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="平移模式"
          >
            <Hand className="w-4 h-4" />
            <span className={`absolute ${tooltipClass} px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10`}>
              平移模式
            </span>
          </button>
        </div>
      )}

      {/* 缩放控制 */}
      <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} items-center gap-0.5 px-3 py-2 ${separatorClass}`}>
        <button
          onClick={onZoomOut}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors group relative"
          title="缩小"
        >
          <ZoomOut className="w-4 h-4 text-gray-700" />
          <span className={`absolute ${tooltipClass} px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10`}>
            缩小
          </span>
        </button>
        <button
          onClick={onZoomIn}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors group relative"
          title="放大"
        >
          <ZoomIn className="w-4 h-4 text-gray-700" />
          <span className={`absolute ${tooltipClass} px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10`}>
            放大
          </span>
        </button>
        <button
          onClick={onFitView}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors group relative"
          title="适应画布"
        >
          <Maximize className="w-4 h-4 text-gray-700" />
          <span className={`absolute ${tooltipClass} px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10`}>
            适应
          </span>
        </button>
      </div>

      {/* 编辑操作 */}
      <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} items-center gap-0.5 px-3 py-2 ${separatorClass}`}>
        <button
          onClick={onCopy}
          disabled={!hasSelection}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed group relative"
          title="复制"
        >
          <Copy className="w-4 h-4 text-gray-700" />
          <span className={`absolute ${tooltipClass} px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10`}>
            复制
          </span>
        </button>
        <button
          onClick={onDelete}
          disabled={!hasSelection}
          className="p-2 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed group relative"
          title="删除"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
          <span className={`absolute ${tooltipClass} px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10`}>
            删除
          </span>
        </button>
        <button
          onClick={onClear}
          disabled={!hasNodes}
          className="p-2 hover:bg-orange-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed group relative"
          title="清空画布"
        >
          <Eraser className="w-4 h-4 text-orange-600" />
          <span className={`absolute ${tooltipClass} px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10`}>
            清空
          </span>
        </button>
      </div>

      {/* 布局工具 */}
      <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} items-center gap-0.5 px-3 py-2 ${separatorClass}`}>
        <button
          onClick={onAlignHorizontal}
          disabled={!hasSelection}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed group relative"
          title="水平对齐"
        >
          <AlignHorizontalJustifyCenter className="w-4 h-4 text-gray-700" />
          <span className={`absolute ${tooltipClass} px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10`}>
            水平对齐
          </span>
        </button>
        <button
          onClick={onAlignVertical}
          disabled={!hasSelection}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed group relative"
          title="垂直对齐"
        >
          <AlignVerticalJustifyCenter className="w-4 h-4 text-gray-700" />
          <span className={`absolute ${tooltipClass} px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10`}>
            垂直对齐
          </span>
        </button>
        <button
          onClick={onAutoLayout}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors group relative"
          title="自动排版"
        >
          <Network className="w-4 h-4 text-gray-700" />
          <span className={`absolute ${tooltipClass} px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10`}>
            自动排版
          </span>
        </button>
        {onSmartLayout && (
          <button
            onClick={onSmartLayout}
            className="p-2 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 rounded-md transition-all group relative"
            title="AI智能排版"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className={`absolute ${tooltipClass} px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10`}>
              AI智能排版
            </span>
          </button>
        )}
        <button
          onClick={onToggleGrid}
          className={`p-2 rounded-md transition-colors group relative ${
            showGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
          }`}
          title="切换网格"
        >
          <Grid3x3 className="w-4 h-4" />
          <span className={`absolute ${tooltipClass} px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10`}>
            网格
          </span>
        </button>
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors group relative text-gray-700"
            title="主题配色"
          >
            <Palette className="w-4 h-4" />
            <span className={`absolute ${tooltipClass} px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10`}>
              主题
            </span>
          </button>
        )}
      </div>

      {/* 保存按钮 */}
      <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} items-center px-3 py-2 ${separatorClass}`}>
        <button
          onClick={onSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
          title="保存"
        >
          <Save className="w-4 h-4" />
          <span>保存</span>
        </button>
      </div>

      {/* 导出菜单 */}
      <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} items-center px-3 py-2`}>
        <div className="relative group">
          <button
            className="px-3 py-2 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-2 text-sm text-gray-700 font-medium"
            title="导出"
          >
            <Download className="w-4 h-4" />
            <span>导出</span>
          </button>
          <div className={`absolute ${position === 'top' ? 'top-full mt-2' : position === 'bottom' ? 'bottom-full mb-2' : position === 'left' ? 'left-full ml-2' : 'right-full mr-2'} ${position === 'right' ? 'right-0' : position === 'left' ? 'left-0' : 'right-0'} bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[140px] hidden group-hover:block z-[1001]`}>
            <button
              onClick={onExportPNG}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
            >
              <ImageIcon className="w-4 h-4" />
              PNG 图片
            </button>
            <button
              onClick={onExportSVG}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
            >
              <ImageIcon className="w-4 h-4" />
              SVG 矢量图
            </button>
            <button
              onClick={onExportJSON}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
            >
              <Download className="w-4 h-4" />
              JSON 数据
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
