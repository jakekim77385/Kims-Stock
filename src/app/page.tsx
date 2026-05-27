'use client';
import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown, AlertTriangle, Calendar, ArrowUpRight, ArrowDownRight, Info, RefreshCw
} from 'lucide-react';
import { sectorData, macroEvents } from '@/lib/mockData';
import { useMarket, useQuotes, useHistory, useComparison, type StockQuote, type MarketIndex, type AssetRow } from '@/lib/hooks';
import { formatPercent, formatMarketCap } from '@/lib/utils';
import dynamic from 'next/dynamic';
const SectorAnalysis = dynamic(() => import('@/components/SectorAnalysis'), { ssr: false });

// ─── 기본 종목 목록 ─────────────────────────────────────────────────────────
const UNIVERSE = ['AAPL','MSFT','GOOGL','NVDA','META','BRK-B','JNJ','V','AMZN','TSLA','JPM','KO','COST','UNH','ABBV'];

// ─── Fear & Greed Gauge ──────────────────────────────────────────────────────
function FearGreedGauge({ value }: { value: number }) {
  const label =
    value <= 25 ? '극단적 공포' :
    value <= 45 ? '공포' :
    value <= 55 ? '중립' :
    value <= 75 ? '탐욕' : '극단적 탐욕';
  const color =
    value <= 25 ? 'var(--negative)' :
    value <= 45 ? '#c9762a' :
    value <= 55 ? '#c9913a' :
    value <= 75 ? '#6ab04c' : 'var(--positive)';

  const angle = (value / 100) * 180 - 90;
  const r = 58; const cx = 80; const cy = 78;

  const polarToCartesian = (angleDeg: number, radius: number) => {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const makeArc = (startAngle: number, endAngle: number, arcR: number, arcColor: string) => {
    const s = polarToCartesian(startAngle, arcR);
    const e = polarToCartesian(endAngle, arcR);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return (
      <path
        d={`M ${s.x} ${s.y} A ${arcR} ${arcR} 0 ${large} 1 ${e.x} ${e.y}`}
        fill="none" stroke={arcColor} strokeWidth={7} strokeLinecap="round"
      />
    );
  };

  const needle = polarToCartesian(angle, r - 10);

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={160} height={95} viewBox="0 0 160 95">
        {makeArc(-90, -54, r, '#c04040')}
        {makeArc(-54, -18, r, '#c9762a')}
        {makeArc(-18, 18, r, '#c9913a')}
        {makeArc(18, 54, r, '#6ab04c')}
        {makeArc(54, 90, r, '#3dbb77')}
        <line x1={cx} y1={cy} x2={needle.x} y2={needle.y}
          stroke="var(--text-primary)" strokeWidth={1.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={3} fill="var(--text-primary)" />
      </svg>
      <div style={{ fontSize: 24, fontWeight: 600, color, marginTop: -12, fontFamily: 'JetBrains Mono' }}>{value}</div>
      <div style={{ fontSize: 12, color, marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ─── Chart Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white', border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)', padding: '7px 11px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 600, fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text-primary)' }}>
        {payload[0].value.toLocaleString()}
      </div>
    </div>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 20 }: { w?: string | number; h?: number }) {
  return <div className="skeleton" style={{ width: w, height: h }} />;
}

// ─── 자산 값 포맷 ────────────────────────────────────────────────────────────
function fmtValue(v: number, unit: string) {
  if (v === 0) return '—';
  if (unit === '%') return `${v.toFixed(3)}%`;
  if (v >= 10000) return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (v >= 100)   return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return v.toFixed(4);
}

// ─── 전체 비교표 ─────────────────────────────────────────────────────────────
const CATEGORY_ORDER = ['미국 주식', '글로벌', '채권/금리', '원자재', '달러/환율'];
const CATEGORY_COLOR: Record<string, string> = {
  '미국 주식': '#1a56db',
  '글로벌':    '#0891b2',
  '채권/금리': '#d97706',
  '원자재':    '#16803c',
  '달러/환율': '#7c3aed',
};

function MarketComparisonTable({ rows, loading }: { rows: AssetRow[] | null; loading: boolean }) {
  const grouped: Record<string, AssetRow[]> = {};
  (rows ?? []).forEach((r) => {
    if (!grouped[r.category]) grouped[r.category] = [];
    grouped[r.category].push(r);
  });

  if (loading && !rows) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">글로벌 시장 비교표</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Array(8).fill(0).map((_, i) => <Skeleton key={i} h={28} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'transparent', border: 'none', boxShadow: 'none' }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)',
        background: 'white', borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
        border: '1px solid var(--border-default)',
        flexWrap: 'wrap', gap: 10
      }}>
        <div>
          <div className="card-title" style={{ fontSize: 14, fontWeight: 700 }}>글로벌 시장 실시간 동향</div>
          <div className="card-subtitle">주식 · 글로벌 · 채권/금리 · 원자재 · 달러 주요 자산군 비교 대시보드</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {CATEGORY_ORDER.map((cat) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: CATEGORY_COLOR[cat] }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{cat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 테이블 그리드 (반응형 랩핑 적용) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', 
        gap: 12,
        marginTop: 12
      }}>
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped[cat] ?? [];
          const color = CATEGORY_COLOR[cat];
          return (
            <div key={cat} style={{ 
              background: 'white',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* 카테고리 헤더 */}
              <div style={{
                padding: '10px 14px',
                background: 'rgba(250, 250, 250, 0.8)',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <div style={{ width: 3, height: 14, borderRadius: 2, background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, fontWeight: 800, color }}>{cat}</span>
              </div>

              {/* 컬럼 헤더 */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr',
                padding: '6px 14px',
                background: '#fafafa',
                borderBottom: '1px solid var(--border-subtle)',
              }}>
                {['자산', '현재값', '등락률'].map((h) => (
                  <div key={h} style={{
                    fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.06em', color: 'var(--text-muted)',
                    textAlign: h === '자산' ? 'left' : 'right',
                  }}>{h}</div>
                ))}
              </div>

              {/* 행 데이터 */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                {items.map((row, rIdx) => {
                  const up = row.changePct >= 0;
                  const range = row.high52w - row.low52w;
                  const pos = range > 0 ? ((row.value - row.low52w) / range) * 100 : 50;
                  return (
                    <div key={row.ticker} style={{
                      display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr',
                      alignItems: 'center', gap: 6,
                      padding: '10px 14px',
                      borderBottom: rIdx < items.length - 1 ? '1px solid var(--border-subtle)' : undefined,
                      transition: 'background 0.15s ease',
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* 이름 + 52주 영롱한 글로우 닷 게이지 */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {row.name}
                          </span>
                          <span style={{ fontSize: 8.5, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', fontWeight: 500 }}>
                            {row.ticker}
                          </span>
                        </div>
                        {row.high52w > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            <span style={{ fontSize: 7.5, color: 'var(--text-muted)', width: 14, fontFamily: 'JetBrains Mono' }}>
                              {row.low52w >= 100 ? row.low52w.toFixed(0) : row.low52w.toFixed(2)}
                            </span>
                            <div style={{ 
                              flex: 1, height: 4, 
                              background: '#f3f4f6', 
                              border: '1px solid #e5e7eb',
                              borderRadius: 4, position: 'relative' 
                            }}>
                              {/* 52주 영롱한 글로우 마커 원(Glow Marker Dot) */}
                              <div style={{
                                position: 'absolute',
                                left: `${Math.max(0, Math.min(pos, 100))}%`,
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: 7, height: 7, borderRadius: '50%',
                                background: color,
                                boxShadow: `0 0 5px ${color}, 0 0 10px ${color}`,
                                zIndex: 2,
                                transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                              }} />
                            </div>
                            <span style={{ fontSize: 7.5, color: 'var(--text-muted)', width: 14, textAlign: 'right', fontFamily: 'JetBrains Mono' }}>
                              {row.high52w >= 100 ? row.high52w.toFixed(0) : row.high52w.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 현재값 */}
                      <div style={{
                        fontFamily: 'JetBrains Mono', fontSize: 11.5, fontWeight: 700,
                        color: 'var(--text-primary)', textAlign: 'right',
                      }}>
                        {fmtValue(row.value, row.unit)}
                      </div>

                      {/* 등락률 */}
                      <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, minWidth: 50,
                      }}>
                        <div style={{
                          fontSize: 11, fontWeight: 800, fontFamily: 'JetBrains Mono',
                          color: up ? 'var(--positive)' : 'var(--negative)',
                        }}>
                          {up ? '+' : ''}{row.changePct.toFixed(2)}%
                        </div>
                        <div style={{
                          fontSize: 8.5, color: up ? 'var(--positive)' : 'var(--negative)',
                          fontFamily: 'JetBrains Mono', opacity: 0.8
                        }}>
                          {up ? '+' : ''}{row.change >= 100
                            ? row.change.toFixed(1)
                            : row.change.toFixed(3)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}



// ─── Dashboard ───────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'1mo' | '3mo' | '6mo' | '1y'>('6mo');

  const { data: market, loading: mLoading, refresh: refreshMarket } = useMarket(60_000);
  const { data: quotes, loading: qLoading } = useQuotes(UNIVERSE, 120_000);
  const { data: historyBars, loading: hLoading } = useHistory('SPY', selectedPeriod);
  const { data: comparison, loading: cLoading } = useComparison(60_000);

  // 파생 데이터
  const spxIndex: MarketIndex | undefined = market?.indices.find((i) => i.ticker === 'SPX');
  const vixIndex:  MarketIndex | undefined = market?.indices.find((i) => i.ticker === 'VIX');

  const topMovers: StockQuote[] = quotes
    ? [...quotes].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)).slice(0, 6)
    : [];

  const topScores: StockQuote[] = quotes
    ? [...quotes].sort((a, b) => (b.pe === null ? 999 : b.pe) > (a.pe === null ? 999 : a.pe) ? -1 : 1).slice(0, 5)
    : [];

  const updatedAt = market?.updatedAt
    ? new Date(market.updatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ② 글로벌 비교표 */}
      <MarketComparisonTable rows={comparison?.rows ?? null} loading={cLoading} />

      {/* ③ 페이지 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>시장 현황</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            실시간 미국 주식 시장 &nbsp;·&nbsp;
            {updatedAt ? `최종 갱신: ${updatedAt}` : '로딩 중...'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {mLoading && <RefreshCw size={13} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />}
          <button className="btn btn-ghost btn-sm" onClick={refreshMarket}>새로고침</button>
          <div className="status-live">LIVE</div>
        </div>
      </div>

      {/* 지수 카드 */}
      <div className="grid-6">
        {mLoading && !market
          ? Array(6).fill(0).map((_, i) => (
              <div key={i} className="metric-card">
                <Skeleton h={10} w="60%" /><br />
                <Skeleton h={22} w="80%" /><br />
                <Skeleton h={10} w="40%" />
              </div>
            ))
          : (market?.indices ?? []).map((idx, i) => (
              <div
                key={idx.ticker}
                className="metric-card card-hover"
                style={{ cursor: 'pointer', borderColor: i === 0 ? 'var(--border-default)' : undefined }}
              >
                <div className="metric-label">{idx.name}</div>
                <div className="metric-value" style={{ fontSize: 18 }}>
                  {idx.ticker === 'TNX'
                    ? `${idx.value.toFixed(2)}%`
                    : idx.value >= 1000
                      ? idx.value.toLocaleString(undefined, { maximumFractionDigits: 0 })
                      : idx.value.toFixed(2)}
                </div>
                <div className={`metric-change ${idx.changePct >= 0 ? 'metric-positive' : 'metric-negative'}`}>
                  {idx.changePct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {formatPercent(idx.changePct)}
                  <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 400, marginLeft: 4 }}>
                    {idx.changePct >= 0 ? '+' : ''}{idx.change.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
      </div>

      {/* 차트 + 패널 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 12 }}>
        {/* S&P 500 차트 (SPY 사용) */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                {spxIndex
                  ? `S&P 500 — ${spxIndex.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                  : 'S&P 500'}
              </div>
              <div className="card-subtitle">
                SPY ETF 기반 실시간 히스토리
                {spxIndex && (
                  <span style={{ color: spxIndex.changePct >= 0 ? 'var(--positive)' : 'var(--negative)', marginLeft: 6, fontWeight: 500 }}>
                    {formatPercent(spxIndex.changePct)} 오늘
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['1mo','3mo','6mo','1y'] as const).map((p) => (
                <button key={p}
                  className={`btn btn-sm ${selectedPeriod === p ? 'btn-secondary' : 'btn-ghost'}`}
                  onClick={() => setSelectedPeriod(p)}
                >{p}</button>
              ))}
            </div>
          </div>
          {hLoading && !historyBars
            ? <Skeleton h={220} />
            : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={historyBars ?? []} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="spxGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4d7ef7" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#4d7ef7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date"
                    tickFormatter={(d) => new Date(d).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                    interval={Math.floor((historyBars?.length ?? 30) / 6)}
                  />
                  <YAxis dataKey="close" domain={['auto','auto']} tickFormatter={(v) => v.toFixed(0)} width={48} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="close" stroke="#4d7ef7" strokeWidth={1.5} fill="url(#spxGrad)" dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
        </div>

        {/* 공포탐욕 + VIX */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <div className="card-title">공포탐욕지수</div>
              <Info size={12} color="var(--text-muted)" />
            </div>
            <FearGreedGauge value={54} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
              <span>전일: <strong style={{ color: 'var(--text-secondary)' }}>50</strong></span>
              <span>1주 전: <strong style={{ color: 'var(--text-secondary)' }}>38</strong></span>
              <span>1달 전: <strong style={{ color: 'var(--text-secondary)' }}>24</strong></span>
            </div>
          </div>

          {/* 버핏 지수 (장기 밸류에이션) */}
          <div className="card">
            <div className="metric-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>버핏 지수 (Buffett Indicator)</span>
              <span className="badge badge-red" style={{ fontSize: 9, padding: '2px 6px' }}>장기 밸류에이션</span>
            </div>
            {spxIndex ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
                  <span style={{ fontSize: 22, fontWeight: 600, fontFamily: 'JetBrains Mono', color: 'var(--negative)' }}>
                    {((spxIndex.value / 5300) * 195.2).toFixed(1)}%
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 500,
                    color: spxIndex.changePct >= 0 ? 'var(--negative)' : 'var(--positive)',
                    display: 'flex', alignItems: 'center', gap: 2,
                  }}>
                    {spxIndex.changePct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {formatPercent(spxIndex.changePct)}
                  </span>
                </div>
                {/* 밸류에이션 게이지 바 */}
                <div style={{ marginTop: 8, height: 6, background: '#e8e8e8', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, height: '100%',
                    width: `${Math.min((((spxIndex.value / 5300) * 195.2) / 300) * 100, 100)}%`,
                    background: 'linear-gradient(90deg, #3dbb77 30%, #c9913a 65%, var(--negative) 100%)',
                    borderRadius: 3
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
                  <span>저평가 (75%)</span>
                  <span>적정 (100%)</span>
                  <span>과열 (135%+)</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--negative)', fontWeight: 600, marginTop: 6 }}>
                  🚨 극단적 고평가 (평균 대비 +60% 상회)
                </div>
              </>
            ) : <Skeleton h={28} />}
          </div>

          <div className="card">
            <div className="metric-label">VIX 변동성 지수</div>
            {vixIndex ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
                  <span style={{ fontSize: 22, fontWeight: 600, fontFamily: 'JetBrains Mono' }}>
                    {vixIndex.value.toFixed(2)}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 500,
                    color: vixIndex.changePct >= 0 ? 'var(--negative)' : 'var(--positive)',
                    display: 'flex', alignItems: 'center', gap: 2,
                  }}>
                    {vixIndex.changePct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {formatPercent(vixIndex.changePct)}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                  {vixIndex.value >= 30 ? '높음 — 시장 불안 신호' : vixIndex.value >= 20 ? '보통 — 주의 필요' : '낮음 — 시장 안정'}
                </div>
              </>
            ) : <Skeleton h={28} />}
          </div>
        </div>
      </div>


      {/* 섹터 분석 (실시간) */}
      <SectorAnalysis />

      {/* 하단 3열 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {/* 급등락 종목 */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">급등락 종목</div>
            <span className="badge badge-blue">실시간</span>
          </div>
          {qLoading && !quotes
            ? Array(5).fill(0).map((_, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <Skeleton h={12} /><br /><Skeleton h={10} w="60%" />
                </div>
              ))
            : topMovers.map((s) => (
                <div key={s.ticker} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 0', borderBottom: '1px solid var(--border-subtle)',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 6,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 600, fontSize: 9, color: 'var(--accent)', flexShrink: 0,
                  }}>{s.ticker.replace('-','.')}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{s.ticker.replace('-','.')}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontFamily: 'JetBrains Mono', fontSize: 12 }}>
                      ${s.price.toFixed(2)}
                    </div>
                    <div className={`badge ${s.changePct >= 0 ? 'badge-green' : 'badge-red'}`}>
                      {s.changePct >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                      {formatPercent(s.changePct)}
                    </div>
                  </div>
                </div>
              ))}
        </div>

        {/* 시가총액 상위 */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">시가총액 Top 5</div>
            <span className="badge badge-neutral">실시간</span>
          </div>
          {qLoading && !quotes
            ? Array(5).fill(0).map((_, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <Skeleton h={12} /><br /><Skeleton h={10} w="60%" />
                </div>
              ))
            : [...(quotes ?? [])].sort((a, b) => b.marketCap - a.marketCap).slice(0, 5).map((s, i) => (
                <div key={s.ticker} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--border-subtle)' : undefined,
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 4,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontWeight: 600, fontSize: 12 }}>{s.ticker.replace('-','.')}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.name.split(' ')[0]}</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      시총 {formatMarketCap(s.marketCap / 1_000_000)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontFamily: 'JetBrains Mono', fontSize: 12 }}>${s.price.toFixed(2)}</div>
                    <div style={{ fontSize: 10, color: s.changePct >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                      {formatPercent(s.changePct)}
                    </div>
                  </div>
                </div>
              ))}
        </div>

        {/* 매크로 캘린더 */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">매크로 캘린더</div>
            <Calendar size={13} color="var(--text-muted)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {macroEvents.slice(0, 6).map((ev, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '6px 0', borderBottom: i < 5 ? '1px solid var(--border-subtle)' : undefined,
              }}>
                <div style={{
                  flexShrink: 0, marginTop: 3,
                  width: 6, height: 6, borderRadius: '50%',
                  background: ev.importance === 'high' ? 'var(--negative)' :
                    ev.importance === 'medium' ? 'var(--warning)' : 'var(--text-muted)',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)' }}>{ev.event}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                    {new Date(ev.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    &nbsp;· 예상 {ev.forecast}
                  </div>
                </div>
                {ev.importance === 'high' && (
                  <AlertTriangle size={11} color="var(--negative)" style={{ flexShrink: 0, marginTop: 2 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
