/**
 * 健康检查 API
 * GET /api/health
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // 检查数据库连接
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - startTime;
    
    // 获取内容统计
    const totalItems = await prisma.item.count();
    const publishedItems = await prisma.item.count({
      where: { status: 'PUBLISHED' },
    });
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        latencyMs: dbLatency,
      },
      content: {
        total: totalItems,
        published: publishedItems,
      },
      uptime: process.uptime(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
