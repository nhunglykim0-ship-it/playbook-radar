/**
 * AI 处理模块 - 使用 Qwen 3.5
 */

import { callAI } from './http-agent';

export async function translateToChinese(text: string): Promise<string> {
  const result = callAI(`Translate to concise Chinese (max 200 chars):\n\n${text.substring(0, 2000)}`, 1024);
  return result || text;
}

export async function summarizeAndTag(content: {
  title: string;
  description?: string;
}): Promise<{
  titleCn: string;
  summaryCn: string;
  tags: string[];
  heatLabel: string;
}> {
  const text = `${content.title}\n\n${content.description || ''}`;
  
  try {
    const result = callAI(`Analyze this content and return JSON:\n\n${text.substring(0, 3000)}\n\nReturn ONLY: {"titleCn":"中文标题","summaryCn":"2-3 句中文摘要","tags":["tag1"],"heatLabel":"国外热 | 国内热 | 双平台热 | 普通"}`, 512);
    return JSON.parse(result || '{}');
  } catch {
    return {
      titleCn: await translateToChinese(content.title),
      summaryCn: '',
      tags: [],
      heatLabel: '普通',
    };
  }
}

export async function generateDigest(items: Array<{
  titleCn: string;
  summaryCn: string;
  url: string;
  sourceType: string;
}>): Promise<string> {
  const content = items.map(i => `- **${i.titleCn}** (${i.sourceType}): ${i.summaryCn}`).join('\n');
  const result = callAI(`Write a daily digest in Chinese Markdown:\n\n${content}\n\nFormat:\n# OpenClaw 玩法日报\n\n## 🔥 今日热点\n## 📚 新教程\n## 💡 新玩法\n## 🛠️ 新工具`, 2048);
  return result || '';
}

/**
 * AI 结构化分析 - 提取玩法的结构化信息
 */
export async function analyzePlaybook(content: {
  title: string;
  description: string;
}): Promise<{
  oneLiner: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  cost: 'FREE' | 'LOW' | 'MEDIUM' | 'HIGH';
  agentUsage: number;
  businessPotential: number;
  timeToBuild: string;
  tools: string[];
  steps: string[];
  resources: string[];
  score: number;
  cluster: string;
}> {
  try {
    const prompt = `分析以下 OpenClaw 玩法内容，返回 JSON：

标题：${content.title}
描述：${content.description || '无'}

只返回以下 JSON 格式（不要任何其他文字）：
{
  "oneLiner": "20 字内核心价值总结",
  "difficulty": "MEDIUM",
  "cost": "LOW",
  "agentUsage": 1,
  "businessPotential": 5,
  "timeToBuild": "1d",
  "tools": [],
  "steps": [],
  "resources": [],
  "score": 5,
  "cluster": ""
}

规则：
- difficulty: EASY, MEDIUM, 或 HARD
- cost: FREE, LOW, MEDIUM, 或 HIGH
- agentUsage: 1-5 的整数
- businessPotential: 1-10 的整数
- timeToBuild: 1h, 1d, 1w, 或 1m
- cluster: 从以下选择一个：["内容工厂", "自动化工作流", "多 agent 系统", "浏览器自动化", "Webhook 集成", "一人公司工具", "AI 辅助编程", "节点部署", "数据抓取", "社交媒体自动化", "未分类"]
- score: 0-10 的综合评分`;

    const result = callAI(prompt, 1024, 3);
    let rawContent = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    const parsed = JSON.parse(rawContent);
    return {
      oneLiner: parsed.oneLiner || '',
      difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(parsed.difficulty) ? parsed.difficulty : 'MEDIUM',
      cost: ['FREE', 'LOW', 'MEDIUM', 'HIGH'].includes(parsed.cost) ? parsed.cost : 'LOW',
      agentUsage: typeof parsed.agentUsage === 'number' ? parsed.agentUsage : 1,
      businessPotential: typeof parsed.businessPotential === 'number' ? parsed.businessPotential : 5,
      timeToBuild: ['1h', '1d', '1w', '1m'].includes(parsed.timeToBuild) ? parsed.timeToBuild : '1d',
      tools: Array.isArray(parsed.tools) ? parsed.tools : [],
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      resources: Array.isArray(parsed.resources) ? parsed.resources : [],
      score: typeof parsed.score === 'number' ? parsed.score : 5,
      cluster: parsed.cluster || '',
    };
  } catch (e) {
    console.error('AI 解析失败:', e instanceof Error ? e.message : e);
    return {
      oneLiner: '',
      difficulty: 'MEDIUM',
      cost: 'LOW',
      agentUsage: 1,
      businessPotential: 5,
      timeToBuild: '1d',
      tools: [],
      steps: [],
      resources: [],
      score: 5,
      cluster: '',
    };
  }
}

/**
 * 批量分析并更新数据库
 */
export async function analyzeAndBulkUpdate(limit: number = 10) {
  const { prisma } = await import('./prisma');
  
  const items = await prisma.item.findMany({
    where: {
      OR: [
        { score: { lte: 5 } },
        { oneLiner: null },
        { oneLiner: '' },
      ],
    },
    take: limit,
  });

  console.log(`📊 开始分析 ${items.length} 条内容...`);
  
  let updated = 0;
  let failed = 0;
  
  for (const item of items) {
    try {
      const analysis = await analyzePlaybook({
        title: item.titleRaw,
        description: item.descriptionRaw || '',
      });

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

      console.log(`✅ ${item.titleCn || item.titleRaw}`);
      updated++;
    } catch (error) {
      console.error(`❌ ${item.titleRaw}:`, error instanceof Error ? error.message : error);
      failed++;
    }
  }

  console.log(`\n📊 完成：更新 ${updated}/${items.length} 条，失败 ${failed} 条`);
  return { updated, failed, total: items.length };
}
