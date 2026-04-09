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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const layerId = resolvedParams.id;

    // DB에서 해당 ID의 밑그림을 삭제합니다.
    // (schema.prisma에서 onDelete: Cascade를 설정했으므로, 달린 댓글도 함께 자동으로 삭제됩니다!)
    await prisma.layer.delete({
      where: { id: layerId },
    });

    return NextResponse.json({ message: '삭제되었습니다.' }, { status: 200 });
  } catch (error) {
    console.error('삭제 오류:', error);
    return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 500 });
  }
}