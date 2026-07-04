import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    let panel = await prisma.ticketPanel.findUnique({ where: { id: 1 } });
    if (!panel) {
      panel = await prisma.ticketPanel.create({ data: { id: 1 } });
    }
    return NextResponse.json({ success: true, panel });
  } catch (error) {
    console.error('Error fetching panel:', error);
    return NextResponse.json({ error: 'Failed to fetch panel' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    let { title, description, color, imageUrl, thumbnailUrl, logChannelId, autoCloseHours } = data;

    // 如果使用者貼上的是完整網址 (例如 https://discord.com/channels/123/456)，則萃取最後面的 ID
    if (logChannelId && logChannelId.includes('/')) {
      const parts = logChannelId.split('/');
      logChannelId = parts[parts.length - 1].trim();
    } else if (logChannelId) {
      logChannelId = logChannelId.trim();
    }

    const updatedPanel = await prisma.ticketPanel.upsert({
      where: { id: 1 },
      update: { title, description, color, imageUrl, thumbnailUrl, logChannelId, autoCloseHours: parseInt(autoCloseHours) || 24 },
      create: { id: 1, title, description, color, imageUrl, thumbnailUrl, logChannelId, autoCloseHours: parseInt(autoCloseHours) || 24 }
    });

    return NextResponse.json({ success: true, panel: updatedPanel });
  } catch (error) {
    console.error('Error updating panel:', error);
    return NextResponse.json({ error: 'Failed to update panel' }, { status: 500 });
  }
}
