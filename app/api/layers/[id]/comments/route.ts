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

// GET: 댓글 불러오기 (기존과 동일)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const comments = await prisma.comment.findMany({
      where: { layerId: resolvedParams.id },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(comments, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: '댓글 로드 실패' }, { status: 500 });
  }
}

// POST: 댓글 저장하기 (작성자 정보 추가 및 닉네임 동기화)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const layerId = resolvedParams.id;
    const body = await request.json();

    if (!body.text) return NextResponse.json({ error: '내용 누락' }, { status: 400 });

    let finalNickname = body.authorName || "익명의 도전자";

    // 💡 [핵심 로직] 이메일이 있다면, Profile 테이블에서 '나만의 닉네임'이 있는지 찾아봅니다.
    if (body.authorEmail) {
      const userProfile = await prisma.userProfile.findUnique({
        where: { email: body.authorEmail }
      });
      // 닉네임을 찾았다면 그걸로 덮어씁니다!
      if (userProfile?.nickname) {
        finalNickname = userProfile.nickname;
      }
    }

    const newComment = await prisma.comment.create({
      data: {
        text: body.text,
        layerId: layerId,
        authorName: finalNickname, // 👈 확인된 최신 닉네임으로 저장!
        authorEmail: body.authorEmail || null,
      },
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('댓글 저장 오류:', error);
    return NextResponse.json({ error: '저장 실패' }, { status: 500 });
  }
}