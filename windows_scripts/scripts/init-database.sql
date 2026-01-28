-- =========================================
-- 运维中心应急工作流平台 - MySQL 数据库初始化脚本
-- =========================================
--
-- 说明：
--   1. 本脚本基于 Supabase migrations 转换为 MySQL 兼容版本
--   2. 移除了所有 PostgreSQL 特有功能（RLS、触发器等）
--   3. 移除了 auth.users 依赖，使用独立的 user_profiles 表
--   4. UUID 使用 CHAR(36) 类型存储
--   5. 安全性通过应用层控制
--
-- 适用版本：
--   - MySQL 5.7+
--   - OceanBase MySQL 兼容模式
--
-- =========================================

-- 设置字符集
SET NAMES utf8mb4;
SET collation_connection = 'utf8mb4_general_ci';
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================
-- 1. 用户系统表
-- =========================================

-- 用户资料表（核心表，包含认证和授权信息）
DROP DATABASE IF EXISTS ops_workflow_center;

CREATE DATABASE IF NOT EXISTS ops_workflow_center DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE ops_workflow_center;

DROP TABLE IF EXISTS `user_profiles`;
CREATE TABLE `user_profiles` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'bcrypt 加密的密码',
  `phone` VARCHAR(50) DEFAULT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'read_only' CHECK (`role` IN ('super_admin', 'admin', 'read_write', 'read_only')),
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (`status` IN ('active', 'locked', 'pending', 'deleted')),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` CHAR(36) DEFAULT NULL,
  `last_login_at` DATETIME DEFAULT NULL,
  INDEX `idx_user_profiles_email` (`email`),
  INDEX `idx_user_profiles_role` (`role`),
  INDEX `idx_user_profiles_status` (`status`),
  FOREIGN KEY (`created_by`) REFERENCES `user_profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户资料表';

-- 注册申请表
DROP TABLE IF EXISTS `account_requests`;
CREATE TABLE `account_requests` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone` VARCHAR(50) DEFAULT NULL,
  `requested_role` VARCHAR(20) NOT NULL DEFAULT 'read_only' CHECK (`requested_role` IN ('read_write', 'read_only')),
  `reason` TEXT DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (`status` IN ('pending', 'approved', 'rejected')),
  `requested_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` DATETIME DEFAULT NULL,
  `reviewed_by` CHAR(36) DEFAULT NULL,
  `review_notes` TEXT DEFAULT NULL,
  `user_id` CHAR(36) DEFAULT NULL,
  INDEX `idx_account_requests_email` (`email`),
  INDEX `idx_account_requests_status` (`status`),
  FOREIGN KEY (`reviewed_by`) REFERENCES `user_profiles`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user_profiles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='注册申请表';

-- =========================================
-- 2. 模块和工作流表
-- =========================================

-- 模块表（可复用的自动化操作模块）
DROP TABLE IF EXISTS `modules`;
CREATE TABLE `modules` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL COMMENT '模块描述',
  `type` VARCHAR(50) NOT NULL COMMENT '模块类型：open_url, fill_form, click_element, wait, execute_command 等',
  `config` JSON DEFAULT NULL COMMENT '模块配置参数',
  `icon` VARCHAR(50) DEFAULT 'Box',
  `color` VARCHAR(20) DEFAULT '#3b82f6',
  `user_id` CHAR(36) NOT NULL COMMENT '创建者',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_modules_type` (`type`),
  INDEX `idx_modules_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `user_profiles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模块表';

-- 工作流表
DROP TABLE IF EXISTS `workflows`;
CREATE TABLE `workflows` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL COMMENT '工作流描述',
  `definition` JSON DEFAULT NULL COMMENT '工作流定义（React Flow 格式）',
  `user_id` CHAR(36) NOT NULL COMMENT '创建者',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_workflows_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `user_profiles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作流表';

-- 工作流节点表
DROP TABLE IF EXISTS `workflow_nodes`;
CREATE TABLE `workflow_nodes` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `workflow_id` CHAR(36) NOT NULL,
  `module_id` CHAR(36) NOT NULL,
  `node_id` VARCHAR(100) NOT NULL,
  `position` JSON DEFAULT NULL COMMENT '节点位置 {x, y}',
  `data` JSON DEFAULT NULL COMMENT '节点数据',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_workflow_nodes_workflow_id` (`workflow_id`),
  INDEX `idx_workflow_nodes_module_id` (`module_id`),
  FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作流节点表';

