import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.item.findUnique({
      where: { id: params.id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // 获取相关推荐（同 cluster 或同标签）
    const relatedItems = await prisma.item.findMany({
      where: {
        AND: [
          { id: { not: item.id } },
          { status: 'PUBLISHED' },
          {
            OR: [
              // 同 cluster
              item.cluster ? { cluster: item.cluster } : { id: '' },
              // 同标签
              {
                tags: {
                  some: {
                    tagId: {
                      in: item.tags.map((t) => t.tagId),
                    },
                  },
                },
              },
            ],
          },
        ],
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { heatScore: 'desc' },
      take: 5,
    });

    // Transform for frontend
    const transformItem = (i: any) => ({
      id: i.id,
      sourceType: i.sourceType,
      titleRaw: i.titleRaw,
      titleCn: i.titleCn,
      descriptionRaw: i.descriptionRaw,
      descriptionCn: i.descriptionCn,
      url: i.url,
      author: i.author,
      publishedAt: i.publishedAt.toISOString(),
      heatScore: i.heatScore,
      status: i.status,
      views: i.views,
      likes: i.likes,
      comments: i.comments,
      tags: i.tags.map((t: any) => t.tag.name),
      // 结构化字段
      oneLiner: i.oneLiner,
      difficulty: i.difficulty,
      cost: i.cost,
      agentUsage: i.agentUsage,
      businessPotential: i.businessPotential,
      timeToBuild: i.timeToBuild,
      tools: i.tools ? JSON.parse(i.tools) : [],
      steps: i.steps ? JSON.parse(i.steps) : [],
      resources: i.resources ? JSON.parse(i.resources) : [],
      score: i.score,
      cluster: i.cluster,
    });

    return NextResponse.json({
      item: transformItem(item),
      related: relatedItems.map(transformItem),
    });
  } catch (error) {
    console.error('Item API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 }
    );
  }
}
