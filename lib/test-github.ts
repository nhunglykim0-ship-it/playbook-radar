/**
 * GitHub 采集链路手动测试脚本
 * 
 * 使用方法：
 *   npx tsx lib/test-github.ts
 * 
 * GitHub API 国内可访问，无需代理
 */

import { prisma } from './prisma';
import { fetchGitHubRepos, GITHUB_REPOS } from './github-trending';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color: string, message: string) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testGitHub() {
  console.log('\n' + '='.repeat(60));
  log(colors.cyan, '🧪 GitHub 采集链路测试');
  log(colors.cyan, '   GitHub API 国内可访问，无需代理');
  console.log('='.repeat(60) + '\n');

  // 步骤 1: 显示配置
  log(colors.blue, '📌 步骤 1: 仓库配置');
  console.log(`   共配置 ${GITHUB_REPOS.length} 个仓库:`);
  GITHUB_REPOS.forEach(({ owner, repo }) => {
    console.log(`   - ${owner}/${repo}`);
  });
  console.log('');

  // 步骤 2: 执行采集
  log(colors.blue, '📌 步骤 2: 执行 GitHub 采集');
  console.log('');
  
  const result = await fetchGitHubRepos();
  
  console.log('');
  console.log('='.repeat(60));
  log(colors.blue, '📊 采集汇总');
  console.log('='.repeat(60));
  log(colors.green, `✅ 成功入库：${result.count} 条`);
  if (result.error) {
    log(colors.red, `❌ 错误：${result.error}`);
  }
  console.log('');

  // 步骤 3: 验证数据库
  log(colors.blue, '📌 步骤 3: 验证数据库内容');
  const githubItems = await prisma.item.findMany({
    where: { sourceType: 'github' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  if (githubItems.length > 0) {
    log(colors.green, `✅ 数据库中有 ${githubItems.length} 条 GitHub 内容`);
    console.log('\n   最新 10 条：');
    githubItems.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.titleCn || item.titleRaw}`);
      console.log(`      状态：${item.status} | ⭐ ${item.views} | 🔥 ${item.heatScore.toFixed(1)}`);
      console.log(`      标签：${item.tags.map(t => t.tag.name).join(', ')}`);
    });
  } else {
    log(colors.yellow, '⚠️  数据库中没有 GitHub 内容');
  }

  console.log('');
  console.log('='.repeat(60));
  log(colors.cyan, '🎉 测试完成！');
  console.log('='.repeat(60));

  // 下一步建议
  console.log('\n📋 下一步建议：');
  if (result.count > 0) {
    log(colors.green, '1. ✅ GitHub 采集链路已打通（国内可访问）');
    log(colors.green, '2. 访问 http://localhost:3001/admin 审核新内容');
    log(colors.green, '3. 审核通过后，内容将显示在首页');
    log(colors.yellow, '4. 验证通过后，可以注册 Cron 任务实现自动采集');
  } else {
    log(colors.yellow, '1. 检查网络连接');
    log(colors.yellow, '2. 查看上方错误信息');
  }
  console.log('');

  return result.success;
}

// 执行测试
testGitHub()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('测试异常:', error);
    process.exit(1);
  });
