/**
 * 日报生成脚本 - 由 Cron 自动触发
 * 
 * 触发方式：
 * 1. Cron 自动：每天 20:00 (Asia/Shanghai)
 * 2. 手动触发：npx tsx scripts/generate-daily-digest.ts
 */

import { prisma } from '../lib/prisma';
import { generateDigest } from '../lib/claude';
import { format } from 'date-fns';

async function generateDailyDigest() {
  console.log('\n📰 开始生成日报...\n');
  
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayStart = new Date(today);
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);
    
    // 获取今天发布的内容
    const items = await prisma.item.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
      orderBy: { heatScore: 'desc' },
      take: 20,
    });
    
    console.log(`找到 ${items.length} 条今日内容`);
    
    if (items.length === 0) {
      console.log('今日无新内容，跳过日报生成');
      return { success: true, skipped: true };
    }
    
    // 准备数据
    const itemsForDigest = items.map((item) => ({
      titleCn: item.titleCn || item.titleRaw,
      summaryCn: item.descriptionCn || item.descriptionRaw || '',
      url: item.url,
      sourceType: item.sourceType,
    }));
    
    // 调用 AI 生成日报
    console.log('🤖 AI 生成日报中...');
    const digest = await generateDigest(itemsForDigest);
    
    // 保存到数据库
    const digestRecord = await prisma.dailyDigest.upsert({
      where: { date: today },
      update: {
        itemsJson: JSON.stringify(items.map(i => ({ id: i.id, title: i.titleCn }))),
        summary: digest,
        generatedAt: new Date(),
      },
      create: {
        date: today,
        itemsJson: JSON.stringify(items.map(i => ({ id: i.id, title: i.titleCn }))),
        summary: digest,
      },
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 日报生成完成');
    console.log('='.repeat(60));
    console.log(`日期：${today}`);
    console.log(`内容数：${items.length}`);
    console.log(`记录 ID: ${digestRecord.id}`);
    console.log('');
    console.log('📋 日报预览:');
    console.log('');
    console.log(digest);
    console.log('');
    
    return { success: true, digest };
    
  } catch (error) {
    console.error('❌ 日报生成失败:', error instanceof Error ? error.message : error);
    return { success: false, error };
  }
}

// 执行
generateDailyDigest()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('脚本异常:', error);
    process.exit(1);
  });
