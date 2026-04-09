import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// 💡 [수정] SQLite 어댑터와 관련된 모든 코드를 삭제하고 표준 방식으로 초기화합니다.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Prisma v7은 어댑터 설정 없이 그냥 생성해도 환경 변수를 자동으로 참조합니다.
const prisma = globalForPrisma.prisma || new PrismaClient();

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