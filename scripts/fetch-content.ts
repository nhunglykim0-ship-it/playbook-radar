/**
 * 内容采集脚本 - 由 Cron 自动触发
 * 
 * 触发方式：
 * 1. Cron 自动：每 6 小时执行一次
 * 2. 手动触发：curl -X POST http://localhost:3001/api/fetch
 * 
 * 使用方法：
 *   npx tsx scripts/fetch-content.ts
 */

import { fetchGitHubRepos } from '../lib/github-trending';
import { fetchRSSFeeds } from '../lib/rss';

async function fetchContent() {
  console.log('\n🚀 开始采集内容...\n');
  
  try {
    // GitHub 采集
    console.log('📦 采集 GitHub 仓库...');
    const github = await fetchGitHubRepos();
    
    // RSS 采集
    console.log('\n📰 采集 RSS 博客...');
    const rss = await fetchRSSFeeds();
    
    // 汇总结果
    const total = github.count + rss.count;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 采集完成');
    console.log('='.repeat(60));
    console.log(`✅ 新增 ${total} 条内容`);
    console.log(`   - GitHub: ${github.count} 条`);
    console.log(`   - RSS: ${rss.count} 条`);
    
    if (github.error) {
      console.log(`⚠️  GitHub 错误：${github.error}`);
    }
    if (rss.error) {
      console.log(`⚠️  RSS 错误：${rss.error}`);
    }
    
    console.log('');
    console.log('📋 下一步：');
    console.log('   1. 访问 http://localhost:3001/admin 审核新内容');
    console.log('   2. 审核通过后，内容将显示在首页');
    console.log('');
    
    return { success: true, total };
    
  } catch (error) {
    console.error('❌ 采集失败:', error instanceof Error ? error.message : error);
    return { success: false, error };
  }
}

// 执行
fetchContent()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('脚本异常:', error);
    process.exit(1);
  });
