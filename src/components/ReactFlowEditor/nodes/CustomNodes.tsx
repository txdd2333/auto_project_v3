import { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';

export interface CustomNodeData {
  label: string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  fontSize?: number;
  fontWeight?: string;
  width?: number;
  height?: number;
}

const handleStyle = { width: 8, height: 8 };

export const RectangleNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={60}
        minHeight={40}
        lineStyle={{ borderColor: '#3b82f6', borderWidth: 2 }}
        handleStyle={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#3b82f6' }}
      />
      <div
        className="relative"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: data.bgColor || '#ffffff',
          border: `${data.borderWidth || 2}px solid ${selected ? '#3b82f6' : data.borderColor || '#000000'}`,
          borderRadius: 4,
          padding: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: data.textColor || '#000000',
          fontSize: data.fontSize || 14,
          fontWeight: data.fontWeight || 'normal',
          boxShadow: selected ? '0 0 0 2px #3b82f6' : 'none',
        }}
      >
        <Handle type="target" position={Position.Top} style={handleStyle} id="top-target" />
        <Handle type="source" position={Position.Top} style={handleStyle} id="top-source" />
        <Handle type="target" position={Position.Right} style={handleStyle} id="right-target" />
        <Handle type="source" position={Position.Right} style={handleStyle} id="right-source" />
        <Handle type="target" position={Position.Bottom} style={handleStyle} id="bottom-target" />
        <Handle type="source" position={Position.Bottom} style={handleStyle} id="bottom-source" />
        <Handle type="target" position={Position.Left} style={handleStyle} id="left-target" />
        <Handle type="source" position={Position.Left} style={handleStyle} id="left-source" />
        <div className="text-center break-words w-full">{data.label}</div>
      </div>
    </>
  );
});

RectangleNode.displayName = 'RectangleNode';

export const RoundedRectangleNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={60}
        minHeight={40}
        lineStyle={{ borderColor: '#3b82f6', borderWidth: 2 }}
        handleStyle={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#3b82f6' }}
      />
      <div
        className="relative"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: data.bgColor || '#ffffff',
          border: `${data.borderWidth || 2}px solid ${selected ? '#3b82f6' : data.borderColor || '#000000'}`,
          borderRadius: 20,
          padding: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: data.textColor || '#000000',
          fontSize: data.fontSize || 14,
          fontWeight: data.fontWeight || 'normal',
          boxShadow: selected ? '0 0 0 2px #3b82f6' : 'none',
        }}
      >
        <Handle type="target" position={Position.Top} style={handleStyle} id="top-target" />
        <Handle type="source" position={Position.Top} style={handleStyle} id="top-source" />
        <Handle type="target" position={Position.Right} style={handleStyle} id="right-target" />
        <Handle type="source" position={Position.Right} style={handleStyle} id="right-source" />
        <Handle type="target" position={Position.Bottom} style={handleStyle} id="bottom-target" />
        <Handle type="source" position={Position.Bottom} style={handleStyle} id="bottom-source" />
        <Handle type="target" position={Position.Left} style={handleStyle} id="left-target" />
        <Handle type="source" position={Position.Left} style={handleStyle} id="left-source" />
        <div className="text-center break-words w-full">{data.label}</div>
      </div>
    </>
  );
});

RoundedRectangleNode.displayName = 'RoundedRectangleNode';

export const CircleNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={50}
        minHeight={50}
        lineStyle={{ borderColor: '#3b82f6', borderWidth: 2 }}
        handleStyle={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#3b82f6' }}
        keepAspectRatio
      />
      <div
        className="relative"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: data.bgColor || '#ffffff',
          border: `${data.borderWidth || 2}px solid ${selected ? '#3b82f6' : data.borderColor || '#000000'}`,
          borderRadius: '50%',
          padding: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: data.textColor || '#000000',
          fontSize: data.fontSize || 14,
          fontWeight: data.fontWeight || 'normal',
          boxShadow: selected ? '0 0 0 2px #3b82f6' : 'none',
        }}
      >
        <Handle type="target" position={Position.Top} style={handleStyle} id="top-target" />
        <Handle type="source" position={Position.Top} style={handleStyle} id="top-source" />
        <Handle type="target" position={Position.Right} style={handleStyle} id="right-target" />
        <Handle type="source" position={Position.Right} style={handleStyle} id="right-source" />
        <Handle type="target" position={Position.Bottom} style={handleStyle} id="bottom-target" />
        <Handle type="source" position={Position.Bottom} style={handleStyle} id="bottom-source" />
        <Handle type="target" position={Position.Left} style={handleStyle} id="left-target" />
        <Handle type="source" position={Position.Left} style={handleStyle} id="left-source" />
        <div className="text-center break-words w-full">{data.label}</div>
      </div>
    </>
  );
});

