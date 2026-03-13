import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { tag: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = decodeURIComponent(params.tag);
    const sortBy = searchParams.get('sortBy') || 'heatScore';
    const difficulty = searchParams.get('difficulty');
    const cost = searchParams.get('cost');

    // 构建查询条件
    const where: any = {
      status: 'PUBLISHED',
      OR: [
        {
          tags: {
            some: {
              tag: {
                name: tag,
              },
            },
          },
        },
        { cluster: tag },
      ],
    };

    // 难度筛选
    if (difficulty && difficulty !== 'all') {
      where.difficulty = difficulty;
    }

    // 成本筛选
    if (cost && cost !== 'all') {
      where.cost = cost;
    }

    // 排序
    const orderBy: any = {};
    if (sortBy === 'heatScore') {
      orderBy.heatScore = 'desc';
    } else if (sortBy === 'publishedAt') {
      orderBy.publishedAt = 'desc';
    } else if (sortBy === 'score') {
      orderBy.score = 'desc';
    }

    // 获取内容
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
    });

    // 获取相关专题（共同标签最多的）
    const tagObj = await prisma.tag.findUnique({
      where: { name: tag },
      include: {
        items: {
          include: {
            item: {
              include: {
                tags: {
                  include: {
                    tag: true,
                  },
                },
              },
            },
          },
          take: 20,
        },
      },
    });

    const relatedTags: Record<string, number> = {};
    tagObj?.items.forEach((itemTag: any) => {
      itemTag.item.tags.forEach((t: any) => {
        if (t.tag.name !== tag) {
          relatedTags[t.tag.name] = (relatedTags[t.tag.name] || 0) + 1;
        }
      });
    });

    const related = Object.entries(relatedTags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

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
    });

    return NextResponse.json({
      tag,
      items: items.map(transformItem),
      related,
      stats: {
        total: items.length,
        avgScore: items.reduce((sum: number, i: any) => sum + (i.score || 5), 0) / items.length,
        avgHeat: items.reduce((sum: number, i: any) => sum + i.heatScore, 0) / items.length,
      },
    });
  } catch (error) {
    console.error('Topics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topic items' },
      { status: 500 }
    );
  }
}
