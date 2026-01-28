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
  MiniMap,
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
import './styles.css';
import dagre from 'dagre';

import { nodeTypes, CustomNodeData } from './nodes/CustomNodes';
import { Toolbar } from './Toolbar';
import { ElementPanel } from './ElementPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { ThemeSelector } from './ThemeSelector';
import { BatchEditPanel } from './BatchEditPanel';
import { SelectionBox } from './SelectionBox';
import { flowchartThemes, FlowchartTheme, getColorForNodeType } from './themes';
import { toPng, toSvg } from 'html-to-image';

export interface AIGenerateResult {
  nodes: any[];
  edges: any[];
  graphType: 'flowchart' | 'mindmap' | 'hybrid';
  nodeCount: number;
}

export interface ReactFlowEditorRef {
  getData: () => Promise<string | null>;
  loadData: (data: string) => void;
  exportImage: (format: 'png' | 'svg') => void;
  generateFromAI: (sopContent: string) => Promise<AIGenerateResult>;
  smartLayout: () => Promise<{ success: boolean; nodeCount: number }>;
  applyTheme: (theme: FlowchartTheme) => void;
}

interface ReactFlowEditorProps {
  initialData?: string;
  onDataChange?: (data: string) => void;
  onSave?: (data: string) => void;
}

