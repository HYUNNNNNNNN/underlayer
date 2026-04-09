"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import LayerDetailModal from "./LayerDetailModal";

interface Layer {
  id: string;
  category: string;
  context: string;
  action: string;
  lesson: string;
  respectCount: number;
  commentCount?: number; 
  authorName: string;
  authorEmail: string | null;
  createdAt: string;
  imageUrl?: string | null;
}

interface StudioFeedProps {
  onGoToWrite?: () => void;
  onViewUser?: (email: string) => void;
}

const CATEGORIES = ["전체", "개발/기술", "디자인/기획", "비즈니스/마케팅", "일상/기타", "🌟 최종 성공 (Masterpiece)"];

export default function StudioFeed({ onGoToWrite, onViewUser }: StudioFeedProps) {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [sortBy, setSortBy] = useState<"latest" | "respect">("latest");
  
  const [selectedLayer, setSelectedLayer] = useState<Layer | null>(null);

  useEffect(() => {
    async function fetchLayers() {
      try {
        const response = await fetch('/api/layers');
        if (response.ok) {
          const data = await response.json();
          setLayers(data);
        }
      } catch (error) {
        console.error("피드 로드 실패", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLayers();
  }, []);

  const handleRespect = async (layerId: string) => {
    try {
      const response = await fetch(`/api/layers/${layerId}/respect`, { method: 'PATCH' });
      if (response.ok) {
        setLayers(prevLayers => prevLayers.map(layer => layer.id === layerId ? { ...layer, respectCount: (layer.respectCount || 0) + 1 } : layer));
        if (selectedLayer && selectedLayer.id === layerId) {
          setSelectedLayer({ ...selectedLayer, respectCount: (selectedLayer.respectCount || 0) + 1 });
        }
        const targetLayer = layers.find(l => l.id === layerId);
        // 큰따옴표 대신 백틱(₩ 키)을 쓰고 ${} 안에 변수를 넣습니다!
        toast.success(`${targetLayer?.authorName || '작성자'}님의 글에 리스펙을 보냈습니다! 🤝`);
      }
    } catch (error) {
      toast.error("리스펙 전달에 실패했습니다.");
    }
  };

  const authorCounts = layers.reduce((acc, layer) => {
    if (layer.authorEmail) {
      acc[layer.authorEmail] = (acc[layer.authorEmail] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const getLevelStyle = (count: number) => {
    if (count >= 10) return {
      badge: "✨ 마스터피스",
      cardBorder: "border-purple-300/50 shadow-purple-500/10 hover:shadow-purple-500/20",
      nameColor: "bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500",
      avatarBg: "bg-gradient-to-tr from-purple-100 to-pink-100 text-purple-600 border-2 border-purple-200"
    };
    if (count >= 5) return {
      badge: "🎨 채색 단계",
      cardBorder: "border-emerald-200/50 shadow-emerald-500/10 hover:shadow-emerald-500/20",
      nameColor: "bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-emerald-500",
      avatarBg: "bg-gradient-to-tr from-blue-50 to-emerald-50 text-emerald-600 border-2 border-emerald-200"
    };
    if (count >= 3) return {
      badge: "🖋️ 선화 단계",
      cardBorder: "border-gray-200 shadow-xl",
      nameColor: "text-gray-900 font-extrabold",
      avatarBg: "bg-gray-100 text-gray-700 border border-gray-200"
    };
    return {
      badge: "📝 스케치",
      cardBorder: "border-gray-100/50 shadow-lg",
      nameColor: "text-gray-700 font-bold",
      avatarBg: "bg-gray-50 text-gray-500 border border-gray-100"
    };
  };

  const processedLayers = layers
    .filter((layer) => {
      const matchesCategory = selectedCategory === "전체" || layer.category === selectedCategory;
      const lowerQuery = searchQuery.toLowerCase();
      const matchesSearch = layer.context.toLowerCase().includes(lowerQuery) || layer.action.toLowerCase().includes(lowerQuery) || layer.lesson.toLowerCase().includes(lowerQuery) || layer.authorName.toLowerCase().includes(lowerQuery);
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "latest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return (b.respectCount || 0) - (a.respectCount || 0);
    });

  if (isLoading) return <div className="text-center py-20 text-gray-500">스튜디오를 불러오는 중...</div>;

  return (
    <div className="max-w-2xl mx-auto py-8">
      
      {onGoToWrite && (
        <div className="flex justify-center mb-16">
          <button onClick={onGoToWrite} className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-black rounded-2xl hover:bg-gray-800 hover:shadow-xl hover:-translate-y-1">
            <span className="mr-2 text-lg">✍️</span> 나도 밑그림 그리러 가기
          </button>
        </div>
      )}

      <div className="mb-10 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-3">The Studio</h2>
      </div>

      <div className="mb-10 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="검색해보세요" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-grow p-3 bg-white border border-gray-200 rounded-2xl text-sm" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "latest" | "respect")} className="p-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold">
            <option value="latest">✨ 최신순</option><option value="respect">🔥 리스펙순</option>
          </select>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map((category) => (
            <button key={category} onClick={() => setSelectedCategory(category)} className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold ${selectedCategory === category ? "bg-gray-900 text-white" : "bg-white border text-gray-600"}`}>{category}</button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {processedLayers.map((layer) => {
          const userPostCount = authorCounts[layer.authorEmail || ""] || 1;
          const levelStyle = getLevelStyle(userPostCount);
          
          // 💡 [핵심] 성공 레이어 판별
          const isSuccessLayer = layer.category === "🌟 최종 성공 (Masterpiece)";

          return (
            <div 
              key={layer.id} 
              onClick={() => setSelectedLayer(layer)}
              // 💡 성공 레이어일 경우 겉보기 디자인(배경, 테두리, 그림자)을 황금색으로!
              className={`backdrop-blur-md rounded-3xl p-6 md:p-8 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col overflow-hidden relative group border ${
                isSuccessLayer 
                  ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-yellow-500/20' 
                  : `bg-white/90 ${levelStyle.cardBorder}`
              }`}
            >
              <div className="flex items-center justify-between mb-6 border-b border-gray-100/50 pb-5 z-10 relative">
                
                <div 
                  className="flex items-center gap-3 cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation(); 
                    if(layer.authorEmail && onViewUser) onViewUser(layer.authorEmail);
                  }}
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-extrabold shadow-sm ${levelStyle.avatarBg}`}>
                    {layer.authorName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-extrabold group-hover:opacity-80 transition-opacity text-lg ${levelStyle.nameColor}`}>
                        {layer.authorName}
                      </span>
                      <span className="text-[10px] font-bold bg-gray-50 border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                        {levelStyle.badge}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(layer.createdAt).toLocaleDateString()} {new Date(layer.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* 💡 카테고리 칩도 성공 모드에 맞게 금색으로 변경 */}
                <span className={`px-3 py-1.5 text-xs font-bold rounded-full ${isSuccessLayer ? 'bg-yellow-200 text-yellow-800 shadow-sm' : 'bg-gray-50 border border-gray-100 text-gray-600'}`}>
                  {layer.category}
                </span>
              </div>
              
              <div className="space-y-5 flex-grow z-10 relative">
                {layer.imageUrl && (
                  <div className="w-full h-48 rounded-2xl overflow-hidden mb-6 border border-gray-100 shadow-sm">
                    <img src={layer.imageUrl} alt="첨부 이미지" className="w-full h-full object-cover" />
                  </div>
                )}
                
                {/* 1. 상황 (Context/Goal) */}
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider block mb-1.5 ${isSuccessLayer ? 'text-yellow-600' : 'text-gray-400'}`}>
                    {isSuccessLayer ? '목표 (Goal)' : '상황 (Context)'}
                  </span>
                  <p className={`leading-relaxed line-clamp-2 transition-colors ${isSuccessLayer ? 'text-gray-900 font-bold' : 'text-gray-800'}`}>
                    {layer.context}
                  </p>
                </div>

                {/* 2. 시도와 실패 (Action) */}
                <div className={`pl-4 border-l-2 ${isSuccessLayer ? 'border-yellow-300' : 'border-gray-200'}`}>
                  <span className={`text-xs font-bold uppercase tracking-wider block mb-1.5 ${isSuccessLayer ? 'text-yellow-600' : 'text-gray-400'}`}>
                    {isSuccessLayer ? '딛고 일어선 실패들 (The Layers)' : '시도와 실패 (Action)'}
                  </span>
                  <p className={`italic leading-relaxed line-clamp-2 ${isSuccessLayer ? 'text-gray-700' : 'text-gray-600'}`}>
                    "{layer.action}"
                  </p>
                </div>

                {/* 3. 배움/증명 (Lesson/Achievement) */}
                <div className={`p-4 rounded-xl border ${isSuccessLayer ? 'bg-white/50 border-yellow-200' : 'bg-gray-50/50 border-gray-100'}`}>
                  <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${isSuccessLayer ? 'bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-orange-500' : 'text-blue-500'}`}>
                    {isSuccessLayer ? '증명 (Achievement)' : '배움 (Lesson)'}
                  </span>
                  <p className="text-gray-900 font-medium line-clamp-2">{layer.lesson}</p>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-gray-100/50 flex items-center justify-end gap-2 z-10 relative">
                <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 rounded-xl">
                  👀 댓글
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleRespect(layer.id); }} 
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition-colors ${isSuccessLayer ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'text-gray-500 bg-gray-50 hover:bg-pink-50 hover:text-pink-600'}`}
                >
                  🤝 리스펙 <span className={isSuccessLayer ? 'text-yellow-800' : 'text-gray-700'}>{layer.respectCount || 0}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedLayer && (
        <LayerDetailModal 
          layer={selectedLayer} 
          onClose={() => setSelectedLayer(null)}
          onRespect={handleRespect}
          onViewUser={onViewUser || (() => {})}

          onDelete={(id) => setLayers(prev => prev.filter(l => l.id !== id))}
        />
      )}
    </div>
  );
}