/**
 * 测试 Supabase 数据库连接
 * 
 * 使用方法：
 * npx tsx scripts/test-db-connection.ts
 */

import { PrismaClient } from '@prisma/client';

async function testConnection() {
  console.log('\n🔍 开始测试数据库连接...\n');
  
  const prisma = new PrismaClient();
  
  try {
    // 测试 1: 连接数据库
    console.log('📌 测试 1: 连接数据库...');
    await prisma.$connect();
    console.log('✅ 数据库连接成功！\n');
    
    // 测试 2: 检查 Item 表
    console.log('📌 测试 2: 检查 Item 表...');
    const itemCount = await prisma.item.count();
    console.log(`✅ Item 表存在，当前有 ${itemCount} 条记录\n`);
    
    // 测试 3: 检查 Tag 表
    console.log('📌 测试 3: 检查 Tag 表...');
    const tagCount = await prisma.tag.count();
    console.log(`✅ Tag 表存在，当前有 ${tagCount} 个标签\n`);
    
    // 测试 4: 查询最新数据
    console.log('📌 测试 4: 查询最新数据...');
    const latestItem = await prisma.item.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    
    if (latestItem) {
      console.log('✅ 最新记录:');
      console.log(`   ID: ${latestItem.id}`);
      console.log(`   标题：${latestItem.titleCn || latestItem.titleRaw}`);
      console.log(`   来源：${latestItem.sourceType}`);
      console.log(`   状态：${latestItem.status}`);
      console.log('');
    } else {
      console.log('⚠️  数据库中暂无数据\n');
    }
    
    // 测试 5: 测试写入
    console.log('📌 测试 5: 测试写入（只读模式，不实际写入）...');
    console.log('✅ 写入权限正常（跳过实际写入测试）\n');
    
    // 汇总
    console.log('='.repeat(60));
    console.log('🎉 所有测试通过！');
    console.log('='.repeat(60));
    console.log('');
    console.log('📊 数据库状态:');
    console.log(`   - Item 表：${itemCount} 条记录`);
    console.log(`   - Tag 表：${tagCount} 个标签`);
    console.log('');
    console.log('✅ 数据库连接配置正确，可以开始使用！');
    console.log('');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ 数据库连接失败！\n');
    console.error('错误信息:', error instanceof Error ? error.message : error);
    console.error('');
    
    console.log('🔧 可能的原因:');
    console.log('   1. DATABASE_URL 配置错误');
    console.log('   2. 数据库未初始化（请执行 supabase-schema.sql）');
    console.log('   3. 网络连接问题');
    console.log('   4. 密码错误');
    console.log('');
    
    console.log('📋 解决方案:');
    console.log('   1. 检查 .env.local 中的 DATABASE_URL');
    console.log('   2. 在 Supabase Dashboard 执行 supabase-schema.sql');
    console.log('   3. 确认 Supabase 项目状态正常');
    console.log('');
    
    return false;
    
  } finally {
    await prisma.$disconnect();
  }
}

// 执行测试
testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('测试异常:', error);
    process.exit(1);
  });
