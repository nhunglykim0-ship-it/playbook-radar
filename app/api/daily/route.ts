import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateDigest } from '@/lib/claude';
import { format } from 'date-fns';

export async function GET() {
  try {
    const digests = await prisma.dailyDigest.findMany({
      orderBy: { date: 'desc' },
      take: 30,
    });
    return NextResponse.json(digests);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Check if already generated
    const existing = await prisma.dailyDigest.findUnique({
      where: { date: today },
    });

    if (existing) {
      return NextResponse.json({ message: 'Already generated', digest: existing });
    }

    // Get today's published items
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const items = await prisma.item.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { gte: startOfDay },
      },
      orderBy: { heatScore: 'desc' },
      take: 20,
    });

    if (items.length === 0) {
      return NextResponse.json({ message: 'No items today' });
    }

    // Generate digest
    const summary = await generateDigest(
      items.map(i => ({
        titleCn: i.titleCn || i.titleRaw,
        summaryCn: i.descriptionCn || '',
        url: i.url,
        sourceType: i.sourceType,
      }))
    );

    const digest = await prisma.dailyDigest.create({
      data: {
        date: today,
        itemsJson: JSON.stringify(items.map(i => ({ id: i.id, title: i.titleCn }))),
        summary,
      },
    });

    return NextResponse.json({ success: true, digest });
  } catch (error) {
    console.error('Digest error:', error);
    return NextResponse.json(
      { error: 'Failed to generate digest' },
      { status: 500 }
    );
  }
}
