import { prisma } from './prisma';
import { summarizeAndTag } from './claude';

const RSS_FEEDS = [
  { name: 'OpenClaw Official', url: 'https://docs.openclaw.ai/feed.xml', type: 'blog' },
];

export async function fetchRSSFeeds(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  try {
    let count = 0;

    for (const feed of RSS_FEEDS) {
      try {
        const res = await fetch(feed.url);
        if (!res.ok) continue;

        const xml = await res.text();
        const items = parseRSS(xml);

        for (const item of items) {
          const existing = await prisma.item.findUnique({
            where: { url: item.url },
          });

          if (existing) continue;

          const analysis = await summarizeAndTag({
            title: item.title,
            description: item.description,
          });

          await prisma.item.create({
            data: {
              sourceType: 'blog',
              sourceId: item.guid || item.url,
              url: item.url,
              titleRaw: item.title,
              titleCn: analysis.titleCn,
              descriptionRaw: item.description,
              descriptionCn: analysis.summaryCn,
              author: feed.name,
              publishedAt: item.pubDate,
              status: 'PENDING',
              heatScore: calculateHeatScore(item.pubDate),
            },
          });

          count++;
        }
      } catch (err) {
        console.error(`Error fetching ${feed.name}:`, err);
      }
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

function parseRSS(xml: string): Array<{
  title: string;
  url: string;
  description: string;
  guid?: string;
  pubDate: Date;
}> {
  const items: any[] = [];
  const regex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const item = match[1];
    const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1];
    const description = item.match(/<description>([\s\S]*?)<\/description>/)?.[1];
    const guid = item.match(/<guid>([\s\S]*?)<\/guid>/)?.[1];
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];

    if (title && link) {
      items.push({
        title,
        url: link,
        description: description || title,
        guid: guid || link,
        pubDate: pubDate ? new Date(pubDate) : new Date(),
      });
    }
  }

  return items;
}

function calculateHeatScore(publishedAt: Date): number {
  const daysSince = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
  const recencyFactor = 1 / Math.log2(daysSince + 2);
  return recencyFactor * 10;
}
