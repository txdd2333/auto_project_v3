import {
  useCallback,
  useRef,
  useState,
  DragEvent,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  ReactFlowInstance,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  ConnectionMode,
  ConnectionLineType,
  reconnectEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { workflowNodeTypes, WorkflowNodeData } from './nodes/WorkflowNodes';
import { WorkflowToolbar } from './WorkflowToolbar';
import { WorkflowElementPanel } from './WorkflowElementPanel';
import { WorkflowPropertiesPanel } from './WorkflowPropertiesPanel';

export interface WorkflowFlowEditorRef {
  getData: () => { nodes: any[]; edges: any[] };
  loadData: (data: { nodes: any[]; edges: any[] }) => void;
}

interface WorkflowFlowEditorProps {
  initialData?: { nodes: any[]; edges: any[] };
  onDataChange?: (data: { nodes: any[]; edges: any[] }) => void;
}

const WorkflowFlowEditorInner = forwardRef<WorkflowFlowEditorRef, WorkflowFlowEditorProps>(
  ({ initialData, onDataChange }, ref) => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes] = useNodesState([]);
    const [edges, setEdges] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const [selectedNode, setSelectedNode] = useState<Node<WorkflowNodeData> | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
    const [showGrid, setShowGrid] = useState(true);
    const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const isUndoRedoRef = useRef(false);

    const nodeIdCounter = useRef(1);

    const saveToHistory = useCallback(() => {
      if (isUndoRedoRef.current) return;

      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ nodes: [...nodes], edges: [...edges] });

      if (newHistory.length > 50) {
        newHistory.shift();
        setHistory(newHistory);
      } else {
        setHistory(newHistory);
        setHistoryIndex(historyIndex + 1);
      }
    }, [nodes, edges, history, historyIndex]);

    useEffect(() => {
      if (initialData) {
        try {
          if (initialData.nodes) setNodes(initialData.nodes);
          if (initialData.edges) setEdges(initialData.edges);

          const maxId = initialData.nodes?.reduce((max: number, node: any) => {
            const match = node.id.match(/node_(\d+)/);
            if (match) {
              return Math.max(max, parseInt(match[1]));
            }
            return max;
          }, 0);
          if (maxId) {
            nodeIdCounter.current = maxId + 1;
          }

          setHistory([{ nodes: initialData.nodes || [], edges: initialData.edges || [] }]);
          setHistoryIndex(0);
        } catch (e) {
          console.error('Failed to load initial data:', e);
        }
      } else {
        setHistory([{ nodes: [], edges: [] }]);
        setHistoryIndex(0);
      }
    }, []);

    useEffect(() => {
      if (nodes.length > 0 || edges.length > 0) {
        onDataChange?.({ nodes, edges });
      }
    }, [nodes, edges, onDataChange]);

    const onNodesChange = useCallback(
      (changes: NodeChange[]) => {
        setNodes((nds) => applyNodeChanges(changes, nds));
      },
      [setNodes]
    );

    const onEdgesChange = useCallback(
      (changes: EdgeChange[]) => {
        setEdges((eds) => applyEdgeChanges(changes, eds));
      },
      [setEdges]
    );

    const onConnect = useCallback(
      (params: Connection) => {
        saveToHistory();
        setEdges((eds) =>
          addEdge(
            {
              ...params,
              type: 'smoothstep',
              animated: true,
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { stroke: '#6b7280', strokeWidth: 2 },
            },
            eds
          )
        );
      },
      [setEdges, saveToHistory]
    );

    const edgeReconnectSuccessful = useRef(true);

    const onReconnectStart = useCallback(() => {
      edgeReconnectSuccessful.current = false;
    }, []);

    const onReconnect = useCallback(
      (oldEdge: Edge, newConnection: Connection) => {
        edgeReconnectSuccessful.current = true;
        saveToHistory();
        setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
      },
      [saveToHistory]
    );

    const onReconnectEnd = useCallback(
      (_: any, edge: Edge) => {
        if (!edgeReconnectSuccessful.current) {
          setEdges((eds) => eds.filter((e) => e.id !== edge.id));
        }
        edgeReconnectSuccessful.current = true;
      },
      []
    );

    const onDragOver = useCallback((event: DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
      (event: DragEvent) => {
        event.preventDefault();

        const type = event.dataTransfer.getData('application/reactflow-type');
        const defaultDataStr = event.dataTransfer.getData('application/reactflow-data');

        if (!type || !reactFlowInstance) {
          return;
        }

        const defaultData = defaultDataStr ? JSON.parse(defaultDataStr) : {};
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const nodeSizes: Record<string, { width: number; height: number }> = {
          start: { width: 100, height: 100 },
          end: { width: 100, height: 100 },
          playwright: { width: 200, height: 80 },
          task: { width: 180, height: 80 },
          decision: { width: 160, height: 160 },
          delay: { width: 160, height: 80 },
          notification: { width: 180, height: 80 },
          apiCall: { width: 180, height: 80 },
          loop: { width: 160, height: 80 },
          merge: { width: 140, height: 80 },
          subprocess: { width: 180, height: 80 },
          approval: { width: 160, height: 80 },
          parallelGateway: { width: 120, height: 120 },
        };

        const size = nodeSizes[type] || { width: 180, height: 80 };

        const newNode: Node<WorkflowNodeData> = {
          id: `node_${nodeIdCounter.current++}`,
          type,
          position,
          data: defaultData,
          style: { width: size.width, height: size.height },
        };

        saveToHistory();
        setNodes((nds) => nds.concat(newNode));
      },
      [reactFlowInstance, setNodes, saveToHistory]
    );

    const onDragStart = (event: DragEvent, nodeType: string, defaultData: any) => {
      event.dataTransfer.setData('application/reactflow-type', nodeType);
      event.dataTransfer.setData('application/reactflow-data', JSON.stringify(defaultData));
      event.dataTransfer.effectAllowed = 'move';
    };

    const handleUndo = () => {
      if (historyIndex > 0) {
        isUndoRedoRef.current = true;
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        const state = history[newIndex];
        setNodes(state.nodes);
        setEdges(state.edges);
        setTimeout(() => {
          isUndoRedoRef.current = false;
        }, 0);
      }
    };

    const handleRedo = () => {
      if (historyIndex < history.length - 1) {
        isUndoRedoRef.current = true;
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        const state = history[newIndex];
        setNodes(state.nodes);
        setEdges(state.edges);
        setTimeout(() => {
          isUndoRedoRef.current = false;
        }, 0);
      }
    };

    const handleZoomIn = () => {
      reactFlowInstance?.zoomIn();
    };

    const handleZoomOut = () => {
      reactFlowInstance?.zoomOut();
    };

    const handleFitView = () => {
      reactFlowInstance?.fitView();
    };

    const handleDelete = () => {
      saveToHistory();
      if (selectedNode) {
        setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
        setSelectedNode(null);
      }
      if (selectedEdge) {
        setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
        setSelectedEdge(null);
      }
    };

    const handleCopy = () => {
      if (selectedNode) {
        const newNode: Node<WorkflowNodeData> = {
          ...selectedNode,
          id: `node_${nodeIdCounter.current++}`,
          position: {
            x: selectedNode.position.x + 50,
            y: selectedNode.position.y + 50,
          },
        };
        saveToHistory();
        setNodes((nds) => [...nds, newNode]);
      }
    };

    const handleAutoLayout = () => {
      if (nodes.length === 0) return;

      const edgesBySource = new Map<string, Edge[]>();
      const edgesByTarget = new Map<string, Set<string>>();

      edges.forEach(edge => {
        if (!edgesBySource.has(edge.source)) {
          edgesBySource.set(edge.source, []);
        }
        edgesBySource.get(edge.source)!.push(edge);

        if (!edgesByTarget.has(edge.target)) {
          edgesByTarget.set(edge.target, new Set());
        }
        edgesByTarget.get(edge.target)!.add(edge.source);
      });

      const levels = new Map<string, number>();
      const visited = new Set<string>();

      const calculateLevel = (nodeId: string, level: number = 0): void => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);

        const currentLevel = levels.get(nodeId) ?? 0;
        levels.set(nodeId, Math.max(currentLevel, level));

        const outgoingEdges = edgesBySource.get(nodeId) || [];
        outgoingEdges.forEach(edge => {
          calculateLevel(edge.target, level + 1);
        });
      };

      const rootNodes = nodes.filter(node =>
        !edgesByTarget.has(node.id) || edgesByTarget.get(node.id)!.size === 0
      );

      if (rootNodes.length === 0 && nodes.length > 0) {
        rootNodes.push(nodes[0]);
      }

      rootNodes.forEach(node => calculateLevel(node.id, 0));

      nodes.forEach(node => {
        if (!levels.has(node.id)) {
          levels.set(node.id, 0);
        }
      });

      const nodesByLevel = new Map<number, Node[]>();
      nodes.forEach(node => {
        const level = levels.get(node.id)!;
        if (!nodesByLevel.has(level)) {
          nodesByLevel.set(level, []);
        }
        nodesByLevel.get(level)!.push(node);
      });

      const LEVEL_HEIGHT = 180;
      const NODE_SPACING = 120;
      const START_Y = 100;

      saveToHistory();
      setNodes((nds) => {
        const newNodes = nds.map((node) => {
          const level = levels.get(node.id)!;
          const nodesInLevel = nodesByLevel.get(level)!;
          const indexInLevel = nodesInLevel.findIndex(n => n.id === node.id);

          const nodeWidth = (node.style?.width as number) || node.width || 180;

          const totalWidth = nodesInLevel.reduce((sum, n) => {
            return sum + ((n.style?.width as number) || n.width || 180);
          }, 0) + (nodesInLevel.length - 1) * NODE_SPACING;

          let xOffset = -totalWidth / 2;
          for (let i = 0; i < indexInLevel; i++) {
            const prevNode = nodesInLevel[i];
            const prevWidth = (prevNode.style?.width as number) || prevNode.width || 180;
            xOffset += prevWidth + NODE_SPACING;
          }
          xOffset += nodeWidth / 2;

          return {
            ...node,
            position: {
              x: xOffset + 500,
              y: START_Y + level * LEVEL_HEIGHT,
            },
          };
        });
        return newNodes;
      });

      setTimeout(() => {
        reactFlowInstance?.fitView({ padding: 0.2 });
      }, 100);
    };

    const handleToggleGrid = () => {
      setShowGrid(!showGrid);
    };

    const handleClear = () => {
      if (nodes.length === 0 && edges.length === 0) return;

      const confirmed = window.confirm(
        '确定要清空整个画布吗？\n\n此操作将删除所有节点和连线，且无法撤销。'
      );

      if (confirmed) {
        saveToHistory();
        setNodes([]);
        setEdges([]);
        setSelectedNode(null);
        setSelectedEdge(null);
        nodeIdCounter.current = 1;
      }
    };

    const getSelectedNodes = useCallback(() => {
      return nodes.filter(node => node.selected);
    }, [nodes]);

    const handleAlignLeft = useCallback(() => {
      const selectedNodes = getSelectedNodes();
      if (selectedNodes.length < 2) return;

      const minX = Math.min(...selectedNodes.map(n => n.position.x));
      saveToHistory();
      setNodes((nds) =>
        nds.map((node) => {
          if (node.selected) {
            return { ...node, position: { ...node.position, x: minX } };
          }
          return node;
        })
      );
    }, [getSelectedNodes, saveToHistory, setNodes]);

    const handleAlignCenter = useCallback(() => {
      const selectedNodes = getSelectedNodes();
      if (selectedNodes.length < 2) return;

      const positions = selectedNodes.map(n => ({
        x: n.position.x,
        width: (n.style?.width as number) || n.width || 180
      }));
      const minX = Math.min(...positions.map(p => p.x));
      const maxX = Math.max(...positions.map(p => p.x + p.width));
      const centerX = (minX + maxX) / 2;

      saveToHistory();
      setNodes((nds) =>
        nds.map((node) => {
          if (node.selected) {
            const nodeWidth = (node.style?.width as number) || node.width || 180;
            return { ...node, position: { ...node.position, x: centerX - nodeWidth / 2 } };
          }
          return node;
        })
      );
    }, [getSelectedNodes, saveToHistory, setNodes]);

    const handleAlignTop = useCallback(() => {
      const selectedNodes = getSelectedNodes();
      if (selectedNodes.length < 2) return;

      const minY = Math.min(...selectedNodes.map(n => n.position.y));
      saveToHistory();
      setNodes((nds) =>
        nds.map((node) => {
          if (node.selected) {
            return { ...node, position: { ...node.position, y: minY } };
          }
          return node;
        })
      );
    }, [getSelectedNodes, saveToHistory, setNodes]);

    const handleAlignMiddle = useCallback(() => {
      const selectedNodes = getSelectedNodes();
      if (selectedNodes.length < 2) return;

      const positions = selectedNodes.map(n => ({
        y: n.position.y,
        height: (n.style?.height as number) || n.height || 80
      }));
      const minY = Math.min(...positions.map(p => p.y));
      const maxY = Math.max(...positions.map(p => p.y + p.height));
      const centerY = (minY + maxY) / 2;

      saveToHistory();
      setNodes((nds) =>
        nds.map((node) => {
          if (node.selected) {
            const nodeHeight = (node.style?.height as number) || node.height || 80;
            return { ...node, position: { ...node.position, y: centerY - nodeHeight / 2 } };
          }
          return node;
        })
      );
    }, [getSelectedNodes, saveToHistory, setNodes]);

    const handleDistributeHorizontal = useCallback(() => {
      const selectedNodes = getSelectedNodes();
      if (selectedNodes.length < 3) return;

      const sortedNodes = [...selectedNodes].sort((a, b) => a.position.x - b.position.x);
      const firstNode = sortedNodes[0];
      const lastNode = sortedNodes[sortedNodes.length - 1];

      const lastWidth = (lastNode.style?.width as number) || lastNode.width || 180;

      const totalSpace = (lastNode.position.x + lastWidth) - firstNode.position.x;
      const totalNodeWidth = sortedNodes.reduce((sum, node) => {
        return sum + ((node.style?.width as number) || node.width || 180);
      }, 0);
      const spacing = (totalSpace - totalNodeWidth) / (sortedNodes.length - 1);

      saveToHistory();
      setNodes((nds) =>
        nds.map((node) => {
          const sortedIndex = sortedNodes.findIndex(n => n.id === node.id);
          if (sortedIndex !== -1) {
            if (sortedIndex === 0) {
              return node;
            }
            const newX = sortedNodes.slice(0, sortedIndex).reduce((x, n) => {
              const w = (n.style?.width as number) || n.width || 180;
              return x + w + spacing;
            }, firstNode.position.x);
            return { ...node, position: { ...node.position, x: newX } };
          }
          return node;
        })
      );
    }, [getSelectedNodes, saveToHistory, setNodes]);

    const handleDistributeVertical = useCallback(() => {
      const selectedNodes = getSelectedNodes();
      if (selectedNodes.length < 3) return;

      const sortedNodes = [...selectedNodes].sort((a, b) => a.position.y - b.position.y);
      const firstNode = sortedNodes[0];
      const lastNode = sortedNodes[sortedNodes.length - 1];

      const lastHeight = (lastNode.style?.height as number) || lastNode.height || 80;

      const totalSpace = (lastNode.position.y + lastHeight) - firstNode.position.y;
      const totalNodeHeight = sortedNodes.reduce((sum, node) => {
        return sum + ((node.style?.height as number) || node.height || 80);
      }, 0);
      const spacing = (totalSpace - totalNodeHeight) / (sortedNodes.length - 1);

      saveToHistory();
      setNodes((nds) =>
        nds.map((node) => {
          const sortedIndex = sortedNodes.findIndex(n => n.id === node.id);
          if (sortedIndex !== -1) {
            if (sortedIndex === 0) {
              return node;
            }
            const newY = sortedNodes.slice(0, sortedIndex).reduce((y, n) => {
              const h = (n.style?.height as number) || n.height || 80;
              return y + h + spacing;
            }, firstNode.position.y);
            return { ...node, position: { ...node.position, y: newY } };
          }
          return node;
        })
      );
    }, [getSelectedNodes, saveToHistory, setNodes]);

    const handleNodeUpdate = (nodeId: string, data: Partial<WorkflowNodeData>) => {
      saveToHistory();
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            return { ...n, data: { ...n.data, ...data } };
          }
          return n;
        })
      );
    };

    const handleEdgeUpdate = (edgeId: string, updates: any) => {
      saveToHistory();
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id === edgeId) {
            const newEdge = { ...e };
            if (updates.label !== undefined) newEdge.label = updates.label;
            if (updates.type !== undefined) newEdge.type = updates.type;
            if (updates.animated !== undefined) newEdge.animated = updates.animated;
            if (updates.stroke !== undefined || updates.strokeWidth !== undefined) {
              newEdge.style = {
                ...newEdge.style,
                ...(updates.stroke && { stroke: updates.stroke }),
                ...(updates.strokeWidth && { strokeWidth: updates.strokeWidth }),
              };
            }
            return newEdge;
          }
          return e;
        })
      );
    };

    const onNodeClick = useCallback((_: any, node: Node<WorkflowNodeData>) => {
      setSelectedNode(node);
      setSelectedEdge(null);
    }, []);

    const onEdgeClick = useCallback((_: any, edge: Edge) => {
      setSelectedEdge(edge);
      setSelectedNode(null);
    }, []);

    const onPaneClick = useCallback(() => {
      setSelectedNode(null);
      setSelectedEdge(null);
    }, []);

    const onNodeDragStop = useCallback(() => {
      saveToHistory();
    }, [saveToHistory]);

    useImperativeHandle(ref, () => ({
      getData: () => {
        return { nodes, edges };
      },
      loadData: (data: { nodes: any[]; edges: any[] }) => {
        try {
          if (data.nodes) setNodes(data.nodes);
          if (data.edges) setEdges(data.edges);
        } catch (e) {
          console.error('Failed to load data:', e);
        }
      },
    }));

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
          e.preventDefault();
          handleRedo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedNode) {
          e.preventDefault();
          handleCopy();
        }
        if (e.key === 'Delete' && (selectedNode || selectedEdge)) {
          e.preventDefault();
          handleDelete();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNode, selectedEdge, historyIndex, history]);

    return (
      <div className="w-full h-full relative bg-gradient-to-br from-slate-50 to-gray-100" ref={reactFlowWrapper}>
        <WorkflowToolbar
          onUndo={handleUndo}
          onRedo={handleRedo}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitView={handleFitView}
          onDelete={handleDelete}
          onCopy={handleCopy}
          onClear={handleClear}
          onAutoLayout={handleAutoLayout}
          onToggleGrid={handleToggleGrid}
          onAlignLeft={handleAlignLeft}
          onAlignCenter={handleAlignCenter}
          onAlignTop={handleAlignTop}
          onAlignMiddle={handleAlignMiddle}
          onDistributeHorizontal={handleDistributeHorizontal}
          onDistributeVertical={handleDistributeVertical}
          showGrid={showGrid}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          hasSelection={!!selectedNode || !!selectedEdge}
          hasMultiSelection={nodes.filter(n => n.selected).length > 1}
          hasNodes={nodes.length > 0 || edges.length > 0}
        />

        <WorkflowElementPanel onDragStart={onDragStart} />

        <WorkflowPropertiesPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onNodeUpdate={handleNodeUpdate}
          onEdgeUpdate={handleEdgeUpdate}
          onClose={() => {
            setSelectedNode(null);
            setSelectedEdge(null);
          }}
          workflowData={{ nodes, edges }}
        />

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          onReconnectStart={onReconnectStart}
          onReconnectEnd={onReconnectEnd}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={workflowNodeTypes}
          connectionMode={ConnectionMode.Loose}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionRadius={30}
          connectOnClick={true}
          selectionOnDrag={false}
          panOnDrag={[2]}
          panOnScroll={true}
          zoomOnScroll={true}
          zoomOnDoubleClick={false}
          multiSelectionKeyCode="Control"
          selectionKeyCode={null}
          deleteKeyCode="Delete"
          selectNodesOnDrag={false}
          elementsSelectable={true}
          nodesConnectable={true}
          nodesDraggable={true}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#6b7280', strokeWidth: 2 },
          }}
          fitView
          attributionPosition="bottom-right"
        >
          <Controls position="bottom-left" showInteractive={false} />
          {showGrid && <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#cbd5e1" />}
        </ReactFlow>
      </div>
    );
  }
);

WorkflowFlowEditorInner.displayName = 'WorkflowFlowEditorInner';

const WorkflowFlowEditor = forwardRef<WorkflowFlowEditorRef, WorkflowFlowEditorProps>((props, ref) => {
  return (
    <ReactFlowProvider>
      <WorkflowFlowEditorInner {...props} ref={ref} />
    </ReactFlowProvider>
  );
});

WorkflowFlowEditor.displayName = 'WorkflowFlowEditor';

export default WorkflowFlowEditor;
