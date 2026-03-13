-- ============================================
-- Playbook Radar - Supabase 数据库初始化
-- 在 Supabase SQL Editor 中执行
-- ============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Item 表
-- ============================================
CREATE TABLE IF NOT EXISTS "Item" (
  id TEXT PRIMARY KEY,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  "titleRaw" TEXT NOT NULL,
  "titleCn" TEXT,
  "descriptionRaw" TEXT,
  "descriptionCn" TEXT,
  author TEXT,
  "publishedAt" TIMESTAMP(3) NOT NULL,
  "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'PENDING',
  "heatScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  "isDuplicateOf" TEXT,
  "oneLiner" TEXT,
  difficulty TEXT,
  cost TEXT,
  "agentUsage" INTEGER NOT NULL DEFAULT 1,
  "businessPotential" INTEGER NOT NULL DEFAULT 5,
  "timeToBuild" TEXT,
  tools TEXT,
  steps TEXT,
  resources TEXT,
  score DOUBLE PRECISION NOT NULL DEFAULT 0,
  cluster TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- ============================================
-- Tag 表
-- ============================================
CREATE TABLE IF NOT EXISTS "Tag" (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ItemTag 关联表
-- ============================================
CREATE TABLE IF NOT EXISTS "ItemTag" (
  "itemId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("itemId", "tagId"),
  FOREIGN KEY ("itemId") REFERENCES "Item"(id) ON DELETE CASCADE,
  FOREIGN KEY ("tagId") REFERENCES "Tag"(id) ON DELETE CASCADE
);

-- ============================================
-- DailyDigest 表
-- ============================================
CREATE TABLE IF NOT EXISTS "DailyDigest" (
  id TEXT PRIMARY KEY,
  date TEXT UNIQUE NOT NULL,
  "itemsJson" TEXT NOT NULL,
  summary TEXT,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- WeeklyDigest 表
-- ============================================
CREATE TABLE IF NOT EXISTS "WeeklyDigest" (
  id TEXT PRIMARY KEY,
  week TEXT UNIQUE NOT NULL,
  "itemsJson" TEXT NOT NULL,
  summary TEXT,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SourceConfig 表
-- ============================================
CREATE TABLE IF NOT EXISTS "SourceConfig" (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  config TEXT NOT NULL,
  "lastFetched" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- ============================================
-- 创建索引
-- ============================================
CREATE INDEX IF NOT EXISTS "Item_sourceType_sourceId_idx" ON "Item"("sourceType", "sourceId");
CREATE INDEX IF NOT EXISTS "Item_status_idx" ON "Item"(status);
CREATE INDEX IF NOT EXISTS "Item_heatScore_idx" ON "Item"("heatScore");
CREATE INDEX IF NOT EXISTS "Item_publishedAt_idx" ON "Item"("publishedAt");
CREATE INDEX IF NOT EXISTS "Item_cluster_idx" ON "Item"(cluster);
CREATE INDEX IF NOT EXISTS "Item_score_idx" ON "Item"(score);
CREATE INDEX IF NOT EXISTS "Item_difficulty_idx" ON "Item"("difficulty");
CREATE INDEX IF NOT EXISTS "Tag_name_idx" ON "Tag"(name);
CREATE INDEX IF NOT EXISTS "DailyDigest_date_idx" ON "DailyDigest"(date);
CREATE INDEX IF NOT EXISTS "WeeklyDigest_week_idx" ON "WeeklyDigest"(week);

-- ============================================
-- 插入默认标签
-- ============================================
INSERT INTO "Tag" (name, category, description) VALUES
  ('自动化', 'PLAYSTYLE', '自动化相关内容'),
  ('coding', 'TOOL', '编程开发相关内容'),
  ('一人公司', 'PLAYSTYLE', '一人公司相关内容'),
  ('内容工厂', 'PLAYSTYLE', '内容工厂相关内容'),
  ('webhook', 'TOOL', 'Webhook 相关内容'),
  ('多 agent', 'PLAYSTYLE', '多 Agent 相关内容'),
  ('浏览器控制', 'TOOL', '浏览器自动化相关内容'),
  ('节点/node', 'PLATFORM', '节点部署相关内容'),
  ('AI', 'TOOL', '人工智能相关内容')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 验证表创建
-- ============================================
SELECT 
  'Item' as table_name, 
  COUNT(*) as row_count 
FROM "Item"
UNION ALL
SELECT 
  'Tag' as table_name, 
  COUNT(*) as row_count 
FROM "Tag"
UNION ALL
SELECT 
  'ItemTag' as table_name, 
  COUNT(*) as row_count 
FROM "ItemTag";
