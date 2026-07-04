import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const categories = await prisma.ticketCategory.findMany({ orderBy: { createdAt: 'asc' } });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newCategory = await prisma.ticketCategory.create({
      data: {
        code: data.code,
        label: data.label,
        emoji: data.emoji,
        channelPrefix: data.channelPrefix,
        welcomeMessage: data.welcomeMessage,
        supportRoleId: data.supportRoleId || null,
        embedColor: data.embedColor || null,
        imageUrl: data.imageUrl || null,
        thumbnailUrl: data.thumbnailUrl || null,
      }
    });
    return NextResponse.json(newCategory);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.ticketCategory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
