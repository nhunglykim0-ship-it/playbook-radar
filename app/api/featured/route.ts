import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    
    // 今日开始时间
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 本周开始时间（周一）
    const dayOfWeek = now.getDay() || 7;
    const weekStart = new Date(now.getTime() - (dayOfWeek - 1) * 24 * 60 * 60 * 1000);
    weekStart.setHours(0, 0, 0, 0);

    // 综合评分公式：score * 0.4 + businessPotential * 0.3 + (automation_level / 5) * 0.3
    const calculateFeaturedScore = (item: any) => {
      const automationLevel = (item.agentUsage || 1) / 5;
      return (item.score || 5) * 0.4 + (item.businessPotential || 5) * 0.3 + automationLevel * 0.3 * 10;
    };

    // 获取所有已发布内容
    const allItems = await prisma.item.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
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
      featuredScore: calculateFeaturedScore(item),
    });

    const items = allItems.map(transformItem);

    // 今日最值得看（今天发布 + 高评分）
    const todayItems = items.filter(i => new Date(i.publishedAt) >= todayStart);
    const topToday = todayItems
      .sort((a, b) => b.featuredScore - a.featuredScore)
      .slice(0, 5);

    // 本周热门（本周发布 + 热度排序）
    const weekItems = items.filter(i => new Date(i.publishedAt) >= weekStart);
    const topWeek = weekItems
      .sort((a, b) => b.heatScore - a.heatScore)
      .slice(0, 10);

    // 一人公司玩法（包含相关标签）
    const soloFounderTags = ['一人公司', '自动化', '内容工厂', 'webhook'];
    const soloFounder = items
      .filter(i => i.tags.some((t: string) => soloFounderTags.includes(t)))
      .sort((a, b) => b.businessPotential - a.businessPotential)
      .slice(0, 8);

    // 自动化程度最高（agentUsage >= 2）
    const highAutomation = items
      .filter(i => i.agentUsage >= 2)
      .sort((a, b) => b.agentUsage - a.agentUsage)
      .slice(0, 8);

    return NextResponse.json({
      today: topToday,
      week: topWeek,
      soloFounder,
      highAutomation,
      stats: {
        total: items.length,
        todayCount: todayItems.length,
        weekCount: weekItems.length,
      },
    });
  } catch (error) {
    console.error('Featured API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured items' },
      { status: 500 }
    );
  }
}
