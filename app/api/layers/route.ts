export const dynamic = 'force-dynamic'; // 💡 아까 고생해서 걸어둔 방어막입니다! 절대 지우지 마세요!

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

let prisma: PrismaClient;
if (globalForPrisma.prisma) {
  prisma = globalForPrisma.prisma;
} else {
  // 💡 Prisma 7 전용 PostgreSQL 어댑터 장착
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// 1. GET: 스튜디오에 뿌려줄 글 목록 가져오기
export async function GET() {
  try {
    const layers = await prisma.layer.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(layers, { status: 200 });
  } catch (error) {
    console.error("불러오기 에러:", error);
    return NextResponse.json({ error: '데이터를 불러오지 못했습니다.' }, { status: 500 });
  }
}

// 2. POST: 작업실에서 쓴 새 글 저장하기
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newLayer = await prisma.layer.create({
      data: {
        category: body.category,
        context: body.context,
        action: body.action,
        lesson: body.lesson,
        authorName: body.authorName || "익명",
        authorEmail: body.authorEmail || null,
        imageUrl: body.imageUrl || null,
        linkedLayerIds: body.linkedLayerIds || null,
      },
    });

    return NextResponse.json(newLayer, { status: 201 });
  } catch (error) {
    console.error("저장 에러:", error);
    return NextResponse.json({ error: '저장 실패' }, { status: 500 });
  }
}