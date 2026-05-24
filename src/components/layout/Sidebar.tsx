'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Search, BarChart3, Briefcase,
  TrendingUp, ShieldCheck, Newspaper, Trophy, Zap, BookOpen, LineChart, Calendar
} from 'lucide-react';

const navItems = [
  { section: '대시보드' },
  { href: '/', label: '시장 현황', icon: LayoutDashboard },
  { href: '/dh-analysis', label: 'DH 분석', icon: LineChart },
  { href: '/knowledge', label: '기초 지식', icon: BookOpen },
  { section: '분석' },
  { href: '/screener', label: '종목 스크리너', icon: Search },
  { href: '/analysis', label: '종목 분석', icon: BarChart3 },
  { href: '/strategy', label: '투자 전략', icon: Zap },
  { section: '포트폴리오' },
  { href: '/portfolio', label: '포트폴리오', icon: Briefcase },
  { href: '/risk', label: '위험 관리', icon: ShieldCheck },
  { section: '인사이트' },
  { href: '/news', label: '뉴스 & 어닝', icon: Newspaper },
  { href: '/calendar', label: '경제 일정', icon: Calendar },
  { href: '/legends', label: '전설 투자가', icon: Trophy },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <TrendingUp size={15} color="white" strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
              DH Stock
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              US Markets
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="sidebar-nav">
        {navItems.map((item, idx) => {
          if ('section' in item && !('href' in item)) {
            return <div key={idx} className="nav-section-label">{item.section}</div>;
          }
          if ('href' in item) {
            const Icon = item.icon as any;
            const isActive = item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href as string);
            return (
              <Link
                key={item.href}
                href={item.href as string}
                className={`nav-item${isActive ? ' active' : ''}`}
              >
                <Icon className="nav-icon" />
                <span>{item.label}</span>
              </Link>
            );
          }
          return null;
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid var(--border-subtle)',
        marginTop: 'auto',
      }}>
        <div className="status-live" style={{ marginBottom: 3 }}>실시간 데이터</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          Yahoo Finance · 60초 갱신
        </div>
      </div>
    </nav>
  );
}
