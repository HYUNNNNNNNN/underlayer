"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import LayerDetailModal from "./LayerDetailModal"; 
import { toPng } from 'html-to-image';

interface Layer {
  id: string;
  category: string;
  context: string;
  action: string;
  lesson: string;
  respectCount: number;
  authorName: string;
  authorEmail: string | null;
  createdAt: string;
  imageUrl?: string | null;
}

export default function MyCanvas() {
  const { data: session, status } = useSession();
  const [myLayers, setMyLayers] = useState<Layer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<Layer | null>(null);
  
  // 💡 이미지 캡처 상태
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function fetchMyLayers() {
      if (!session?.user?.email) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch('/api/layers');
        if (response.ok) {
          const allLayers = await response.json();
          const filteredLayers = allLayers
            .filter((layer: Layer) => layer.authorEmail === session.user?.email)
            .sort((a: Layer, b: Layer) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setMyLayers(filteredLayers);
        }
      } catch (error) {
        console.error("데이터 로드 실패", error);
      } finally {
        setIsLoading(false);
      }
    }
    if (status !== "loading") {
      fetchMyLayers();
    }
  }, [session, status]);

  const handleDelete = (layerId: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[200px]">
        <p className="font-bold text-center text-gray-800">
          정말 이 밑그림을 지우시겠습니까?
        </p>
        <div className="flex justify-center gap-2 mt-2">
          <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">취소</button>
          <button
            onClick={async () => {
              toast.dismiss(t.id); 
              const loadingToast = toast.loading("밑그림을 지우는 중...");
              try {
                const response = await fetch(`/api/layers/${layerId}`, { method: 'DELETE' });
                if (response.ok) {
                  setMyLayers((prev) => prev.filter((layer) => layer.id !== layerId));
                  toast.dismiss(loadingToast);
                  toast.success("성공적으로 삭제되었습니다! 🗑️");
                } else { throw new Error("삭제 실패"); }
              } catch (error) {
                toast.dismiss(loadingToast);
                toast.error("삭제 중 오류가 발생했습니다.");
              }
            }}
            className="px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
          >삭제</button>
        </div>
      </div>
    ), { duration: Infinity, style: { background: '#ffffff', color: '#333333', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' } });
  };

  const handleRespect = async (layerId: string) => {
    try {
      const response = await fetch(`/api/layers/${layerId}/respect`, { method: 'PATCH' });
      if (response.ok) {
        setMyLayers(prevLayers => prevLayers.map(layer => layer.id === layerId ? { ...layer, respectCount: (layer.respectCount || 0) + 1 } : layer));
        if (selectedLayer && selectedLayer.id === layerId) {
          setSelectedLayer({ ...selectedLayer, respectCount: (selectedLayer.respectCount || 0) + 1 });
        }
        toast.success("나의 도전에 셀프 리스펙! 🤝");
      }
    } catch (error) { toast.error("오류가 발생했습니다."); }
  };

  // 💡 [핵심] 화면 캡처 함수
  const handleExportImage = async () => {
    const targetElement = document.getElementById("canvas-export-area");
    if (!targetElement) return;

    setIsExporting(true);
    const loadingToast = toast.loading("캔버스를 멋지게 캡처하고 있습니다... 📸\n(시간이 조금 걸릴 수 있습니다)");

    try {
      // 💡 html-to-image의 toPng를 사용합니다. CSS 파싱 에러가 발생하지 않습니다!
      const dataUrl = await toPng(targetElement, {
        backgroundColor: "#f9fafb", // 배경색 강제 지정
        pixelRatio: 2,              // 고화질 설정 (html2canvas의 scale: 2 와 동일)
        skipFonts: false,           // 폰트 깨짐 방지
      });
      
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `Underlayer_${session?.user?.name || "MyCanvas"}.png`;
      link.click();

      toast.dismiss(loadingToast);
      toast.success("사진첩에 저장되었습니다! 인스타에 자랑해보세요 ✨");
    } catch (error) {
      console.error("캡처 에러 상세:", error);
      toast.dismiss(loadingToast);
      toast.error("화면을 캡처하는 중 문제가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsExporting(false);
    }
  };

  const layerCount = myLayers.length;
  let canvasText = "빈 캔버스";
  let progressPercentage = 0;
  let textGradient = "from-gray-400 to-gray-400"; 
  let bgGlowEffect = "bg-transparent"; 

  if (layerCount >= 10) {
    canvasText = "✨ 화려한 마스터피스"; progressPercentage = 100; textGradient = "from-purple-500 via-pink-500 to-yellow-500"; bgGlowEffect = "bg-gradient-to-tr from-purple-500/60 via-pink-500/50 to-yellow-500/60 blur-3xl animate-pulse";
  } else if (layerCount >= 5) {
    canvasText = "🎨 다채로운 채색 단계"; progressPercentage = (layerCount / 10) * 100; textGradient = "from-blue-400 to-emerald-400"; bgGlowEffect = "bg-gradient-to-tr from-blue-400/50 to-emerald-400/50 blur-3xl";
  } else if (layerCount >= 3) {
    canvasText = "🖋️ 뚜렷한 선화 단계"; progressPercentage = (layerCount / 10) * 100; textGradient = "from-gray-600 to-gray-400"; bgGlowEffect = "bg-gray-400/40 blur-2xl";
  } else if (layerCount >= 1) {
    canvasText = "📝 러프 스케치 단계"; progressPercentage = (layerCount / 10) * 100; textGradient = "from-gray-400 to-gray-300"; bgGlowEffect = "bg-gray-300/40 blur-2xl";
  }

  if (status === "loading" || isLoading) return <div className="text-center py-20 text-gray-500">내 캔버스를 불러오는 중...</div>;
  if (!session) return <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl shadow-sm max-w-2xl mx-auto mt-8"><p className="text-xl text-gray-500 mb-4">로그인하고 나만의 캔버스를 만들어보세요.</p></div>;
  if (myLayers.length === 0) return <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl shadow-sm max-w-2xl mx-auto mt-8"><p className="text-xl text-gray-500 mb-4">아직 기록한 밑그림이 없습니다.</p></div>;

  return (
    <div className="max-w-2xl mx-auto py-8">
      
      {/* 💡 캡처 자랑하기 버튼 (이 버튼 자체는 사진에 안 찍힘) */}
      <div className="flex justify-end mb-4 animate-in fade-in duration-500">
        <button 
          onClick={handleExportImage}
          disabled={isExporting}
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full font-bold shadow-md hover:bg-gray-800 hover:-translate-y-0.5 transition-all disabled:bg-gray-400"
        >
          {isExporting ? '📸 찍는 중...' : '📸 내 캔버스 이미지로 저장'}
        </button>
      </div>

      {/* 💡 여기서부터 사진에 찍히는 영역입니다 (id="canvas-export-area") */}
      <div id="canvas-export-area" className="relative pb-10 bg-gray-50 pt-8 px-2 sm:px-4 rounded-3xl">
        
        {/* 숨겨진 워터마크 (저장된 사진을 보면 멋있게 로고가 찍혀있습니다) */}
        <div className="absolute top-6 left-8 font-extrabold text-gray-300 text-xl tracking-tighter opacity-40 z-30 pointer-events-none">Underlayer.</div>

        <div className="mb-16 flex flex-col items-center text-center animate-in fade-in duration-700 relative z-20 mt-4">
          <div className="text-sm font-bold text-gray-400 mb-2">{session.user.name}님의 캔버스 완성도</div>
          <div className={`text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${textGradient} transition-all duration-1000`}>
            {canvasText}
          </div>
          
          <div className="w-full max-w-xs h-2 bg-gray-100 rounded-full mt-6 overflow-hidden relative">
            <div 
              className={`absolute top-0 left-0 h-full bg-gradient-to-r ${textGradient} transition-all duration-1000 ease-out`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-3 font-medium">
            {layerCount}개의 실패가 겹쳐져 작품이 되고 있습니다
          </div>
        </div>

        <div className="relative isolate mt-10">
          <div className={`absolute top-10 left-0 right-0 h-[400px] -mx-4 rounded-full transition-all duration-1000 ease-in-out z-0 pointer-events-none ${bgGlowEffect}`} />

          <div className="flex flex-col relative pb-32 z-10" onMouseLeave={() => setHoveredIndex(null)}>
            {myLayers.map((layer, index) => {
              const isStackActive = hoveredIndex !== null;
              const isHovered = hoveredIndex === index;
              const isNextToHovered = isStackActive && index === hoveredIndex + 1;
              
              // 💡 성공 레이어 판별
              const isSuccessLayer = layer.category === "🌟 최종 성공 (Masterpiece)";

              let marginTop = index === 0 ? '0px' : isNextToHovered ? '24px' : isStackActive ? '-160px' : '-250px';
              let scale = !isStackActive ? Math.max(1 - index * 0.05, 1.0) : isHovered ? 1.03 : Math.max(1 - index * 0.02, 0.95);
              let opacity = !isStackActive ? Math.max(1 - index * 0.2, 0) : isHovered ? 1 : Math.max(1 - index * 0.1, 0.4);

              return (
                <div 
                  key={layer.id} 
                  onMouseEnter={() => setHoveredIndex(index)}
                  onClick={() => setSelectedLayer(layer)} 
                  // 💡 성공 레이어일 경우 황금빛 테두리와 배경을 씌워줍니다!
                  className={`backdrop-blur-md border rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] relative cursor-pointer group ${isSuccessLayer ? 'bg-gradient-to-br from-yellow-50 to-white border-yellow-300' : 'bg-white/90 border-gray-100/50'}`}
                  style={{
                    marginTop: marginTop,
                    transform: `scale(${scale})`,
                    opacity: opacity,
                    zIndex: isHovered ? 50 : myLayers.length - index,
                  }}
                >
                  {index === 0 && (
                    <div className={`absolute -top-3 -right-3 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10 bg-gradient-to-r ${textGradient}`}>
                      최근 기록
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-5 border-b border-gray-100/50 pb-4">
                    {/* 카테고리 칩 색상도 변경 */}
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${isSuccessLayer ? 'bg-yellow-200 text-yellow-800 shadow-sm' : 'bg-gray-50 border border-gray-100 text-gray-600'}`}>
                      {layer.category}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-gray-400">
                        {new Date(layer.createdAt).toLocaleDateString()} {new Date(layer.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(layer.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors z-20"
                        title="삭제하기"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 mb-2">
                    {layer.imageUrl && (
                      <div className="w-full h-32 rounded-xl overflow-hidden mb-4 border border-gray-100">
                        <img src={layer.imageUrl} className="w-full h-full object-cover" alt="첨부 이미지" />
                      </div>
                    )}
                    <div>
                      {/* 항목 텍스트도 상황에 맞게 변경 */}
                      <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${isSuccessLayer ? 'text-yellow-600' : 'text-gray-400'}`}>
                        {isSuccessLayer ? '목표 (Goal)' : '상황 (Context)'}
                      </span>
                      <p className={`leading-relaxed line-clamp-2 transition-colors ${isSuccessLayer ? 'text-gray-900 font-bold' : 'text-gray-800 group-hover:text-blue-600'}`}>
                        {layer.context}
                      </p>
                    </div>
                    <div className={`p-4 rounded-xl border mt-4 ${isSuccessLayer ? 'bg-white/50 border-yellow-200' : 'bg-gray-50/50 border-gray-100'}`}>
                      <span className={`text-xs font-bold uppercase tracking-wider block mb-1 bg-clip-text text-transparent bg-gradient-to-r ${textGradient}`}>
                        {isSuccessLayer ? '증명 (Achievement)' : '배움 (Lesson)'}
                      </span>
                      <p className="text-gray-900 font-medium line-clamp-2">{layer.lesson}</p>
                    </div>
                  </div>

                  <div className="mt-4 text-sm font-bold text-gray-500 flex justify-between items-center gap-1 pt-4 border-t border-gray-100/50">
                    <span className="text-xs">💬 자세히 보기</span>
                    <span>🤝 받은 리스펙 <span className="text-gray-700">{layer.respectCount}</span></span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {selectedLayer && (
        <LayerDetailModal 
          layer={selectedLayer} 
          onClose={() => setSelectedLayer(null)}
          onRespect={handleRespect}
          onViewUser={() => {}} 
        />
      )}
    </div>
  );
}