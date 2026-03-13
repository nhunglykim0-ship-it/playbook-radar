/**
 * YouTube 真实采集链路手动测试脚本
 * 
 * 使用方法：
 *   npx tsx lib/test-youtube.ts
 * 
 * 验证环节：
 * 1. API 调用是否成功
 * 2. 数据是否成功入库
 * 3. 字段是否正确（标题、摘要、标签、时间等）
 * 4. 是否有重复内容检测
 */

import { prisma } from './prisma';
import { summarizeAndTag } from './claude';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const SEARCH_QUERY = 'OpenClaw OR "Open Claw" OR openclaw.ai';
const MAX_RESULTS = 5; // 测试模式，只获取 5 条

// 颜色输出
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

async function testYouTubeFetch() {
  console.log('\n' + '='.repeat(60));
  log(colors.cyan, '🧪 YouTube 真实采集链路测试');
  console.log('='.repeat(60) + '\n');

  // 步骤 1: 检查 API Key 配置
  log(colors.blue, '📌 步骤 1: 检查 API Key 配置');
  if (!YOUTUBE_API_KEY) {
    log(colors.red, '❌ 错误：YOUTUBE_API_KEY 未配置');
    log(colors.yellow, '💡 请在 .env.local 中设置 YOUTUBE_API_KEY');
    console.log('');
    return false;
  }
  if (YOUTUBE_API_KEY === 'your_youtube_api_key_here') {
    log(colors.red, '❌ 错误：YOUTUBE_API_KEY 仍是占位符');
    log(colors.yellow, '💡 请在 .env.local 中填入真实的 API Key');
    console.log('');
    return false;
  }
  log(colors.green, '✅ API Key 已配置');
  console.log(`   搜索词：${SEARCH_QUERY}`);
  console.log(`   最大结果数：${MAX_RESULTS}\n`);

  // 步骤 2: 调用 YouTube Search API
  log(colors.blue, '📌 步骤 2: 调用 YouTube Search API');
  try {
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('q', SEARCH_QUERY);
    searchUrl.searchParams.set('maxResults', MAX_RESULTS.toString());
    searchUrl.searchParams.set('key', YOUTUBE_API_KEY);
    searchUrl.searchParams.set('order', 'date');
    searchUrl.searchParams.set('type', 'video');

    log(colors.cyan, `   GET ${searchUrl.toString()}`);
    
    const searchRes = await fetch(searchUrl.toString());
    const searchData = await searchRes.json();

    if (!searchRes.ok) {
      log(colors.red, `❌ API 请求失败：${searchRes.status}`);
      log(colors.red, `   错误：${JSON.stringify(searchData.error)}`);
      return false;
    }

    const videoCount = searchData.items?.length || 0;
    log(colors.green, `✅ API 请求成功，找到 ${videoCount} 个视频\n`);

    if (videoCount === 0) {
      log(colors.yellow, '⚠️  没有找到匹配的视频');
      log(colors.yellow, `   建议：尝试修改搜索词 "${SEARCH_QUERY}"`);
      return false;
    }

    // 步骤 3: 处理每个视频
    log(colors.blue, '📌 步骤 3: 处理视频数据');
    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (const item of searchData.items || []) {
      const videoId = item.id.videoId;
      if (!videoId) continue;

      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      console.log(`\n   --- 视频 ${videoId} ---`);

      // 检查重复
      const existing = await prisma.item.findUnique({
        where: { url: videoUrl },
      });

      if (existing) {
        log(colors.yellow, `   ⏭️  跳过（已存在）: ${existing.titleRaw.substring(0, 50)}...`);
        duplicateCount++;
        continue;
      }

      // 获取视频详情
      try {
        const videoDetails = await getVideoDetails(videoId);
        if (!videoDetails) {
          log(colors.red, `   ❌ 获取视频详情失败`);
          errorCount++;
          continue;
        }

        log(colors.cyan, `   📺 标题：${videoDetails.title}`);
        log(colors.cyan, `   📺 频道：${videoDetails.channelTitle}`);
        log(colors.cyan, `   📺 发布时间：${videoDetails.publishedAt}`);
        log(colors.cyan, `   📺 播放量：${videoDetails.viewCount.toLocaleString()}`);

        // 调用 AI 生成中文标题和摘要
        log(colors.cyan, `   🤖 调用 AI 生成中文标题和摘要...`);
        const analysis = await summarizeAndTag({
          title: videoDetails.title,
          description: videoDetails.description.substring(0, 3000),
        });

        log(colors.green, `   ✅ 中文标题：${analysis.titleCn}`);
        log(colors.green, `   ✅ 标签：${analysis.tags.join(', ')}`);

        // 计算热度分数
        const heatScore = calculateHeatScore(
          videoDetails.viewCount,
          videoDetails.likeCount || 0,
          videoDetails.commentCount || 0,
          new Date(videoDetails.publishedAt)
        );

        // 保存到数据库
        const created = await prisma.item.create({
          data: {
            sourceType: 'youtube',
            sourceId: videoId,
            url: videoUrl,
            titleRaw: videoDetails.title,
            titleCn: analysis.titleCn,
            descriptionRaw: videoDetails.description.substring(0, 5000),
            descriptionCn: analysis.summaryCn,
            author: videoDetails.channelTitle,
            publishedAt: new Date(videoDetails.publishedAt),
            status: 'PENDING', // 待审核
            heatScore,
            views: videoDetails.viewCount,
            likes: videoDetails.likeCount || 0,
            comments: videoDetails.commentCount || 0,
          },
        });

        log(colors.green, `   ✅ 已入库 (ID: ${created.id})`);
        successCount++;

        // 添加标签
        if (analysis.tags.length > 0) {
          for (const tagName of analysis.tags) {
            const tag = await prisma.tag.upsert({
              where: { name: tagName },
              update: {},
              create: {
                name: tagName,
                category: 'PLAYSTYLE',
                description: `${tagName} 相关内容`,
              },
            });
            await prisma.itemTag.create({
              data: {
                itemId: created.id,
                tagId: tag.id,
              },
            });
          }
          log(colors.green, `   ✅ 已添加标签：${analysis.tags.join(', ')}`);
        }

      } catch (error) {
        log(colors.red, `   ❌ 处理失败：${error instanceof Error ? error.message : '未知错误'}`);
        errorCount++;
      }
    }

    // 步骤 4: 汇总结果
    console.log('\n' + '='.repeat(60));
    log(colors.blue, '📊 测试汇总');
    console.log('='.repeat(60));
    log(colors.green, `✅ 成功入库：${successCount} 条`);
    log(colors.yellow, `⏭️  跳过重复：${duplicateCount} 条`);
    log(colors.red, `❌ 处理失败：${errorCount} 条`);
    console.log('');

    // 步骤 5: 验证结果
    log(colors.blue, '📌 步骤 5: 验证数据库内容');
    const youtubeItems = await prisma.item.findMany({
      where: { sourceType: 'youtube' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    if (youtubeItems.length > 0) {
      log(colors.green, `✅ 数据库中有 ${youtubeItems.length} 条 YouTube 内容`);
      console.log('\n   最新 5 条：');
      youtubeItems.forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.titleCn || item.titleRaw}`);
        console.log(`      状态：${item.status} | 热度：${item.heatScore.toFixed(1)}`);
        console.log(`      标签：${item.tags.map(t => t.tag.name).join(', ')}`);
      });
    } else {
      log(colors.yellow, '⚠️  数据库中没有 YouTube 内容');
    }

    console.log('');
    console.log('='.repeat(60));
    log(colors.cyan, '🎉 测试完成！');
    console.log('='.repeat(60));

    // 下一步建议
    console.log('\n📋 下一步建议：');
    if (successCount > 0) {
      log(colors.green, '1. ✅ 采集链路已打通');
      log(colors.green, '2. 访问 http://localhost:3001/admin 审核新内容');
      log(colors.green, '3. 审核通过后，内容将显示在首页');
      log(colors.yellow, '4. 验证通过后，可以注册 Cron 任务实现自动采集');
    } else {
      log(colors.yellow, '1. 检查 API Key 是否正确');
      log(colors.yellow, '2. 检查搜索词是否合适');
      log(colors.yellow, '3. 查看上方错误信息');
    }
    console.log('');

    return successCount > 0;

  } catch (error) {
    log(colors.red, `❌ 测试失败：${error instanceof Error ? error.message : '未知错误'}`);
    console.log('');
    return false;
  }
}

async function getVideoDetails(videoId: string) {
  const url = new URL('https://www.googleapis.com/youtube/v3/videos');
  url.searchParams.set('part', 'snippet,statistics');
  url.searchParams.set('id', videoId);
  url.searchParams.set('key', YOUTUBE_API_KEY!);

  const res = await fetch(url.toString());
  const data = await res.json();

  if (!res.ok || !data.items?.length) return null;

  const item = data.items[0];
  return {
    videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    viewCount: parseInt(item.statistics.viewCount) || 0,
    likeCount: parseInt(item.statistics.likeCount) || 0,
    commentCount: parseInt(item.statistics.commentCount) || 0,
  };
}

function calculateHeatScore(
  views: number,
  likes: number,
  comments: number,
  publishedAt: Date
): number {
  const daysSince = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
  const recencyFactor = 1 / Math.log2(daysSince + 2);

  const viewsNorm = Math.log10(views + 1);
  const likesNorm = Math.log10(likes + 1);
  const commentsNorm = Math.log10(comments + 1);

  return (
    viewsNorm * 0.3 +
    likesNorm * 0.3 +
    commentsNorm * 0.2 +
    recencyFactor * 10 * 0.2
  );
}

// 执行测试
testYouTubeFetch()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('测试异常:', error);
    process.exit(1);
  });
