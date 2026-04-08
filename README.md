This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Google Cloud TTS 운영 메모

상담 음성(TTS)은 기본적으로 Google Cloud Text-to-Speech(`ko-KR-Wavenet-A`)를 우선 사용합니다.

- 환경 변수: `GOOGLE_CLOUD_TTS_API_KEY`
- 미설정/실패 시: 클라이언트에서 Web Speech API로 자동 폴백
- 운영 리스크:
  - Google API 쿼터/과금 초과 시 서버 TTS가 실패할 수 있음
  - 브라우저 Web Speech 품질은 기기/브라우저별 편차가 큼
  - 장문 응답이 많을수록 TTS 비용이 증가하므로 사용량 모니터링 권장
