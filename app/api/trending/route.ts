import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d'; // 24h, 7d, 30d
    const tag = searchParams.get('tag');

    // 计算时间范围
    const now = new Date();
    let startTime: Date;
    switch (timeRange) {
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // 基础查询条件
    const baseWhere: any = {
      status: 'PUBLISHED',
      publishedAt: { gte: startTime },
    };

    // 标签筛选
    if (tag) {
      baseWhere.tags = {
        some: {
          tag: {
            name: tag,
          },
        },
      };
    }

    // 获取所有符合条件的内容
    const allItems = await prisma.item.findMany({
      where: baseWhere,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // 转换数据
    const transformItem = (item: any) => ({
      id: item.id,
      sourceType: item.sourceType,
      titleRaw: item.titleRaw,
      titleCn: item.titleCn,
      url: item.url,
      author: item.author,
      publishedAt: item.publishedAt.toISOString(),
      heatScore: item.heatScore,
      views: item.views,
      likes: item.likes,
      comments: item.comments,
      tags: item.tags.map((t: any) => t.tag.name),
      oneLiner: item.oneLiner,
      difficulty: item.difficulty,
      cost: item.cost,
      agentUsage: item.agentUsage,
      businessPotential: item.businessPotential,
      timeToBuild: item.timeToBuild,
      score: item.score,
      cluster: item.cluster,
      // 计算增长分数（基于发布时间和当前热度）
      growthScore: calculateGrowthScore(item, startTime),
    });

    const items = allItems.map(transformItem);

    // 1. 今日增长最快（按增长分数排序）
    const topGrowth = [...items]
      .sort((a, b) => b.growthScore - a.growthScore)
      .slice(0, 10);

    // 2. 热门玩法（按热度排序）
    const topHot = [...items]
      .sort((a, b) => b.heatScore - a.heatScore)
      .slice(0, 10);

    // 3. 新增标签统计
    const tagCounts: Record<string, number> = {};
    items.forEach((item) => {
      item.tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    const newTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // 4. 自动化程度最高（按 agentUsage 排序）
    const topAutomation = [...items]
      .filter((i) => i.agentUsage >= 2)
      .sort((a, b) => b.agentUsage - a.agentUsage)
      .slice(0, 10);

    // 5. 商业潜力最高
    const topBusiness = [...items]
      .sort((a, b) => b.businessPotential - a.businessPotential)
      .slice(0, 10);

    // 统计信息
    const stats = {
      total: items.length,
      avgHeat: items.reduce((sum, i) => sum + i.heatScore, 0) / items.length,
      avgScore: items.reduce((sum, i) => sum + (i.score || 5), 0) / items.length,
      avgBusiness: items.reduce((sum, i) => sum + i.businessPotential, 0) / items.length,
      totalViews: items.reduce((sum, i) => sum + i.views, 0),
    };

    return NextResponse.json({
      timeRange,
      tag,
      growth: topGrowth,
      hot: topHot,
      newTags,
      automation: topAutomation,
      business: topBusiness,
      stats,
    });
  } catch (error) {
    console.error('Trending API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending items' },
      { status: 500 }
    );
  }
}

/**
 * 计算增长分数
 * 公式：heatScore * (1 / log2(daysSince + 2)) * 10
 * 越新且热度越高的内容，增长分数越高
 */
function calculateGrowthScore(item: any, startTime: Date): number {
  const publishedAt = new Date(item.publishedAt);
  const now = new Date();
  
  // 发布至今的天数
  const daysSince = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
  
  // 时间衰减因子（越新越高）
  const recencyFactor = 1 / Math.log2(daysSince + 2);
  
  // 增长分数 = 热度 * 时间衰减 * 10
  return item.heatScore * recencyFactor * 10;
}
