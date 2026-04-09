import NextAuth, { NextAuthOptions } from "next-auth"; // 💡 NextAuthOptions 타입 추가
import GithubProvider from "next-auth/providers/github";

// 💡 1. 설정 부분만 따로 빼서 authOptions라는 변수에 담고 export 합니다.
export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || "임시_아이디",
      clientSecret: process.env.GITHUB_SECRET || "임시_시크릿",
    }),
  ],
  callbacks: {
    async jwt({ token, trigger, session }) {
      if (trigger === "update" && session?.image) {
        token.picture = session.image; 
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.picture) {
        session.user.image = token.picture as string;
      }
      return session;
    }
  },
};

// 💡 2. 기존 핸들러는 authOptions를 받아서 실행되게 둡니다.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };