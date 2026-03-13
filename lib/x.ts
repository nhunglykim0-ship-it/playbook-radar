import { prisma } from './prisma';
import { summarizeAndTag } from './claude';

const X_API_KEY = process.env.X_API_KEY;
const SEARCH_QUERY = 'OpenClaw OR openclaw.ai';

export async function fetchXTweets(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  if (!X_API_KEY) {
    return { success: false, count: 0, error: 'X API key not configured' };
  }

  try {
    // X API v2 搜索
    const url = new URL('https://api.twitter.com/2/tweets/search/recent');
    url.searchParams.set('query', SEARCH_QUERY);
    url.searchParams.set('max_results', '10');
    url.searchParams.set('tweet.fields', 'created_at,author_id,public_metrics');
    url.searchParams.set('expansions', 'author_id');
    url.searchParams.set('user.fields', 'name,username');

    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${X_API_KEY}`,
      },
    });

    if (!res.ok) {
      if (res.status === 429) {
        return { success: false, count: 0, error: 'X API rate limited' };
      }
      throw new Error(`X API error: ${res.status}`);
    }

    const data = await res.json();
    let count = 0;

    const users = new Map(
      data.includes?.users?.map((u: any) => [u.id, u]) || []
    );

    for (const tweet of data.data || []) {
      const existing = await prisma.item.findUnique({
        where: { url: `https://twitter.com/i/status/${tweet.id}` },
      });

      if (existing) continue;

      const author: any = users.get(tweet.author_id);
      const analysis = await summarizeAndTag({
        title: tweet.text.substring(0, 100),
        description: tweet.text,
      });

      await prisma.item.create({
        data: {
          sourceType: 'x',
          sourceId: tweet.id,
          url: `https://twitter.com/i/status/${tweet.id}`,
          titleRaw: tweet.text.substring(0, 100),
          titleCn: analysis.titleCn,
          descriptionRaw: tweet.text,
          descriptionCn: analysis.summaryCn,
          author: author ? `@${(author as any).username}` : 'Unknown',
          publishedAt: new Date(tweet.created_at),
          status: 'PENDING',
          heatScore: calculateHeatScore(
            tweet.public_metrics?.likeCount || 0,
            tweet.public_metrics?.retweetCount || 0,
            new Date(tweet.created_at)
          ),
          likes: tweet.public_metrics?.likeCount || 0,
          views: tweet.public_metrics?.impressionCount || 0,
        },
      });

      count++;
    }

    return { success: true, count };
  } catch (error) {
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function calculateHeatScore(likes: number, retweets: number, publishedAt: Date): number {
  const daysSince = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
  const recencyFactor = 1 / Math.log2(daysSince + 2);
  return (Math.log10(likes + 1) + Math.log10(retweets + 1)) * 0.5 + recencyFactor * 5;
}
