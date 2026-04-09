// 🟢 유지 (prisma.config.ts)
import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv'; // 💡 dotenv 불러오기
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

console.log("현재 로드된 DB URL:", process.env.DATABASE_URL ? "읽기 성공" : "읽기 실패");

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
    // @ts-ignore: Prisma v7 config type workaround
    directUrl: process.env.DIRECT_URL,
  },
});