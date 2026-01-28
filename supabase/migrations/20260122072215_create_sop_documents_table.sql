/*
  # 创建 SOP 文档表

  1. 新表
    - `sop_documents`
      - `id` (uuid, 主键)
      - `title` (text, 文档标题)
      - `content` (text, 文档内容 - Markdown/HTML)
      - `category` (text, 分类)
      - `tags` (text[], 标签数组)
      - `user_id` (uuid, 创建者ID)
      - `created_at` (timestamptz, 创建时间)
      - `updated_at` (timestamptz, 更新时间)
  
  2. 安全性
    - 启用 RLS
    - 用户可以查看所有 SOP 文档
    - 用户只能编辑自己创建的文档
*/

CREATE TABLE IF NOT EXISTS sop_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text DEFAULT '',
  category text DEFAULT '',
  tags text[] DEFAULT '{}',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sop_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view SOP documents"
  ON sop_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own SOP documents"
  ON sop_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own SOP documents"
  ON sop_documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own SOP documents"
  ON sop_documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
