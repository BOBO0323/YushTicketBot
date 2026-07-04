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
    const { title, description, color, imageUrl, thumbnailUrl } = data;

    const updatedPanel = await prisma.ticketPanel.upsert({
      where: { id: 1 },
      update: { title, description, color, imageUrl, thumbnailUrl },
      create: { id: 1, title, description, color, imageUrl, thumbnailUrl }
    });

    return NextResponse.json({ success: true, panel: updatedPanel });
  } catch (error) {
    console.error('Error updating panel:', error);
    return NextResponse.json({ error: 'Failed to update panel' }, { status: 500 });
  }
}
