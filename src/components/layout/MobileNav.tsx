'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Search, Briefcase, LineChart, BookOpen } from 'lucide-react';

const mobileNavItems = [
  { href: '/', label: '시장현황', icon: LayoutDashboard },
  { href: '/dh-analysis', label: 'DH분석', icon: LineChart },
  { href: '/screener', label: '스크리너', icon: Search },
  { href: '/portfolio', label: '포트폴리오', icon: Briefcase },
  { href: '/knowledge', label: '기초지식', icon: BookOpen },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-nav">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === '/'
          ? pathname === '/'
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
