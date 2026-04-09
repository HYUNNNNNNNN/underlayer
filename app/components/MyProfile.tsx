"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Layer {
  id: string;
  category: string;
  respectCount: number;
  authorEmail: string | null;
}

export default function MyProfile() {
  // 💡 update 함수는 쿠키를 터뜨리므로 더 이상 사용하지 않습니다.
  const { data: session } = useSession();
  const router = useRouter();
  
  const [nickname, setNickname] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const [myLayers, setMyLayers] = useState<Layer[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [displayImage, setDisplayImage] = useState<string | null | undefined>(null);

  // 처음에 세션 정보나 DB에 저장된 이미지로 세팅
  useEffect(() => {
    if (session?.user?.email) {
      fetchProfile();
      fetchMyStats();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/profile?email=${session?.user?.email}`);
      if (response.ok) {
        const data = await response.json();
        if (data.nickname) {
          setNickname(data.nickname);
        } else if (session?.user?.name) {
          setNickname(session.user.name);
        }
        
        // 💡 DB에서 저장된 최신 이미지를 가져와서 화면에 반영합니다!
        if (data.image) {
          setDisplayImage(data.image);
        } else if (session?.user?.image) {
          setDisplayImage(session.user.image);
        }
      }
    } catch (error) {
      console.error("프로필 로드 실패", error);
    }
  };

  const fetchMyStats = async () => {
    try {
      const response = await fetch('/api/layers');
      if (response.ok) {
        const allLayers = await response.json();
        const mine = allLayers.filter((layer: Layer) => layer.authorEmail === session?.user?.email);
        setMyLayers(mine);
      }
    } catch (error) {
      console.error("통계 로드 실패", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      toast.error("닉네임을 입력해주세요! ✍️");
      return;
    }

    setIsSaving(true);
    const loadingToast = toast.loading("프로필 업데이트 중...");

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session?.user?.email,
          nickname: nickname,
        }),
      });

      if (response.ok) {
        toast.dismiss(loadingToast);
        toast.success("프로필이 성공적으로 저장되었습니다! 🎉");
      } else {
        throw new Error("저장 실패");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 💡 프로필 사진 업로드 처리 (수정됨)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("이미지 용량은 5MB를 넘을 수 없어요! 😅");
      return;
    }

    const loadingToast = toast.loading("프로필 사진을 변경하는 중...");
    setIsUploading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Image = reader.result as string;
        
        const response = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: base64Image }),
        });

        if (response.ok) {
          // 💡 핵심 변경점: update()를 지우고 React 상태만 변경합니다!
          setDisplayImage(base64Image); 
          toast.dismiss(loadingToast);
          toast.success("프로필 사진이 멋지게 변경되었습니다! ✨");
          router.refresh();
        } else {
          throw new Error("업데이트 실패");
        }
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error("프로필 변경에 실패했습니다.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  if (!session) {
    return (
      <div className="text-center py-20 text-gray-500">
        로그인 정보를 불러오는 중입니다...
      </div>
    );
  }

  // 통계 계산
  const totalLayers = myLayers.length;
  const totalRespects = myLayers.reduce((sum, layer) => sum + (layer.respectCount || 0), 0);
  
  const categoryCounts = myLayers.reduce((acc, layer) => {
    acc[layer.category] = (acc[layer.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let topCategory = "아직 없음";
  let maxCount = 0;
  Object.entries(categoryCounts).forEach(([cat, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topCategory = cat;
    }
  });

  // 캔버스 완성도 시각화 로직
  let canvasText = "빈 캔버스";
  let progressPercentage = 0;
  let textGradient = "from-gray-400 to-gray-400"; 
  let bgGlowEffect = "bg-transparent"; 

  if (totalLayers >= 10) {
    canvasText = "✨ 화려한 마스터피스";
    progressPercentage = 100;
    textGradient = "from-purple-500 via-pink-500 to-yellow-500";
    bgGlowEffect = "bg-gradient-to-tr from-purple-500/20 via-pink-500/20 to-yellow-500/20 blur-3xl";
  } else if (totalLayers >= 5) {
    canvasText = "🎨 다채로운 채색 단계";
    progressPercentage = (totalLayers / 10) * 100;
    textGradient = "from-blue-400 to-emerald-400";
    bgGlowEffect = "bg-gradient-to-tr from-blue-400/20 to-emerald-400/20 blur-3xl";
  } else if (totalLayers >= 3) {
    canvasText = "🖋️ 뚜렷한 선화 단계";
    progressPercentage = (totalLayers / 10) * 100;
    textGradient = "from-gray-600 to-gray-400";
  } else if (totalLayers >= 1) {
    canvasText = "📝 러프 스케치 단계";
    progressPercentage = (totalLayers / 10) * 100;
    textGradient = "from-gray-400 to-gray-300";
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8 px-4 md:px-0">
      
      {/* 1. 상단 명함 & 캔버스 완성도 섹션 */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
        
        <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full pointer-events-none transition-colors duration-1000 ${bgGlowEffect}`}></div>

        <div className="relative z-10 flex-shrink-0">
          <div className="relative inline-block">
            {displayImage ? (
              <img 
                src={displayImage} 
                alt="프로필 사진" 
                className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-lg object-cover" 
              />
            ) : (
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-lg flex items-center justify-center bg-gradient-to-tr from-gray-100 to-gray-200 text-4xl font-extrabold text-gray-400">
                {(nickname || session?.user?.name || "U").charAt(0)}
              </div>
            )}
            
            <label className="absolute bottom-0 right-0 bg-black text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform z-20 text-xs md:text-base">
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
        </div>

        <div className="flex-1 w-full z-10 text-center md:text-left">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-1">{nickname}</h2>
          <p className="text-sm text-gray-400 mb-6">{session?.user?.email}</p>

          <div className="w-full">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-bold text-gray-500">나의 캔버스 완성도</span>
              <span className={`text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${textGradient}`}>
                {canvasText}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-50 border border-gray-100 rounded-full overflow-hidden shadow-inner">
              <div 
                className={`h-full bg-gradient-to-r ${textGradient} transition-all duration-1000 ease-out`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-2 font-medium md:text-right text-center">
              {totalLayers}개의 실패가 겹쳐져 작품이 되고 있습니다
            </div>
          </div>
        </div>
      </div>

      {/* 2. 통계 대시보드 섹션 */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          📊 나의 도전 기록
        </h2>
        
        {isLoadingStats ? (
          <div className="text-center py-10 text-gray-400 font-medium">통계를 불러오는 중...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 p-6 rounded-2xl text-center border border-gray-100">
                <div className="text-sm font-bold text-gray-400 mb-1">총 밑그림</div>
                <div className="text-3xl font-extrabold text-gray-900">{totalLayers}<span className="text-lg text-gray-500 ml-1">장</span></div>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl text-center border border-gray-100">
                <div className="text-sm font-bold text-gray-400 mb-1">받은 리스펙</div>
                <div className="text-3xl font-extrabold text-pink-500">{totalRespects}<span className="text-lg text-pink-300 ml-1">개</span></div>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl text-center border border-gray-100">
                <div className="text-sm font-bold text-gray-400 mb-1">주요 도전 분야</div>
                <div className="text-xl font-extrabold text-blue-600 mt-2">{topCategory}</div>
              </div>
            </div>

            {totalLayers > 0 && (
              <div>
                <div className="text-sm font-bold text-gray-700 mb-3">분야별 도전 비율</div>
                <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
                  {Object.entries(categoryCounts).map(([cat, count], index) => {
                    const colors = ["bg-blue-500", "bg-pink-500", "bg-yellow-500", "bg-emerald-500"];
                    const percent = (count / totalLayers) * 100;
                    return (
                      <div 
                        key={cat} 
                        style={{ width: `${percent}%` }} 
                        className={`${colors[index % colors.length]} h-full transition-all duration-1000 ease-out`}
                        title={`${cat}: ${count}개`}
                      />
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-3 mt-3">
                  {Object.entries(categoryCounts).map(([cat, count], index) => {
                    const textColors = ["text-blue-500", "text-pink-500", "text-yellow-500", "text-emerald-500"];
                    return (
                      <div key={cat} className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                        <span className={`w-2.5 h-2.5 rounded-full ${textColors[index % textColors.length].replace('text', 'bg')}`}></span>
                        {cat} ({count})
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 3. 프로필 설정 섹션 */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          ⚙️ 계정 설정
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">스튜디오에 표시될 닉네임</label>
            <input 
              type="text" 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="멋진 닉네임을 지어주세요!"
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all font-bold text-gray-900"
            />
            <p className="text-xs text-gray-400 mt-2 ml-1">이름을 바꾸면 과거에 쓴 글과 댓글의 이름도 모두 변경됩니다.</p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-4 bg-black text-white font-bold rounded-2xl hover:bg-gray-800 transition-colors disabled:bg-gray-400 shadow-md hover:shadow-lg"
            >
              {isSaving ? '저장 중...' : '변경사항 저장하기'}
            </button>
            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-6 py-4 bg-red-50 text-red-500 font-bold rounded-2xl hover:bg-red-100 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}