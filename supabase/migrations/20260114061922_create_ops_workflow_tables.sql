/*
  # 运维中心应急工作流平台 - 数据库架构

  ## 新建表

  ### 1. modules (模块表)
  存储可复用的自动化操作模块定义
  - `id` (uuid, 主键) - 模块ID
  - `name` (text) - 模块名称，如"打开水滴链接"
  - `description` (text) - 模块描述
  - `type` (text) - 模块类型：open_url(打开URL)、fill_form(填写表单)、click_element(点击元素)、wait(等待)、execute_command(执行命令)等
  - `config` (jsonb) - 模块配置参数，如 {url: "https://skyeye.unicom.local", selector: "#login-btn"}
  - `icon` (text) - 模块图标
  - `color` (text) - 模块颜色
  - `created_at` (timestamptz) - 创建时间
  - `updated_at` (timestamptz) - 更新时间

  ### 2. workflows (工作流表)
  存储工作流定义
  - `id` (uuid, 主键) - 工作流ID
  - `name` (text) - 工作流名称
  - `description` (text) - 工作流描述
  - `created_at` (timestamptz) - 创建时间
  - `updated_at` (timestamptz) - 更新时间

  ### 3. workflow_nodes (工作流节点表)
  存储工作流中的节点（模块实例）
  - `id` (uuid, 主键) - 节点ID
  - `workflow_id` (uuid, 外键) - 所属工作流
  - `module_id` (uuid, 外键) - 使用的模块
  - `node_id` (text) - React Flow节点ID
  - `position` (jsonb) - 节点位置 {x: 100, y: 200}
  - `data` (jsonb) - 节点数据，包含参数等
  - `created_at` (timestamptz) - 创建时间

  ### 4. workflow_edges (工作流连接表)
  存储工作流节点之间的连接关系
  - `id` (uuid, 主键) - 连接ID
  - `workflow_id` (uuid, 外键) - 所属工作流
  - `edge_id` (text) - React Flow边ID
  - `source_node_id` (text) - 源节点ID
  - `target_node_id` (text) - 目标节点ID
  - `created_at` (timestamptz) - 创建时间

  ### 5. scenarios (应急场景表)
  存储应急处置场景
  - `id` (uuid, 主键) - 场景ID
  - `name` (text) - 场景名称，如"OB集群故障处置"
  - `description` (text) - 场景描述
  - `workflow_id` (uuid, 外键) - 关联的工作流
  - `parameters` (jsonb) - 场景参数定义，如 [{name: "cluster_name", label: "集群名称", type: "text"}]
  - `created_at` (timestamptz) - 创建时间
  - `updated_at` (timestamptz) - 更新时间

  ### 6. execution_logs (执行日志表)
  存储工作流执行记录
  - `id` (uuid, 主键) - 日志ID
  - `scenario_id` (uuid, 外键) - 场景ID
  - `workflow_id` (uuid, 外键) - 工作流ID
  - `parameters` (jsonb) - 执行参数
  - `status` (text) - 执行状态：pending(待执行)、running(执行中)、completed(完成)、failed(失败)
  - `started_at` (timestamptz) - 开始时间
  - `completed_at` (timestamptz) - 完成时间
  - `error_message` (text) - 错误信息
  - `created_at` (timestamptz) - 创建时间

  ## 安全策略
  - 所有表启用 RLS
  - 暂时允许所有已认证用户访问（后续可根据需求细化权限）
*/

-- 创建 modules 表
CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  type text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  icon text DEFAULT 'Box',
  color text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建 workflows 表
CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建 workflow_nodes 表
CREATE TABLE IF NOT EXISTS workflow_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  node_id text NOT NULL,
  position jsonb DEFAULT '{}'::jsonb,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 创建 workflow_edges 表
CREATE TABLE IF NOT EXISTS workflow_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  edge_id text NOT NULL,
  source_node_id text NOT NULL,
  target_node_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 创建 scenarios 表
CREATE TABLE IF NOT EXISTS scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  workflow_id uuid REFERENCES workflows(id) ON DELETE SET NULL,
  parameters jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建 execution_logs 表
CREATE TABLE IF NOT EXISTS execution_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid REFERENCES scenarios(id) ON DELETE SET NULL,
  workflow_id uuid REFERENCES workflows(id) ON DELETE SET NULL,
  parameters jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- 启用 RLS
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略（暂时允许所有已认证用户访问）
CREATE POLICY "Allow authenticated users to view modules"
  ON modules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create modules"
  ON modules FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update modules"
  ON modules FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete modules"
  ON modules FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to view workflows"
  ON workflows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create workflows"
  ON workflows FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update workflows"
  ON workflows FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete workflows"
  ON workflows FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to view workflow_nodes"
  ON workflow_nodes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create workflow_nodes"
  ON workflow_nodes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update workflow_nodes"
  ON workflow_nodes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete workflow_nodes"
  ON workflow_nodes FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to view workflow_edges"
  ON workflow_edges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create workflow_edges"
  ON workflow_edges FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update workflow_edges"
  ON workflow_edges FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete workflow_edges"
  ON workflow_edges FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to view scenarios"
  ON scenarios FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create scenarios"
  ON scenarios FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update scenarios"
  ON scenarios FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete scenarios"
  ON scenarios FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to view execution_logs"
  ON execution_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create execution_logs"
  ON execution_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update execution_logs"
  ON execution_logs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_workflow_id ON workflow_nodes(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_edges_workflow_id ON workflow_edges(workflow_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_workflow_id ON scenarios(workflow_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_scenario_id ON execution_logs(scenario_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_status ON execution_logs(status);

-- 插入一些示例模块
INSERT INTO modules (name, description, type, config, icon, color) VALUES
  ('打开URL', '在新标签页中打开指定URL', 'open_url', '{"url": ""}', 'ExternalLink', '#3b82f6'),
  ('等待页面加载', '等待页面完全加载', 'wait', '{"seconds": 2}', 'Clock', '#10b981'),
  ('点击元素', '点击页面上的指定元素', 'click_element', '{"selector": ""}', 'MousePointer', '#f59e0b'),
  ('填写表单', '填写表单字段', 'fill_form', '{"selector": "", "value": ""}', 'Edit', '#8b5cf6'),
  ('执行命令', '在终端执行命令', 'execute_command', '{"command": ""}', 'Terminal', '#ef4444')
ON CONFLICT DO NOTHING;
