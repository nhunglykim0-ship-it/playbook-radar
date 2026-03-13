import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const items = await prisma.item.findMany({
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { fetchedAt: 'desc' },
      take: 100,
    });

    const transformed = items.map((item) => ({
      id: item.id,
      sourceType: item.sourceType,
      titleRaw: item.titleRaw,
      titleCn: item.titleCn,
      url: item.url,
      author: item.author,
      publishedAt: item.publishedAt.toISOString(),
      heatScore: item.heatScore,
      status: item.status,
      views: item.views,
      likes: item.likes,
      comments: item.comments,
      tags: item.tags.map((t) => t.tag.name),
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Admin items API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}
