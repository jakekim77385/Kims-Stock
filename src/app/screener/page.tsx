'use client';
import { useState, useMemo } from 'react';
import { Filter, SortAsc, SortDesc, ChevronRight, RefreshCw } from 'lucide-react';
import { stockUniverse, Stock } from '@/lib/mockData';
import { useQuotes } from '@/lib/hooks';
import { formatPercent, formatMarketCap, getChangeBg } from '@/lib/utils';
import Link from 'next/link';

// ─── Filter Config ─────────────────────────────────────────────────────────
interface FilterConfig {
  // Valuation
  peMax: number; peMin: number;
  pbMax: number;
  pegMax: number;
  // Quality
  roeMin: number;
  operatingMarginMin: number;
  // Growth
  epsGrowthMin: number;
  revenueGrowthMin: number;
  // Safety
  debtToEquityMax: number;
  currentRatioMin: number;
  // Momentum
  rsiMin: number; rsiMax: number;
  rs52wMin: number;
  priceVs52wHighMax: number;
  // Dividend
  dividendYieldMin: number;
  // Sector
  sector: string;
  // Score
  overallScoreMin: number;
}

const defaultFilters: FilterConfig = {
  peMin: 0, peMax: 100,
  pbMax: 50,
  pegMax: 5,
  roeMin: 0,
  operatingMarginMin: 0,
  epsGrowthMin: -100,
  revenueGrowthMin: -100,
  debtToEquityMax: 500,
  currentRatioMin: 0,
  rsiMin: 0, rsiMax: 100,
  rs52wMin: 0,
  priceVs52wHighMax: 0,
  dividendYieldMin: 0,
  sector: 'all',
  overallScoreMin: 0,
};

// ─── Strategy Presets ──────────────────────────────────────────────────────
const presets: { label: string; desc: string; color: string; filters: Partial<FilterConfig> }[] = [
  {
    label: '가치투자',
    desc: '저PER + 고ROE + 안정적 FCF',
    color: '#3b82f6',
    filters: { peMax: 25, roeMin: 15, debtToEquityMax: 100, overallScoreMin: 60 },
  },
  {
    label: 'CANSLIM',
    desc: '고성장 + 모멘텀 + 신고가',
    color: '#10b981',
    filters: { epsGrowthMin: 25, rs52wMin: 80, rsiMin: 50, rsiMax: 75 },
  },
  {
    label: '마법공식',
    desc: 'EY + ROIC 고랭킹 종목',
    color: '#f59e0b',
    filters: { peMax: 20, roeMin: 20, overallScoreMin: 65 },
  },
  {
    label: '배당성장',
    desc: '고배당 + 배당성장 안정성',
    color: '#8b5cf6',
    filters: { dividendYieldMin: 1.5, debtToEquityMax: 200, roeMin: 10 },
  },
  {
    label: '모멘텀',
    desc: '52주 신고가 근접 + 강한 RS',
    color: '#ef4444',
    filters: { rs52wMin: 85, rsiMin: 55, rsiMax: 70, priceVs52wHighMax: -10 },
  },
  {
    label: '고품질 성장',
    desc: '영업이익률 + EPS 복합 성장',
    color: '#06b6d4',
    filters: { operatingMarginMin: 20, epsGrowthMin: 15, roeMin: 20, overallScoreMin: 70 },
  },
];

// ─── Slider Component ──────────────────────────────────────────────────────
function RangeFilter({ label, min, max, value, onChange, step = 1, suffix = '' }: {
  label: string; min: number; max: number;
  value: number; onChange: (v: number) => void;
  step?: number; suffix?: string;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <label className="form-label" style={{ marginBottom: 0 }}>{label}</label>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)', fontFamily: 'JetBrains Mono' }}>
          {value === max && suffix === 'max' ? '∞' : `${value}${suffix}`}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
      />
    </div>
  );
}

