"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  // 현재 로그인된 유저의 정보(session)를 가져옵니다.
  const { data: session } = useSession();

  // 로그인 상태일 때: 유저 이름과 로그아웃 버튼 표시
  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">
          <span className="font-bold text-black">{session.user?.name}</span>님, 환영합니다!
        </span>
        <button 
          onClick={() => signOut()} 
          className="px-4 py-2 bg-gray-200 text-sm font-bold text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
        >
          로그아웃
        </button>
      </div>
    );
  }

  // 로그아웃 상태일 때: 로그인 버튼 표시
  return (
    <button 
      onClick={() => signIn('github')} 
      className="px-6 py-2 bg-black text-white text-sm font-bold rounded-full hover:bg-gray-800 transition-colors shadow-md"
    >
      GitHub로 시작하기
    </button>
  );
}