const ReactFlowEditorInner = forwardRef<ReactFlowEditorRef, ReactFlowEditorProps>(
  ({ initialData, onDataChange, onSave }, ref) => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes] = useNodesState([]);
    const [edges, setEdges] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const [selectedNode, setSelectedNode] = useState<Node<CustomNodeData> | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
    const [selectedNodes, setSelectedNodes] = useState<Node<CustomNodeData>[]>([]);
    const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);
    const [showGrid, setShowGrid] = useState(true);
    const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [currentTheme, setCurrentTheme] = useState<FlowchartTheme>(flowchartThemes[0]);
    const [showThemeSelector, setShowThemeSelector] = useState(false);
    const [smartLayoutLoading, setSmartLayoutLoading] = useState(false);
    const [interactionMode, setInteractionMode] = useState<'select' | 'pan'>('select');
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
          const data = JSON.parse(initialData);
          if (data.nodes) setNodes(data.nodes);
          if (data.edges) setEdges(data.edges);
          if (data.nodeIdCounter) nodeIdCounter.current = data.nodeIdCounter;

          setHistory([{ nodes: data.nodes || [], edges: data.edges || [] }]);
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
        const data = JSON.stringify({
          nodes,
          edges,
          nodeIdCounter: nodeIdCounter.current,
        });
        onDataChange?.(data);
      }
    }, [nodes, edges, onDataChange]);

    const onNodesChange = useCallback(
      (changes: NodeChange[]) => {
        setNodes((nds) => {
          const updatedNodes = applyNodeChanges(changes, nds);
          // 更新选中的节点列表
          const selected = updatedNodes.filter(node => node.selected);
          setSelectedNodes(selected);
          return updatedNodes;
        });
      },
      [setNodes]
    );

    const onEdgesChange = useCallback(
      (changes: EdgeChange[]) => {
        setEdges((eds) => {
          const updatedEdges = applyEdgeChanges(changes, eds);
          // 更新选中的边列表
          const selected = updatedEdges.filter(edge => edge.selected);
          setSelectedEdges(selected);
          return updatedEdges;
        });
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
              animated: false,
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { stroke: '#b1b1b7', strokeWidth: 2 },
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

        const newNode: Node<CustomNodeData> = {
          id: `node_${nodeIdCounter.current++}`,
          type,
          position,
          data: defaultData,
          style: {
            width: defaultData.width || 100,
            height: defaultData.height || 100,
          },
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

    const handleSave = () => {
      const data = JSON.stringify({
        nodes,
        edges,
        nodeIdCounter: nodeIdCounter.current,
      });
      onSave?.(data);
    };

    const handleExportPNG = () => {
      if (reactFlowWrapper.current) {
        const viewport = reactFlowWrapper.current.querySelector('.react-flow__viewport');
        if (viewport) {
          toPng(viewport as HTMLElement, {
            backgroundColor: '#ffffff',
            width: viewport.clientWidth,
            height: viewport.clientHeight,
          })
            .then((dataUrl) => {
              const link = document.createElement('a');
              link.download = 'flowchart.png';
              link.href = dataUrl;
              link.click();
            })
            .catch((err) => {
              console.error('Failed to export PNG:', err);
            });
        }
      }
    };

    const handleExportSVG = () => {
      if (reactFlowWrapper.current) {
        const viewport = reactFlowWrapper.current.querySelector('.react-flow__viewport');
        if (viewport) {
          toSvg(viewport as HTMLElement, {
            backgroundColor: '#ffffff',
            width: viewport.clientWidth,
            height: viewport.clientHeight,
          })
            .then((dataUrl) => {
              const link = document.createElement('a');
              link.download = 'flowchart.svg';
              link.href = dataUrl;
              link.click();
            })
            .catch((err) => {
              console.error('Failed to export SVG:', err);
            });
        }
      }
    };

    const handleExportJSON = () => {
      const data = JSON.stringify(
        {
          nodes,
          edges,
          nodeIdCounter: nodeIdCounter.current,
        },
        null,
        2
      );
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'flowchart.json';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
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
        const newNode: Node<CustomNodeData> = {
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
        setSelectedNodes([]);
        setSelectedEdges([]);
        nodeIdCounter.current = 1;
      }
    };

    const handleBatchNodesUpdate = useCallback((updates: Partial<CustomNodeData>) => {
      if (selectedNodes.length === 0) return;

      saveToHistory();
      setNodes((nds) =>
        nds.map((node) => {
          if (selectedNodes.find(sn => sn.id === node.id)) {
            return {
              ...node,
              data: {
                ...node.data,
                ...updates,
              },
            };
          }
          return node;
        })
      );
    }, [selectedNodes, saveToHistory, setNodes]);

    const handleBatchEdgesUpdate = useCallback((updates: Partial<Edge>) => {
      if (selectedEdges.length === 0) return;

      saveToHistory();
      setEdges((eds) =>
        eds.map((edge) => {
          if (selectedEdges.find(se => se.id === edge.id)) {
            return {
              ...edge,
              ...updates,
              style: {
                ...edge.style,
                ...updates.style,
              },
            };
          }
          return edge;
        })
      );
    }, [selectedEdges, saveToHistory, setEdges]);

    const handleCloseBatchEdit = useCallback(() => {
      // 取消所有选择
      setNodes((nds) => nds.map(n => ({ ...n, selected: false })));
      setEdges((eds) => eds.map(e => ({ ...e, selected: false })));
      setSelectedNodes([]);
      setSelectedEdges([]);
    }, [setNodes, setEdges]);

    const handleAlignHorizontal = () => {
      if (selectedNode && nodes.length > 1) {
        const avgY = nodes.reduce((sum, n) => sum + n.position.y, 0) / nodes.length;
        saveToHistory();
        setNodes((nds) =>
          nds.map((n) =>
            n.selected ? { ...n, position: { ...n.position, y: avgY } } : n
          )
        );
      }
    };

    const handleAlignVertical = () => {
      if (selectedNode && nodes.length > 1) {
        const avgX = nodes.reduce((sum, n) => sum + n.position.x, 0) / nodes.length;
        saveToHistory();
        setNodes((nds) =>
          nds.map((n) =>
            n.selected ? { ...n, position: { ...n.position, x: avgX } } : n
          )
        );
      }
    };

    const handleAutoLayout = () => {
      // 检查是否有节点
      if (!nodes || nodes.length === 0) {
        console.warn('没有节点可以布局');
        return;
      }

      const dagreGraph = new dagre.graphlib.Graph();
      dagreGraph.setDefaultEdgeLabel(() => ({}));
      dagreGraph.setGraph({
        rankdir: 'TB',
        nodesep: 100,
        ranksep: 100,
        marginx: 50,
        marginy: 50
      });

      nodes.forEach((node) => {
        dagreGraph.setNode(node.id, {
          width: node.width || 120,
          height: node.height || 60
        });
      });

      edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
      });

      dagre.layout(dagreGraph);

      saveToHistory();
      setNodes((nds) =>
        nds.map((node) => {
          const nodeWithPosition = dagreGraph.node(node.id);
          // 安全检查：如果找不到节点位置，保持原位置
          if (!nodeWithPosition) {
            console.warn(`无法找到节点 ${node.id} 的布局位置，保持原位置`);
            return node;
          }
          return {
            ...node,
            position: {
              x: nodeWithPosition.x - (node.width || 120) / 2,
              y: nodeWithPosition.y - (node.height || 60) / 2,
            },
          };
        })
      );

      setTimeout(() => {
        reactFlowInstance?.fitView({ padding: 0.2 });
      }, 0);
    };

    const handleToggleGrid = () => {
      setShowGrid(!showGrid);
    };

    const handleSetInteractionMode = (mode: 'select' | 'pan') => {
      setInteractionMode(mode);
    };

    const handleNodeUpdate = (nodeId: string, data: Partial<CustomNodeData>) => {
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

    const onNodeClick = useCallback((_: any, node: Node<CustomNodeData>) => {
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

    const applyThemeToAll = useCallback((theme: FlowchartTheme) => {
      saveToHistory();
      setCurrentTheme(theme);

      // Apply theme to all nodes
      setNodes((nds) =>
        nds.map((node) => {
          const bgColor = getColorForNodeType(theme, node.type || 'rectangle');
          return {
            ...node,
            data: {
              ...node.data,
              bgColor,
              textColor: theme.textColor,
              borderColor: theme.borderColor,
              borderWidth: theme.borderWidth,
            },
          };
        })
      );

      // Apply theme to all edges
      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          animated: theme.edgeAnimated,
          style: {
            ...edge.style,
            stroke: theme.edgeColor,
            strokeWidth: theme.edgeWidth,
          },
        }))
      );
    }, [saveToHistory, setNodes, setEdges]);

    const generateFlowchartFromAI = useCallback(async (sopContent: string) => {
      try {
        // Import AI service dynamically
        const AIService = (await import('../../services/ai/AIService')).default;

        const config = await AIService.getActiveConfig();
        if (!config) {
          throw new Error('请先在AI配置页面配置并激活一个AI模型');
        }

        const response = await AIService.chat({
          messages: [
            {
              role: 'system',
              content: `你是一个专业的知识图谱和流程可视化专家。你需要深度理解文档内容，智能分析其类型和特征，然后选择最合适的图形模型来表达。

# 第一步：分析文档类型
仔细阅读文档，判断其主要特征：

1. **流程型文档**（适合流程图）：
   - 包含明确的操作步骤、先后顺序
   - 有决策点、分支判断、条件选择
   - 描述"如何做"的操作性内容
   - 关键词：步骤、流程、操作、执行、审批、判断

2. **知识型文档**（适合思维导图/层次图）：
   - 介绍概念、知识点、分类体系
   - 强调概念之间的层次关系、从属关系
   - 描述"是什么"的知识性内容
   - 关键词：分类、体系、概念、组成、包括、类型

3. **混合型文档**（适合综合结构图）：
   - 既有流程步骤，又有知识分类
   - 同时包含操作和概念说明

# 第二步：选择合适的图形模型

## 模型A：流程图（用于流程型文档）
- 节点类型：roundedRectangle（开始）→ rectangle（步骤）→ diamond（判断）→ circle（结束）
- 布局：垂直流动，决策分支左右展开
- 连线：顺序连接，分支标注条件

## 模型B：思维导图/层次图（用于知识型文档）
- 中心主题节点（roundedRectangle，居中放置）
- 一级分支（rectangle，围绕中心展开）
- 二级分支（rectangle，从一级延伸）
- 三级及以下细节（rectangle，继续延伸）
- 布局：树形结构或辐射状结构

## 模型C：综合结构图（用于混合型文档）
- 结合流程和层次的混合布局
- 既体现流程顺序，又展示知识结构

# 第三步：深度提取内容

无论选择哪种模型，都要做到：
1. **全面提取**：提取文档中的所有关键信息点，不要遗漏
2. **层次分明**：主次关系清晰，层级结构合理
3. **标签精准**：每个节点的标签要准确概括其含义
4. **逻辑严密**：节点之间的连接要符合逻辑关系
5. **丰富完整**：节点数量要充分（至少8-15个），充分展现文档内容

# 输出格式

## nodes数组格式
{
  "id": "node_1",
  "type": "rectangle",  // 可选：roundedRectangle, rectangle, diamond, circle, parallelogram, cylinder, hexagon, document
  "position": { "x": 100, "y": 50 },
  "data": {
    "label": "节点标签",  // 精炼但完整的描述，可达15字
    "bgColor": "#e3f2fd",
    "textColor": "#000000",
    "borderColor": "#000000",
    "width": 150,
    "height": 70
  }
}

## edges数组格式
{
  "id": "edge_1",
  "source": "node_1",
  "target": "node_2",
  "label": "关系描述",  // 可选，说明连接关系
  "type": "smoothstep"
}

# 布局建议

**流程图布局**：
- 开始节点：x=400, y=50
- 垂直间距：120-150
- 决策分支：左右各偏移200-300

**思维导图布局**：
- 中心节点：x=400, y=300
- 一级节点：围绕中心，间隔200-300
- 二级节点：从一级延伸，间隔150-200
- 采用辐射状或树形布局

# 输出要求
只返回JSON对象：{"nodes": [...], "edges": [...], "graphType": "flowchart/mindmap/hybrid"}
不要任何解释文字，确保JSON格式正确可解析。`,
            },
            {
              role: 'user',
              content: `请深度分析以下文档，智能选择最合适的图形模型并生成可视化数据：

${sopContent}

分析要求：
1. 仔细阅读并理解文档的完整内容
2. 判断文档类型（流程型/知识型/混合型）
3. 选择最合适的图形模型（流程图/思维导图/综合图）
4. 全面提取文档中的关键信息点，生成丰富的节点（至少8-15个节点）
5. 构建清晰的层次结构或流程逻辑
6. 合理布局节点位置，确保视觉效果专业
7. 只返回JSON数据，格式：{"nodes": [...], "edges": [...], "graphType": "flowchart/mindmap/hybrid"}`,
            },
          ],
          temperature: 0.4,
          max_tokens: 6000,
        });

        if (!response.content) {
          throw new Error('AI返回内容为空');
        }

        // 解析AI返回的JSON
        let jsonContent = response.content.trim();
        // 移除可能的markdown代码块标记
        jsonContent = jsonContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        jsonContent = jsonContent.replace(/^```\n?/, '').replace(/\n?```$/, '');

        let flowchartData;
        try {
          flowchartData = JSON.parse(jsonContent);
        } catch (parseError) {
          console.error('JSON解析失败:', jsonContent);
          throw new Error('AI返回的数据无法解析为JSON格式');
        }

        // 验证数据结构
        if (!flowchartData || typeof flowchartData !== 'object') {
          throw new Error('AI返回的数据格式不正确：不是有效的对象');
        }

        if (!Array.isArray(flowchartData.nodes)) {
          throw new Error('AI返回的数据格式不正确：nodes不是数组');
        }

        if (!Array.isArray(flowchartData.edges)) {
          throw new Error('AI返回的数据格式不正确：edges不是数组');
        }

        if (flowchartData.nodes.length === 0) {
          throw new Error('AI未能识别出流程节点，请检查文档内容是否包含明确的流程步骤');
        }

        // 验证每个节点的基本结构
        const invalidNodes = flowchartData.nodes.filter((node: any) =>
          !node.id || !node.type || !node.position || !node.data
        );
        if (invalidNodes.length > 0) {
          console.error('无效的节点:', invalidNodes);
          throw new Error(`AI生成的节点数据不完整（缺少id、type、position或data字段）`);
        }

        // 清空当前流程图并加载新数据
        saveToHistory();
        setNodes(flowchartData.nodes);
        setEdges(flowchartData.edges);

        if (flowchartData.nodes.length > 0) {
          const maxId = Math.max(...flowchartData.nodes.map((n: any) => {
            const match = n.id.match(/\d+/);
            return match ? parseInt(match[0]) : 0;
          }));
          nodeIdCounter.current = maxId + 1;
        }

        // AI已经生成了带位置的节点，只需要适应视图即可
        setTimeout(() => {
          reactFlowInstance?.fitView({ padding: 0.2 });
        }, 100);

        // 返回生成的数据和图形类型
        return {
          nodes: flowchartData.nodes,
          edges: flowchartData.edges,
          graphType: flowchartData.graphType || 'flowchart',
          nodeCount: flowchartData.nodes.length
        };
      } catch (error: any) {
        console.error('AI生成流程图失败:', error);
        throw error;
      }
    }, [saveToHistory, setNodes, setEdges, handleAutoLayout]);

    const smartLayout = useCallback(async () => {
      if (nodes.length === 0) {
        throw new Error('当前没有节点可以排版');
      }

      try {
        // Import AI service dynamically
        const AIService = (await import('../../services/ai/AIService')).default;

        const config = await AIService.getActiveConfig();
        if (!config) {
          throw new Error('请先在AI配置页面配置并激活一个AI模型');
        }

        // 准备当前流程图的数据
        const flowchartDescription = {
          nodes: nodes.map(node => ({
            id: node.id,
            type: node.type,
            label: node.data.label,
            currentPosition: node.position,
          })),
          edges: edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: edge.label || '',
          })),
        };

        const response = await AIService.chat({
          messages: [
            {
              role: 'system',
              content: `你是一个专业的流程图布局优化专家。你需要分析流程图的节点和连接关系，理解其逻辑结构，然后生成优化的布局坐标。

# 分析要点
1. **识别流程类型**：
   - 线性流程（顺序执行）
   - 分支流程（包含决策点）
   - 并行流程（同时执行）
   - 循环流程（包含回路）
   - 层次结构（思维导图式）

2. **布局原则**：
   - **清晰度**：节点之间不重叠，连线尽量减少交叉
   - **美观性**：对齐、均匀分布、视觉平衡
   - **逻辑性**：遵循自然流动方向（流程图：从上到下；思维导图：辐射状）
   - **紧凑性**：避免过度分散，保持合理间距

3. **布局规则**：
   - 线性流程：垂直排列，y坐标递增150
   - 决策分支：左右展开，分支间隔200-300
   - 并行任务：水平排列，x坐标递增200
   - 层次结构：中心辐射或树形，层级间隔150-200
   - 保持对齐：同层节点y坐标相同，同列节点x坐标相同

4. **间距标准**：
   - 垂直间距：120-150（紧凑），150-180（标准）
   - 水平间距：180-220（紧凑），220-280（标准）
   - 分支间距：200-300
   - 画布居中：考虑整体布局在视图中居中

# 输出格式
返回优化后的节点位置数组，JSON格式：
[
  { "id": "node_1", "x": 400, "y": 50 },
  { "id": "node_2", "x": 400, "y": 200 },
  ...
]

只返回JSON数组，不要任何解释文字。确保：
1. 包含所有节点的新位置
2. 坐标为整数
3. 布局整齐、美观、逻辑清晰`,
            },
            {
              role: 'user',
              content: `请分析以下流程图结构，生成优化的布局方案：

${JSON.stringify(flowchartDescription, null, 2)}

要求：
1. 深度理解节点之间的逻辑关系（通过edges连接）
2. 识别流程的主线和分支
3. 生成整齐、美观、符合逻辑的布局坐标
4. 确保节点不重叠，连线尽量少交叉
5. 只返回JSON数组：[{"id": "node_1", "x": 100, "y": 50}, ...]`,
            },
          ],
          temperature: 0.2,
          max_tokens: 3000,
        });

        if (!response.content) {
          throw new Error('AI返回内容为空');
        }

        // 解析AI返回的JSON
        let jsonContent = response.content.trim();
        jsonContent = jsonContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        jsonContent = jsonContent.replace(/^```\n?/, '').replace(/\n?```$/, '');

        let positions: Array<{ id: string; x: number; y: number }>;
        try {
          positions = JSON.parse(jsonContent);
        } catch (parseError) {
          console.error('JSON解析失败:', jsonContent);
          throw new Error('AI返回的数据无法解析为JSON格式');
        }

        if (!Array.isArray(positions)) {
          throw new Error('AI返回的数据格式不正确：不是数组');
        }

        // 应用新的布局
        saveToHistory();
        setNodes((nds) =>
          nds.map((node) => {
            const newPos = positions.find((p) => p.id === node.id);
            if (newPos) {
              return {
                ...node,
                position: { x: newPos.x, y: newPos.y },
              };
            }
            return node;
          })
        );

        // 适应视图
        setTimeout(() => {
          reactFlowInstance?.fitView({ padding: 0.2 });
        }, 100);

        return { success: true, nodeCount: positions.length };
      } catch (error: any) {
        console.error('AI智能排版失败:', error);
        throw error;
      }
    }, [nodes, edges, saveToHistory, setNodes, reactFlowInstance]);

    const handleSmartLayout = useCallback(async () => {
      if (smartLayoutLoading) return;

      setSmartLayoutLoading(true);
      try {
        await smartLayout();
      } catch (error: any) {
        console.error('Smart layout error:', error);
        alert(`AI智能排版失败：${error.message || '未知错误'}`);
      } finally {
        setSmartLayoutLoading(false);
      }
    }, [smartLayout, smartLayoutLoading]);

    useImperativeHandle(ref, () => ({
      getData: async () => {
        return JSON.stringify({
          nodes,
          edges,
          nodeIdCounter: nodeIdCounter.current,
        });
      },
      loadData: (data: string) => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.nodes) setNodes(parsed.nodes);
          if (parsed.edges) setEdges(parsed.edges);
          if (parsed.nodeIdCounter) nodeIdCounter.current = parsed.nodeIdCounter;
        } catch (e) {
          console.error('Failed to load data:', e);
        }
      },
      exportImage: (format: 'png' | 'svg') => {
        if (format === 'png') {
          handleExportPNG();
        } else {
          handleExportSVG();
        }
      },
      generateFromAI: generateFlowchartFromAI,
      smartLayout: smartLayout,
      applyTheme: applyThemeToAll,
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
      <div
        className="w-full h-full relative bg-gray-50"
        ref={reactFlowWrapper}
        data-interaction-mode={interactionMode}
      >
        <Toolbar
          onUndo={handleUndo}
          onRedo={handleRedo}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitView={handleFitView}
          onSave={handleSave}
          onExportPNG={handleExportPNG}
          onExportSVG={handleExportSVG}
          onExportJSON={handleExportJSON}
          onDelete={handleDelete}
          onCopy={handleCopy}
          onClear={handleClear}
          onAlignHorizontal={handleAlignHorizontal}
          onAlignVertical={handleAlignVertical}
          onAutoLayout={handleAutoLayout}
          onSmartLayout={handleSmartLayout}
          onToggleGrid={handleToggleGrid}
          onToggleTheme={() => setShowThemeSelector(!showThemeSelector)}
          onSetInteractionMode={handleSetInteractionMode}
          showGrid={showGrid}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          hasSelection={!!selectedNode || !!selectedEdge}
          hasNodes={nodes.length > 0 || edges.length > 0}
          interactionMode={interactionMode}
        />

        <ElementPanel onDragStart={onDragStart} />

        {showThemeSelector && (
          <ThemeSelector
            currentThemeId={currentTheme.id}
            onThemeChange={(theme) => {
              applyThemeToAll(theme);
              setShowThemeSelector(false);
            }}
          />
        )}

        {smartLayoutLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 z-30 flex flex-col items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              <div className="text-center max-w-md px-4">
                <p className="text-lg font-semibold text-gray-900 mb-2">AI 正在智能排版...</p>
                <p className="text-sm text-gray-600">正在分析流程结构，优化节点布局</p>
              </div>
            </div>
          </div>
        )}

        {(selectedNodes.length > 1 || selectedEdges.length > 1) ? (
          <BatchEditPanel
            selectedNodes={selectedNodes}
            selectedEdges={selectedEdges}
            onNodesUpdate={handleBatchNodesUpdate}
            onEdgesUpdate={handleBatchEdgesUpdate}
            onClose={handleCloseBatchEdit}
          />
        ) : (
          <PropertiesPanel
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            onNodeUpdate={handleNodeUpdate}
            onEdgeUpdate={handleEdgeUpdate}
            onClose={() => {
              setSelectedNode(null);
              setSelectedEdge(null);
            }}
          />
        )}

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
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          connectionLineType={ConnectionLineType.SmoothStep}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: false,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#b1b1b7', strokeWidth: 2 },
          }}
          panOnScroll
          selectionOnDrag={interactionMode === 'select'}
          selectNodesOnDrag={false}
          panOnDrag={interactionMode === 'pan' ? true : [1, 2]}
          nodesDraggable={interactionMode === 'select'}
          nodesConnectable={interactionMode === 'select'}
          elementsSelectable={interactionMode === 'select'}
          multiSelectionKeyCode={interactionMode === 'select' ? 'Control' : null}
          selectionKeyCode={interactionMode === 'select' ? 'Shift' : null}
          deleteKeyCode="Delete"
          fitView
          attributionPosition="bottom-right"
        >
          <Controls position="bottom-left" />
          <MiniMap
            position="bottom-right"
            nodeColor={(node) => {
              const data = node.data as CustomNodeData;
              return data.bgColor || '#ffffff';
            }}
            style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
            }}
          />
          {showGrid && <Background variant={BackgroundVariant.Dots} gap={16} size={1} />}
        </ReactFlow>

        <SelectionBox nodes={nodes} />
      </div>
    );
  }
);

ReactFlowEditorInner.displayName = 'ReactFlowEditorInner';

const ReactFlowEditor = forwardRef<ReactFlowEditorRef, ReactFlowEditorProps>((props, ref) => {
  return (
    <ReactFlowProvider>
      <ReactFlowEditorInner {...props} ref={ref} />
    </ReactFlowProvider>
  );
});

ReactFlowEditor.displayName = 'ReactFlowEditor';

export default ReactFlowEditor;
