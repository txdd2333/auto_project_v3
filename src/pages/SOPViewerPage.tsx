import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, FileText, GitBranch, Code, Type, Globe, ChevronDown, Play, Clock, ExternalLink, Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { dataService } from '../services';
import { useToastContext } from '../contexts/ToastContext';
import type { Scenario } from '../lib/database.types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Turndown from 'turndown';
import { playwrightService } from '../services/playwright/PlaywrightService';
import '../styles/sop-content.css';
import ReactFlow, {
  Controls,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from '../components/ReactFlowEditor/nodes/CustomNodes';

type ViewMode = 'html' | 'markdown' | 'plaintext';

interface Workflow {
  id: string;
  name: string;
  description: string;
  definition?: string;
}

interface ExecutionLog {
  id: string;
  execution_id: string;
  status: string;
  started_at: string;
  completed_at?: string;
  result?: any;
}

export default function SOPViewerPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToastContext();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('html');
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadScenario();
  }, [id]);

  useEffect(() => {
    if (viewMode === 'html' && scenario?.sop_content && contentRef.current) {
      setTimeout(enhanceCodeBlocks, 100);
    }
  }, [viewMode, scenario?.sop_content]);

  const loadScenario = async () => {
    if (!id) {
      navigate('/sop-library');
      return;
    }

    try {
      const { data, error } = await dataService.queryOne<Scenario>('scenarios', {
        filter: { id }
      });

      if (error) throw error;
      if (!data) {
        navigate('/sop-library');
        return;
      }

      setScenario(data);

      if (data.workflow_id) {
        const { data: workflowData, error: workflowError } = await dataService.queryOne<Workflow>('workflows', {
          filter: { id: data.workflow_id },
          select: 'id, name, description, definition'
        });
        if (!workflowError && workflowData) {
          setWorkflow(workflowData);
          loadExecutionLogs(data.workflow_id);
        }
      }
    } catch (error) {
      console.error('Error loading scenario:', error);
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadExecutionLogs = async (workflowId: string) => {
    setLoadingLogs(true);
    try {
      const { data, error } = await dataService.query<ExecutionLog>('execution_logs', {
        filter: { workflow_id: workflowId, scenario_id: id },
        order: { column: 'started_at', ascending: false },
        limit: 5
      });

      if (!error && data) {
        setExecutionLogs(data);
      }
    } catch (error) {
      console.error('Error loading execution logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleExecuteWorkflow = async () => {
    if (!scenario?.workflow_id || !workflow) return;

    setExecuting(true);
    try {
      const { data: workflowData, error: workflowError } = await dataService.queryOne('workflows', {
        filter: { id: scenario.workflow_id }
      });

      if (workflowError) throw workflowError;
      if (!workflowData) {
        toast.error('工作流不存在');
        return;
      }

      const definition = (workflowData as any).definition;
      if (!definition) {
        toast.warning('工作流未定义，请先编辑工作流');
        return;
      }

      let workflowDef;
      try {
        workflowDef = JSON.parse(definition);
      } catch {
        toast.error('工作流数据格式错误');
        return;
      }

      const workflowPayload = {
        nodes: workflowDef.nodes.map((n: any) => ({
          id: n.id,
          type: n.type,
          properties: n.data || n.properties
        })),
        edges: workflowDef.edges.map((e: any) => ({
          id: e.id,
          sourceNodeId: e.source || e.sourceNodeId,
          targetNodeId: e.target || e.targetNodeId
        }))
      };

      const { executionId } = await playwrightService.executeWorkflow(workflowPayload, {
        scenarioId: scenario.id,
        scenarioName: scenario.name
      });

      await dataService.insert('execution_logs', {
        workflow_id: scenario.workflow_id,
        scenario_id: scenario.id,
        status: 'running',
        execution_id: executionId,
        started_at: new Date().toISOString()
      });

      toast.success(`工作流开始执行！执行ID: ${executionId}`);
      toast.info('请查看后端终端查看执行日志', 5000);

      // 重新加载执行日志
      if (scenario.workflow_id) {
        loadExecutionLogs(scenario.workflow_id);
      }
    } catch (error: any) {
      console.error('Error executing workflow:', error);
      toast.error(`执行失败：${error.message}`);
      toast.warning('请确保后端服务已启动（npm run server）', 5000);
    } finally {
      setExecuting(false);
    }
  };

  const convertToMarkdown = (html: string): string => {
    const turndown = new Turndown({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });

    turndown.addRule('strikethrough', {
      filter: ['del', 's'],
      replacement: (content) => `~~${content}~~`,
    });

    return turndown.turndown(html);
  };

  const convertToPlainText = (html: string): string => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const FlowchartPreview = () => {
    if (!scenario?.flowchart_data) {
      return (
        <div className="text-center py-12 text-gray-400">
          <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>暂无流程图</p>
        </div>
      );
    }

    try {
      const flowchartData = typeof scenario.flowchart_data === 'string'
        ? JSON.parse(scenario.flowchart_data)
        : scenario.flowchart_data;

      const [nodes] = useNodesState(flowchartData.nodes || []);
      const [edges] = useEdgesState(flowchartData.edges || []);

      return (
        <div className="bg-gray-50 rounded-lg p-4" style={{ height: '500px' }}>
          <div className="text-sm text-gray-600 mb-3">
            流程图包含 {flowchartData.nodes?.length || 0} 个节点，
            {flowchartData.edges?.length || 0} 条连接线
          </div>
          <div className="bg-white rounded border border-gray-200" style={{ height: 'calc(100% - 40px)' }}>
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-left"
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={true}
                zoomOnScroll={true}
                panOnScroll={false}
                zoomOnDoubleClick={false}
                panOnDrag={true}
                minZoom={0.1}
                maxZoom={4}
              >
                <Controls showInteractive={false} />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
              </ReactFlow>
            </ReactFlowProvider>
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering flowchart:', error);
      return (
        <div className="text-center py-12 text-gray-400">
          <p>流程图数据格式错误</p>
        </div>
      );
    }
  };

  const renderFlowchart = () => {
    return <FlowchartPreview />;
  };

  const enhanceCodeBlocks = () => {
    if (!contentRef.current) return;

    const preElements = contentRef.current.querySelectorAll('pre');
    preElements.forEach((pre) => {
      if (pre.classList.contains('code-enhanced')) return;

      pre.classList.add('code-enhanced');

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';

      const copyButton = document.createElement('button');
      copyButton.className = 'code-copy-button';
      copyButton.title = '复制代码';
      copyButton.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
        <span>复制</span>
      `;

      copyButton.addEventListener('click', async () => {
        const code = pre.textContent || '';
        try {
          await navigator.clipboard.writeText(code);
          copyButton.classList.add('copied');
          copyButton.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span>已复制</span>
          `;
          setTimeout(() => {
            copyButton.classList.remove('copied');
            copyButton.innerHTML = `
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              <span>复制</span>
            `;
          }, 2000);
        } catch (error) {
          console.error('Failed to copy:', error);
        }
      });

      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
      wrapper.appendChild(copyButton);
    });
  };

  const renderContent = () => {
    const content = scenario?.sop_content || '';

    if (!content) {
      return (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>暂无 SOP 内容</p>
        </div>
      );
    }

    switch (viewMode) {
      case 'html':
        return (
          <div
            ref={contentRef}
            className="sop-content"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );

      case 'markdown':
        const markdown = convertToMarkdown(content);
        return (
          <div className="sop-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdown}
            </ReactMarkdown>
          </div>
        );

      case 'plaintext':
        const plainText = convertToPlainText(content);
        return (
          <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
            {plainText}
          </pre>
        );

      default:
        return null;
    }
  };

  const getModeIcon = () => {
    switch (viewMode) {
      case 'html':
        return <Globe className="w-4 h-4" />;
      case 'markdown':
        return <Code className="w-4 h-4" />;
      case 'plaintext':
        return <Type className="w-4 h-4" />;
    }
  };

  const getModeName = () => {
    switch (viewMode) {
      case 'html':
        return 'HTML 格式';
      case 'markdown':
        return 'Markdown 格式';
      case 'plaintext':
        return '纯文本';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">文档不存在</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/sop-library')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{scenario.name}</h1>
            {scenario.description && (
              <p className="text-sm text-gray-500 mt-1">{scenario.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowModeMenu(!showModeMenu)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {getModeIcon()}
              {getModeName()}
              <ChevronDown className="w-4 h-4" />
            </button>
            {showModeMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                <button
                  onClick={() => {
                    setViewMode('html');
                    setShowModeMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                    viewMode === 'html'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  HTML 格式
                </button>
                <button
                  onClick={() => {
                    setViewMode('markdown');
                    setShowModeMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                    viewMode === 'markdown'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Code className="w-4 h-4" />
                  Markdown 格式
                </button>
                <button
                  onClick={() => {
                    setViewMode('plaintext');
                    setShowModeMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                    viewMode === 'plaintext'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Type className="w-4 h-4" />
                  纯文本
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate(`/scenarios/${scenario.id}`)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            编辑
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{scenario.name}</h1>
            {scenario.description && (
              <p className="text-gray-600 mb-6">{scenario.description}</p>
            )}
          </div>

          {scenario.flowchart_data && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
                <GitBranch className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">流程图</h2>
              </div>
              {renderFlowchart()}
            </div>
          )}

          {/* 工作流调用界面 - 始终显示 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
            {/* 头部区域 */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      关联工作流
                      {workflow && (
                        <span className="text-xs font-normal bg-purple-100 text-purple-700 px-2 py-1 rounded">自动化</span>
                      )}
                    </h2>
                    {workflow ? (
                      <>
                        <p className="text-base text-gray-700 mt-1 font-medium">{workflow.name}</p>
                        {workflow.description && (
                          <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">此SOP文档暂未关联工作流</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {workflow ? (
                    <>
                      <button
                        onClick={() => navigate(`/workflows/${workflow.id}`)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        查看详情
                      </button>
                      <button
                        onClick={handleExecuteWorkflow}
                        disabled={executing}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 active:from-green-800 active:to-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md font-medium transform hover:scale-105"
                      >
                        <Play className={`w-5 h-5 ${executing ? 'animate-pulse' : ''}`} />
                        {executing ? '执行中...' : '启动执行'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => navigate(`/scenarios/${scenario?.id}`)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      关联工作流
                    </button>
                  )}
                </div>
              </div>

              {/* 工作流统计信息 */}
              {workflow?.definition && (() => {
                try {
                  const def = JSON.parse(workflow.definition);
                  const nodeCount = def.nodes?.length || 0;
                  const edgeCount = def.edges?.length || 0;
                  return (
                    <div className="mt-4 flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>{nodeCount} 个节点</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>{edgeCount} 个连接</span>
                      </div>
                    </div>
                  );
                } catch {
                  return null;
                }
              })()}
            </div>

            {/* 执行历史或未关联提示 */}
            <div className="px-8 py-6">
              {workflow ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      最近执行记录
                    </h3>
                    {executionLogs.length > 0 && (
                      <button
                        onClick={() => navigate('/execution-logs')}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        查看全部
                      </button>
                    )}
                  </div>

                  {loadingLogs ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto"></div>
                      <p className="mt-2 text-sm">加载执行记录...</p>
                    </div>
                  ) : executionLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">暂无执行记录</p>
                      <p className="text-xs mt-1">点击"启动执行"开始第一次运行</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {executionLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex-shrink-0">
                              {log.status === 'completed' && (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              )}
                              {log.status === 'failed' && (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                              {log.status === 'running' && (
                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-mono text-gray-900 truncate">
                                  {log.execution_id}
                                </p>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded ${
                                    log.status === 'completed'
                                      ? 'bg-green-100 text-green-700'
                                      : log.status === 'failed'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  {log.status === 'completed'
                                    ? '成功'
                                    : log.status === 'failed'
                                    ? '失败'
                                    : '运行中'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {new Date(log.started_at).toLocaleString('zh-CN', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                                {log.completed_at && log.status !== 'running' && (
                                  <span className="ml-2">
                                    · 耗时{' '}
                                    {Math.round(
                                      (new Date(log.completed_at).getTime() -
                                        new Date(log.started_at).getTime()) /
                                        1000
                                    )}
                                    秒
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                    <Activity className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">未关联工作流</h3>
                  <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                    为此SOP文档关联一个工作流，即可实现自动化执行。工作流可以自动完成重复性操作，提高工作效率。
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => navigate('/workflows')}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      <Activity className="w-4 h-4" />
                      查看所有工作流
                    </button>
                    <button
                      onClick={() => navigate(`/scenarios/${scenario?.id}`)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md font-medium text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      去关联工作流
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">SOP 文档内容</h2>
            </div>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
