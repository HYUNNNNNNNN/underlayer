import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || "file:./prisma/dev.db" });
const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });
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