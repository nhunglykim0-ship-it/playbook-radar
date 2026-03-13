import { prisma } from './prisma';
import { summarizeAndTag } from './claude';

// YouTube 频道配置列表
// 格式：频道名称 -> 频道 ID
// 获取频道 ID 方法：访问频道页 -> 查看源代码 -> 搜索 "channel_id"
// 或使用：https://www.youtube.com/@频道名 -> 重定向 URL 中包含 channel_id

export const YOUTUBE_CHANNELS = [
  {
    name: 'AI Jason',
    channelId: 'UCxqAWLTk1CmBvZFPzeZMd9A',
    enabled: true,
  },
  {
    name: 'Fireship',
    channelId: 'UCsBjURrPoezykLs9EqgamOA',
    enabled: true,
  },
  {
    name: 'AI Explained',
    channelId: 'UCkRfGP3M0vSfUq3r3dGZJNg',
    enabled: true,
  },
  {
    name: 'LangChain',
    channelId: 'UCIy4T5h9b0hxQ8M8vqGqFJQ',
    enabled: true,
  },
  {
    name: 'OpenClaw',
    channelId: 'UC_OPENCLAW_CHANNEL_ID', // TODO: 替换为真实 ID
    enabled: false, // 暂时禁用，直到找到真实 ID
  },
];

/**
 * 解析 YouTube RSS XML
 */
function parseYouTubeRSS(xml: string): VideoEntry[] {
  const videos: VideoEntry[] = [];
  
  // 简单的 XML 解析（生产环境建议使用 xmldom 或 fast-xml-parser）
  const entries = xml.split('<entry>');
  
  for (const entry of entries) {
    if (!entry.includes('</entry>')) continue;
    
    try {
      const videoId = extractTag(entry, 'yt:videoId');
      const title = extractTag(entry, 'title');
      const author = extractTag(entry, 'author', 'name');
      const published = extractTag(entry, 'published');
      const url = extractTag(entry, 'link', 'href');
      
      if (videoId && title && url) {
        videos.push({
          videoId,
          title,
          channel: author,
          publishedAt: new Date(published),
          url,
        });
      }
    } catch (e) {
      console.error('解析 entry 失败:', e);
    }
  }
  
  return videos;
}

function extractTag(xml: string, tag: string, subTag?: string): string {
  const openTag = subTag ? `<${tag}>` : `<${tag}>`;
  const closeTag = subTag ? `</${tag}>` : `</${tag}>`;
  
  let start = xml.indexOf(openTag);
  if (start === -1) return '';
  
  start += openTag.length;
  
  if (subTag) {
    // 处理嵌套标签，如 <author><name>xxx</name></author>
    const subOpen = xml.indexOf(`<${subTag}>`, start);
    const subClose = xml.indexOf(`</${subTag}>`, subOpen);
    if (subOpen === -1 || subClose === -1) return '';
    return xml.substring(subOpen + `<${subTag}>`.length, subClose);
  }
  
  // 处理 href 属性
  if (tag === 'link') {
    const hrefMatch = xml.substring(start).match(/href="([^"]+)"/);
    if (hrefMatch) return hrefMatch[1];
  }
  
  const end = xml.indexOf(closeTag, start);
  if (end === -1) return '';
  
  return xml.substring(start, end).trim();
}

interface VideoEntry {
  videoId: string;
  title: string;
  channel: string;
  publishedAt: Date;
  url: string;
}

/**
 * 从单个频道 RSS 抓取视频
 */
async function fetchChannelRSS(channelId: string): Promise<VideoEntry[]> {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  
  console.log(`  抓取 RSS: ${rssUrl}`);
  
  const res = await fetch(rssUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; PlaybookRadar/1.0)',
      'Accept': 'application/xml',
    },
  });
  
  if (!res.ok) {
    throw new Error(`RSS 请求失败：${res.status}`);
  }
  
  const xml = await res.text();
  return parseYouTubeRSS(xml);
}

