import { prisma } from './prisma';
import { summarizeAndTag } from './claude';
import { YouTubeVideo } from '@/types';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const SEARCH_QUERY = 'OpenClaw OR "Open Claw" OR openclaw.ai';
const MAX_RESULTS = 10;

export async function fetchYouTubeVideos(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  if (!YOUTUBE_API_KEY) {
    return { success: false, count: 0, error: 'YouTube API key not configured' };
  }

  try {
    // Search for videos
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('q', SEARCH_QUERY);
    searchUrl.searchParams.set('maxResults', MAX_RESULTS.toString());
    searchUrl.searchParams.set('key', YOUTUBE_API_KEY);
    searchUrl.searchParams.set('order', 'date');
    searchUrl.searchParams.set('type', 'video');

    const searchRes = await fetch(searchUrl.toString());
    const searchData = await searchRes.json();

    if (!searchRes.ok) {
      throw new Error(searchData.error?.message || 'YouTube API error');
    }

    let count = 0;

    for (const item of searchData.items || []) {
      const videoId = item.id.videoId;
      if (!videoId) continue;

      // Check if already exists
      const existing = await prisma.item.findUnique({
        where: { url: `https://www.youtube.com/watch?v=${videoId}` },
      });

      if (existing) continue;

      // Get video details
      const videoDetails = await getVideoDetails(videoId);
      if (!videoDetails) continue;

      // Generate Chinese title and summary
      const analysis = await summarizeAndTag({
        title: videoDetails.title,
        description: videoDetails.description,
      });

      // Calculate heat score
      const heatScore = calculateHeatScore(
        videoDetails.viewCount,
        videoDetails.likeCount || 0,
        videoDetails.commentCount || 0,
        new Date(videoDetails.publishedAt)
      );

      // Save to database
      await prisma.item.create({
        data: {
          sourceType: 'youtube',
          sourceId: videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          titleRaw: videoDetails.title,
          titleCn: analysis.titleCn,
          descriptionRaw: videoDetails.description.substring(0, 5000),
          descriptionCn: analysis.summaryCn,
          author: videoDetails.channelTitle,
          publishedAt: new Date(videoDetails.publishedAt),
          status: 'PENDING',
          heatScore,
          views: videoDetails.viewCount,
          likes: videoDetails.likeCount || 0,
          comments: videoDetails.commentCount || 0,
        },
      });

      count++;
    }

    // TODO: Update last fetched (requires sourceConfig model)
    // await prisma.sourceConfig.upsert({...});

    return { success: true, count };
  } catch (error) {
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function getVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
  if (!YOUTUBE_API_KEY) return null;

  const url = new URL('https://www.googleapis.com/youtube/v3/videos');
  url.searchParams.set('part', 'snippet,statistics');
  url.searchParams.set('id', videoId);
  url.searchParams.set('key', YOUTUBE_API_KEY);

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

  // Normalize (log scale for views)
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
