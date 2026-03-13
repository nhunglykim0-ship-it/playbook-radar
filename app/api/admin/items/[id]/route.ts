import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, titleCn, descriptionCn } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (titleCn) updateData.titleCn = titleCn;
    if (descriptionCn) updateData.descriptionCn = descriptionCn;

    const item = await prisma.item.update({
      where: { id: params.id },
      data: updateData,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: item.id,
      sourceType: item.sourceType,
      titleRaw: item.titleRaw,
      titleCn: item.titleCn,
      url: item.url,
      status: item.status,
      heatScore: item.heatScore,
      tags: item.tags.map((t) => t.tag.name),
    });
  } catch (error) {
    console.error('Update item API error:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.item.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete item API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
