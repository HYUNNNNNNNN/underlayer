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

// Next.js 15 변경 사항: params를 Promise 타입으로 받습니다.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 💡 에러 원인 해결: params를 await로 먼저 풀어준 뒤 id를 꺼냅니다!
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // 해당 ID의 레이어를 찾아 respectCount를 1 증가시킵니다.
    const updatedLayer = await prisma.layer.update({
      where: { id },
      data: {
        respectCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(updatedLayer, { status: 200 });
  } catch (error) {
    console.error('리스펙 업데이트 오류:', error);
    return NextResponse.json({ error: '업데이트 실패' }, { status: 500 });
  }
}