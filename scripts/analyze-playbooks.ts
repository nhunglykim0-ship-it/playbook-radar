/**
 * 批量分析玩法数据结构
 * 
 * 使用方法：
 *   npx tsx scripts/analyze-playbooks.ts
 *   ANALYZE_LIMIT=50 npx tsx scripts/analyze-playbooks.ts
 *   ANALYZE_BATCH=10 npx tsx scripts/analyze-playbooks.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { analyzePlaybook } from '../lib/claude';
import { PrismaClient } from '@prisma/client';

// 手动加载 .env.local
const envPath = resolve(__dirname, '../.env.local');
const envContent = readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach((line) => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0 && !key.trim().startsWith('#')) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

const prisma = new PrismaClient();

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function analyzeWithRetry(
  item: any, 
  maxRetries = 3
): Promise<any | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const analysis = await analyzePlaybook({
        title: item.titleRaw,
        description: item.descriptionRaw || '',
      });
      return analysis;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`  ⚠️  尝试 ${attempt}/${maxRetries} 失败：${errorMsg}`);
      
      if (attempt < maxRetries) {
        // 指数退避：1s, 2s, 4s
        await sleep(Math.pow(2, attempt - 1) * 1000);
      }
    }
  }
  return null;
}

async function main() {
  console.log('\n🤖 开始 AI 结构化分析...\n');
  
  const limit = parseInt(process.env.ANALYZE_LIMIT || '50');
  const batchSize = parseInt(process.env.ANALYZE_BATCH || '10');
  
  // 获取待分析的内容（优先分析 cluster 为空的）
  const items = await prisma.item.findMany({
    where: {
      OR: [
        { cluster: null },
        { cluster: '' },
        { score: 5 },  // 默认评分
      ],
    },
    take: limit,
    orderBy: { publishedAt: 'desc' },
  });

  console.log(`📊 待分析：${items.length} 条内容`);
  console.log(`📦 批次大小：${batchSize} 条/批`);
  console.log(`\n${'='.repeat(60)}\n`);
  
  let totalUpdated = 0;
  let totalFailed = 0;
  let processed = 0;
  
  // 分批处理
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(items.length / batchSize);
    
    console.log(`📦 批次 ${batchNum}/${totalBatches} (处理 ${batch.length} 条)\n`);
    
    for (const item of batch) {
      processed++;
      const progress = `${processed}/${items.length}`;
      
      console.log(`[${progress}] 分析：${item.titleCn || item.titleRaw}`);
      
      const analysis = await analyzeWithRetry(item);
      
      if (analysis) {
        await prisma.item.update({
          where: { id: item.id },
          data: {
            oneLiner: analysis.oneLiner,
            difficulty: analysis.difficulty,
            cost: analysis.cost,
            agentUsage: analysis.agentUsage,
            businessPotential: analysis.businessPotential,
            timeToBuild: analysis.timeToBuild,
            tools: JSON.stringify(analysis.tools),
            steps: JSON.stringify(analysis.steps),
            resources: JSON.stringify(analysis.resources),
            score: analysis.score,
            cluster: analysis.cluster,
          },
        });
        console.log(`  ✅ 完成 - 难度:${analysis.difficulty}, 潜力:${analysis.businessPotential}/10, 专题:${analysis.cluster || '未分类'}`);
        totalUpdated++;
      } else {
        console.log(`  ❌ 失败 - 跳过`);
        totalFailed++;
      }
      
      // API 限流保护：每条间隔 500ms
      await sleep(500);
    }
    
    console.log(`\n📊 批次 ${batchNum} 完成：更新 ${totalUpdated} 条，失败 ${totalFailed} 条\n`);
    
    // 批次间休息 2 秒
    if (i + batchSize < items.length) {
      console.log('⏸️  休息 2 秒...\n');
      await sleep(2000);
    }
  }
  
  // 统计报告
  console.log('\n' + '='.repeat(60));
  console.log('📊 分析完成 - 统计报告');
  console.log('='.repeat(60));
  console.log(`总处理：${processed} 条`);
  console.log(`成功：${totalUpdated} 条 (${((totalUpdated / processed) * 100).toFixed(1)}%)`);
  console.log(`失败：${totalFailed} 条 (${((totalFailed / processed) * 100).toFixed(1)}%)`);
  
  // 分布统计
  const allItems = await prisma.item.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [
        { score: { gt: 5 } },
        { oneLiner: { not: null } },
      ],
    },
  });
  
  console.log('\n' + '-'.repeat(60));
  console.log('📈 分布统计');
  console.log('-'.repeat(60));
  
  // 难度分布
  const difficultyDist: Record<string, number> = {};
  allItems.forEach(i => {
    const d = i.difficulty || 'UNKNOWN';
    difficultyDist[d] = (difficultyDist[d] || 0) + 1;
  });
  console.log('\n🎯 难度分布:');
  Object.entries(difficultyDist).sort().forEach(([k, v]) => {
    const bar = '█'.repeat(Math.round(v / allItems.length * 20));
    console.log(`  ${k.padEnd(10)} ${v.toString().padStart(3)} ${bar}`);
  });
  
  // 商业潜力分布
  const potentialDist: Record<string, number> = {};
  allItems.forEach(i => {
    const p = Math.floor(i.businessPotential / 2) * 2; // 按 2 分一组
    const key = `${p}-${p + 1}`;
    potentialDist[key] = (potentialDist[key] || 0) + 1;
  });
  console.log('\n💰 商业潜力分布:');
  Object.entries(potentialDist).sort().forEach(([k, v]) => {
    const bar = '█'.repeat(Math.round(v / allItems.length * 20));
    console.log(`  ${k.padEnd(10)} ${v.toString().padStart(3)} ${bar}`);
  });
  
  // 标签统计
  const tagCounts: Record<string, number> = {};
  const itemsWithTags = await prisma.item.findMany({
    where: { status: 'PUBLISHED' },
    include: { tags: { include: { tag: true } } },
  });
  itemsWithTags.forEach(i => {
    i.tags.forEach(t => {
      tagCounts[t.tag.name] = (tagCounts[t.tag.name] || 0) + 1;
    });
  });
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log('\n🏷️  热门标签:');
  topTags.forEach(([tag, count], idx) => {
    const bar = '█'.repeat(Math.round(count / Math.max(...topTags.map(t => t[1])) * 20));
    console.log(`  ${idx + 1}. ${tag.padEnd(15)} ${count.toString().padStart(3)} ${bar}`);
  });
  
  // 成本分布
  const costDist: Record<string, number> = {};
  allItems.forEach(i => {
    const c = i.cost || 'UNKNOWN';
    costDist[c] = (costDist[c] || 0) + 1;
  });
  console.log('\n💵 成本分布:');
  Object.entries(costDist).sort().forEach(([k, v]) => {
    const bar = '█'.repeat(Math.round(v / allItems.length * 20));
    console.log(`  ${k.padEnd(10)} ${v.toString().padStart(3)} ${bar}`);
  });
  
  // 时间分布
  const timeDist: Record<string, number> = {};
  allItems.forEach(i => {
    const t = i.timeToBuild || 'UNKNOWN';
    timeDist[t] = (timeDist[t] || 0) + 1;
  });
  console.log('\n⏱️  构建时间分布:');
  Object.entries(timeDist).sort().forEach(([k, v]) => {
    const bar = '█'.repeat(Math.round(v / allItems.length * 20));
    console.log(`  ${k.padEnd(10)} ${v.toString().padStart(3)} ${bar}`);
  });
  
  // 专题分布
  const clusterDist: Record<string, number> = {};
  allItems.forEach(i => {
    const c = i.cluster || '未分类';
    clusterDist[c] = (clusterDist[c] || 0) + 1;
  });
  console.log('\n📁 专题分布:');
  Object.entries(clusterDist).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    const bar = '█'.repeat(Math.round(v / allItems.length * 20));
    console.log(`  ${k.padEnd(15)} ${v.toString().padStart(3)} ${bar}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('');
  console.log('💡 下一步：');
  console.log('   - 访问 http://localhost:3000 查看首页');
  console.log('   - 访问任意详情页查看结构化信息');
  console.log('   - 使用 ?difficulty=X 或 ?cluster=X 筛选');
  console.log('');
}

main()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本异常:', error);
    prisma.$disconnect();
    process.exit(1);
  });
