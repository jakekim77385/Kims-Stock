'use client';
import { useState, useEffect, useRef } from 'react';
import { Calendar, AlertTriangle, TrendingUp, TrendingDown, ExternalLink, RefreshCw, Search, X } from 'lucide-react';
import NewsDetailModal from '@/components/NewsDetailModal';

interface NewsItem {
  id: number;
  headline: string;
  translatedHeadline?: string;
  source: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
  ticker: string;
  impact: 'high' | 'medium' | 'low';
  link?: string;
}

interface EarningItem {
  ticker: string;
  name: string;
  date: string;
  eps_est: number;
  surprise_pct: number | null;
}

interface MacroEventItem {
  date: string;
  event: string;
  actual: string | null;
  forecast: string;
  previous: string;
  importance: 'high' | 'medium' | 'low';
}

const NewsCardSkeleton = () => (
  <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, animation: 'pulse 1.5s infinite' }}>
    <div style={{ display: 'flex', gap: 6 }}>
      <div style={{ width: 40, height: 16, background: 'var(--bg-elevated)', borderRadius: 4 }} />
      <div style={{ width: 60, height: 16, background: 'var(--bg-elevated)', borderRadius: 4 }} />
    </div>
    <div style={{ height: 14, background: 'var(--bg-elevated)', borderRadius: 4, width: '100%' }} />
    <div style={{ height: 14, background: 'var(--bg-elevated)', borderRadius: 4, width: '70%' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
      <div style={{ width: 50, height: 12, background: 'var(--bg-elevated)', borderRadius: 4 }} />
      <div style={{ width: 14, height: 14, background: 'var(--bg-elevated)', borderRadius: '50%' }} />
    </div>
  </div>
);

const EarningSkeleton = () => (
  <div style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border-subtle)', animation: 'pulse 1.5s infinite' }}>
    <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--bg-elevated)', flexShrink: 0 }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
      <div style={{ height: 12, background: 'var(--bg-elevated)', borderRadius: 4, width: '50%' }} />
      <div style={{ height: 10, background: 'var(--bg-elevated)', borderRadius: 4, width: '75%' }} />
    </div>
  </div>
);

const MacroSkeleton = () => (
  <div style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', animation: 'pulse 1.5s infinite' }}>
    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--bg-elevated)', marginTop: 6, flexShrink: 0 }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ height: 12, background: 'var(--bg-elevated)', borderRadius: 4, width: '80%' }} />
      <div style={{ height: 10, background: 'var(--bg-elevated)', borderRadius: 4, width: '60%' }} />
    </div>
  </div>
);

export default function NewsPage() {
  const [filter, setFilter] = useState('all');
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [earnings, setEarnings] = useState<EarningItem[]>([]);
  const [macroEventsList, setMacroEventsList] = useState<MacroEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState('');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // 개별 종목/ETF 뉴스 검색 전용 상태 추가
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTicker, setActiveTicker] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  const categories = ['all', '매크로', 'Tech', 'Healthcare', 'Financials', 'EV', 'Communication'];

  const fetchData = async (cat: string, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setNewsLoading(true);

    try {
      const res = await fetch(`/api/news?category=${cat}`);
      if (res.ok) {
        const json = await res.json();
        setNewsList(json.news ?? []);
        if (isInitial) {
          setEarnings(json.earnings ?? []);
          setMacroEventsList(json.macroEvents ?? []);
        }
        setUpdatedAt(json.updatedAt ?? '');
      }
    } catch (err) {
      console.error('Failed to fetch news feed:', err);
    } finally {
      setLoading(false);
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(filter, true);
  }, []);

  // 종목/ETF 검색 디바운스 처리
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const json = await res.json();
          setSearchResults(json.results ?? []);
        }
      } catch (err) {
        console.error('Failed to search tickers:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 바깥 클릭 시 추천 자동완성 창 닫기
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
    };
  }, []);

  const handleSelectTicker = async (ticker: string) => {
    const upper = ticker.toUpperCase();
    setActiveTicker(upper);
    setSearchQuery(upper);
    setShowSuggestions(false);
    setFilter(''); // 종목 검색 시 카테고리 필터 하이라이트 해제
    
    setNewsLoading(true);
    try {
      const res = await fetch(`/api/news?ticker=${upper}`);
      if (res.ok) {
        const json = await res.json();
        setNewsList(json.news ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch ticker news:', err);
    } finally {
      setNewsLoading(false);
    }
  };

  const handleClearTicker = () => {
    setActiveTicker('');
    setSearchQuery('');
    setFilter('all');
    fetchData('all', false);
  };

  const handleFilterChange = (cat: string) => {
    setActiveTicker('');
    setSearchQuery('');
    setFilter(cat);
    fetchData(cat, false);
  };

  const handleRefresh = () => {
    if (activeTicker) {
      handleSelectTicker(activeTicker);
    } else {
      fetchData(filter, true);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>뉴스 & 어닝 캘린더</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            시장 주요 뉴스 · 어닝 시즌 · 매크로 이벤트 실시간 추적
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading || newsLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-secondary)',
            background: 'var(--card-bg, white)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 6,
            padding: '6px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--card-bg, white)'}
        >
          <RefreshCw size={12} style={{ animation: (loading || newsLoading) ? 'spin 1s linear infinite' : 'none' }} />
          새로고침
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
        {/* News Feed Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          {/* Ticker News Search Bar */}
          <div 
            ref={searchContainerRef}
            style={{ position: 'relative', width: '100%', marginBottom: 4 }}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  placeholder="종목 또는 ETF 티커 검색 (예: NVDA, AAPL, TSLA, SPY, QQQ)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    border: activeTicker ? '1.5px solid var(--accent, #6366f1)' : '1.5px solid var(--border-default, #e2e8f0)',
                    background: 'white',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-sm)',
                    outline: 'none',
                    transition: 'all 0.15s'
                  }}
                />
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted, #94a3b8)'
                  }}
                />
                {(searchQuery || activeTicker) && (
                  <button
                    onClick={handleClearTicker}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted, #94a3b8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 2,
                      borderRadius: '50%'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated, #f8fafc)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              
              {activeTicker && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(99, 102, 241, 0.08)',
                  color: 'var(--accent, #6366f1)',
                  border: '1.5px solid rgba(99, 102, 241, 0.15)',
                  borderRadius: '8px',
                  padding: '9px 14px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  whiteSpace: 'nowrap'
                }}>
                  🔎 {activeTicker} 뉴스 조회 중
                </div>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (searchResults.length > 0 || searchLoading) && (
              <div 
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  zIndex: 100,
                  marginTop: '4px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  padding: '6px'
                }}
              >
                {searchLoading ? (
                  <div style={{ padding: '12px 14px', fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> 검색하는 중...
                  </div>
                ) : (
                  searchResults.map((res) => (
                    <div
                      key={res.ticker}
                      onClick={() => handleSelectTicker(res.ticker)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', fontFamily: 'JetBrains Mono' }}>{res.ticker}</span>
                        <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: 1 }}>{res.name}</span>
                      </div>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent, #6366f1)', background: 'rgba(99, 102, 241, 0.06)', padding: '2px 6px', borderRadius: '4px' }}>
                        {res.exchange} · {res.type}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => handleFilterChange(c)}
                disabled={loading || newsLoading}
                className={`badge ${filter === c ? 'badge-blue' : 'badge-neutral'}`}
                style={{
                  cursor: 'pointer',
                  border: 'none',
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  transition: 'background 0.15s'
                }}
              >
                {c === 'all' ? '전체' : c}
              </button>
            ))}
          </div>

          {/* News List */}
          {loading || newsLoading ? (
            [1, 2, 3, 4, 5].map(i => <NewsCardSkeleton key={i} />)
          ) : newsList.length === 0 ? (
            <div className="card" style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              해당 카테고리의 실시간 속보 뉴스가 없습니다.
            </div>
          ) : (
            newsList.map((n) => {
              const isPositive = n.sentiment === 'positive';
              const isNegative = n.sentiment === 'negative';
              const badgeClass = isPositive ? 'badge-green' : isNegative ? 'badge-red' : 'badge-neutral';
              const borderLeftColor = isPositive ? 'var(--positive)' : isNegative ? 'var(--negative)' : 'var(--border-subtle)';

              return (
                <div
                  key={n.id}
                  className="card card-hover"
                  onClick={() => {
                    setSelectedNews(n);
                    setModalOpen(true);
                  }}
                  style={{
                    borderLeft: `3px solid ${borderLeftColor}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span className={`badge ${badgeClass}`} style={{ border: `1px solid ${isPositive ? '#a7f3d0' : isNegative ? '#fecaca' : '#cbd5e1'}` }}>
                        {isPositive ? <TrendingUp size={11} /> : isNegative ? <TrendingDown size={11} /> : null}
                        {isPositive ? '긍정 호재' : isNegative ? '부정 악재' : '중립 일반'}
                      </span>
                      <span className="badge badge-neutral">{n.category}</span>
                      {n.impact === 'high' && (
                        <span className="badge badge-red"><AlertTriangle size={10} /> 고영향</span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.time}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 8, wordBreak: 'keep-all' }}>
                    {n.headline}
                  </div>
                  {n.translatedHeadline && (
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: '#475569', lineHeight: 1.4, marginTop: -4, marginBottom: 10, wordBreak: 'keep-all' }}>
                      {n.translatedHeadline}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="badge badge-blue" style={{ fontWeight: 700 }}>{n.ticker}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>출처: {n.source}</span>
                    </div>
                    <ExternalLink size={13} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column (Earnings & Macro Events) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Earning Calendar */}
          <div className="card" style={{ padding: '16px' }}>
            <div className="card-header" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title" style={{ fontSize: 13, fontWeight: 800 }}>어닝 캘린더</div>
              <Calendar size={14} color="var(--text-muted)" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {loading ? (
                [1, 2, 3, 4, 5, 6].map(i => <EarningSkeleton key={i} />)
              ) : earnings.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
                  실시간 실적 예측 정보가 없습니다.
                </div>
              ) : (
                earnings.map((e) => (
                  <div
                    key={e.ticker}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 0',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        flexShrink: 0,
                        background: 'var(--bg-elevated)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 800,
                        color: 'var(--accent-blue)',
                      }}
                    >
                      {e.ticker}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{e.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                        {new Date(e.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        &nbsp;· EPS 예상 ${e.eps_est.toFixed(2)}
                      </div>
                    </div>
                    {e.surprise_pct !== null && (
                      <span className={`badge ${e.surprise_pct > 0 ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 10, fontWeight: 700 }}>
                        서프 {e.surprise_pct > 0 ? '+' : ''}{e.surprise_pct.toFixed(1)}%
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Macro Calendar */}
          <div className="card" style={{ padding: '16px' }}>
            <div className="card-header" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title" style={{ fontSize: 13, fontWeight: 800 }}>매크로 이벤트</div>
              <span className="badge badge-red" style={{ display: 'flex', alignItems: 'center', gap: 3 }}><AlertTriangle size={10} /> 고위험</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {loading ? (
                [1, 2, 3, 4, 5].map(i => <MacroSkeleton key={i} />)
              ) : macroEventsList.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
                  예정된 매크로 지표 이벤트가 없습니다.
                </div>
              ) : (
                macroEventsList.map((ev, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 10,
                      padding: '8px 0',
                      borderBottom: i < macroEventsList.length - 1 ? '1px solid var(--border-subtle)' : undefined,
                    }}
                  >
                    <div
                      style={{
                        flexShrink: 0,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        marginTop: 6,
                        background:
                          ev.importance === 'high'
                            ? 'var(--negative)'
                            : ev.importance === 'medium'
                            ? 'var(--accent-gold)'
                            : 'var(--neutral)',
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{ev.event}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span>{new Date(ev.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                        {ev.forecast !== '-' && (
                          <>
                            <span>·</span>
                            <span>예상 {ev.forecast}</span>
                          </>
                        )}
                        {ev.previous !== '-' && (
                          <>
                            <span>·</span>
                            <span>이전 {ev.previous}</span>
                          </>
                        )}
                        {ev.actual && (
                          <>
                            <span>·</span>
                            <span style={{ 
                              color: ev.actual.includes('상회') || ev.actual.includes('서프') || ev.actual.includes('완화') 
                                ? 'var(--positive)' 
                                : ev.actual.includes('하회') || ev.actual.includes('부진') || ev.actual.includes('매파') 
                                ? 'var(--negative)' 
                                : 'var(--text-secondary)',
                              fontWeight: 700 
                            }}>
                              실제 {ev.actual}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* News Detail Modal */}
      <NewsDetailModal
        news={selectedNews}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
