import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Node, Edge } from 'reactflow';
import { X, Settings, Move } from 'lucide-react';
import { WorkflowNodeData } from './nodes/WorkflowNodes';

interface WorkflowPropertiesPanelProps {
  selectedNode: Node<WorkflowNodeData> | null;
  selectedEdge: Edge | null;
  onNodeUpdate: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  onEdgeUpdate: (edgeId: string, data: any) => void;
  onClose: () => void;
  workflowData: { nodes: Node<WorkflowNodeData>[]; edges: Edge[] };
}

export const WorkflowPropertiesPanel = ({
  selectedNode,
  selectedEdge,
  onNodeUpdate,
  onEdgeUpdate,
  onClose,
  workflowData,
}: WorkflowPropertiesPanelProps) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 350, y: window.innerHeight - 450 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Local state for inputs to prevent lag
  const [localLabel, setLocalLabel] = useState('');
  const [localDescription, setLocalDescription] = useState('');
  const [localEdgeLabel, setLocalEdgeLabel] = useState('');
  const [localProperties, setLocalProperties] = useState<Record<string, any>>({});

  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state when selected node/edge changes
  useEffect(() => {
    if (selectedNode) {
      setLocalLabel(selectedNode.data.label || '');
      setLocalDescription(selectedNode.data.description || '');
      setLocalProperties(selectedNode.data.properties || {});
    }
  }, [selectedNode?.id]);

  useEffect(() => {
    if (selectedEdge) {
      setLocalEdgeLabel((selectedEdge.label as string) || '');
    }
  }, [selectedEdge?.id]);

  // Debounced update function
  const debouncedUpdate = useCallback((updateFn: () => void) => {
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }
    updateTimerRef.current = setTimeout(updateFn, 300);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 320),
        y: Math.min(prev.y, window.innerHeight - 200)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        const newX = Math.max(0, Math.min(e.clientX - dragStart.x, window.innerWidth - 320));
        const newY = Math.max(0, Math.min(e.clientY - dragStart.y, window.innerHeight - 200));
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
      }
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, true);
      document.addEventListener('mouseup', handleMouseUp, true);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('mouseup', handleMouseUp, true);
    };
  }, [isDragging, dragStart]);

  if (!selectedNode && !selectedEdge) return null;

  const handleNodeChange = (field: keyof WorkflowNodeData, value: any) => {
    if (!selectedNode) return;

    // Update local state immediately for smooth UI
    if (field === 'label') {
      setLocalLabel(value);
    } else if (field === 'description') {
      setLocalDescription(value);
    }

    // Debounce actual update to parent
    debouncedUpdate(() => {
      onNodeUpdate(selectedNode.id, { [field]: value });
    });
  };

  const handlePropertyChange = (property: string, value: any) => {
    if (!selectedNode) return;

    // Update local state immediately
    const newProperties = { ...localProperties, [property]: value };
    setLocalProperties(newProperties);

    // Debounce actual update to parent
    debouncedUpdate(() => {
      onNodeUpdate(selectedNode.id, {
        properties: newProperties
      });
    });
  };

  const handleEdgeChange = (field: string, value: any) => {
    if (!selectedEdge) return;

    // Update local state immediately for label
    if (field === 'label') {
      setLocalEdgeLabel(value);
    }

    // Debounce actual update to parent
    debouncedUpdate(() => {
      onEdgeUpdate(selectedEdge.id, { [field]: value });
    });
  };

  // Immediate updates for non-text inputs (color, checkbox, select, range)
  const handleImmediateNodeChange = (field: keyof WorkflowNodeData, value: any) => {
    if (selectedNode) {
      onNodeUpdate(selectedNode.id, { [field]: value });
    }
  };

  const handleImmediateEdgeChange = (field: string, value: any) => {
    if (selectedEdge) {
      onEdgeUpdate(selectedEdge.id, { [field]: value });
    }
  };

  const renderSelectorField = () => {
    // 为所有需要选择器的节点类型显示选择器字段
    return (
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">选择器</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={localProperties?.selector || ''}
            onChange={(e) => handlePropertyChange('selector', e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
            onKeyPress={(e) => e.stopPropagation()}
            placeholder="#element-id"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
              onClick={async (e) => {
                // 阻止事件冒泡
                e.stopPropagation();
                
                // 保存按钮元素引用和原始文本
                const buttonElement = e.currentTarget as HTMLButtonElement;
                if (!buttonElement) return;
                
                const originalText = buttonElement.textContent || '获取选择器';
                
                try {
                  // 显示加载状态
                  buttonElement.textContent = '加载中...';
                  buttonElement.disabled = true;
                  
                  let targetUrl = localProperties?.url;
                  let processedWorkflowData: any = undefined;

                  // 如果有工作流数据，先执行到当前节点之前的所有节点，获取登录后的URL
                  if (workflowData && workflowData.nodes.length > 0 && selectedNode) {
                    console.log('📋 Executing workflow to get login state...');

                    // 提取从起始节点到当前节点的子图
                    const startNode = workflowData.nodes.find((n: any) =>
                      n.type === 'start' || n.type === 'start-node'
                    ) || workflowData.nodes[0];

                    // 使用BFS找到从起始节点到当前节点的所有节点和边
                    const visited = new Set<string>();
                    const queue: any[] = [startNode];
                    const subgraphNodes: any[] = [];
                    const subgraphEdges: any[] = [];

                    while (queue.length > 0) {
                      const current = queue.shift()!;
                      if (visited.has(current.id)) continue;

                      visited.add(current.id);
                      subgraphNodes.push(current);

                      // 如果当前节点是目标节点，停止BFS
                      if (current.id === selectedNode.id) break;

                      // 找到所有从当前节点出发的边
                      const outgoingEdges = workflowData.edges.filter((e: any) => e.source === current.id);

                      for (const edge of outgoingEdges) {
                        subgraphEdges.push(edge);
                        const targetNode = workflowData.nodes.find((n: any) => n.id === edge.target);
                        if (targetNode && !visited.has(targetNode.id)) {
                          queue.push(targetNode);
                        }
                      }
                    }

                    // 将子图数据转换为后端期望的格式
                    processedWorkflowData = {
                      nodes: subgraphNodes.map((n: any) => ({
                        id: n.id,
                        type: n.type,
                        properties: n.data.properties || n.data
                      })),
                      edges: subgraphEdges.map((e: any) => ({
                        id: e.id,
                        source: e.source,
                        target: e.target
                      }))
                    };

                    console.log('📤 Using workflow data to get current URL:', processedWorkflowData);

                    // 调用后端API获取当前URL，执行到当前节点之前的所有节点
                    const urlResponse = await fetch('http://localhost:3001/api/playwright/get-current-url', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        nodeId: selectedNode.id,
                        workflow: processedWorkflowData,
                        executeOptions: {
                          untilNodeId: selectedNode.id,
                          includeCurrentNode: false
                        }
                      })
                    });

                    if (urlResponse.ok) {
                      const urlData = await urlResponse.json();
                      if (urlData.success && urlData.url) {
                        targetUrl = urlData.url;
                        console.log('✅ Got logged-in URL:', targetUrl);

                        // 更新节点的URL属性
                        handlePropertyChange('url', targetUrl);
                      }
                    }
                  }

                  // 如果没有URL，显示错误提示
                  if (!targetUrl) {
                    alert('请先在节点属性中填写URL地址');
                    return;
                  }

                  console.log('Calling get-selector API with URL:', targetUrl);
                  // 调用后端API获取选择器，根据情况传递工作流数据和节点ID
                  const response = await fetch('http://localhost:3001/api/playwright/get-selector', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      url: targetUrl,
                      // 只有当processedWorkflowData存在时才传递
                      ...(processedWorkflowData && selectedNode && {
                        workflow: processedWorkflowData,
                        nodeId: selectedNode.id
                      })
                    })
                  });
                  
                  console.log('API Response status:', response.status);
                  const data = await response.json();
                  console.log('API Response data:', data);
                  
                  if (response.ok && data.success && data.selector) {
                    handlePropertyChange('selector', data.selector);
                    alert('选择器获取成功: ' + data.selector);
                  } else {
                    const errorMsg = data.error || `HTTP ${response.status}: ${response.statusText}`;
                    console.error('Get selector failed:', errorMsg);
                    alert('获取选择器失败: ' + errorMsg);
                  }
                } catch (error: any) {
                  console.error('Get selector error:', error);
                  alert('获取选择器时发生错误: ' + (error.message || String(error)));
                } finally {
                  // 恢复按钮状态
                  if (buttonElement && document.contains(buttonElement)) {
                    try {
                      buttonElement.textContent = originalText;
                      buttonElement.disabled = false;
                    } catch (domError) {
                      console.error('无法恢复按钮状态:', domError);
                    }
                  }
                }
              }}
            onMouseDown={(e) => e.stopPropagation()}
            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            获取选择器
          </button>
        </div>
      </div>
    );
  };

  const renderPlaywrightProperties = () => {
    if (!selectedNode || selectedNode.type !== 'playwright') return null;

    const action = localProperties?.action || 'open_tabs';

    return (
      <>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">操作类型</label>
          <select
            value={action}
            onChange={(e) => handlePropertyChange('action', e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
            onKeyPress={(e) => e.stopPropagation()}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="open_tabs">打开标签页</option>
            <option value="navigate">导航</option>
            <option value="click">点击</option>
            <option value="fill">填充</option>
            <option value="wait">等待</option>
            <option value="screenshot">截图</option>
            <option value="extract_text">提取文本</option>
            <option value="close_tab">关闭标签页</option>
          </select>
        </div>

        {action === 'open_tabs' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">标签页数量</label>
            <input
              type="number"
              value={localProperties?.count || 1}
              onChange={(e) => handlePropertyChange('count', parseInt(e.target.value))}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              onKeyUp={(e) => e.stopPropagation()}
              onKeyPress={(e) => e.stopPropagation()}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
            />
          </div>
        )}

        {(action === 'navigate' || action === 'open_tabs') && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">URL</label>
            <input
              type="text"
              value={localProperties?.url || ''}
              onChange={(e) => handlePropertyChange('url', e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              onKeyUp={(e) => e.stopPropagation()}
              onKeyPress={(e) => e.stopPropagation()}
              placeholder="https://example.com"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {action === 'click' || action === 'extract_text' ? (
          renderSelectorField()
        ) : action === 'fill' ? (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">填充项目</label>
            <div className="space-y-3">
              {/* 支持多个选择器和填充内容组合 */}
              {(localProperties?.fillItems || []).map((item: any, index: number) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">选择器</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={item.selector || ''}
                            onChange={(e) => {
                              const fillItems = [...(localProperties?.fillItems || [])];
                              fillItems[index] = { ...fillItems[index], selector: e.target.value };
                              handlePropertyChange('fillItems', fillItems);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            onKeyUp={(e) => e.stopPropagation()}
                            onKeyPress={(e) => e.stopPropagation()}
                            placeholder="#element-id 或 .class-name"
                            className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                    
                                  // 保存按钮元素引用和原始文本
                                  const buttonElement = e.currentTarget as HTMLButtonElement;
                                  if (!buttonElement) return;
                                  
                                  const originalText = buttonElement.textContent || '获取选择器';
                                    
                                  try {
                                    // 显示加载状态
                                    buttonElement.textContent = '加载中...';
                                    buttonElement.disabled = true;

                                    let targetUrl = localProperties?.url;
                                    let processedWorkflowData: any = undefined;

                                    // 如果有工作流数据，先执行到当前节点之前的所有节点，获取登录后的URL
                                    if (workflowData && workflowData.nodes.length > 0 && selectedNode) {
                                      console.log('📋 Executing workflow to get login state...');

                                      // 提取从起始节点到当前节点的子图
                                      const startNode = workflowData.nodes.find((n: any) =>
                                        n.type === 'start' || n.type === 'start-node'
                                      ) || workflowData.nodes[0];

                                      // 使用BFS找到从起始节点到当前节点的所有节点和边
                                      const visited = new Set<string>();
                                      const queue: any[] = [startNode];
                                      const subgraphNodes: any[] = [];
                                      const subgraphEdges: any[] = [];

                                      while (queue.length > 0) {
                                        const current = queue.shift()!;
                                        if (visited.has(current.id)) continue;

                                        visited.add(current.id);
                                        subgraphNodes.push(current);

                                        // 如果当前节点是目标节点，停止BFS
                                        if (current.id === selectedNode.id) break;

                                        // 找到所有从当前节点出发的边
                                        const outgoingEdges = workflowData.edges.filter((e: any) => e.source === current.id);

                                        for (const edge of outgoingEdges) {
                                          subgraphEdges.push(edge);
                                          const targetNode = workflowData.nodes.find((n: any) => n.id === edge.target);
                                          if (targetNode && !visited.has(targetNode.id)) {
                                            queue.push(targetNode);
                                          }
                                        }
                                      }

                                      // 将子图数据转换为后端期望的格式
                                      processedWorkflowData = {
                                        nodes: subgraphNodes.map((n: any) => ({
                                          id: n.id,
                                          type: n.type,
                                          properties: n.data.properties || n.data
                                        })),
                                        edges: subgraphEdges.map((e: any) => ({
                                          id: e.id,
                                          source: e.source,
                                          target: e.target
                                        }))
                                      };

                                      console.log('📤 Using workflow data to get current URL:', processedWorkflowData);

                                      // 调用后端API获取当前URL，执行到当前节点之前的所有节点
                                      const urlResponse = await fetch('http://localhost:3001/api/playwright/get-current-url', {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                          nodeId: selectedNode.id,
                                          workflow: processedWorkflowData,
                                          executeOptions: {
                                            untilNodeId: selectedNode.id,
                                            includeCurrentNode: false
                                          }
                                        })
                                      });

                                      if (urlResponse.ok) {
                                        const urlData = await urlResponse.json();
                                        if (urlData.success && urlData.url) {
                                          targetUrl = urlData.url;
                                          console.log('✅ Got logged-in URL:', targetUrl);

                                          // 更新节点的URL属性
                                          handlePropertyChange('url', targetUrl);
                                        }
                                      }
                                    }

                                    // 如果没有URL，显示错误提示
                                    if (!targetUrl) {
                                      alert('请先在节点属性中填写URL地址');
                                      return;
                                    }

                                    console.log('Calling get-selector API with URL:', targetUrl);
                                    // 调用后端API获取选择器，根据情况传递工作流数据和节点ID
                                    const response = await fetch('http://localhost:3001/api/playwright/get-selector', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json'
                                      },
                                      body: JSON.stringify({
                                        url: targetUrl,
                                        // 只有当processedWorkflowData存在时才传递
                                        ...(processedWorkflowData && selectedNode && {
                                          workflow: processedWorkflowData,
                                          nodeId: selectedNode.id
                                        })
                                      })
                                    });
                                    
                                    console.log('API Response status:', response.status);
                                    const data = await response.json();
                                    console.log('API Response data:', data);
                                    
                                    if (response.ok && data.success && data.selector) {
                                      const fillItems = [...(localProperties?.fillItems || [])];
                                      fillItems[index] = { ...fillItems[index], selector: data.selector };
                                      handlePropertyChange('fillItems', fillItems);
                                      alert('选择器获取成功: ' + data.selector);
                                    } else {
                                      const errorMsg = data.error || `HTTP ${response.status}: ${response.statusText}`;
                                      console.error('Get selector failed:', errorMsg);
                                      alert('获取选择器失败: ' + errorMsg);
                                    }
                                  } catch (error: any) {
                                    console.error('Get selector error:', error);
                                    alert('获取选择器时发生错误: ' + (error.message || String(error)));
                                  } finally {
                                    // 恢复按钮状态
                                    if (buttonElement && document.contains(buttonElement)) {
                                      try {
                                        buttonElement.textContent = originalText;
                                        buttonElement.disabled = false;
                                      } catch (domError) {
                                        console.error('无法恢复按钮状态:', domError);
                                      }
                                    }
                                  }
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap"
                              >
                                获取选择器
                              </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">填充内容</label>
                        <input
                          type="text"
                          value={item.value || ''}
                          onChange={(e) => {
                            const fillItems = [...(localProperties?.fillItems || [])];
                            fillItems[index] = { ...fillItems[index], value: e.target.value };
                            handlePropertyChange('fillItems', fillItems);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          onKeyUp={(e) => e.stopPropagation()}
                          onKeyPress={(e) => e.stopPropagation()}
                          placeholder="输入要填充的文本内容"
                          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const fillItems = [...(localProperties?.fillItems || [])];
                          fillItems.splice(index, 1);
                          handlePropertyChange('fillItems', fillItems);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* 添加新的填充项目 */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const fillItems = [...(localProperties?.fillItems || [])];
                  fillItems.push({ selector: '', value: '' });
                  handlePropertyChange('fillItems', fillItems);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-full px-4 py-3 text-base font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                添加填充项目
              </button>
              
              {/* 兼容旧版单选择器和填充内容 */}
              {(!localProperties?.fillItems || localProperties.fillItems.length === 0) && (
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">选择器</label>
                      <input
                        type="text"
                        value={localProperties?.selector || ''}
                        onChange={(e) => handlePropertyChange('selector', e.target.value)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        onKeyUp={(e) => e.stopPropagation()}
                        onKeyPress={(e) => e.stopPropagation()}
                        placeholder="#element-id 或 .class-name"
                        className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">填充内容</label>
                      <input
                        type="text"
                        value={localProperties?.value || ''}
                        onChange={(e) => handlePropertyChange('value', e.target.value)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        onKeyUp={(e) => e.stopPropagation()}
                        onKeyPress={(e) => e.stopPropagation()}
                        placeholder="输入要填充的文本内容"
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {action === 'wait' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">等待时间 (毫秒)</label>
            <input
              type="number"
              value={localProperties?.milliseconds || 1000}
              onChange={(e) => handlePropertyChange('milliseconds', parseInt(e.target.value))}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              onKeyUp={(e) => e.stopPropagation()}
              onKeyPress={(e) => e.stopPropagation()}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>
        )}
      </>
    );
  };

  const content = (
    <div
      ref={panelRef}
      className={`fixed z-[9999] bg-white rounded-xl shadow-2xl border border-gray-200 w-80 max-h-[450px] overflow-hidden flex flex-col ${
        isDragging ? 'cursor-grabbing' : ''
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        pointerEvents: 'auto',
      }}
    >
      <div
        className="drag-handle px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <Move className="w-4 h-4 text-blue-600" />
          <Settings className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-sm text-gray-900">
            {selectedNode ? '节点属性' : '连接线属性'}
          </h3>
        </div>
        <button
          onClick={onClose}
          onMouseDown={(e) => e.stopPropagation()}
          className="p-1 hover:bg-white rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        {selectedNode && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">节点名称</label>
              <input
                type="text"
                value={localLabel}
                onChange={(e) => handleNodeChange('label', e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                onKeyUp={(e) => e.stopPropagation()}
                onKeyPress={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="输入节点名称"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">描述</label>
              <textarea
                value={localDescription}
                onChange={(e) => handleNodeChange('description', e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                onKeyUp={(e) => e.stopPropagation()}
                onKeyPress={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="输入节点描述"
              />
            </div>

            {selectedNode.type !== 'start' && selectedNode.type !== 'end' && selectedNode.type !== 'playwright' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">节点颜色</label>
                <input
                  type="color"
                  value={selectedNode.data.color || '#3b82f6'}
                  onChange={(e) => handleImmediateNodeChange('color', e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                />
              </div>
            )}

            {renderPlaywrightProperties()}

            {/* 为需要选择器的节点类型显示URL输入框 */}
            {(selectedNode.type === 'click' || 
              selectedNode.type === 'fill' || 
              selectedNode.type === 'extract_text' ||
              (selectedNode.type === 'playwright' && 
               (localProperties?.action === 'click' || 
                localProperties?.action === 'fill' || 
                localProperties?.action === 'extract_text'))) && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700">URL</label>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();

                      // 保存按钮元素引用和原始文本
                      const buttonElement = e.currentTarget as HTMLButtonElement;
                      if (!buttonElement) return;
                      
                      const originalText = buttonElement.textContent || '加载当前位置的url';
                      
                      try {
                        // 显示加载状态
                        buttonElement.textContent = '加载中...';
                        buttonElement.disabled = true;
                        
                        // 从完整的工作流数据中提取从起始节点到当前节点的子图
                        // 1. 首先找到起始节点
                        const startNode = workflowData.nodes.find((n: any) => 
                          n.type === 'start' || n.type === 'start-node'
                        ) || workflowData.nodes[0];
                        
                        // 2. 使用BFS找到从起始节点到当前节点的所有节点和边
                        const visited = new Set<string>();
                        const queue: any[] = [startNode];
                        const subgraphNodes: any[] = [];
                        const subgraphEdges: any[] = [];
                        
                        while (queue.length > 0) {
                          const current = queue.shift()!;
                          if (visited.has(current.id)) continue;
                          
                          visited.add(current.id);
                          subgraphNodes.push(current);
                          
                          // 如果当前节点是目标节点，停止BFS
                          if (current.id === selectedNode.id) break;
                          
                          // 找到所有从当前节点出发的边
                          const outgoingEdges = workflowData.edges.filter((e: any) => e.source === current.id);
                          
                          for (const edge of outgoingEdges) {
                            subgraphEdges.push(edge);
                            const targetNode = workflowData.nodes.find((n: any) => n.id === edge.target);
                            if (targetNode && !visited.has(targetNode.id)) {
                              queue.push(targetNode);
                            }
                          }
                        }
                        
                        // 3. 将子图数据转换为后端期望的格式
                        const processedWorkflowData = {
                          nodes: subgraphNodes.map((n: any) => ({
                            id: n.id,
                            type: n.type,
                            properties: n.data.properties || n.data
                          })),
                          edges: subgraphEdges.map((e: any) => ({
                            id: e.id,
                            source: e.source,
                            target: e.target
                          }))
                        };
                        
                        console.log('📤 Using workflow data from props:', processedWorkflowData);
                        console.log('📤 Extracted subgraph nodes:', subgraphNodes.map(n => n.id));
                        console.log('📤 Extracted subgraph edges:', subgraphEdges.map(e => `${e.source}→${e.target}`));
                        
                        // 调用后端API获取当前URL，执行所有节点直到目标节点
                        const response = await fetch('http://localhost:3001/api/playwright/get-current-url', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                            nodeId: selectedNode.id,
                            workflow: processedWorkflowData,
                            // 添加执行选项，执行到当前节点之前的所有节点
                            executeOptions: {
                              untilNodeId: selectedNode.id,
                              includeCurrentNode: false
                            }
                          })
                        });
                        
                        if (response.ok) {
                          const data = await response.json();
                          if (data.success && data.url) {
                            // 将获取到的URL填充到输入框
                            handlePropertyChange('url', data.url);
                            alert('URL加载成功: ' + data.url);
                          } else {
                            alert('URL加载失败: ' + (data.error || '未知错误'));
                          }
                        } else {
                          alert('URL加载失败: HTTP ' + response.status);
                        }
                      } catch (error) {
                        console.error('加载URL失败:', error);
                        alert('URL加载失败: ' + (error as Error).message);
                      } finally {
                        // 确保按钮元素仍然存在并且可以访问
                        if (buttonElement && document.contains(buttonElement)) {
                          try {
                            buttonElement.textContent = originalText;
                            buttonElement.disabled = false;
                          } catch (domError) {
                            console.error('无法恢复按钮状态:', domError);
                          }
                        }
                      }
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                  >
                    加载当前位置的url
                  </button>
                </div>
                <input
                  type="text"
                  value={localProperties?.url || ''}
                  onChange={(e) => handlePropertyChange('url', e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}
                  onKeyPress={(e) => e.stopPropagation()}
                  placeholder={localProperties?.useCurrentUrl ? '将使用前面节点的URL' : 'https://example.com'}
                  disabled={localProperties?.useCurrentUrl}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${localProperties?.useCurrentUrl ? 'bg-gray-50 border-gray-200 text-gray-500' : 'border-gray-300'}`}
                />
              </div>
            )}

            {/* 为普通节点显示选择器字段（playwright节点在renderPlaywrightProperties中处理） */}
            {(selectedNode.type === 'click' || selectedNode.type === 'extract_text') && (
              renderSelectorField()
            )}
            
            {/* 为普通填充节点显示多个选择器和填充内容的编辑功能 */}
            {selectedNode.type === 'fill' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">填充项目</label>
                <div className="space-y-3">
                  {/* 支持多个选择器和填充内容组合 */}
                  {(localProperties?.fillItems || []).map((item: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">选择器</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={item.selector || ''}
                                onChange={(e) => {
                                  const fillItems = [...(localProperties?.fillItems || [])];
                                  fillItems[index] = { ...fillItems[index], selector: e.target.value };
                                  handlePropertyChange('fillItems', fillItems);
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                                onFocus={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                                onKeyUp={(e) => e.stopPropagation()}
                                onKeyPress={(e) => e.stopPropagation()}
                                placeholder="#element-id 或 .class-name"
                                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                    
                                  // 保存按钮元素引用和原始文本
                                  const buttonElement = e.currentTarget as HTMLButtonElement;
                                  if (!buttonElement) return;
                                  
                                  const originalText = buttonElement.textContent || '获取选择器';
                                    
                                  try {
                                    // 显示加载状态
                                    buttonElement.textContent = '加载中...';
                                    buttonElement.disabled = true;

                                    let targetUrl = localProperties?.url;
                                    let processedWorkflowData: any = undefined;

                                    // 如果有工作流数据，先执行到当前节点之前的所有节点，获取登录后的URL
                                    if (workflowData && workflowData.nodes.length > 0 && selectedNode) {
                                      console.log('📋 Executing workflow to get login state...');

                                      // 提取从起始节点到当前节点的子图
                                      const startNode = workflowData.nodes.find((n: any) =>
                                        n.type === 'start' || n.type === 'start-node'
                                      ) || workflowData.nodes[0];

                                      // 使用BFS找到从起始节点到当前节点的所有节点和边
                                      const visited = new Set<string>();
                                      const queue: any[] = [startNode];
                                      const subgraphNodes: any[] = [];
                                      const subgraphEdges: any[] = [];

                                      while (queue.length > 0) {
                                        const current = queue.shift()!;
                                        if (visited.has(current.id)) continue;

                                        visited.add(current.id);
                                        subgraphNodes.push(current);

                                        // 如果当前节点是目标节点，停止BFS
                                        if (current.id === selectedNode.id) break;

                                        // 找到所有从当前节点出发的边
                                        const outgoingEdges = workflowData.edges.filter((e: any) => e.source === current.id);

                                        for (const edge of outgoingEdges) {
                                          subgraphEdges.push(edge);
                                          const targetNode = workflowData.nodes.find((n: any) => n.id === edge.target);
                                          if (targetNode && !visited.has(targetNode.id)) {
                                            queue.push(targetNode);
                                          }
                                        }
                                      }

                                      // 将子图数据转换为后端期望的格式
                                      processedWorkflowData = {
                                        nodes: subgraphNodes.map((n: any) => ({
                                          id: n.id,
                                          type: n.type,
                                          properties: n.data.properties || n.data
                                        })),
                                        edges: subgraphEdges.map((e: any) => ({
                                          id: e.id,
                                          source: e.source,
                                          target: e.target
                                        }))
                                      };

                                      console.log('📤 Using workflow data to get current URL:', processedWorkflowData);

                                      // 调用后端API获取当前URL，执行到当前节点之前的所有节点
                                      const urlResponse = await fetch('http://localhost:3001/api/playwright/get-current-url', {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                          nodeId: selectedNode.id,
                                          workflow: processedWorkflowData,
                                          executeOptions: {
                                            untilNodeId: selectedNode.id,
                                            includeCurrentNode: false
                                          }
                                        })
                                      });

                                      if (urlResponse.ok) {
                                        const urlData = await urlResponse.json();
                                        if (urlData.success && urlData.url) {
                                          targetUrl = urlData.url;
                                          console.log('✅ Got logged-in URL:', targetUrl);

                                          // 更新节点的URL属性
                                          handlePropertyChange('url', targetUrl);
                                        }
                                      }
                                    }

                                    // 如果没有URL，显示错误提示
                                    if (!targetUrl) {
                                      alert('请先在节点属性中填写URL地址');
                                      return;
                                    }

                                    console.log('Calling get-selector API with URL:', targetUrl);
                                    // 调用后端API获取选择器，根据情况传递工作流数据和节点ID
                                    const response = await fetch('http://localhost:3001/api/playwright/get-selector', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json'
                                      },
                                      body: JSON.stringify({
                                        url: targetUrl,
                                        // 只有当processedWorkflowData存在时才传递
                                        ...(processedWorkflowData && selectedNode && {
                                          workflow: processedWorkflowData,
                                          nodeId: selectedNode.id
                                        })
                                      })
                                    });
                                    
                                    console.log('API Response status:', response.status);
                                    const data = await response.json();
                                    console.log('API Response data:', data);
                                    
                                    if (response.ok && data.success && data.selector) {
                                      const fillItems = [...(localProperties?.fillItems || [])];
                                      fillItems[index] = { ...fillItems[index], selector: data.selector };
                                      handlePropertyChange('fillItems', fillItems);
                                      alert('选择器获取成功: ' + data.selector);
                                    } else {
                                      const errorMsg = data.error || `HTTP ${response.status}: ${response.statusText}`;
                                      console.error('Get selector failed:', errorMsg);
                                      alert('获取选择器失败: ' + errorMsg);
                                    }
                                  } catch (error: any) {
                                    console.error('Get selector error:', error);
                                    alert('获取选择器时发生错误: ' + (error.message || String(error)));
                                  } finally {
                                    // 恢复按钮状态
                                    if (buttonElement && document.contains(buttonElement)) {
                                      try {
                                        buttonElement.textContent = originalText;
                                        buttonElement.disabled = false;
                                      } catch (domError) {
                                        console.error('无法恢复按钮状态:', domError);
                                      }
                                    }
                                  }
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap"
                              >
                                获取选择器
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">填充内容</label>
                            <input
                              type="text"
                              value={item.value || ''}
                              onChange={(e) => {
                                const fillItems = [...(localProperties?.fillItems || [])];
                                fillItems[index] = { ...fillItems[index], value: e.target.value };
                                handlePropertyChange('fillItems', fillItems);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                              onFocus={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                              onKeyUp={(e) => e.stopPropagation()}
                              onKeyPress={(e) => e.stopPropagation()}
                              placeholder="输入要填充的文本内容"
                              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const fillItems = [...(localProperties?.fillItems || [])];
                              fillItems.splice(index, 1);
                              handlePropertyChange('fillItems', fillItems);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* 添加新的填充项目 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const fillItems = [...(localProperties?.fillItems || [])];
                      fillItems.push({ selector: '', value: '' });
                      handlePropertyChange('fillItems', fillItems);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="w-full px-4 py-3 text-base font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    添加填充项目
                  </button>
                  
                  {/* 兼容旧版单选择器和填充内容 */}
                  {(!localProperties?.fillItems || localProperties.fillItems.length === 0) && (
                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">选择器</label>
                          <input
                            type="text"
                            value={localProperties?.selector || ''}
                            onChange={(e) => handlePropertyChange('selector', e.target.value)}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            onKeyUp={(e) => e.stopPropagation()}
                            onKeyPress={(e) => e.stopPropagation()}
                            placeholder="#element-id 或 .class-name"
                            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">填充内容</label>
                          <input
                            type="text"
                            value={localProperties?.value || ''}
                            onChange={(e) => handlePropertyChange('value', e.target.value)}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            onKeyUp={(e) => e.stopPropagation()}
                            onKeyPress={(e) => e.stopPropagation()}
                            placeholder="输入要填充的文本内容"
                            className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {selectedEdge && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">连接线标签</label>
              <input
                type="text"
                value={localEdgeLabel}
                onChange={(e) => handleEdgeChange('label', e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                onKeyUp={(e) => e.stopPropagation()}
                onKeyPress={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="输入连接线标签"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">连接线类型</label>
              <select
                value={selectedEdge.type || 'default'}
                onChange={(e) => handleImmediateEdgeChange('type', e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                onKeyUp={(e) => e.stopPropagation()}
                onKeyPress={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="default">默认</option>
                <option value="straight">直线</option>
                <option value="step">阶梯</option>
                <option value="smoothstep">平滑阶梯</option>
                <option value="simplebezier">简单曲线</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">连接线颜色</label>
              <input
                type="color"
                value={(selectedEdge.style as any)?.stroke || '#6b7280'}
                onChange={(e) => handleImmediateEdgeChange('style', { ...(selectedEdge.style || {}), stroke: e.target.value })}
                className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">线宽</label>
              <input
                type="range"
                min="1"
                max="5"
                value={(selectedEdge.style as any)?.strokeWidth || 2}
                onChange={(e) => handleImmediateEdgeChange('style', { ...(selectedEdge.style || {}), strokeWidth: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-center mt-1">
                {(selectedEdge.style as any)?.strokeWidth || 2}px
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedEdge.animated || false}
                  onChange={(e) => handleImmediateEdgeChange('animated', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">动画效果</span>
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
