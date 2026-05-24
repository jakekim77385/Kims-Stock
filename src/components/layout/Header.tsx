'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, Settings, RefreshCw } from 'lucide-react';
import { useMarket, useSearch } from '@/lib/hooks';
import { formatPercent } from '@/lib/utils';

export default function Header() {
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const router = useRouter();

  const { data: market, loading: mLoading, refresh } = useMarket(60_000);
  const { results: searchResults, loading: searchLoading } = useSearch(query);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      if (searchResults && searchResults.length > 0) {
        router.push(`/analysis?ticker=${searchResults[0].ticker}`);
      } else {
        router.push(`/analysis?ticker=${query.trim().toUpperCase()}`);
      }
      setQuery('');
      setShowSearch(false);
    }
    if (e.key === 'Escape') {
      setQuery('');
      setShowSearch(false);
    }
  };

  return (
    <header className="header">
      {/* Search */}
      <div className="header-search" style={{ position: 'relative' }}>
        <Search size={13} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="티커 또는 종목명 검색"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowSearch(true); }}
          onFocus={() => setShowSearch(true)}
          onBlur={() => setTimeout(() => setShowSearch(false), 150)}
          onKeyDown={handleKeyDown}
        />

        {/* 검색 드롭다운 */}
        {showSearch && query.length >= 1 && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0, right: 0,
            background: 'white',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            zIndex: 100,
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)',
          }}>
            {searchLoading && (
              <div style={{ padding: '10px 12px', fontSize: 11, color: 'var(--text-muted)' }}>
                검색 중...
              </div>
            )}
            {!searchLoading && searchResults.length === 0 && (
              <div style={{ padding: '10px 12px', fontSize: 11, color: 'var(--text-muted)' }}>
                결과 없음 — Enter로 바로 이동
              </div>
            )}
            {searchResults.map((r) => (
              <div
                key={r.ticker}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', cursor: 'pointer',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
                onMouseDown={() => {
                  router.push(`/analysis?ticker=${r.ticker}`);
                  setQuery(''); setShowSearch(false);
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--accent)', minWidth: 50 }}>
                  {r.ticker}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.name}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{r.exchange}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 실시간 지수 티커 */}
      <div className="header-ticker-strip">
        {mLoading && !market ? (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>지수 로딩 중...</span>
        ) : (
          (market?.indices ?? []).slice(0, 5).map((idx) => (
            <div key={idx.ticker} className="ticker-chip">
              <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}>
                {idx.ticker}
              </span>
              <span style={{
                fontWeight: 600,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
                color: 'var(--text-primary)',
              }}>
                {idx.ticker === 'TNX'
                  ? `${idx.value.toFixed(2)}%`
                  : idx.value >= 10000
                    ? idx.value.toLocaleString(undefined, { maximumFractionDigits: 0 })
                    : idx.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span style={{
                fontSize: 11,
                color: idx.changePct >= 0 ? 'var(--positive)' : 'var(--negative)',
              }}>
                {idx.changePct >= 0 ? '+' : ''}{formatPercent(idx.changePct)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* 업데이트 시각 + 버튼 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
        {market?.updatedAt && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginRight: 4 }}>
            {new Date(market.updatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
        <button
          className="btn btn-ghost btn-icon"
          title="새로고침"
          onClick={refresh}
          style={{ opacity: mLoading ? 0.4 : 1 }}
        >
          <RefreshCw
            size={13}
            color="var(--text-secondary)"
            style={{ animation: mLoading ? 'spin 1s linear infinite' : undefined }}
          />
        </button>
        <button className="btn btn-ghost btn-icon" title="알림">
          <Bell size={13} color="var(--text-secondary)" />
        </button>
        <button className="btn btn-ghost btn-icon" title="설정">
          <Settings size={13} color="var(--text-secondary)" />
        </button>
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 600, cursor: 'pointer',
          color: 'var(--text-secondary)', marginLeft: 4,
        }}>P</div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </header>
  );
}
