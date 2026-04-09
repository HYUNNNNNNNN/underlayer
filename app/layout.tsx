import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "./components/AuthProvider";
// 💡 1. 라이브러리에서 Toaster를 불러옵니다.
import { Toaster } from "react-hot-toast"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Underlayer",
  description: "성공 아래 숨겨진 실패의 레이어를 기록하다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        
        {/* 화면 맨 아래 중앙(bottom-center)에서 토스트가 올라오도록 설정합니다. */}
        <Toaster 
          position="bottom-center" 
          toastOptions={{
            duration: 3000, // 3초 뒤에 사라짐
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '12px',
              padding: '16px',
              fontWeight: 'bold',
            },
          }}
        />
      </body>
    </html>
  );
}