/**
 * 批量发布待审核内容
 * 
 * 使用方法：
 *   npx tsx scripts/bulk-publish.ts
 */

import { prisma } from '../lib/prisma';

async function bulkPublish() {
  console.log('\n📢 批量发布待审核内容...\n');
  
  try {
    // 获取所有待审核内容
    const pendingItems = await prisma.item.findMany({
      where: { status: 'PENDING' },
      orderBy: { publishedAt: 'desc' },
    });
    
    console.log(`找到 ${pendingItems.length} 条待审核内容\n`);
    
    if (pendingItems.length === 0) {
      console.log('✅ 没有待发布的内容');
      return;
    }
    
    // 批量更新状态
    const itemIds = pendingItems.map(item => item.id);
    
    await prisma.item.updateMany({
      where: { id: { in: itemIds } },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
    
    console.log('✅ 发布成功!\n');
    console.log('📋 已发布内容:');
    console.log('='.repeat(60));
    
    pendingItems.forEach((item, index) => {
      console.log(`${index + 1}. [${item.sourceType}] ${item.titleCn || item.titleRaw}`);
    });
    
    console.log('='.repeat(60));
    console.log(`\n总计：${pendingItems.length} 条内容已发布`);
    console.log('\n💡 下一步：');
    console.log('   - 访问 http://localhost:3000 查看首页');
    console.log('   - 内容已对所有用户可见');
    
  } catch (error) {
    console.error('❌ 发布失败:', error instanceof Error ? error.message : error);
    throw error;
  }
}

bulkPublish()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本异常:', error);
    process.exit(1);
  });
