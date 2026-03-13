import { NextResponse } from 'next/server';
import { fetchGitHubRepos } from '@/lib/github-trending';
import { fetchRSSFeeds } from '@/lib/rss';

export async function POST() {
  try {
    // GitHub 仓库采集（国内可访问）
    const github = await fetchGitHubRepos();
    
    // RSS 博客采集
    const rss = await fetchRSSFeeds();

    const total = github.count + rss.count;
    const errors = [github.error, rss.error].filter(Boolean);

    return NextResponse.json({
      success: total > 0,
      message: `采集完成，新增 ${total} 条内容`,
      details: {
        github: { success: github.success, count: github.count },
        rss: { success: rss.success, count: rss.count },
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { success: false, error: '采集失败' },
      { status: 500 }
    );
  }
}
