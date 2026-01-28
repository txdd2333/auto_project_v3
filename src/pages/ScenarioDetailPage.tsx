import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dataService } from '../services';
import { FileText, GitBranch, Workflow, Play, Save, ArrowLeft, Upload, Download, ChevronDown, Wand2 } from 'lucide-react';
import { importDocument, exportDocument, getAcceptedFileTypes, type ExportFormat } from '../lib/documentUtils';
import type { Scenario as DbScenario } from '../lib/database.types';
import MarkdownEditor from '../components/MarkdownEditor';
import ReactFlowEditor, { ReactFlowEditorRef } from '../components/ReactFlowEditor';
import { playwrightService } from '../services/playwright/PlaywrightService';
import { useToastContext } from '../contexts/ToastContext';
import AIService from '../services/ai/AIService';

interface Workflow {
  id: string;
  name: string;
  description: string;
}

type TabType = 'sop' | 'flowchart' | 'workflow';

export default function ScenarioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToastContext();
  const [scenario, setScenario] = useState<DbScenario | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('sop');
  const [sopContent, setSopContent] = useState('');
  const [flowchartData, setFlowchartData] = useState<string>('');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [importing, setImporting] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const flowEditorRef = useRef<ReactFlowEditorRef>(null);

  useEffect(() => {
    loadScenario();
    loadWorkflows();
  }, [id]);

  // 监控 sopContent 变化
  useEffect(() => {
    console.log('>>> sopContent 状态已更新');
    console.log('sopContent length:', sopContent.length);
    console.log('sopContent preview:', sopContent.substring(0, 100));
  }, [sopContent]);

  const loadScenario = async () => {
    if (!id) {
      navigate('/scenarios');
      return;
    }

    try {
      const { data, error } = await dataService.queryOne('scenarios', {
        filter: { id }
      });

      if (error) throw error;
      if (!data) {
        navigate('/scenarios');
        return;
      }

      setScenario(data);
      setSopContent(data.sop_content || '');
      setSelectedWorkflowId(data.workflow_id || '');

      if (data.flowchart_data && typeof data.flowchart_data === 'string') {
        setFlowchartData(data.flowchart_data);
      }
    } catch (error) {
      console.error('Error loading scenario:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflows = async () => {
    try {
      const { data, error } = await dataService.query('workflows', {
        select: 'id, name, description',
        order: { column: 'created_at', ascending: false }
      });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error loading workflows:', error);
    }
  };

  const handleSave = async () => {
    if (!scenario) return;
    setSaving(true);

    try {
      const updates: any = {};

      if (activeTab === 'sop') {
        updates.sop_content = sopContent;
      } else if (activeTab === 'flowchart') {
        const data = await flowEditorRef.current?.getData();
        if (data) {
          updates.flowchart_data = data;
          setFlowchartData(data);
        }
      } else if (activeTab === 'workflow') {
        updates.workflow_id = selectedWorkflowId || null;
      }

      updates.updated_at = new Date().toISOString();

      const { error } = await dataService.update('scenarios', scenario.id, updates);

      if (error) throw error;

      setScenario({ ...scenario, ...updates });
      toast.success('保存成功！');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleExecute = async () => {
    if (!selectedWorkflowId) {
      toast.warning('请先在"关联工作流"选项卡中选择一个工作流');
      return;
    }

    setExecuting(true);
    try {
      const { data: workflowData, error: workflowError } = await dataService.queryOne('workflows', {
        filter: { id: selectedWorkflowId }
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

      let workflow;
      try {
        workflow = JSON.parse(definition);
      } catch {
        toast.error('工作流数据格式错误');
        return;
      }

      const workflowPayload = {
        nodes: workflow.nodes.map((n: any) => ({
          id: n.id,
          type: n.type,
          properties: n.data || n.properties
        })),
        edges: workflow.edges.map((e: any) => ({
          id: e.id,
          sourceNodeId: e.source || e.sourceNodeId,
          targetNodeId: e.target || e.targetNodeId
        }))
      };

      const { executionId } = await playwrightService.executeWorkflow(workflowPayload, {
        scenarioId: scenario?.id,
        scenarioName: scenario?.name
      });

      await dataService.insert('execution_logs', {
        workflow_id: selectedWorkflowId,
        scenario_id: scenario?.id,
        status: 'running',
        execution_id: executionId,
        started_at: new Date().toISOString()
      });

      toast.success(`工作流开始执行！执行ID: ${executionId}`);
      toast.info('请查看后端终端查看执行日志', 5000);
    } catch (error: any) {
      console.error('Error executing workflow:', error);
      toast.error(`执行失败：${error.message}`);
      toast.warning('请确保后端服务已启动（npm run server）', 5000);
    } finally {
      setExecuting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      console.log('=== 开始PDF导入流程 ===');
      console.log('文件名:', file.name);
      const html = await importDocument(file);
      console.log('✓ PDF解析完成');
      console.log('生成的 HTML 长度:', html.length);
      console.log('生成的 HTML 前100字符:', html.substring(0, 100));
      console.log('当前 sopContent 长度:', sopContent.length);

      console.log('>>> 调用 setSopContent...');
      setSopContent(html);

      // 使用 setTimeout 验证状态是否更新
      setTimeout(() => {
        console.log('✓ setSopContent 完成，验证状态...');
        console.log('sopContent 应该已更新（这里看不到新值，因为闭包问题）');
      }, 50);

      toast.success('导入成功！');
    } catch (error) {
      console.error('❌ Import error:', error);
      toast.error(error instanceof Error ? error.message : '导入失败，请重试');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async (format: ExportFormat) => {
    const baseName = scenario?.name || 'SOP文档';
    try {
      await exportDocument(sopContent, format, baseName);
      setShowExportMenu(false);
      toast.success('导出成功！');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('导出失败，请重试');
    }
  };

  const handleAIFormat = async () => {
    if (!sopContent || !sopContent.trim()) {
      toast.warning('文档内容为空，无法进行排版优化');
      return;
    }

    setFormatting(true);
    try {
      const config = await AIService.getActiveConfig();
      if (!config) {
        toast.error('请先在AI配置页面配置并激活一个AI模型');
        return;
      }

      toast.info('AI正在深度理解并优化文档排版，请稍候...');

      const response = await AIService.chat({
        messages: [
          {
            role: 'system',
            content: `你是一个专业的文档结构化专家和内容拆解专家。

# 🎯 第一优先级任务：深度拆解混合内容

**最重要的任务**：当文档中出现"步骤描述+命令+执行结果"混杂在一起的超长段落时，你必须将其彻底拆解！

## 典型问题示例：
输入："1. 查询对应Zone的ob_server状态 select * from ob_server where zone_name='xxx'\\G ; 执行结果: MySQL [oceanbase]> select * from ocp.ob_server where zone_name='zone3'\\G ; *************************** 1. row *************************** id: 1000117 create_time: 2022-11-01 18:09:19 update_time: 2024-03-27 18:54:32 creator: NULL ip: xxxx.xx.xx.xx port: 2882 sql_port: 2881 version: 3.1.2_10000392021123010..."

这种内容必须拆解为：

1. 步骤描述段落：
<p>1. 查询对应 Zone 的 <code>ob_server</code> 状态，若所有状态均为 <code>RUNNING</code> 则说明 <code>ob_server</code> 无数据。</p>

2. 命令代码块：
<p><strong>执行命令：</strong></p>
<pre><code class="language-sql">select * from ob_server where zone_name='xxx'\\G;</code></pre>

3. 结果代码块（格式化后）：
<p><strong>执行结果：</strong></p>
<pre><code class="language-text">MySQL [oceanbase]> select * from ocp.ob_server where zone_name='zone3'\\G;
*************************** 1. row ***************************
id: 1000117
create_time: 2022-11-01 18:09:19
update_time: 2024-03-27 18:54:32
creator: NULL
ip: xxxx.xx.xx.xx
port: 2882
sql_port: 2881
version: 3.1.2_10000392021123010
cluster_id: 1
host_id: 1000066
zone_name: zone3
status: RUNNING</code></pre>

# 核心原则
1. **深度拆解混合内容**：这是第一优先级！遇到混合内容必须拆分
2. **不删减原文内容**：保持所有实质性文字内容完整
3. **可以增加标题**：根据上下文理解，为缺少标题的章节自动生成合适的标题
4. **智能层级划分**：分析文档逻辑结构，赋予合适的标题层级

# 具体要求

## 1. 标题层级规范
- **h1**：文档主标题（全文只有一个，如果没有则根据文档主题生成）
- **h2**：主要章节标题（如：一、项目概述；二、实施步骤）
- **h3**：次级标题（如：2.1 环境准备；2.2 系统配置）
- **h4**：子节标题（如：2.1.1 硬件要求）
- **h5/h6**：更细分的标题

识别规则：
- 如果文本是"一、二、三"或"1. 2. 3."开头的短句，应该是h2
- 如果是"1.1、1.2"或"（一）（二）"，应该是h3
- 如果段落内容是总结性、概括性的短句，应该考虑作为标题
- 如果缺少标题但有明显的主题转换，根据后续段落内容的主题，自动生成标题

## 2. 段落处理
- 正文段落必须用<p>标签包裹
- 删除段落之间多余的空行（超过一个<br>的都删除）
- 段落文字保持完整，自然断句
- 确保每个<p>标签内容充实，不要空标签

## 3. 列表识别与转换
识别以下模式并转换为HTML列表：
- "1. 2. 3." 或 "1) 2) 3)" 或 "1、2、3、" → <ol><li>
- "• - * ► →" 等符号开头 → <ul><li>
- "第一、第二、第三" → <ol><li>
- "①②③" 或 "⑴⑵⑶" → <ol><li>

列表项内容保持原文，但移除前面的编号符号

## 4. 表格规范化
- 确保使用完整的<table><thead><tbody><tr><th><td>结构
- 第一行通常是表头，使用<th>
- 数据行使用<td>

## 5. 混合内容深度拆解（最核心！）
**这是整个排版任务的重点！必须严格执行！**

### 5.1 🚨 识别需要拆解的内容模式

**特征1：超长段落包含多种内容**
- 段落长度超过200字，包含步骤编号、命令、结果输出
- 例如："1. 查询... select * from... MySQL> ... row 1 row 2... 2. 删除... delete from..."

**特征2：技术内容未分离**
- 描述文字和命令混在一起，没有换行
- SQL命令后直接跟着查询结果，没有分隔
- 命令提示符（MySQL>, $, #）出现在正文段落中

**特征3：查询结果未格式化**
- 多个字段值挤在一行："id: 1000117 create_time: 2022-11-01 port: 2882 status: RUNNING..."
- 应该拆分为多行，每个字段一行

### 5.2 🔧 拆解执行步骤（严格按此顺序）

**步骤1：识别并提取步骤编号和描述**
- 查找："1."、"2."、"步骤一"、"第一步"等开头
- 提取描述性文字到该步骤实际命令之间的内容
- 输出为：<p>步骤编号 + 描述文字</p>

**步骤2：识别并提取命令**
- 从描述后查找SQL关键字：select、insert、update、delete、show、desc
- 从描述后查找Shell命令：cd、ls、docker、systemctl、mysql等
- 命令结束标志：分号;、\\G、换行后是结果输出
- 输出为：<p><strong>执行命令：</strong></p><pre><code class="language-sql或bash">实际命令</code></pre>

**步骤3：识别并提取执行结果**
- 查找命令提示符后的内容：MySQL [xxx]>、$、# 等
- 查找行分隔符：******、++++++、------
- 查找字段值模式：key: value 格式
- 将所有字段值拆分为多行（每个字段一行）
- 输出为：<p><strong>执行结果：</strong></p><pre><code class="language-text">格式化后的结果</code></pre>

**步骤4：重复处理多个步骤**
- 如果文档有多个步骤（1. 2. 3. 4.），对每个步骤重复步骤1-3

### 5.3 语言标记规则
- SQL命令 → class="language-sql"
- Shell/Bash命令 → class="language-bash"
- 执行结果/输出 → class="language-text"
- JSON → class="language-json"
- Python/Java等 → class="language-python/java"

### 5.4 格式化要点
- 查询结果的字段值必须拆分为多行，每个字段一行
- 保持原始数据完整，不删减信息
- 添加"执行命令："和"执行结果："说明标签

## 6. 特殊格式
- **强调内容**：用<strong>标记
- *斜体*：用<em>标记
- 引用内容：用<blockquote>标记

## 7. 清理工作
- 删除连续的空白标签（如连续的<br>、<p></p>）
- 合并重复的格式标签
- 确保HTML结构正确闭合

# 输出要求
只返回优化后的HTML内容，不要任何解释文字。HTML应该干净、语义化、结构清晰。`,
          },
          {
            role: 'user',
            content: `请深度理解以下文档内容，然后进行智能排版优化：

文档内容：
${sopContent}

🚨 **最高优先级任务**：深度拆解混合内容！

如果文档中出现类似这样的混合段落：
"1. 查询... select * from... MySQL> ... id: xxx port: xxx... 2. 删除... delete from..."

你必须将其彻底拆解为清晰的结构：
- 每个步骤的描述 → 单独的 <p> 段落
- 每条命令 → 单独的 <pre><code class="language-sql/bash"> 代码块
- 每个执行结果 → 单独的 <pre><code class="language-text"> 代码块（格式化，字段换行）

📋 **具体执行步骤**：

1. **第一步：深度扫描文档，识别混合内容**
   - 查找超长段落（>200字）
   - 查找包含"1. 2. 3."编号、SQL命令、查询结果的段落
   - 这些段落需要拆解！

2. **第二步：逐个拆解每个步骤**
   - 提取步骤编号和描述 → <p>1. 描述文字</p>
   - 提取命令 → <p><strong>执行命令：</strong></p><pre><code class="language-sql">命令</code></pre>
   - 提取结果并格式化 → <p><strong>执行结果：</strong></p><pre><code class="language-text">结果\n字段1: 值1\n字段2: 值2...</code></pre>

3. **第三步：格式化查询结果**
   - 将密集的字段值（id: xxx port: xxx status: xxx）拆分为多行
   - 保持原始数据完整，只是增加换行提高可读性

4. **第四步：添加正确的语言标记**
   - SQL 命令 → class="language-sql"
   - Shell 命令 → class="language-bash"
   - 执行结果 → class="language-text"

5. **第五步：标题和段落结构化**
   - 为主要章节生成h1/h2标题
   - 正文用<p>标签包裹

6. **第六步：清理和优化**
   - 删除多余空行
   - 确保HTML结构正确

7. **只返回HTML**：只返回优化后的HTML，不要解释文字`,
          },
        ],
        temperature: 0.2,
        max_tokens: 8192,
      });

      if (response.content && response.content.trim()) {
        let formattedHtml = response.content.trim();

        formattedHtml = formattedHtml.replace(/^```html\n?/, '').replace(/\n?```$/, '');
        formattedHtml = formattedHtml.replace(/^```\n?/, '').replace(/\n?```$/, '');

        setSopContent(formattedHtml);
        toast.success('文档排版优化完成！AI已智能优化文档结构和标题层级');
      } else {
        toast.error('AI返回内容为空');
      }
    } catch (error: any) {
      console.error('AI format error:', error);
      toast.error(`AI排版失败：${error.message || '未知错误'}`);
    } finally {
      setFormatting(false);
    }
  };

  const handleAIGenerateFlowchart = async () => {
    if (!sopContent || !sopContent.trim()) {
      toast.warning('请先编写SOP文档内容');
      return;
    }

    if (!scenario) {
      toast.error('场景数据未加载');
      return;
    }

    setGenerating(true);
    try {
      const config = await AIService.getActiveConfig();
      if (!config) {
        toast.error('请先在AI配置页面配置并激活一个AI模型');
        return;
      }

      toast.info('AI正在深度分析文档并生成流程图，请稍候...');

      // 将HTML转换为纯文本用于AI分析
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = sopContent;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';

      if (flowEditorRef.current) {
        const result = await flowEditorRef.current.generateFromAI(textContent);

        // 根据图形类型给出不同的提示
        let graphTypeText = '流程图';
        if (result?.graphType === 'mindmap') {
          graphTypeText = '思维导图';
        } else if (result?.graphType === 'hybrid') {
          graphTypeText = '综合结构图';
        }

        // 自动保存生成的流程图到数据库
        toast.info(`正在保存${graphTypeText}...`);
        const data = await flowEditorRef.current.getData();
        if (data) {
          const updates = {
            flowchart_data: data,
            updated_at: new Date().toISOString()
          };

          const { error } = await dataService.update('scenarios', scenario.id, updates);

          if (error) {
            console.error('Save error:', error);
            toast.error(`${graphTypeText}生成成功，但保存失败，请手动点击保存按钮`);
          } else {
            setFlowchartData(data);
            setScenario({ ...scenario, ...updates });
            const nodeCount = result?.nodeCount || 0;
            toast.success(`${graphTypeText}生成并保存成功！AI已识别并生成${nodeCount}个节点`);
          }
        }
      }
    } catch (error: any) {
      console.error('AI generate flowchart error:', error);
      toast.error(`AI生成流程图失败：${error.message || '未知错误'}`);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as globalThis.Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

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
        <div className="text-gray-500">场景不存在</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/scenarios')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{scenario.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{scenario.description}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            onClick={handleExecute}
            disabled={executing || !selectedWorkflowId}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!selectedWorkflowId ? '请先关联一个工作流' : ''}
          >
            <Play className="w-4 h-4" />
            {executing ? '执行中...' : '启动执行'}
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('sop')}
          className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'sop'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          SOP 文档
        </button>
        <button
          onClick={() => setActiveTab('flowchart')}
          className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'flowchart'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          流程图
        </button>
        <button
          onClick={() => setActiveTab('workflow')}
          className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'workflow'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Workflow className="w-4 h-4" />
          关联工作流
        </button>
      </div>

      <div className="flex-1 overflow-hidden bg-slate-50 relative">
        {activeTab === 'sop' && (
          <div className="absolute inset-0 p-6">
            <div className="h-full flex flex-col">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    标准操作程序文档
                  </h3>
                  <p className="text-sm text-gray-500">
                    编写详细的操作步骤、注意事项和应急处理流程。支持标题、列表、代码块、表格、图片等丰富格式。
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={getAcceptedFileTypes()}
                    onChange={handleFileImport}
                    className="hidden"
                  />
                  <button
                    onClick={handleAIFormat}
                    disabled={formatting || !sopContent}
                    className="px-3 py-1.5 text-sm border border-purple-300 text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="AI智能排版：深度理解文档，优化结构层级，自动生成标题，规范段落格式"
                  >
                    <Wand2 className="w-4 h-4" />
                    {formatting ? 'AI排版中...' : 'AI智能排版'}
                  </button>
                  <button
                    onClick={handleImportClick}
                    disabled={importing}
                    className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    {importing ? '导入中...' : '导入'}
                  </button>
                  <div className="relative" ref={exportMenuRef}>
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      导出
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {showExportMenu && (
                      <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                        <button
                          onClick={() => handleExport('txt')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          纯文本 (.txt)
                        </button>
                        <button
                          onClick={() => handleExport('md')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Markdown (.md)
                        </button>
                        <button
                          onClick={() => handleExport('docx')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Word (.docx)
                        </button>
                        <button
                          onClick={() => handleExport('html')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          HTML (.html)
                        </button>
                        <button
                          onClick={() => handleExport('pdf')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          PDF (.pdf)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <MarkdownEditor
                  value={sopContent}
                  onChange={setSopContent}
                  placeholder="在此编写应急处理流程、操作步骤、注意事项等内容..."
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'flowchart' && (
          <div className="absolute inset-0">
            {/* AI生成中的遮罩层 */}
            {generating && (
              <div className="absolute inset-0 bg-white bg-opacity-90 z-30 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                  <div className="text-center max-w-md px-4">
                    <p className="text-lg font-semibold text-gray-900 mb-2">AI 正在智能分析...</p>
                    <p className="text-sm text-gray-600 mb-1">正在深度理解文档内容和结构</p>
                    <p className="text-xs text-gray-500">AI会自动选择最适合的图形模型（流程图/思维导图）</p>
                  </div>
                </div>
              </div>
            )}

            <div className="absolute top-4 right-4 z-20 flex gap-2">
              <button
                onClick={handleAIGenerateFlowchart}
                disabled={!sopContent || generating}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title="基于SOP文档智能生成流程图"
              >
                <Wand2 className="w-4 h-4" />
                {generating ? 'AI生成中...' : 'AI智能生成流程图'}
              </button>
            </div>
            <ReactFlowEditor
              ref={flowEditorRef}
              initialData={flowchartData}
              onDataChange={(data) => setFlowchartData(data)}
              onSave={handleSave}
            />
          </div>
        )}

        {activeTab === 'workflow' && (
          <div className="absolute inset-0 p-6 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择关联工作流
                </label>
                <p className="text-sm text-gray-500 mb-4">
                  将此应急场景关联到一个自动化工作流，可以一键执行预定义的操作步骤
                </p>
              </div>

              <select
                value={selectedWorkflowId}
                onChange={(e) => setSelectedWorkflowId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">不关联工作流</option>
                {workflows.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name} {workflow.description && `- ${workflow.description}`}
                  </option>
                ))}
              </select>

              {workflows.length === 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    暂无可用工作流，请先在
                    <button
                      onClick={() => navigate('/workflows')}
                      className="text-blue-600 hover:underline mx-1"
                    >
                      工作流管理
                    </button>
                    中创建工作流
                  </p>
                </div>
              )}

              {selectedWorkflowId && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    已选择工作流。保存后，您可以直接启动此工作流来处理该应急场景。
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