CircleNode.displayName = 'CircleNode';

export const DiamondNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={60}
        minHeight={60}
        lineStyle={{ borderColor: '#3b82f6', borderWidth: 2 }}
        handleStyle={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#3b82f6' }}
        keepAspectRatio
      />
      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }} viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon
          points="50,0 100,50 50,100 0,50"
          fill={data.bgColor || '#ffffff'}
          stroke={selected ? '#3b82f6' : data.borderColor || '#000000'}
          strokeWidth={data.borderWidth || 2}
          style={{ filter: selected ? 'drop-shadow(0 0 4px #3b82f6)' : 'none' }}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <Handle type="target" position={Position.Top} style={handleStyle} id="top-target" />
      <Handle type="source" position={Position.Top} style={handleStyle} id="top-source" />
      <Handle type="target" position={Position.Right} style={handleStyle} id="right-target" />
      <Handle type="source" position={Position.Right} style={handleStyle} id="right-source" />
      <Handle type="target" position={Position.Bottom} style={handleStyle} id="bottom-target" />
      <Handle type="source" position={Position.Bottom} style={handleStyle} id="bottom-source" />
      <Handle type="target" position={Position.Left} style={handleStyle} id="left-target" />
      <Handle type="source" position={Position.Left} style={handleStyle} id="left-source" />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: data.textColor || '#000000',
          fontSize: data.fontSize || 14,
          fontWeight: data.fontWeight || 'normal',
          textAlign: 'center',
          maxWidth: '70%',
          wordBreak: 'break-word',
        }}
      >
        {data.label}
      </div>
    </>
  );
});

DiamondNode.displayName = 'DiamondNode';

export const ParallelogramNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={80}
        minHeight={40}
        lineStyle={{ borderColor: '#3b82f6', borderWidth: 2 }}
        handleStyle={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#3b82f6' }}
      />
      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }} viewBox="0 0 140 60" preserveAspectRatio="none">
        <polygon
          points="20,0 140,0 120,60 0,60"
          fill={data.bgColor || '#ffffff'}
          stroke={selected ? '#3b82f6' : data.borderColor || '#000000'}
          strokeWidth={data.borderWidth || 2}
          style={{ filter: selected ? 'drop-shadow(0 0 4px #3b82f6)' : 'none' }}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <Handle type="target" position={Position.Top} style={handleStyle} id="top-target" />
      <Handle type="source" position={Position.Top} style={handleStyle} id="top-source" />
      <Handle type="target" position={Position.Right} style={handleStyle} id="right-target" />
      <Handle type="source" position={Position.Right} style={handleStyle} id="right-source" />
      <Handle type="target" position={Position.Bottom} style={handleStyle} id="bottom-target" />
      <Handle type="source" position={Position.Bottom} style={handleStyle} id="bottom-source" />
      <Handle type="target" position={Position.Left} style={handleStyle} id="left-target" />
      <Handle type="source" position={Position.Left} style={handleStyle} id="left-source" />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: data.textColor || '#000000',
          fontSize: data.fontSize || 14,
          fontWeight: data.fontWeight || 'normal',
          textAlign: 'center',
          maxWidth: '80%',
          wordBreak: 'break-word',
        }}
      >
        {data.label}
      </div>
    </>
  );
});

ParallelogramNode.displayName = 'ParallelogramNode';

export const HexagonNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={80}
        minHeight={40}
        lineStyle={{ borderColor: '#3b82f6', borderWidth: 2 }}
        handleStyle={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#3b82f6' }}
      />
      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }} viewBox="0 0 120 60" preserveAspectRatio="none">
        <polygon
          points="20,0 100,0 120,30 100,60 20,60 0,30"
          fill={data.bgColor || '#ffffff'}
          stroke={selected ? '#3b82f6' : data.borderColor || '#000000'}
          strokeWidth={data.borderWidth || 2}
          style={{ filter: selected ? 'drop-shadow(0 0 4px #3b82f6)' : 'none' }}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <Handle type="target" position={Position.Top} style={handleStyle} id="top-target" />
      <Handle type="source" position={Position.Top} style={handleStyle} id="top-source" />
      <Handle type="target" position={Position.Right} style={handleStyle} id="right-target" />
      <Handle type="source" position={Position.Right} style={handleStyle} id="right-source" />
      <Handle type="target" position={Position.Bottom} style={handleStyle} id="bottom-target" />
      <Handle type="source" position={Position.Bottom} style={handleStyle} id="bottom-source" />
      <Handle type="target" position={Position.Left} style={handleStyle} id="left-target" />
      <Handle type="source" position={Position.Left} style={handleStyle} id="left-source" />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: data.textColor || '#000000',
          fontSize: data.fontSize || 14,
          fontWeight: data.fontWeight || 'normal',
          textAlign: 'center',
          maxWidth: '70%',
          wordBreak: 'break-word',
        }}
      >
        {data.label}
      </div>
    </>
  );
});

