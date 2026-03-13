import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PUBLISHED';
    const tag = searchParams.get('tag');
    const sourceType = searchParams.get('sourceType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'heatScore';
    
    // 搜索参数
    const q = searchParams.get('q'); // 关键词搜索
    const heatMin = searchParams.get('heatMin');
    const heatMax = searchParams.get('heatMax');
    const dateRange = searchParams.get('dateRange'); // today, week, month, all
    
    // 结构化筛选
    const difficulty = searchParams.get('difficulty');
    const cluster = searchParams.get('cluster');
    const scoreMin = searchParams.get('scoreMin');

    // Build where clause
    const where: any = { status };

    // 关键词搜索（标题和描述）
    if (q && q.trim()) {
      const searchTerm = q.trim();
      where.OR = [
        { titleRaw: { contains: searchTerm } },
        { titleCn: { contains: searchTerm } },
        { descriptionRaw: { contains: searchTerm } },
        { descriptionCn: { contains: searchTerm } },
        { author: { contains: searchTerm } },
      ];
    }

    if (sourceType && sourceType !== 'all') {
      where.sourceType = sourceType;
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: tag,
          },
        },
      };
    }

    // 热度区间筛选
    if (heatMin) {
      where.heatScore = { ...where.heatScore, gte: parseFloat(heatMin) };
    }
    if (heatMax) {
      where.heatScore = { ...where.heatScore, lte: parseFloat(heatMax) };
    }

    // 时间范围筛选
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let dateStart: Date;
      
      switch (dateRange) {
        case 'today':
          dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          dateStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateStart = new Date(0);
      }
      
      where.publishedAt = { gte: dateStart };
    }

    // 结构化筛选
    if (difficulty && difficulty !== 'all') {
      where.difficulty = difficulty;
    }
    if (cluster) {
      where.cluster = cluster;
    }
    if (scoreMin) {
      where.score = { ...where.score, gte: parseFloat(scoreMin) };
    }

    // Build order by
    const orderBy: any = {};
    if (sortBy === 'heatScore') {
      orderBy.heatScore = 'desc';
    } else if (sortBy === 'publishedAt') {
      orderBy.publishedAt = 'desc';
    } else if (sortBy === 'views') {
      orderBy.views = 'desc';
    } else if (sortBy === 'oldest') {
      orderBy.publishedAt = 'asc';
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy,
      take: limit,
    });

    // Transform for frontend
    const transformed = items.map((item) => ({
      id: item.id,
      sourceType: item.sourceType,
      titleRaw: item.titleRaw,
      titleCn: item.titleCn,
      descriptionRaw: item.descriptionRaw,
      descriptionCn: item.descriptionCn,
      url: item.url,
      author: item.author,
      publishedAt: item.publishedAt.toISOString(),
      heatScore: item.heatScore,
      status: item.status,
      views: item.views,
      likes: item.likes,
      comments: item.comments,
      tags: item.tags.map((t) => t.tag.name),
      // 结构化字段
      oneLiner: item.oneLiner,
      difficulty: item.difficulty,
      cost: item.cost,
      agentUsage: item.agentUsage,
      businessPotential: item.businessPotential,
      timeToBuild: item.timeToBuild,
      tools: item.tools ? JSON.parse(item.tools) : [],
      steps: item.steps ? JSON.parse(item.steps) : [],
      resources: item.resources ? JSON.parse(item.resources) : [],
      score: item.score,
      cluster: item.cluster,
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Items API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}