-- 工作流连接表
DROP TABLE IF EXISTS `workflow_edges`;
CREATE TABLE `workflow_edges` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `workflow_id` CHAR(36) NOT NULL,
  `edge_id` VARCHAR(100) NOT NULL,
  `source_node_id` VARCHAR(100) NOT NULL,
  `target_node_id` VARCHAR(100) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_workflow_edges_workflow_id` (`workflow_id`),
  FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作流连接表';

-- =========================================
-- 3. 应急场景表
-- =========================================

-- 应急场景表
DROP TABLE IF EXISTS `scenarios`;
CREATE TABLE `scenarios` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL COMMENT '场景描述',
  `workflow_id` CHAR(36) DEFAULT NULL,
  `parameters` JSON DEFAULT NULL COMMENT '场景参数定义',
  `sop_content` LONGTEXT DEFAULT NULL COMMENT 'SOP 文档内容（Markdown/HTML）',
  `flowchart_xml` LONGTEXT DEFAULT NULL COMMENT '流程图 XML（Draw.io 格式）',
  `user_id` CHAR(36) NOT NULL COMMENT '创建者',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_scenarios_workflow_id` (`workflow_id`),
  INDEX `idx_scenarios_user_id` (`user_id`),
  FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user_profiles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='应急场景表';

-- =========================================
-- 4. 执行日志表
-- =========================================

