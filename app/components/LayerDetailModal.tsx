"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface Comment {
  id: string;
  text: string;
  authorName: string;
  createdAt: string;
}

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
  linkedLayerIds?: string | null; // 💡 묶인 실패들 ID
}

interface LayerDetailModalProps {
  layer: Layer;
  onClose: () => void;
  onRespect: (layerId: string) => void;
  onViewUser: (email: string) => void;
  onDelete?: (layerId: string) => void; // 💡 삭제 후 피드 갱신용
}

export default function LayerDetailModal({ layer: initialLayer, onClose, onRespect, onViewUser, onDelete }: LayerDetailModalProps) {
  const { data: session } = useSession();
  
  // 💡 [핵심] 모달 창 안에서 다른 카드로 이동할 수 있도록 현재 레이어를 상태로 관리합니다!
  const [currentLayer, setCurrentLayer] = useState<Layer>(initialLayer);
  const [linkedLayers, setLinkedLayers] = useState<Layer[]>([]); // 💡 묶인 실패 카드들

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);

  // 🚨 [관리자 설정] 여기에 본인의 로그인 이메일을 적어주세요!
  const ADMIN_EMAIL = "sinsh1025@gmail.com"; 
  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  // 카드가 바뀔 때마다 댓글과 묶인 실패 기록을 새로 불러옵니다.
  useEffect(() => {
    setCurrentLayer(initialLayer);
  }, [initialLayer]);

  useEffect(() => {
    async function fetchData() {
      setIsLoadingComments(true);
      try {
        // 1. 댓글 불러오기
        const resComments = await fetch(`/api/layers/${currentLayer.id}/comments`);
        if (resComments.ok) setComments(await resComments.json());

        // 2. 성공 카드라면 묶인 실패 기록들 불러오기
        if (currentLayer.category === "🌟 최종 성공 (Masterpiece)" && currentLayer.linkedLayerIds) {
          const ids = JSON.parse(currentLayer.linkedLayerIds);
          const resAll = await fetch('/api/layers');
          if (resAll.ok) {
            const allData = await resAll.json();
            setLinkedLayers(allData.filter((l: Layer) => ids.includes(l.id)));
          }
        } else {
          setLinkedLayers([]);
        }
      } catch (err) { console.error("데이터 로드 실패", err); } 
      finally { setIsLoadingComments(false); }
    }
    fetchData();
  }, [currentLayer]);

  const handleCommentSubmit = async () => { /* 기존 댓글 저장 로직 동일 */
    if (!newComment.trim()) return;
    if (!session) { toast.error("로그인이 필요합니다!"); return; }
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/layers/${currentLayer.id}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment, authorName: session.user?.name || "익명", authorEmail: session.user?.email })
      });
      if (response.ok) {
        setNewComment(""); toast.success("응원의 한마디가 전달되었습니다! 💬");
        const res = await fetch(`/api/layers/${currentLayer.id}/comments`);
        if (res.ok) setComments(await res.json());
      }
    } catch (error) { toast.error("댓글 저장에 실패했습니다."); } 
    finally { setIsSubmitting(false); }
  };

  // 💡 관리자 전용 삭제 기능
  const handleAdminDelete = async () => {
    if (!confirm("🚨 관리자 권한으로 이 글을 완전히 삭제하시겠습니까?")) return;
    const loadingToast = toast.loading("삭제 중...");
    try {
      const response = await fetch(`/api/layers/${currentLayer.id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.dismiss(loadingToast);
        toast.success("관리자 권한으로 삭제되었습니다.");
        if (onDelete) onDelete(currentLayer.id); // 부모 피드에서 카드 없애기
        onClose(); // 모달 닫기
      } else throw new Error("삭제 실패");
    } catch (error) {
      toast.dismiss(loadingToast); toast.error("삭제에 실패했습니다.");
    }
  };

  const isSuccessLayer = currentLayer.category === "🌟 최종 성공 (Masterpiece)";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className={`w-full max-w-5xl h-[90vh] md:h-[80vh] flex flex-col md:flex-row overflow-hidden rounded-[2rem] shadow-2xl relative ${isSuccessLayer ? 'bg-gradient-to-br from-yellow-50 to-white' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
        
        <button onClick={onClose} className="absolute top-4 right-4 z-50 w-10 h-10 bg-gray-100/80 backdrop-blur-md rounded-full flex items-center justify-center font-bold text-gray-500 hover:bg-gray-200 transition-colors">✕</button>
        
        {/* 💡 관리자용 삭제 버튼 */}
        {isAdmin && (
          <button onClick={handleAdminDelete} className="absolute top-7 right-44 z-50 px-4 py-2 bg-red-100 text-red-600 font-bold text-xs rounded-full hover:bg-red-200 shadow-sm border border-red-200 transition-colors">
            🚨 관리자 삭제
          </button>
        )}

        {/* 좌측: 글 본문 영역 */}
        <div className={`w-full md:w-3/5 h-1/2 md:h-full overflow-y-auto p-6 md:p-10 custom-scrollbar border-b md:border-b-0 md:border-r ${isSuccessLayer ? 'border-yellow-200' : 'border-gray-200 bg-gray-50'}`}>
          
          {/* 뒤로 가기 버튼 (내부 탐색 중일 때만 표시) */}
          {currentLayer.id !== initialLayer.id && (
            <button onClick={() => setCurrentLayer(initialLayer)} className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
              ← 원래 카드로 돌아가기
            </button>
          )}

          <div className="flex items-center gap-3 cursor-pointer hover:opacity-70 transition-opacity mb-8 inline-flex" onClick={() => { onClose(); if (currentLayer.authorEmail) onViewUser(currentLayer.authorEmail); }}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-extrabold shadow-sm ${isSuccessLayer ? 'bg-yellow-100 text-yellow-600 border border-yellow-300' : 'bg-white border border-gray-200 text-gray-500'}`}>
              {currentLayer.authorName.charAt(0)}
            </div>
            <div>
              <div className={`font-extrabold transition-colors ${isSuccessLayer ? 'text-yellow-700' : 'text-gray-900 hover:text-blue-600'}`}>{currentLayer.authorName} <span className="text-xs font-normal text-gray-400 ml-1">의 캔버스 ↗</span></div>
              <div className="text-xs text-gray-400 mt-0.5">{new Date(currentLayer.createdAt).toLocaleDateString()} {new Date(currentLayer.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>

          {currentLayer.imageUrl && (
            <img src={currentLayer.imageUrl} className="w-full rounded-2xl mb-8 shadow-sm border border-gray-200" alt="상세 이미지" />
          )}

          <div className="space-y-8 text-lg">
            <section>
              <span className={`text-xs font-extrabold uppercase tracking-widest block mb-2 ${isSuccessLayer ? 'text-yellow-600' : 'text-gray-400'}`}>{isSuccessLayer ? '목표 (Goal)' : '상황 (Context)'}</span>
              <p className={`leading-relaxed ${isSuccessLayer ? 'text-gray-900 font-bold' : 'text-gray-800'}`}>{currentLayer.context}</p>
            </section>
            
            <section className={`pl-5 border-l-4 ${isSuccessLayer ? 'border-yellow-300' : 'border-gray-300'}`}>
              <span className={`text-xs font-extrabold uppercase tracking-widest block mb-2 ${isSuccessLayer ? 'text-yellow-600' : 'text-gray-400'}`}>{isSuccessLayer ? '딛고 일어선 실패들 (The Layers)' : '시도와 실패 (Action)'}</span>
              <p className={`italic leading-relaxed ${isSuccessLayer ? 'text-gray-700' : 'text-gray-600'}`}>"{currentLayer.action}"</p>
              
              {/* 💡 딛고 일어선 실패 카드들을 클릭할 수 있게 보여줍니다! */}
              {isSuccessLayer && linkedLayers.length > 0 && (
                <div className="mt-4 space-y-2 pr-4">
                  {linkedLayers.map(l => (
                    <div 
                      key={l.id} 
                      onClick={() => setCurrentLayer(l)} // 💡 누르면 해당 실패 카드로 모달 안에서 이동!
                      className="p-3 bg-white/80 border border-yellow-200 rounded-xl cursor-pointer hover:bg-yellow-50 hover:border-yellow-400 hover:-translate-y-0.5 transition-all shadow-sm flex items-center justify-between group"
                    >
                      <div className="pr-4">
                        <span className="text-[10px] font-bold text-gray-400 block mb-0.5">{l.category}</span>
                        <span className="text-sm font-bold text-gray-800 group-hover:text-yellow-700 transition-colors line-clamp-1">{l.context}</span>
                      </div>
                      <span className="text-xs font-extrabold text-yellow-500 whitespace-nowrap bg-yellow-100 px-2 py-1 rounded-full group-hover:bg-yellow-500 group-hover:text-white transition-colors">보기 ↗</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={`p-6 rounded-2xl border ${isSuccessLayer ? 'bg-white/50 border-yellow-200 shadow-inner' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100/50'}`}>
              <span className={`text-xs font-extrabold uppercase tracking-widest block mb-2 ${isSuccessLayer ? 'bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-orange-500' : 'text-blue-500'}`}>{isSuccessLayer ? '증명 (Achievement)' : '배움 (Lesson)'}</span>
              <p className="text-gray-900 font-bold leading-relaxed">{currentLayer.lesson}</p>
            </section>
          </div>
        </div>

        {/* 우측: 리스펙 & 댓글 영역 (기존과 동일) */}
        <div className="w-full md:w-2/5 h-1/2 md:h-full flex flex-col bg-white">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
            <span className="font-bold text-gray-900">댓글 {comments.length}</span>
            <button onClick={() => onRespect(currentLayer.id)} className={`flex items-center gap-2 px-5 py-2.5 text-sm font-extrabold rounded-full transition-colors active:scale-95 ${isSuccessLayer ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-pink-50 text-pink-600 hover:bg-pink-100'}`}>
              🤝 리스펙 <span className="bg-white px-2 py-0.5 rounded-full shadow-sm">{currentLayer.respectCount || 0}</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white custom-scrollbar">
            {isLoadingComments ? ( <div className="text-center text-gray-400 text-sm mt-10">댓글을 불러오는 중...</div> ) : comments.length === 0 ? ( <div className="text-center text-gray-400 text-sm mt-10">첫 번째 응원의 댓글을 남겨보세요!</div> ) : (
              comments.map((c) => (
                <div key={c.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-extrabold text-gray-900">{c.authorName}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{c.text}</p>
                </div>
              ))
            )}
          </div>
          <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50 shrink-0">
            <div className="flex gap-2 relative">
              <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()} placeholder="따뜻한 응원을 남겨주세요..." className="flex-grow p-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm pr-20" />
              <button onClick={handleCommentSubmit} disabled={isSubmitting || !newComment.trim()} className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 transition-colors">등록</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}