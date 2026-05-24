import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';

export const metadata: Metadata = {
  title: 'DH Stock — 미국 주식 투자 플랫폼',
  description: '퀀트 분석 · 가치투자 · 모멘텀 전략 · 포트폴리오 관리 · 세계 최고 수준의 미국 주식 투자 플랫폼',
  keywords: '미국 주식, 주식 스크리너, 퀀트 투자, 가치투자, CANSLIM, 마법공식, 포트폴리오',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="app-layout">
          <Sidebar />
          <div className="main-content">
            <Header />
            <main className="page-container page-enter">
              {children}
            </main>
          </div>
          <MobileNav />
        </div>
      </body>
    </html>
  );
}

