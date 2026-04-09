export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// 💡 SQLite 어댑터 코드를 싹 지우고 기본 Prisma 설정으로 되돌립니다.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// 1. 기존 GET 함수 (그대로 유지 - 닉네임 불러오기)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  
  if (!email) return NextResponse.json({ error: '이메일 없음' }, { status: 400 });

  try {
    const profile = await prisma.userProfile.findUnique({ where: { email } });
    return NextResponse.json(profile || { nickname: null }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: '불러오기 실패' }, { status: 500 });
  }
}

// 2. 기존 POST 함수 (그대로 유지 - 닉네임 저장 및 과거 글 동기화)
export async function POST(request: Request) {
  try {
    const { email, nickname } = await request.json();

    if (!email || !nickname) {
      console.error("❌ 에러: 이메일이나 닉네임 정보가 넘어오지 않았습니다.", { email, nickname });
      return NextResponse.json({ error: '필수 데이터 누락' }, { status: 400 });
    }

    await prisma.userProfile.upsert({
      where: { email },
      update: { nickname },
      create: { email, nickname },
    });

    await prisma.layer.updateMany({
      where: { authorEmail: email },
      data: { authorName: nickname },
    });
    
    await prisma.comment.updateMany({
      where: { authorEmail: email },
      data: { authorName: nickname },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ 프로필 저장 중 치명적 DB 에러 발생:', error);
    return NextResponse.json({ error: '저장 실패' }, { status: 500 });
  }
}

// 3. 💡 [신규] PATCH 함수 (프로필 사진 업로드 전용)
export async function PATCH(request: Request) {
  try {
    // 현재 로그인한 유저 확인
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();  

    // 💡 엉뚱한 User 테이블이 아니라, 우리의 UserProfile 테이블에 안전하게 저장합니다!
    await prisma.userProfile.upsert({
      where: { email: session.user.email },
      update: { 
        image: body.imageUrl 
      },
      create: { 
        email: session.user.email, 
        nickname: session.user.name || "익명",
        image: body.imageUrl 
      },
    });

    return NextResponse.json({ message: '프로필 사진 업데이트 성공' }, { status: 200 });
  } catch (error) {
    console.error("프로필 사진 업데이트 에러:", error);
    return NextResponse.json({ error: '업데이트 실패' }, { status: 500 });
  }
}