export default function ScreenerPage() {
  const [filters, setFilters] = useState<FilterConfig>(defaultFilters);
  const [sortKey, setSortKey] = useState<keyof Stock>('overallScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // 실시간 시세 overlay
  const tickers = stockUniverse.map((s) => s.ticker.replace('.','-'));
  const { data: liveQuotes, loading: liveLoading, refresh } = useQuotes(tickers, 120_000);

  const enrichedUniverse = useMemo(() => {
    if (!liveQuotes) return stockUniverse;
    return stockUniverse.map((s) => {
      const live = liveQuotes.find(
        (q) => q.ticker === s.ticker || q.ticker === s.ticker.replace('.','-')
      );
      if (!live) return s;
      return {
        ...s,
        price:     live.price || s.price,
        change:    live.change || s.change,
        changePct: live.changePct || s.changePct,
        marketCap: live.marketCap ? live.marketCap / 1_000_000 : s.marketCap,
        volume:    live.volume || s.volume,
        high52w:   live.high52w || s.high52w,
        low52w:    live.low52w  || s.low52w,
      };
    });
  }, [liveQuotes]);

  const updateFilter = <K extends keyof FilterConfig>(key: K, value: FilterConfig[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset: typeof presets[0]) => {
    if (activePreset === preset.label) {
      setFilters(defaultFilters);
      setActivePreset(null);
    } else {
      setFilters({ ...defaultFilters, ...preset.filters });
      setActivePreset(preset.label);
    }
  };

  const handleSort = (key: keyof Stock) => {
    if (sortKey === key) setDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  // Fix: use setSortDir
  const setDir = setSortDir;

  const filtered = useMemo(() => {
    let stocks = enrichedUniverse.filter((s) => {
      if (s.pe < filters.peMin || s.pe > filters.peMax) return false;
      if (s.pb > filters.pbMax) return false;
      if (s.peg > filters.pegMax) return false;
      if (s.roe < filters.roeMin) return false;
      if (s.operatingMargin < filters.operatingMarginMin) return false;
      if (s.epsGrowthYoy < filters.epsGrowthMin) return false;
      if (s.revenueGrowthYoy < filters.revenueGrowthMin) return false;
      if (s.debtToEquity > filters.debtToEquityMax) return false;
      if (s.currentRatio < filters.currentRatioMin) return false;
      if (s.rsi14 < filters.rsiMin || s.rsi14 > filters.rsiMax) return false;
      if (s.rs52w < filters.rs52wMin) return false;
      if (filters.priceVs52wHighMax < 0 && s.priceVs52wHigh < filters.priceVs52wHighMax) return false;
      if (s.dividendYield < filters.dividendYieldMin) return false;
      if (filters.sector !== 'all' && s.sector !== filters.sector) return false;
      if (s.overallScore < filters.overallScoreMin) return false;
      return true;
    });

    stocks.sort((a, b) => {
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return stocks;
  }, [filters, sortKey, sortDir, enrichedUniverse]);

  const sectors = ['all', ...Array.from(new Set(stockUniverse.map((s) => s.sector)))];

  const SortIcon = ({ col }: { col: keyof Stock }) =>
    sortKey === col
      ? (sortDir === 'desc' ? <SortDesc size={12} color="var(--accent-blue)" /> : <SortAsc size={12} color="var(--accent-blue)" />)
      : <SortAsc size={12} color="var(--text-muted)" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>종목 스크리너</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            퀀트 기반 멀티팩터 필터링 — 가치 · 성장 · 모멘텀 · 배당 통합
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {liveLoading && <RefreshCw size={12} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />}
          {!liveLoading && liveQuotes && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>실시간 시세</span>}
          <span className="badge badge-blue">{filtered.length}개 종목</span>
          <button className="btn btn-ghost btn-sm" onClick={refresh}><RefreshCw size={12} /></button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilters(defaultFilters); setActivePreset(null); }}>초기화</button>
        </div>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      {/* Strategy Presets */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          투자 전략 빠른 선택
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              style={{
                background: activePreset === p.label
                  ? `${p.color}22`
                  : 'var(--bg-card)',
                border: `1px solid ${activePreset === p.label ? p.color : 'var(--border-subtle)'}`,
                borderRadius: 10,
                padding: '10px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: activePreset === p.label ? p.color : 'var(--text-primary)' }}>
                {p.label}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Filter Panel */}
        <div className="card" style={{ position: 'sticky', top: 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Filter size={15} color="var(--accent-blue)" />
            <span className="card-title">필터 설정</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Sector */}
            <div>
              <label className="form-label">섹터</label>
              <select className="select" style={{ width: '100%' }}
                value={filters.sector} onChange={(e) => updateFilter('sector', e.target.value)}>
                {sectors.map((s) => (
                  <option key={s} value={s}>{s === 'all' ? '전체 섹터' : s}</option>
                ))}
              </select>
            </div>

            <div className="divider" style={{ margin: '0' }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              밸류에이션
            </div>

            <RangeFilter label="PER 최대" min={0} max={100} value={filters.peMax}
              onChange={(v) => updateFilter('peMax', v)} suffix="x" />
            <RangeFilter label="PBR 최대" min={0} max={50} value={filters.pbMax}
              onChange={(v) => updateFilter('pbMax', v)} suffix="x" />
            <RangeFilter label="PEG 최대" min={0} max={5} step={0.1} value={filters.pegMax}
              onChange={(v) => updateFilter('pegMax', v)} suffix="x" />

            <div className="divider" style={{ margin: '0' }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              수익성 / 품질
            </div>

            <RangeFilter label="ROE 최소" min={0} max={100} value={filters.roeMin}
              onChange={(v) => updateFilter('roeMin', v)} suffix="%" />
            <RangeFilter label="영업이익률 최소" min={0} max={80} value={filters.operatingMarginMin}
              onChange={(v) => updateFilter('operatingMarginMin', v)} suffix="%" />

            <div className="divider" style={{ margin: '0' }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              성장성
            </div>

            <RangeFilter label="EPS 성장률 최소" min={-100} max={200} value={filters.epsGrowthMin}
              onChange={(v) => updateFilter('epsGrowthMin', v)} suffix="%" />
            <RangeFilter label="매출 성장률 최소" min={-50} max={100} value={filters.revenueGrowthMin}
              onChange={(v) => updateFilter('revenueGrowthMin', v)} suffix="%" />

            <div className="divider" style={{ margin: '0' }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              기술적 지표
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>RSI 범위</label>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)', fontFamily: 'JetBrains Mono' }}>
                  {filters.rsiMin}~{filters.rsiMax}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="range" min={0} max={100} value={filters.rsiMin}
                  onChange={(e) => updateFilter('rsiMin', Number(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--accent-blue)' }} />
                <input type="range" min={0} max={100} value={filters.rsiMax}
                  onChange={(e) => updateFilter('rsiMax', Number(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--accent-blue)' }} />
              </div>
            </div>

            <RangeFilter label="RS Rating 최소 (52주)" min={0} max={100} value={filters.rs52wMin}
              onChange={(v) => updateFilter('rs52wMin', v)} suffix="" />

            <div className="divider" style={{ margin: '0' }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              재무 안정성
            </div>

            <RangeFilter label="부채비율 최대" min={0} max={500} value={filters.debtToEquityMax}
              onChange={(v) => updateFilter('debtToEquityMax', v)} suffix="%" />
            <RangeFilter label="배당수익률 최소" min={0} max={10} step={0.5} value={filters.dividendYieldMin}
              onChange={(v) => updateFilter('dividendYieldMin', v)} suffix="%" />

            <div className="divider" style={{ margin: '0' }} />
            <RangeFilter label="Alpha Score 최소" min={0} max={100} value={filters.overallScoreMin}
              onChange={(v) => updateFilter('overallScoreMin', v)} suffix="" />
          </div>
        </div>

        {/* Results Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="card-title">스크리닝 결과</span>
            <span className="badge badge-blue">{filtered.length}개</span>
            {activePreset && <span className="badge badge-gold">{activePreset} 전략</span>}
          </div>
          <div className="scroll-container">
            <table className="data-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th onClick={() => handleSort('ticker')} style={{ paddingLeft: 20 }}>종목 <SortIcon col="ticker" /></th>
                  <th>섹터</th>
                  <th onClick={() => handleSort('price')}>현재가 <SortIcon col="price" /></th>
                  <th onClick={() => handleSort('changePct')}>등락률 <SortIcon col="changePct" /></th>
                  <th onClick={() => handleSort('marketCap')}>시총 <SortIcon col="marketCap" /></th>
                  <th onClick={() => handleSort('pe')}>PER <SortIcon col="pe" /></th>
                  <th onClick={() => handleSort('roe')}>ROE <SortIcon col="roe" /></th>
                  <th onClick={() => handleSort('epsGrowthYoy')}>EPS성장 <SortIcon col="epsGrowthYoy" /></th>
                  <th onClick={() => handleSort('rsi14')}>RSI <SortIcon col="rsi14" /></th>
                  <th onClick={() => handleSort('rs52w')}>RS <SortIcon col="rs52w" /></th>
                  <th onClick={() => handleSort('dividendYield')}>배당 <SortIcon col="dividendYield" /></th>
                  <th onClick={() => handleSort('overallScore')}>Alpha Score <SortIcon col="overallScore" /></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={13} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    필터 조건에 맞는 종목이 없습니다. 필터를 완화해 보세요.
                  </td></tr>
                ) : filtered.map((s) => (
                  <tr key={s.ticker}>
                    <td style={{ paddingLeft: 20 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--accent)' }}>{s.ticker}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                      </div>
                    </td>
                    <td><span className="tag">{s.sector}</span></td>
                    <td style={{ fontWeight: 700, fontFamily: 'JetBrains Mono' }}>${s.price.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${s.changePct >= 0 ? 'badge-green' : 'badge-red'}`}>
                        {formatPercent(s.changePct)}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{formatMarketCap(s.marketCap)}</td>
                    <td style={{ fontFamily: 'JetBrains Mono' }}>{s.pe.toFixed(1)}x</td>
                    <td style={{ color: s.roe >= 15 ? 'var(--positive)' : 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>
                      {s.roe.toFixed(1)}%
                    </td>
                    <td style={{ color: s.epsGrowthYoy >= 20 ? 'var(--positive)' : s.epsGrowthYoy < 0 ? 'var(--negative)' : 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>
                      {formatPercent(s.epsGrowthYoy)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="score-bar" style={{ width: 40 }}>
                          <div className="score-bar-fill" style={{
                            width: `${s.rsi14}%`,
                            background: s.rsi14 >= 70 ? '#ef4444' : s.rsi14 <= 30 ? '#10b981' : '#3b82f6',
                          }} />
                        </div>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{s.rsi14.toFixed(0)}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div className="score-bar" style={{ width: 32 }}>
                          <div className="score-bar-fill" style={{ width: `${s.rs52w}%`, background: s.rs52w >= 80 ? '#10b981' : '#3b82f6' }} />
                        </div>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{s.rs52w}</span>
                      </div>
                    </td>
                    <td style={{ color: s.dividendYield >= 2 ? 'var(--accent-purple)' : 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>
                      {s.dividendYield > 0 ? `${s.dividendYield.toFixed(2)}%` : '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: `conic-gradient(${s.overallScore >= 80 ? '#10b981' : s.overallScore >= 60 ? '#f59e0b' : '#ef4444'} ${s.overallScore * 3.6}deg, var(--bg-elevated) 0deg)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 800,
                          color: s.overallScore >= 80 ? '#10b981' : s.overallScore >= 60 ? '#f59e0b' : '#ef4444',
                        }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 6,
                            background: 'var(--bg-card)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 800,
                          }}>{s.overallScore}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ paddingRight: 16 }}>
                      <Link href={`/analysis?ticker=${s.ticker}`} className="btn btn-ghost btn-sm btn-icon">
                        <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
