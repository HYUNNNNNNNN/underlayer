"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function MyProfile() {
  const { data: session, update } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("이미지 용량은 5MB를 넘을 수 없어요! 😅");
      return;
    }

    const loadingToast = toast.loading("프로필 사진을 업데이트하는 중...");
    setIsUploading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Image = reader.result as string;
        
        // 💡 서버로 새 프로필 사진 전송
        const response = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: base64Image }),
        });

        if (response.ok) {
          // 💡 화면의 세션 정보 강제 새로고침
          await update({ image: base64Image });
          toast.dismiss(loadingToast);
          toast.success("프로필 사진이 멋지게 변경되었습니다! ✨");
        } else {
          throw new Error("업데이트 실패");
        }
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error("프로필 변경에 실패했습니다.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!session) {
    return <div className="text-center py-20 text-gray-500">로그인 후 프로필을 설정할 수 있습니다.</div>;
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl text-center relative overflow-hidden">
        {/* 상단 배경 디자인 */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-gray-900 to-gray-700 z-0"></div>
        
        <div className="relative z-10 mt-12">
          {/* 프로필 이미지 영역 */}
          <div className="relative inline-block">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white mx-auto flex items-center justify-center">
              {session.user?.image ? (
                <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-extrabold text-gray-300">{session.user?.name?.charAt(0)}</span>
              )}
            </div>
            
            {/* 사진 변경 버튼 */}
            <label className="absolute bottom-0 right-0 bg-black text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform">
              📷
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
                disabled={isUploading}
              />
            </label>
          </div>

          <h2 className="text-2xl font-extrabold text-gray-900 mt-4">{session.user?.name}</h2>
          <p className="text-gray-500 text-sm mt-1">{session.user?.email}</p>

          <div className="mt-8 pt-8 border-t border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">내 활동 요약</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="text-3xl mb-2">🎨</div>
                <div className="text-sm font-bold text-gray-600">내 캔버스 상태</div>
                <div className="text-xs text-gray-400 mt-1">꾸준히 기록 중!</div>
              </div>
              <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100">
                <div className="text-3xl mb-2">🤝</div>
                <div className="text-sm font-bold text-pink-600">보낸 응원</div>
                <div className="text-xs text-pink-400 mt-1">따뜻한 커뮤니티 기여</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}