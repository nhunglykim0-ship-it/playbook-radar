/**
 * 生成数据结构统计报告
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
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

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Playbook Radar 数据结构统计报告');
  console.log('='.repeat(60));
  
  const allItems = await prisma.item.findMany({
    where: { status: 'PUBLISHED' },
    include: { tags: { include: { tag: true } } },
  });
  
  console.log(`\n总内容数：${allItems.length} 条\n`);
  
  // 难度分布
  const difficultyDist: Record<string, number> = {};
  allItems.forEach(i => {
    const d = i.difficulty || '未分析';
    difficultyDist[d] = (difficultyDist[d] || 0) + 1;
  });
  console.log('🎯 难度分布:');
  Object.entries(difficultyDist).sort().forEach(([k, v]) => {
    const pct = ((v / allItems.length) * 100).toFixed(0);
    const bar = '█'.repeat(Math.round(v / allItems.length * 30));
    console.log(`  ${k.padEnd(10)} ${v.toString().padStart(3)} (${pct}%) ${bar}`);
  });
  
  // 商业潜力分布
  const potentialDist: Record<string, number> = {};
  allItems.forEach(i => {
    const p = Math.floor(i.businessPotential / 2) * 2;
    const key = p >= 8 ? '8-10' : `${p}-${p + 1}`;
    potentialDist[key] = (potentialDist[key] || 0) + 1;
  });
  console.log('\n💰 商业潜力分布:');
  Object.entries(potentialDist).sort().forEach(([k, v]) => {
    const pct = ((v / allItems.length) * 100).toFixed(0);
    const bar = '█'.repeat(Math.round(v / allItems.length * 30));
    console.log(`  ${k.padEnd(10)} ${v.toString().padStart(3)} (${pct}%) ${bar}`);
  });
  
  // 成本分布
  const costDist: Record<string, number> = {};
  allItems.forEach(i => {
    const c = i.cost || '未分析';
    costDist[c] = (costDist[c] || 0) + 1;
  });
  console.log('\n💵 成本分布:');
  Object.entries(costDist).sort().forEach(([k, v]) => {
    const pct = ((v / allItems.length) * 100).toFixed(0);
    const bar = '█'.repeat(Math.round(v / allItems.length * 30));
    console.log(`  ${k.padEnd(10)} ${v.toString().padStart(3)} (${pct}%) ${bar}`);
  });
  
  // 构建时间分布
  const timeDist: Record<string, number> = {};
  allItems.forEach(i => {
    const t = i.timeToBuild || '未分析';
    timeDist[t] = (timeDist[t] || 0) + 1;
  });
  console.log('\n⏱️  构建时间分布:');
  Object.entries(timeDist).sort().forEach(([k, v]) => {
    const pct = ((v / allItems.length) * 100).toFixed(0);
    const bar = '█'.repeat(Math.round(v / allItems.length * 30));
    console.log(`  ${k.padEnd(10)} ${v.toString().padStart(3)} (${pct}%) ${bar}`);
  });
  
  // 专题分布
  const clusterDist: Record<string, number> = {};
  allItems.forEach(i => {
    const c = i.cluster || '未分类';
    clusterDist[c] = (clusterDist[c] || 0) + 1;
  });
  console.log('\n📁 专题分布:');
  Object.entries(clusterDist).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    const pct = ((v / allItems.length) * 100).toFixed(0);
    const bar = '█'.repeat(Math.round(v / allItems.length * 30));
    console.log(`  ${k.padEnd(15)} ${v.toString().padStart(3)} (${pct}%) ${bar}`);
  });
  
  // 标签统计
  const tagCounts: Record<string, number> = {};
  allItems.forEach(i => {
    i.tags.forEach(t => {
      tagCounts[t.tag.name] = (tagCounts[t.tag.name] || 0) + 1;
    });
  });
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log('\n🏷️  热门标签:');
  topTags.forEach(([tag, count], idx) => {
    const pct = ((count / allItems.length) * 100).toFixed(0);
    const bar = '█'.repeat(Math.round(count / topTags[0][1] * 30));
    console.log(`  ${idx + 1}. ${tag.padEnd(15)} ${count.toString().padStart(3)} (${pct}%) ${bar}`);
  });
  
  // Agent 使用分布
  const agentDist: Record<string, number> = {};
  allItems.forEach(i => {
    const a = i.agentUsage || 1;
    const key = a >= 4 ? '4-5' : `${a}`;
    agentDist[key] = (agentDist[key] || 0) + 1;
  });
  console.log('\n🤖 Agent 使用分布:');
  Object.entries(agentDist).sort().forEach(([k, v]) => {
    const pct = ((v / allItems.length) * 100).toFixed(0);
    const bar = '█'.repeat(Math.round(v / allItems.length * 30));
    console.log(`  ${k.padEnd(10)} ${v.toString().padStart(3)} (${pct}%) ${bar}`);
  });
  
  // 综合评分分布
  const scoreDist: Record<string, number> = {};
  allItems.forEach(i => {
    const s = Math.floor(i.score / 2) * 2;
    const key = s >= 8 ? '8-10' : `${s}-${s + 1}`;
    scoreDist[key] = (scoreDist[key] || 0) + 1;
  });
  console.log('\n⭐ 综合评分分布:');
  Object.entries(scoreDist).sort().forEach(([k, v]) => {
    const pct = ((v / allItems.length) * 100).toFixed(0);
    const bar = '█'.repeat(Math.round(v / allItems.length * 30));
    console.log(`  ${k.padEnd(10)} ${v.toString().padStart(3)} (${pct}%) ${bar}`);
  });
  
  // 结构化数据完整度
  const analyzedCount = allItems.filter(i => i.cluster && i.cluster !== '').length;
  const completeness = ((analyzedCount / allItems.length) * 100).toFixed(1);
  console.log('\n' + '-'.repeat(60));
  console.log('📋 数据完整度:');
  console.log(`  已分析：${analyzedCount}/${allItems.length} 条 (${completeness}%)`);
  console.log(`  待分析：${allItems.length - analyzedCount} 条`);
  
  console.log('\n' + '='.repeat(60));
  console.log('');
}

main()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((error) => {
    console.error('错误:', error);
    prisma.$disconnect();
    process.exit(1);
  });