HexagonNode.displayName = 'HexagonNode';

export const CylinderNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={60}
        minHeight={60}
        lineStyle={{ borderColor: '#3b82f6', borderWidth: 2 }}
        handleStyle={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#3b82f6' }}
      />
      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }} viewBox="0 0 100 80" preserveAspectRatio="none">
        <ellipse
          cx="50"
          cy="15"
          rx="50"
          ry="15"
          fill={data.bgColor || '#ffffff'}
          stroke={selected ? '#3b82f6' : data.borderColor || '#000000'}
          strokeWidth={data.borderWidth || 2}
          style={{ filter: selected ? 'drop-shadow(0 0 4px #3b82f6)' : 'none' }}
          vectorEffect="non-scaling-stroke"
        />
        <rect
          x="0"
          y="15"
          width="100"
          height="50"
          fill={data.bgColor || '#ffffff'}
          stroke={selected ? '#3b82f6' : data.borderColor || '#000000'}
          strokeWidth={data.borderWidth || 2}
          style={{ filter: selected ? 'drop-shadow(0 0 4px #3b82f6)' : 'none' }}
          vectorEffect="non-scaling-stroke"
        />
        <ellipse
          cx="50"
          cy="65"
          rx="50"
          ry="15"
          fill={data.bgColor || '#ffffff'}
          stroke={selected ? '#3b82f6' : data.borderColor || '#000000'}
          strokeWidth={data.borderWidth || 2}
          style={{ filter: selected ? 'drop-shadow(0 0 4px #3b82f6)' : 'none' }}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <Handle type="target" position={Position.Top} style={handleStyle} id="top-target" />
      <Handle type="source" position={Position.Top} style={handleStyle} id="top-source" />
      <Handle type="target" position={Position.Right} style={handleStyle} id="right-target" />
      <Handle type="source" position={Position.Right} style={handleStyle} id="right-source" />
      <Handle type="target" position={Position.Bottom} style={handleStyle} id="bottom-target" />
      <Handle type="source" position={Position.Bottom} style={handleStyle} id="bottom-source" />
      <Handle type="target" position={Position.Left} style={handleStyle} id="left-target" />
      <Handle type="source" position={Position.Left} style={handleStyle} id="left-source" />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: data.textColor || '#000000',
          fontSize: data.fontSize || 14,
          fontWeight: data.fontWeight || 'normal',
          textAlign: 'center',
          maxWidth: '80%',
          wordBreak: 'break-word',
        }}
      >
        {data.label}
      </div>
    </>
  );
});

CylinderNode.displayName = 'CylinderNode';

export const DocumentNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={80}
        minHeight={60}
        lineStyle={{ borderColor: '#3b82f6', borderWidth: 2 }}
        handleStyle={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#3b82f6' }}
      />
      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }} viewBox="0 0 120 80" preserveAspectRatio="none">
        <path
          d="M 0 0 L 120 0 L 120 70 Q 90 80 60 70 Q 30 60 0 70 Z"
          fill={data.bgColor || '#ffffff'}
          stroke={selected ? '#3b82f6' : data.borderColor || '#000000'}
          strokeWidth={data.borderWidth || 2}
          style={{ filter: selected ? 'drop-shadow(0 0 4px #3b82f6)' : 'none' }}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <Handle type="target" position={Position.Top} style={handleStyle} id="top-target" />
      <Handle type="source" position={Position.Top} style={handleStyle} id="top-source" />
      <Handle type="target" position={Position.Right} style={handleStyle} id="right-target" />
      <Handle type="source" position={Position.Right} style={handleStyle} id="right-source" />
      <Handle type="target" position={Position.Bottom} style={handleStyle} id="bottom-target" />
      <Handle type="source" position={Position.Bottom} style={handleStyle} id="bottom-source" />
      <Handle type="target" position={Position.Left} style={handleStyle} id="left-target" />
      <Handle type="source" position={Position.Left} style={handleStyle} id="left-source" />
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: data.textColor || '#000000',
          fontSize: data.fontSize || 14,
          fontWeight: data.fontWeight || 'normal',
          textAlign: 'center',
          maxWidth: '80%',
          wordBreak: 'break-word',
        }}
      >
        {data.label}
      </div>
    </>
  );
});

DocumentNode.displayName = 'DocumentNode';

export const nodeTypes = {
  rectangle: RectangleNode,
  roundedRectangle: RoundedRectangleNode,
  circle: CircleNode,
  diamond: DiamondNode,
  parallelogram: ParallelogramNode,
  hexagon: HexagonNode,
  cylinder: CylinderNode,
  document: DocumentNode,
};