-- 执行日志表
DROP TABLE IF EXISTS `execution_logs`;
CREATE TABLE `execution_logs` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `scenario_id` CHAR(36) DEFAULT NULL,
  `workflow_id` CHAR(36) DEFAULT NULL,
  `parameters` JSON DEFAULT NULL COMMENT '执行参数',
  `status` VARCHAR(20) DEFAULT 'pending' CHECK (`status` IN ('pending', 'running', 'completed', 'failed')),
  `started_at` DATETIME DEFAULT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  `error_message` TEXT DEFAULT NULL,
  `user_id` CHAR(36) NOT NULL COMMENT '执行者',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_execution_logs_scenario_id` (`scenario_id`),
  INDEX `idx_execution_logs_workflow_id` (`workflow_id`),
  INDEX `idx_execution_logs_status` (`status`),
  INDEX `idx_execution_logs_user_id` (`user_id`),
  FOREIGN KEY (`scenario_id`) REFERENCES `scenarios`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user_profiles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='执行日志表';

-- =========================================
-- 5. AI 配置表
-- =========================================

-- AI 配置表
DROP TABLE IF EXISTS `ai_configs`;
CREATE TABLE `ai_configs` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `user_id` CHAR(36) DEFAULT NULL COMMENT '用户ID，NULL 表示全局配置',
  `name` VARCHAR(255) NOT NULL,
  `type` VARCHAR(20) NOT NULL CHECK (`type` IN ('internet', 'intranet')),
  `provider` VARCHAR(50) NOT NULL,
  `model_name` VARCHAR(100) NOT NULL,
  `api_base` VARCHAR(500) NOT NULL,
  `api_key` VARCHAR(500) DEFAULT NULL,
  `config_json` JSON DEFAULT NULL COMMENT '额外配置（temperature, headers 等）',
  `is_active` BOOLEAN DEFAULT FALSE,
  `is_global` BOOLEAN DEFAULT FALSE COMMENT '是否为全局配置',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_ai_configs_user_id` (`user_id`),
  INDEX `idx_ai_configs_is_global` (`is_global`),
  INDEX `idx_ai_configs_is_active` (`is_active`),
  FOREIGN KEY (`user_id`) REFERENCES `user_profiles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI 配置表';

-- =========================================
-- 6. SOP 文档表
-- =========================================

-- SOP 文档表
DROP TABLE IF EXISTS `sop_documents`;
CREATE TABLE `sop_documents` (
  `id` CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `title` VARCHAR(500) NOT NULL,
  `content` LONGTEXT DEFAULT NULL COMMENT 'SOP 文档内容（HTML/Markdown）',
  `category` VARCHAR(100) DEFAULT '',
  `tags` JSON DEFAULT NULL COMMENT '标签数组',
  `user_id` CHAR(36) NOT NULL COMMENT '创建者',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_sop_documents_category` (`category`),
  INDEX `idx_sop_documents_user_id` (`user_id`),
  FULLTEXT KEY `ft_sop_title_content` (`title`, `content`),
  FOREIGN KEY (`user_id`) REFERENCES `user_profiles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='SOP 文档表';

-- =========================================
-- 7. 插入初始数据
-- =========================================

-- 插入示例模块（如果不存在）
INSERT IGNORE INTO `modules` (`id`, `name`, `description`, `type`, `config`, `icon`, `color`, `user_id`)
SELECT
  UUID(),
  '打开URL',
  '在新标签页中打开指定URL',
  'open_url',
  '{"url": ""}',
  'ExternalLink',
  '#3b82f6',
  (SELECT `id` FROM `user_profiles` WHERE `role` = 'super_admin' LIMIT 1)
FROM DUAL
WHERE EXISTS (SELECT 1 FROM `user_profiles` WHERE `role` = 'super_admin')
  AND NOT EXISTS (SELECT 1 FROM `modules` WHERE `name` = '打开URL');

INSERT IGNORE INTO `modules` (`id`, `name`, `description`, `type`, `config`, `icon`, `color`, `user_id`)
SELECT
  UUID(),
  '等待页面加载',
  '等待页面完全加载',
  'wait',
  '{"seconds": 2}',
  'Clock',
  '#10b981',
  (SELECT `id` FROM `user_profiles` WHERE `role` = 'super_admin' LIMIT 1)
FROM DUAL
WHERE EXISTS (SELECT 1 FROM `user_profiles` WHERE `role` = 'super_admin')
  AND NOT EXISTS (SELECT 1 FROM `modules` WHERE `name` = '等待页面加载');

INSERT IGNORE INTO `modules` (`id`, `name`, `description`, `type`, `config`, `icon`, `color`, `user_id`)
SELECT
  UUID(),
  '点击元素',
  '点击页面上的指定元素',
  'click_element',
  '{"selector": ""}',
  'MousePointer',
  '#f59e0b',
  (SELECT `id` FROM `user_profiles` WHERE `role` = 'super_admin' LIMIT 1)
FROM DUAL
WHERE EXISTS (SELECT 1 FROM `user_profiles` WHERE `role` = 'super_admin')
  AND NOT EXISTS (SELECT 1 FROM `modules` WHERE `name` = '点击元素');

INSERT IGNORE INTO `modules` (`id`, `name`, `description`, `type`, `config`, `icon`, `color`, `user_id`)
SELECT
  UUID(),
  '填写表单',
  '填写表单字段',
  'fill_form',
  '{"selector": "", "value": ""}',
  'Edit',
  '#8b5cf6',
  (SELECT `id` FROM `user_profiles` WHERE `role` = 'super_admin' LIMIT 1)
FROM DUAL
WHERE EXISTS (SELECT 1 FROM `user_profiles` WHERE `role` = 'super_admin')
  AND NOT EXISTS (SELECT 1 FROM `modules` WHERE `name` = '填写表单');

INSERT IGNORE INTO `modules` (`id`, `name`, `description`, `type`, `config`, `icon`, `color`, `user_id`)
SELECT
  UUID(),
  '执行命令',
  '在终端执行命令',
  'execute_command',
  '{"command": ""}',
  'Terminal',
  '#ef4444',
  (SELECT `id` FROM `user_profiles` WHERE `role` = 'super_admin' LIMIT 1)
FROM DUAL
WHERE EXISTS (SELECT 1 FROM `user_profiles` WHERE `role` = 'super_admin')
  AND NOT EXISTS (SELECT 1 FROM `modules` WHERE `name` = '执行命令');

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- =========================================
-- 完成
-- =========================================
SELECT '数据库初始化完成！' AS message;
SELECT CONCAT('创建了 ', COUNT(*), ' 张数据表') AS summary
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN (
    'user_profiles', 'account_requests', 'modules', 'workflows',
    'workflow_nodes', 'workflow_edges', 'scenarios', 'execution_logs',
    'ai_configs', 'sop_documents'
  );
