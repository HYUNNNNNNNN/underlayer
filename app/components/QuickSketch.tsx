"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react"; 
import toast from "react-hot-toast";

interface Layer {
  id: string;
  category: string;
  context: string;
  createdAt: string;
}

export default function QuickSketch() {
  const { data: session } = useSession(); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    category: "개발/기술",
    context: "",
    action: "",
    lesson: "",
    imageUrl: "" 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 💡 [신규] 과거 실패 기록을 담을 상태 추가
  const [pastFailures, setPastFailures] = useState<Layer[]>([]);
  const [selectedFailureIds, setSelectedFailureIds] = useState<string[]>([]);

  const isSuccessMode = formData.category === "🌟 최종 성공 (Masterpiece)";

  // 💡 성공 모드일 때 내 과거 글들을 불러옵니다!
  useEffect(() => {
    if (session?.user?.email && isSuccessMode) {
      fetch('/api/layers')
        .then(res => res.json())
        .then(data => {
          // 내 글 중에서 '성공' 카테고리가 아닌 진짜 실패들만 가져옴
          const failures = data.filter((l: any) => l.authorEmail === session.user?.email && l.category !== "🌟 최종 성공 (Masterpiece)");
          setPastFailures(failures);
        })
        .catch(err => console.error("실패 기록 로드 에러", err));
    }
  }, [session, isSuccessMode]);

  // 💡 체크박스를 누를 때 텍스트 박스에 자동 입력해 주는 마법!
  const handleCheckboxToggle = (layer: Layer) => {
    setSelectedFailureIds(prev => {
      const isSelected = prev.includes(layer.id);
      const newSelection = isSelected ? prev.filter(id => id !== layer.id) : [...prev, layer.id];
      
      // 선택된 글의 제목(Context)들을 모아서 텍스트로 만듭니다.
      const selectedTexts = pastFailures
        .filter(l => newSelection.includes(l.id))
        .map(l => `✔️ [${l.category}] ${l.context}`)
        .join('\n');
      
      // action(딛고 일어선 실패들) 텍스트 박스에 자동 주입
      setFormData(f => ({ ...f, action: selectedTexts ? `[나의 발판이 된 실패들]\n${selectedTexts}\n\n` : "" }));
      
      return newSelection;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("이미지 용량은 5MB를 넘을 수 없어요! 😅"); return; }
    const reader = new FileReader();
    reader.onloadend = () => setFormData({ ...formData, imageUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.context || !formData.action || !formData.lesson) { toast.error("모든 칸을 꼼꼼히 채워주세요! ✍️"); return; }

    setIsSubmitting(true);
    const loadingToast = toast.loading(isSuccessMode ? "위대한 마스터피스를 전시하는 중..." : "소중한 실패를 기록하는 중...");

    try {
      const response = await fetch('/api/layers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          authorName: session?.user?.name || "익명의 도전자",
          authorEmail: session?.user?.email || null,
          // 💡 [핵심] 성공 모드일 때, 체크한 실패 카드들의 ID를 문자열(JSON)로 변환해서 보냅니다!
          linkedLayerIds: isSuccessMode && selectedFailureIds.length > 0 ? JSON.stringify(selectedFailureIds) : null,
        }),
      });

      if (response.ok) {
        setFormData({ category: "개발/기술", context: "", action: "", lesson: "", imageUrl: "" });
        setSelectedFailureIds([]); 
        if (fileInputRef.current) fileInputRef.current.value = ""; 
        toast.dismiss(loadingToast);
        toast.success(isSuccessMode ? "위대한 성공이 기록되었습니다! 🏆" : "나만의 밑그림이 완성되었습니다! 🎨");
      } else { throw new Error("저장 실패"); }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("저장에 실패했습니다. 다시 시도해주세요.");
    } finally { setIsSubmitting(false); }
  };

  if (!session) return <div className="max-w-xl mx-auto py-20 text-center bg-white border border-gray-200 rounded-2xl shadow-sm mt-8"><p className="text-xl text-gray-500">로그인 후 밑그림을 그릴 수 있습니다.</p></div>;

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="mb-8 text-center animate-in fade-in slide-in-from-top-2 duration-500">
        <h2 className={`text-2xl font-bold mb-2 transition-colors ${isSuccessMode ? 'text-yellow-600' : 'text-gray-900'}`}>
          {isSuccessMode ? '눈부신 성공 기록하기 👑' : '새로운 밑그림 그리기 ✍️'}
        </h2>
        <p className="text-gray-500 text-sm">
          {isSuccessMode ? '수많은 실패가 모여 만들어낸 마스터피스를 자랑해주세요.' : '실패는 부끄러운 것이 아닙니다. 성공을 위한 레이어일 뿐입니다.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className={`space-y-6 p-6 md:p-8 rounded-2xl border shadow-sm transition-all duration-500 ${isSuccessMode ? 'border-yellow-400 bg-gradient-to-b from-yellow-50/50 to-white' : 'border-gray-200 bg-white'}`}>
        
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">분야</label>
          <select 
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all font-medium text-gray-800"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          >
            <option value="개발/기술">개발/기술</option>
            <option value="디자인/기획">디자인/기획</option>
            <option value="비즈니스/마케팅">비즈니스/마케팅</option>
            <option value="일상/기타">일상/기타</option>
            <option value="🌟 최종 성공 (Masterpiece)">🌟 최종 성공 (Masterpiece)</option>
          </select>
        </div>

        {/* 💡 [신규] 성공 모드일 때만 나타나는 과거 실패 선택 리스트! */}
        {isSuccessMode && pastFailures.length > 0 && (
          <div className="bg-white p-5 rounded-xl border border-yellow-200 shadow-inner max-h-60 overflow-y-auto custom-scrollbar">
            <label className="block text-sm font-bold text-yellow-600 mb-3">어떤 실패들이 이 성공을 만들었나요?</label>
            <div className="space-y-2">
              {pastFailures.map(layer => (
                <label key={layer.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedFailureIds.includes(layer.id) ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}>
                  <input 
                    type="checkbox" 
                    className="mt-1 w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500 accent-yellow-500 cursor-pointer"
                    checked={selectedFailureIds.includes(layer.id)}
                    onChange={() => handleCheckboxToggle(layer)}
                  />
                  <div>
                    <div className="text-xs font-bold text-gray-400 mb-0.5">{new Date(layer.createdAt).toLocaleDateString()} | {layer.category}</div>
                    <div className="text-sm font-bold text-gray-800 leading-tight">{layer.context}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">시각적 기록 (선택)</label>
          <div className="flex items-center justify-center w-full">
            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden relative ${isSuccessMode ? 'border-yellow-300 bg-yellow-50/30' : 'border-gray-300 bg-gray-50'}`}>
              {formData.imageUrl ? <img src={formData.imageUrl} className="object-cover w-full h-full opacity-70" /> : <p className="text-sm font-bold text-gray-400">클릭하여 이미지 첨부</p>}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">{isSuccessMode ? '상황 (Goal)' : '상황 (Context)'}</label>
          <textarea required placeholder={isSuccessMode ? "어떤 위대한 목표를 마침내 달성하셨나요?" : "어떤 목표를 달성하려고 하셨나요?"} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl min-h-[100px]" value={formData.context} onChange={(e) => setFormData({...formData, context: e.target.value})} />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">{isSuccessMode ? '딛고 일어선 실패들 (The Layers)' : '시도와 실패 (Action)'}</label>
          <textarea required placeholder={isSuccessMode ? "이 성공을 만들기 위해 이전에 어떤 실패들을 거쳐왔나요? (위에서 체크하면 자동 입력됩니다)" : "어떤 시도를 했고, 결과적으로 왜 실패했나요?"} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl min-h-[100px]" value={formData.action} onChange={(e) => setFormData({...formData, action: e.target.value})} />
        </div>

        <div>
          <label className={`block text-sm font-bold mb-2 ${isSuccessMode ? 'text-yellow-600' : 'text-blue-600'}`}>{isSuccessMode ? '증명 (Achievement)' : '배움 (Lesson)'}</label>
          <textarea required placeholder={isSuccessMode ? "이 성공을 통해 무엇을 증명해냈나요? 스스로에게 칭찬 한마디를 적어보세요!" : "이 실패를 통해 무엇을 배우셨나요?"} className={`w-full p-3 rounded-xl min-h-[100px] ${isSuccessMode ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-100'}`} value={formData.lesson} onChange={(e) => setFormData({...formData, lesson: e.target.value})} />
        </div>

        <button type="submit" disabled={isSubmitting} className={`w-full py-4 font-bold text-white rounded-xl ${isSuccessMode ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-black hover:bg-gray-800'}`}>
          {isSubmitting ? '기록하는 중...' : (isSuccessMode ? '마스터피스 전시하기 👑' : '밑그림 저장하기')}
        </button>
      </form>
    </div>
  );
}