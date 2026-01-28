/*
  # 为应急场景添加 SOP 文档和流程图字段
  
  ## 修改内容
  
  ### 1. 添加字段到 scenarios 表
  - `sop_content` (text) - SOP（标准操作程序）文档内容，支持 Markdown 格式
  - `flowchart_data` (jsonb) - 流程图数据，存储节点和连接信息
  
  ### 2. 字段说明
  - sop_content: 存储详细的操作步骤和注意事项，可以使用 Markdown 格式
  - flowchart_data: 存储流程图的可视化数据，包含节点位置、连接关系等
    格式示例: {
      "nodes": [{"id": "1", "type": "step", "position": {"x": 100, "y": 100}, "data": {"label": "步骤1"}}],
      "edges": [{"id": "e1-2", "source": "1", "target": "2"}]
    }
*/

-- 添加 sop_content 字段
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'sop_content'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN sop_content text DEFAULT '';
  END IF;
END $$;

-- 添加 flowchart_data 字段
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenarios' AND column_name = 'flowchart_data'
  ) THEN
    ALTER TABLE scenarios ADD COLUMN flowchart_data jsonb DEFAULT '{"nodes": [], "edges": []}'::jsonb;
  END IF;
END $$;
