import { Metadata } from 'next';
import '../styles/index.css';

export const metadata = {
  title: '카드뉴스 제작 - Card News Maker',
  description: '수동 및 AI 자동 생성을 지원하는 카드뉴스 제작 도구',
  keywords: ['카드뉴스', '카드뉴스 제작', '소셜미디어', 'SNS', '인스타그램'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
          rel="stylesheet"
        />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8940400388075870" crossOrigin="anonymous"></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
