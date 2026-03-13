import { prisma } from './prisma';
import { summarizeAndTag } from './claude';

// GitHub 仓库配置列表
// 这些是国内可访问的 AI/自动化相关热门仓库
export const GITHUB_REPOS = [
  { owner: 'langchain-ai', repo: 'langchain', topics: ['多 agent', '自动化', 'coding'] },
  { owner: 'openclaw', repo: 'openclaw', topics: ['自动化', '浏览器控制', '一人公司'] },
  { owner: 'huggingface', repo: 'transformers', topics: ['AI', 'coding', '自动化'] },
  { owner: 'microsoft', repo: 'autogen', topics: ['多 agent', 'AI', '自动化'] },
  { owner: 'vercel', repo: 'next.js', topics: ['coding', 'webhook', '自动化'] },
  { owner: 'n8n-io', repo: 'n8n', topics: ['自动化', 'webhook', '一人公司'] },
  { owner: 'langfuse', repo: 'langfuse', topics: ['多 agent', '自动化', 'coding'] },
  { owner: 'langgenius', repo: 'dify', topics: ['AI', '自动化', '多 agent'] },
];

/**
 * 获取 GitHub 仓库信息
 */
async function fetchRepoInfo(owner: string, repo: string) {
  const url = `https://api.github.com/repos/${owner}/${repo}`;
  
  console.log(`  请求：${url}`);
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'PlaybookRadar/1.0',
      'Accept': 'application/vnd.github+json',
    },
  });
  
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('GitHub API 速率限制，请稍后再试');
    }
    throw new Error(`GitHub API 错误：${res.status}`);
  }
  
  return res.json();
}

/**
 * 获取仓库最近的活动（issues/PRs 作为更新信号）
 */
async function fetchRepoActivity(owner: string, repo: string) {
  // 获取最近的 issues 作为活动信号
  const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=5`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'PlaybookRadar/1.0',
      },
    });
    
    if (res.ok) {
      const issues = await res.json();
      if (issues.length > 0) {
        return new Date(issues[0].updated_at);
      }
    }
  } catch (e) {
    // 忽略错误
  }
  
  return null;
}

/**
 * 计算热度分数
 */
function calculateHeatScore(stars: number, forks: number, updatedAt: Date): number {
  const daysSince = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  const recencyFactor = 1 / Math.log2(daysSince + 2);
  
  // 基于 star 数的对数刻度
  const starsNorm = Math.log10(stars + 1);
  const forksNorm = Math.log10(forks + 1);
  
  return Math.min(10, starsNorm * 0.4 + forksNorm * 0.3 + recencyFactor * 3);
}

/**
 * 主函数：抓取 GitHub 仓库信息
 */
export async function fetchGitHubRepos(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  try {
    let totalCount = 0;
    let errorCount = 0;
    
    console.log(`\n💻 开始抓取 ${GITHUB_REPOS.length} 个 GitHub 仓库...`);
    
    for (const { owner, repo, topics } of GITHUB_REPOS) {
      console.log(`\n📌 仓库：${owner}/${repo}`);
      
      try {
        const repoInfo = await fetchRepoInfo(owner, repo);
        
        const videoId = `${owner}/${repo}`;
        const url = repoInfo.html_url;
        
        // 检查是否已存在
        const existing = await prisma.item.findUnique({
          where: { url },
        });
        
        if (existing) {
          // 更新现有记录的活动时间
          const activityDate = await fetchRepoActivity(owner, repo);
          if (activityDate) {
            await prisma.item.update({
              where: { id: existing.id },
              data: {
                heatScore: calculateHeatScore(repoInfo.stargazers_count, repoInfo.forks_count, activityDate),
              },
            });
          }
          console.log(`  ⏭️  跳过（已存在），热度已更新`);
          continue;
        }
        
        // AI 生成中文标题和摘要
        console.log(`  🤖 AI 处理中...`);
        const analysis = await summarizeAndTag({
          title: `${repoInfo.name}: ${repoInfo.description || 'No description'}`,
          description: `${repoInfo.description || ''}\n\nStars: ${repoInfo.stargazers_count}\nForks: ${repoInfo.forks_count}\nTopics: ${repoInfo.topics?.join(', ') || topics.join(', ')}`,
        });
        
        // 获取活动时间
        const activityDate = await fetchRepoActivity(owner, repo) || new Date(repoInfo.updated_at);
        
        // 计算热度
        const heatScore = calculateHeatScore(
          repoInfo.stargazers_count,
          repoInfo.forks_count,
          activityDate
        );
        
        // 保存到数据库
        const created = await prisma.item.create({
          data: {
            sourceType: 'github',
            sourceId: videoId,
            url,
            titleRaw: `${repoInfo.name}: ${repoInfo.description || 'No description'}`,
            titleCn: analysis.titleCn,
            descriptionRaw: repoInfo.description || '',
            descriptionCn: analysis.summaryCn || `${repoInfo.name} - GitHub 热门项目`,
            author: owner,
            publishedAt: new Date(repoInfo.created_at),
            fetchedAt: new Date(),
            status: 'PENDING',
            heatScore,
            views: repoInfo.stargazers_count,
            likes: repoInfo.forks_count,
            comments: repoInfo.open_issues_count || 0,
          },
        });
        
        // 添加标签（预定义 + AI 生成）
        const allTags = [...new Set([...topics, ...(analysis.tags || [])])];
        for (const tagName of allTags.slice(0, 5)) {
          const tag = await prisma.tag.upsert({
            where: { name: tagName },
            update: {},
            create: {
              name: tagName,
              category: 'TOOL',
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
        
        console.log(`  ✅ 新增：${analysis.titleCn} (⭐ ${repoInfo.stargazers_count}, 🔥 ${heatScore.toFixed(1)})`);
        totalCount++;
        
      } catch (error) {
        console.error(`  ❌ 失败：${error instanceof Error ? error.message : error}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 汇总：新增 ${totalCount} 条，${errorCount} 个仓库失败`);
    
    return {
      success: totalCount > 0,
      count: totalCount,
      error: errorCount > 0 ? `${errorCount} 个仓库失败` : undefined,
    };
    
  } catch (error) {
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}