/**
 * 计算热度分数
 */
function calculateHeatScore(publishedAt: Date): number {
  const daysSince = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
  const recencyFactor = 1 / Math.log2(daysSince + 2);
  
  // RSS 没有播放量数据，主要基于时间
  // 新发布的视频热度更高
  return Math.max(1, Math.min(10, recencyFactor * 8));
}

/**
 * 主函数：抓取所有启用的频道
 */
export async function fetchYouTubeRSS(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  try {
    let totalCount = 0;
    let errorCount = 0;
    
    const enabledChannels = YOUTUBE_CHANNELS.filter(c => c.enabled);
    console.log(`\n📺 开始抓取 ${enabledChannels.length} 个 YouTube 频道 RSS...`);
    
    for (const channel of enabledChannels) {
      console.log(`\n📌 频道：${channel.name} (${channel.channelId})`);
      
      try {
        const videos = await fetchChannelRSS(channel.channelId);
        console.log(`  找到 ${videos.length} 个视频`);
        
        let channelCount = 0;
        
        for (const video of videos) {
          // 检查是否已存在
          const existing = await prisma.item.findUnique({
            where: { url: video.url },
          });
          
          if (existing) {
            continue; // 跳过已存在的视频
          }
          
          // 调用 AI 生成中文标题和摘要
          console.log(`  🤖 AI 处理：${video.title.substring(0, 50)}...`);
          const analysis = await summarizeAndTag({
            title: video.title,
            description: `${video.channel} - ${video.title}`,
          });
          
          // 计算热度
          const heatScore = calculateHeatScore(video.publishedAt);
          
          // 保存到数据库
          await prisma.item.create({
            data: {
              sourceType: 'youtube',
              sourceId: video.videoId,
              url: video.url,
              titleRaw: video.title,
              titleCn: analysis.titleCn,
              descriptionRaw: `${video.channel} 发布于 ${video.publishedAt.toISOString()}`,
              descriptionCn: analysis.summaryCn || `${video.channel} 的最新视频`,
              author: video.channel,
              publishedAt: video.publishedAt,
              fetchedAt: new Date(),
              status: 'PENDING', // 待审核
              heatScore,
              views: 0, // RSS 无法获取播放量
              likes: 0,
              comments: 0,
            },
          });
          
          // 添加标签
          if (analysis.tags && analysis.tags.length > 0) {
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
              
              // 检查是否已存在该标签关联
              const existingItem = await prisma.item.findUnique({
                where: { url: video.url },
              });
              
              const existingTag = await prisma.itemTag.findUnique({
                where: {
                  itemId_tagId: {
                    itemId: existingItem?.id || '',
                    tagId: tag.id,
                  },
                },
              }).catch(() => null);
              
              if (!existingTag) {
                // 获取刚创建的 item
                const newItem = await prisma.item.findUnique({
                  where: { url: video.url },
                });
                if (newItem) {
                  await prisma.itemTag.create({
                    data: {
                      itemId: newItem.id,
                      tagId: tag.id,
                    },
                  });
                }
              }
            }
          }
          
          channelCount++;
          totalCount++;
        }
        
        console.log(`  ✅ 新增 ${channelCount} 条`);
        
        // 更新最后抓取时间
        await prisma.sourceConfig.upsert({
          where: { name: `youtube:${channel.name}` },
          update: { lastFetched: new Date() },
          create: {
            name: `youtube:${channel.name}`,
            type: 'youtube',
            config: JSON.stringify({ channelId: channel.channelId }),
            lastFetched: new Date(),
          },
        });
        
      } catch (error) {
        console.error(`  ❌ 抓取失败：${error instanceof Error ? error.message : error}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 汇总：新增 ${totalCount} 条，${errorCount} 个频道失败`);
    
    return {
      success: totalCount > 0,
      count: totalCount,
      error: errorCount > 0 ? `${errorCount} 个频道失败` : undefined,
    };
    
  } catch (error) {
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}
