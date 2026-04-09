"use client";

import { useState } from "react";
import QuickSketch from "./components/QuickSketch";
import MyCanvas from "./components/MyCanvas";     
import StudioFeed from "./components/StudioFeed"; 
import AuthButton from "./components/AuthButton";
import MyProfile from "./components/MyProfile"; 
import UserCanvas from "./components/UserCanvas"; // 💡 새로 만들 컴포넌트를 불러옵니다!

export default function Home() {
  const [activeTab, setActiveTab] = useState("studio");
  const [targetUserEmail, setTargetUserEmail] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-8 pb-20 relative">
      
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-10">
        <AuthButton />
      </div>

      <div className="w-full max-w-4xl pt-8">
        
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Underlayer</h1>
          <p className="text-gray-500">성공 아래 숨겨진 '실패의 레이어'를 기록하다</p>
        </div>

        {/* 💡 [모바일 최적화] 모바일에서는 하단 바, PC에서는 상단 탭으로 자동 변신합니다! */}
        <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 p-3 z-[100] flex justify-around md:relative md:bg-transparent md:border-none md:p-0 md:justify-center md:gap-4 md:mb-10 pb-safe">
          <button
            onClick={() => setActiveTab("write")}
            className={`flex flex-col md:flex-row items-center gap-1 md:px-5 md:py-2.5 rounded-2xl md:rounded-full text-[10px] md:text-sm font-bold transition-all ${
              activeTab === "write" 
                ? "text-black md:bg-black md:text-white md:shadow-md scale-110 md:scale-100" 
                : "text-gray-400 md:bg-white md:text-gray-500 md:border border-gray-200 hover:bg-gray-100"
            }`}
          >
            <span className="text-xl md:text-base">✍️</span>
            <span>작업실</span>
          </button>
          <button
            onClick={() => setActiveTab("mine")}
            className={`flex flex-col md:flex-row items-center gap-1 md:px-5 md:py-2.5 rounded-2xl md:rounded-full text-[10px] md:text-sm font-bold transition-all ${
              activeTab === "mine" 
                ? "text-black md:bg-black md:text-white md:shadow-md scale-110 md:scale-100" 
                : "text-gray-400 md:bg-white md:text-gray-500 md:border border-gray-200 hover:bg-gray-100"
            }`}
          >
            <span className="text-xl md:text-base">🎨</span>
            <span>내 캔버스</span>
          </button>
          <button
            onClick={() => setActiveTab("studio")}
            className={`flex flex-col md:flex-row items-center gap-1 md:px-5 md:py-2.5 rounded-2xl md:rounded-full text-[10px] md:text-sm font-bold transition-all ${
              activeTab === "studio" || activeTab === "userCanvas"
                ? "text-black md:bg-black md:text-white md:shadow-md scale-110 md:scale-100" 
                : "text-gray-400 md:bg-white md:text-gray-500 md:border border-gray-200 hover:bg-gray-100"
            }`}
          >
            <span className="text-xl md:text-base">🌍</span>
            <span>스튜디오</span>
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col md:flex-row items-center gap-1 md:px-5 md:py-2.5 rounded-2xl md:rounded-full text-[10px] md:text-sm font-bold transition-all ${
              activeTab === "profile" 
                ? "text-black md:bg-black md:text-white md:shadow-md scale-110 md:scale-100" 
                : "text-gray-400 md:bg-white md:text-gray-500 md:border border-gray-200 hover:bg-gray-100"
            }`}
          >
            <span className="text-xl md:text-base">👤</span>
            <span>프로필</span>
          </button>
        </div>

        {activeTab === "write" && <QuickSketch />}
        {activeTab === "mine" && <MyCanvas />}
        {activeTab === "studio" && (
          <StudioFeed 
            onGoToWrite={() => setActiveTab("write")} 
            onViewUser={(email) => {
              setTargetUserEmail(email);
              setActiveTab("userCanvas");
            }}
          />
        )}
        {activeTab === "userCanvas" && targetUserEmail && (
          <UserCanvas 
            email={targetUserEmail} 
            onBack={() => setActiveTab("studio")} 
          />
        )}
        {activeTab === "profile" && <MyProfile />} 

      </div>
    </main>
  );
}