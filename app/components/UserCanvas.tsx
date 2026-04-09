"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import LayerDetailModal from "./LayerDetailModal"; // 💡 우리가 만든 모달 컴포넌트를 불러옵니다!

interface Layer {
  id: string;
  category: string;
  context: string;
  action: string;
  lesson: string;
  respectCount: number; // 💡 모달에 넘겨주기 위해 리스펙 카운트도 추가!
  authorName: string;
  authorEmail: string | null;
  createdAt: string;
  imageUrl?: string | null;
}

export default function UserCanvas({ email, onBack }: { email: string, onBack: () => void }) {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [userName, setUserName] = useState("알 수 없음");
  const [isLoading, setIsLoading] = useState(true);
  
  // 💡 선택된 카드를 담을 상태 추가
  const [selectedLayer, setSelectedLayer] = useState<Layer | null>(null);

  useEffect(() => {
    async function fetchUserLayers() {
      try {
        const response = await fetch('/api/layers');
        if (response.ok) {
          const all = await response.json();
          const userLayers = all.filter((l: Layer) => l.authorEmail === email);
          setLayers(userLayers.reverse()); // 오래된 순으로 정렬 (바닥부터 쌓이게)
          if(userLayers.length > 0) setUserName(userLayers[userLayers.length - 1].authorName);
        }
      } catch (error) {
        console.error("로드 실패", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUserLayers();
  }, [email]);

  // 💡 모달 안에서 리스펙을 눌렀을 때의 처리
  const handleRespect = async (layerId: string) => {
    setLayers(prevLayers => prevLayers.map(layer => layer.id === layerId ? { ...layer, respectCount: (layer.respectCount || 0) + 1 } : layer));
    if (selectedLayer && selectedLayer.id === layerId) {
      setSelectedLayer({ ...selectedLayer, respectCount: (selectedLayer.respectCount || 0) + 1 });
    }
    toast.success("멋진 실패에 리스펙을 보냈습니다! 🤝");
  };

  if (isLoading) return <div className="text-center py-20 text-gray-500">캔버스를 불러오는 중...</div>;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <button 
        onClick={onBack} 
        className="mb-8 flex items-center gap-2 font-bold text-gray-500 hover:text-black transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200"
      >
        ← 스튜디오로 돌아가기
      </button>

      <div className="mb-12 text-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{userName}님의 캔버스</h2>
        <p className="text-gray-500">성공을 향해 {layers.length}개의 레이어를 쌓아가고 있습니다.</p>
      </div>

      {layers.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-500">아직 작성된 밑그림이 없습니다.</p>
        </div>
      ) : (
        <div className="relative w-full pb-32">
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-gray-200 to-transparent -translate-x-1/2"></div>

          <div className="space-y-12 relative z-10">
            {layers.map((layer, index) => {
              const isEven = index % 2 === 0;
              return (
                <div key={layer.id} className={`flex flex-col md:flex-row items-center w-full ${isEven ? 'md:flex-row-reverse' : ''}`}>
                  <div className="hidden md:block w-1/2"></div>
                  
                  <div className="absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-4 border-white bg-black shadow-md z-20 flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>
                  
                  <div className={`w-full md:w-1/2 ${isEven ? 'md:pr-12' : 'md:pl-12'} p-4 md:p-0`}>
                    {/* 💡 카드를 누르면 selectedLayer에 데이터가 담기면서 모달이 열립니다! (커서 모양도 포인터로 변경) */}
                    <div 
                      onClick={() => setSelectedLayer(layer)}
                      className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100 hover:-translate-y-1 transition-transform duration-300 cursor-pointer group"
                    >
                      <div className="text-xs font-bold text-gray-400 mb-3">
                        {new Date(layer.createdAt).toLocaleDateString()} {new Date(layer.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">{layer.context}</h3>
                      
                      {layer.imageUrl && (
                        <div className="w-full h-32 rounded-xl overflow-hidden mb-4 border border-gray-100">
                          <img src={layer.imageUrl} className="w-full h-full object-cover" alt="첨부" />
                        </div>
                      )}
                      
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                        <span className="text-xs font-bold text-blue-500 block mb-1">배움</span>
                        <p className="text-gray-800 text-sm font-medium line-clamp-2">{layer.lesson}</p>
                      </div>

                      {/* 💡 클릭을 유도하기 위해 하단에 작은 아이콘을 띄워줍니다 */}
                      <div className="flex items-center justify-end gap-3 text-xs font-bold text-gray-400">
                        <span>💬 자세히 보기</span>
                        <span>🤝 리스펙 {layer.respectCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 💡 상세 보기 모달 연결 (StudioFeed와 완전히 동일하게 뜹니다!) */}
      {selectedLayer && (
        <LayerDetailModal 
          layer={selectedLayer} 
          onClose={() => setSelectedLayer(null)}
          onRespect={handleRespect}
          onViewUser={() => {}} // 이미 해당 유저 캔버스에 있으므로 아무 동작 안 함
        />
      )}
    </div>
  );
}