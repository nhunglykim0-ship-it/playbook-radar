import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 获取所有标签及其使用次数
    const tags = await prisma.tag.findMany({
      include: {
        items: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // 转换为前端格式
    const transformed = tags
      .map((tag) => ({
        name: tag.name,
        category: tag.category,
        description: tag.description,
        count: tag.items.length,
      }))
      .filter((t) => t.count > 0)
      .sort((a, b) => b.count - a.count);

    // 按分类分组
    const grouped: Record<string, typeof transformed> = {};
    transformed.forEach((tag) => {
      const category = tag.category || 'OTHER';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(tag);
    });

    return NextResponse.json({
      tags: transformed,
      grouped,
      total: transformed.length,
    });
  } catch (error) {
    console.error('Tags API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}
