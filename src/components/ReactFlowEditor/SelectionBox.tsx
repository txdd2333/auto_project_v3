import { useEffect, useState } from 'react';
import { useStore, Node } from 'reactflow';
import { CustomNodeData } from './nodes/CustomNodes';

interface SelectionBoxProps {
  nodes: Node<CustomNodeData>[];
}

export const SelectionBox = ({ nodes }: SelectionBoxProps) => {
  const [bounds, setBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const transform = useStore((state) => state.transform);

  useEffect(() => {
    const selectedNodes = nodes.filter((node) => node.selected);

    if (selectedNodes.length < 2) {
      setBounds(null);
      return;
    }

    // 计算选中节点的真实边界（紧密包围）
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedNodes.forEach((node) => {
      // 获取节点的实际宽高
      let nodeWidth = 180; // 默认宽度
      let nodeHeight = 60;  // 默认高度

      // 尝试从 DOM 获取实际尺寸
      if (typeof document !== 'undefined') {
        const element = document.querySelector(`[data-id="${node.id}"]`);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            nodeWidth = node.width || rect.width;
            nodeHeight = node.height || rect.height;
          }
        }
      }

      // 如果 DOM 获取失败，使用节点数据中的尺寸
      if (!nodeWidth || nodeWidth === 180) {
        nodeWidth = node.width || node.data?.width || 180;
        nodeHeight = node.height || node.data?.height || 60;
      }

      const x = node.position.x;
      const y = node.position.y;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + nodeWidth);
      maxY = Math.max(maxY, y + nodeHeight);
    });

    // 添加一点边距（10px）
    const padding = 10;
    setBounds({
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    });
  }, [nodes]);

  if (!bounds) {
    return null;
  }

  const [zoom, x, y] = transform;

  // 将画布坐标转换为屏幕坐标
  const screenX = bounds.x * zoom + x;
  const screenY = bounds.y * zoom + y;
  const screenWidth = bounds.width * zoom;
  const screenHeight = bounds.height * zoom;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${screenX}px`,
        top: `${screenY}px`,
        width: `${screenWidth}px`,
        height: `${screenHeight}px`,
        border: '2px dashed rgba(59, 130, 246, 0.6)',
        background: 'rgba(59, 130, 246, 0.08)',
        borderRadius: '8px',
        pointerEvents: 'none',
        zIndex: 5,
        transition: 'all 0.15s ease-out',
      }}
    >
      {/* 四个角的控制点 */}
      <div
        style={{
          position: 'absolute',
          top: '-4px',
          left: '-4px',
          width: '8px',
          height: '8px',
          background: '#3b82f6',
          border: '2px solid white',
          borderRadius: '50%',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          width: '8px',
          height: '8px',
          background: '#3b82f6',
          border: '2px solid white',
          borderRadius: '50%',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-4px',
          left: '-4px',
          width: '8px',
          height: '8px',
          background: '#3b82f6',
          border: '2px solid white',
          borderRadius: '50%',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-4px',
          right: '-4px',
          width: '8px',
          height: '8px',
          background: '#3b82f6',
          border: '2px solid white',
          borderRadius: '50%',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      />
    </div>
  );
};
