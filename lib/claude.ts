import OpenAI from 'openai';

function getOpenAIClient() {
  const apiKey = process.env.API_KEY;
  const baseURL = process.env.API_BASE_URL || 'http://1.95.142.151:3000/v1';
  
  if (!apiKey) {
    throw new Error('API_KEY is not configured');
  }
  
  return new OpenAI({ apiKey, baseURL });
}

export async function translateToChinese(text: string): Promise<string> {
  const client = getOpenAIClient();
  const completion = await client.chat.completions.create({
    model: 'claude-opus-4.6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Translate this to concise Chinese (max 200 characters):

${text.substring(0, 2000)}`,
      },
    ],
  });

  return completion.choices[0].message.content || text;
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
  const client = getOpenAIClient();
  const completion = await client.chat.completions.create({
    model: 'claude-opus-4.6',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Analyze this OpenClaw content and return JSON:

${text.substring(0, 3000)}

Return exactly:
{
  "titleCn": "concise Chinese title",
  "summaryCn": "2-3 sentence summary in Chinese",
  "tags": ["tag1", "tag2"],
  "heatLabel": "国外热|国内热|双平台热|普通"
}`,
      },
    ],
  });

  try {
    return JSON.parse(completion.choices[0].message.content || '{}');
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
  const client = getOpenAIClient();
  const completion = await client.chat.completions.create({
    model: 'claude-opus-4.6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Write a daily digest in Chinese Markdown:

${items.map(i => `- **${i.titleCn}** (${i.sourceType}): ${i.summaryCn}`).join('\n')}

Format:
# OpenClaw 玩法日报

## 🔥 今日热点
## 📚 新教程
## 💡 新玩法
## 🛠️ 新工具`,
      },
    ],
  });

  return completion.choices[0].message.content || '';
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
  const text = `${content.title}\n\n${content.description}`;
  const client = getOpenAIClient();
  const completion = await client.chat.completions.create({
    model: 'claude-opus-4.6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `你是一个内容分析专家。分析以下 OpenClaw 玩法内容，提取结构化数据。

**内容：**
${text.substring(0, 2500)}

**分析指南：**
- difficulty: 根据实现复杂度判断
  - EASY: 简单配置/单步骤/无需代码
  - MEDIUM: 需要基础编程/多步骤配置
  - HARD: 需要完整开发/复杂架构/多系统集成

- cost: 根据所需服务/工具费用
  - FREE: 完全免费工具
  - LOW: 基础订阅 (<$20/月)
  - MEDIUM: 中等订阅 ($20-100/月)
  - HIGH: 企业级/高成本 (>$100/月)

- agentUsage: 需要几个 AI agent 协作
  - 1: 单 agent 可完成
  - 2-3: 需要少量 agent 协作
  - 4-5: 复杂多 agent 系统

- businessPotential: 商业变现潜力 (1-10)
  - 1-3: 学习/兴趣为主
  - 4-6: 可提升效率/节省成本
  - 7-8: 可直接变现/副业
  - 9-10: 可规模化/创业级

- timeToBuild: 从零到可用所需时间
  - 1h: 1 小时内
  - 1d: 1 天内
  - 1w: 1 周内
  - 1m: 1 月内

- cluster: 根据内容主题分类，从以下选择最匹配的：
  "内容工厂", "自动化工作流", "多 agent 系统", "浏览器自动化", "Webhook 集成", 
  "一人公司工具", "AI 辅助编程", "节点部署", "数据抓取", "社交媒体自动化"

**返回纯 JSON，不要任何其他文字：**
{
  "oneLiner": "20 字内一句话总结核心价值",
  "difficulty": "EASY 或 MEDIUM 或 HARD",
  "cost": "FREE 或 LOW 或 MEDIUM 或 HIGH",
  "agentUsage": 1 到 5 的整数,
  "businessPotential": 1 到 10 的整数,
  "timeToBuild": "1h 或 1d 或 1w 或 1m",
  "tools": ["必需工具列表"],
  "steps": ["关键实现步骤，3-5 条"],
  "resources": ["相关资源链接，如无则空数组"],
  "score": 综合评分 0-10,
  "cluster": "最匹配的专题名称"
}`,
      },
    ],
  });

  try {
    let rawContent = completion.choices[0].message.content || '{}';
    
    // 移除 markdown 代码块标记
    rawContent = rawContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    const result = JSON.parse(rawContent);
    return {
      oneLiner: result.oneLiner || '',
      difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(result.difficulty) ? result.difficulty : 'MEDIUM',
      cost: ['FREE', 'LOW', 'MEDIUM', 'HIGH'].includes(result.cost) ? result.cost : 'LOW',
      agentUsage: typeof result.agentUsage === 'number' ? result.agentUsage : 1,
      businessPotential: typeof result.businessPotential === 'number' ? result.businessPotential : 5,
      timeToBuild: ['1h', '1d', '1w', '1m'].includes(result.timeToBuild) ? result.timeToBuild : '1d',
      tools: Array.isArray(result.tools) ? result.tools : [],
      steps: Array.isArray(result.steps) ? result.steps : [],
      resources: Array.isArray(result.resources) ? result.resources : [],
      score: typeof result.score === 'number' ? result.score : 5,
      cluster: result.cluster || '',
    };
  } catch (e) {
    console.error('AI 解析失败:', e);
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
        { score: { lte: 5 } },  // 低评分或默认值
        { oneLiner: null },
        { oneLiner: '' },
      ],
    },
    take: limit,
  });

  console.log(`📊 开始分析 ${items.length} 条内容...`);
  
  let updated = 0;
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
    }
  }

  console.log(`\n📊 完成：更新 ${updated}/${items.length} 条`);
  return { updated, total: items.length };
}
