import { DragEvent } from 'react';
import {
  Square,
  Circle,
  Diamond,
  Hexagon,
  Cylinder,
  FileText,
  Minus,
  ArrowRight,
} from 'lucide-react';

interface ElementItem {
  type: string;
  label: string;
  icon: React.ReactNode;
  defaultData: {
    label: string;
    bgColor?: string;
    textColor?: string;
    borderColor?: string;
    width?: number;
    height?: number;
  };
}

const elements: ElementItem[] = [
  {
    type: 'rectangle',
    label: '矩形',
    icon: <Square className="w-5 h-5" />,
    defaultData: { label: '矩形', bgColor: '#ffffff', textColor: '#000000', borderColor: '#000000', width: 120, height: 60 },
  },
  {
    type: 'roundedRectangle',
    label: '圆角矩形',
    icon: <Square className="w-5 h-5" style={{ borderRadius: 8 }} />,
    defaultData: { label: '圆角矩形', bgColor: '#ffffff', textColor: '#000000', borderColor: '#000000', width: 120, height: 60 },
  },
  {
    type: 'circle',
    label: '圆形',
    icon: <Circle className="w-5 h-5" />,
    defaultData: { label: '圆形', bgColor: '#ffffff', textColor: '#000000', borderColor: '#000000', width: 80, height: 80 },
  },
  {
    type: 'diamond',
    label: '菱形',
    icon: <Diamond className="w-5 h-5" />,
    defaultData: { label: '决策', bgColor: '#ffffff', textColor: '#000000', borderColor: '#000000', width: 100, height: 100 },
  },
  {
    type: 'parallelogram',
    label: '平行四边形',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 3 L17 3 L15 17 L3 17 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    ),
    defaultData: { label: '输入/输出', bgColor: '#ffffff', textColor: '#000000', borderColor: '#000000', width: 140, height: 60 },
  },
  {
    type: 'hexagon',
    label: '六边形',
    icon: <Hexagon className="w-5 h-5" />,
    defaultData: { label: '准备', bgColor: '#ffffff', textColor: '#000000', borderColor: '#000000', width: 120, height: 60 },
  },
  {
    type: 'cylinder',
    label: '圆柱',
    icon: <Cylinder className="w-5 h-5" />,
    defaultData: { label: '数据库', bgColor: '#ffffff', textColor: '#000000', borderColor: '#000000', width: 100, height: 80 },
  },
  {
    type: 'document',
    label: '文档',
    icon: <FileText className="w-5 h-5" />,
    defaultData: { label: '文档', bgColor: '#ffffff', textColor: '#000000', borderColor: '#000000', width: 120, height: 80 },
  },
];

interface ElementPanelProps {
  onDragStart: (event: DragEvent, nodeType: string, defaultData: any) => void;
}

export const ElementPanel = ({ onDragStart }: ElementPanelProps) => {
  return (
    <div className="absolute left-4 top-20 z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-52 pointer-events-auto">
      <div className="p-3 border-b border-gray-200">
        <h3 className="font-semibold text-sm text-gray-700">图形元素</h3>
        <p className="text-xs text-gray-500 mt-1">拖拽元素到画布</p>
      </div>

      <div className="p-2 max-h-[calc(100vh-200px)] overflow-y-auto">
        <div className="space-y-1">
          {elements.map((element) => (
            <div
              key={element.type}
              draggable={true}
              onDragStart={(e) => onDragStart(e, element.type, element.defaultData)}
              className="flex items-center gap-3 p-2.5 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-grab active:cursor-grabbing transition-all group select-none"
            >
              <div className="text-gray-600 group-hover:text-blue-600 transition-colors">
                {element.icon}
              </div>
              <span className="text-sm text-gray-700 group-hover:text-blue-700 font-medium">
                {element.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">连接线样式</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 text-xs text-gray-600">
              <Minus className="w-4 h-4" />
              <span>直线</span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 text-xs text-gray-600">
              <ArrowRight className="w-4 h-4" />
              <span>箭头</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 leading-relaxed">
            拖拽图形到画布添加元素，点击元素可编辑属性。
          </p>
        </div>
      </div>
    </div>
  );
};
