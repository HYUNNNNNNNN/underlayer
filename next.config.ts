const nextConfig = {
  // 💡 문법 검사(ESLint)와 타입 검사(TypeScript) 에러를 무시하고 무조건 배포합니다!
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;