'use client';
import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

interface SectorItem {
  symbol: string; name: string; nameKo: string;
  price: number; changePct: number; ytd: number;
  high52w: number; low52w: number; rangePos: number;
  relToSpx: number; cycle: 'early' | 'mid' | 'late' | 'recession';
  cycleLabel: string;
}
interface SectorData {
  sectors: SectorItem[]; spxYtd: number; spxChange: number;
  dominantCycle: string; cycleSignal: string; updatedAt: string;
}

// ─── 상수 ─────────────────────────────────────────────────────────────────────
const CYCLE_STYLE = {
  early:     { label: '경기 회복 초기', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  mid:       { label: '경기 확장 중반', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  late:      { label: '경기 후반 과열', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  recession: { label: '방어 / 침체기',  color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
};

// ─── 등락률 색 ─────────────────────────────────────────────────────────────────
function chgColor(v: number) { return v > 0 ? '#15803d' : v < 0 ? '#b91c1c' : '#6b7280'; }
function fmt1(v: number) { return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`; }
function fmt2(v: number) { return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`; }

// ─── 52주 미니 바 ──────────────────────────────────────────────────────────────
function MiniBar({ pos, changePct }: { pos: number; changePct: number }) {
  const c = pos <= 20 ? '#15803d' : pos <= 40 ? '#22c55e' : pos <= 60 ? '#f59e0b' : pos <= 80 ? '#fb923c' : '#ef4444';
  return (
    <div style={{ position: 'relative', height: 6, background: 'linear-gradient(to right,#dcfce7,#fffbeb,#fef2f2)', borderRadius: 3 }}>
      <div style={{
        position: 'absolute', top: -2, width: 10, height: 10, borderRadius: '50%',
        left: `${pos}%`, transform: 'translateX(-50%)',
        background: c, boxShadow: `0 0 0 2px white, 0 0 0 3px ${c}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {changePct > 0
          ? <TrendingUp size={5} color="white" />
          : <TrendingDown size={5} color="white" />}
      </div>
    </div>
  );
}

// ─── 섹터 카드 ────────────────────────────────────────────────────────────────
function SectorCard({ s, spxYtd, rank }: { s: SectorItem; spxYtd: number; rank: number }) {
  const cs = CYCLE_STYLE[s.cycle];
  const isOutperform = s.ytd > spxYtd;
  const valLabel = s.rangePos <= 20 ? '매우 저평가' : s.rangePos <= 40 ? '저평가' : s.rangePos <= 60 ? '적정' : s.rangePos <= 80 ? '다소 고평가' : '고평가';
  const valColor = s.rangePos <= 20 ? '#15803d' : s.rangePos <= 40 ? '#22c55e' : s.rangePos <= 60 ? '#f59e0b' : s.rangePos <= 80 ? '#fb923c' : '#ef4444';

  return (
    <div style={{
      border: `1px solid ${cs.border}`,
      borderTop: `3px solid ${cs.color}`,
      borderRadius: 8, background: 'white', padding: '12px 14px',
      position: 'relative', overflow: 'hidden',
    }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = 'none')}
    >
      {/* 순위 */}
      <div style={{
        position: 'absolute', top: 8, right: 10,
        fontSize: 9, fontWeight: 800, color: rank <= 3 ? '#f59e0b' : '#e5e7eb',
        fontFamily: 'JetBrains Mono, monospace',
      }}>#{rank}</div>

      {/* 섹터명 */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{s.nameKo}</div>
        <div style={{ fontSize: 9, color: cs.color, fontWeight: 600 }}>{s.symbol}</div>
      </div>

      {/* 가격 + 일간 등락 */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#111' }}>
          ${s.price.toFixed(2)}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: chgColor(s.changePct), fontFamily: 'JetBrains Mono, monospace' }}>
          {fmt2(s.changePct)}
        </span>
      </div>

      {/* 52주 미니바 */}
      <MiniBar pos={s.rangePos} changePct={s.changePct} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#bbb', marginTop: 3, marginBottom: 8 }}>
        <span>52주저점</span>
        <span style={{ color: valColor, fontWeight: 600 }}>{valLabel} {s.rangePos}%</span>
        <span>52주고점</span>
      </div>

      {/* 52주 수익 vs S&P */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 9, color: '#bbb' }}>52주 수익</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: chgColor(s.ytd), fontFamily: 'JetBrains Mono, monospace' }}>
            {fmt1(s.ytd)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: '#bbb' }}>S&P 대비</div>
          <div style={{
            fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
            color: isOutperform ? '#15803d' : '#b91c1c',
            background: isOutperform ? '#f0fdf4' : '#fef2f2',
            padding: '1px 5px', borderRadius: 3,
          }}>
            {isOutperform ? '▲' : '▼'} {fmt1(Math.abs(s.relToSpx))}
          </div>
        </div>
      </div>

      {/* 경기 사이클 태그 */}
      <div style={{
        marginTop: 8, fontSize: 9, fontWeight: 600, color: cs.color,
        background: cs.bg, padding: '2px 6px', borderRadius: 3,
        display: 'inline-block',
      }}>{cs.label}</div>
    </div>
  );
}

// ─── 상대 강도 바 차트 ────────────────────────────────────────────────────────
function RelativeBar({ s, maxAbs }: { s: SectorItem; maxAbs: number }) {
  const pct = maxAbs > 0 ? (s.relToSpx / maxAbs) * 50 : 0;  // -50% ~ +50% of bar width
  const isPos = s.relToSpx >= 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid #f5f5f5' }}>
      <div style={{ width: 60, fontSize: 10, fontWeight: 600, color: '#111', flexShrink: 0 }}>{s.nameKo}</div>
      {/* 바 */}
      <div style={{ flex: 1, position: 'relative', height: 16, background: '#f9fafb', borderRadius: 3 }}>
        {/* 중앙선 */}
        <div style={{ position: 'absolute', left: '50%', top: 0, width: 1, height: '100%', background: '#e5e7eb' }} />
        {/* 바 */}
        <div style={{
          position: 'absolute',
          top: 2, height: 12, borderRadius: 2,
          left: isPos ? '50%' : `${50 + pct}%`,
          width: `${Math.abs(pct)}%`,
          background: isPos ? '#22c55e' : '#ef4444',
          opacity: 0.75,
        }} />
      </div>
      <div style={{
        width: 50, fontSize: 10, fontWeight: 700, textAlign: 'right', flexShrink: 0,
        fontFamily: 'JetBrains Mono, monospace',
        color: isPos ? '#15803d' : '#b91c1c',
      }}>
        {isPos ? '+' : ''}{s.relToSpx.toFixed(1)}%
      </div>
    </div>
  );
}

// ─── 경기 사이클 뷰 ──────────────────────────────────────────────────────────
function CycleView({ sectors, dominantCycle }: { sectors: SectorItem[]; dominantCycle: string }) {
  const order = ['early', 'mid', 'late', 'recession'] as const;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
      {order.map(cycle => {
        const cs = CYCLE_STYLE[cycle];
        const items = sectors.filter(s => s.cycle === cycle).sort((a, b) => b.ytd - a.ytd);
        const isActive = dominantCycle === cycle;
        return (
          <div key={cycle} style={{
            border: `1px solid ${isActive ? cs.color : cs.border}`,
            borderRadius: 8, overflow: 'hidden',
            boxShadow: isActive ? `0 0 0 2px ${cs.color}30` : 'none',
          }}>
            <div style={{
              padding: '8px 12px', background: isActive ? cs.color : cs.bg,
              borderBottom: `1px solid ${cs.border}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: isActive ? 'white' : cs.color }}>
                {isActive ? '▶ ' : ''}{cs.label}
              </div>
              {isActive && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', marginTop: 1 }}>현재 지배적 국면</div>}
            </div>
            <div style={{ padding: '8px 12px' }}>
              {items.map(s => (
                <div key={s.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#111' }}>{s.nameKo}</span>
                  <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: chgColor(s.ytd), fontWeight: 600 }}>
                    {fmt1(s.ytd)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
type ViewMode = 'cards' | 'relative' | 'cycle';

export default function SectorAnalysis() {
  const [data,    setData]    = useState<SectorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view,    setView]    = useState<ViewMode>('cards');
  const [sortBy,  setSortBy]  = useState<'ytd' | 'changePct' | 'rangePos' | 'relToSpx'>('ytd');

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/sectors');
      setData(await r.json());
    } catch { /**/ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sorted = data
    ? [...data.sectors].sort((a, b) => b[sortBy] - a[sortBy])
    : [];

  const maxAbs = data
    ? Math.max(...data.sectors.map(s => Math.abs(s.relToSpx)), 1)
    : 1;

  // 요약 통계
  const upCount   = data?.sectors.filter(s => s.changePct > 0).length ?? 0;
  const downCount = data?.sectors.filter(s => s.changePct < 0).length ?? 0;
  const bestYtd   = data ? [...data.sectors].sort((a, b) => b.ytd - a.ytd)[0] : null;
  const worstYtd  = data ? [...data.sectors].sort((a, b) => a.ytd - b.ytd)[0] : null;

  return (
    <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden', background: 'white' }}>

      {/* ── 헤더 ── */}
      <div style={{ padding: '12px 20px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700 }}>🇺🇸 미국증시 섹터 분석</span>
          <span style={{ fontSize: 10, color: '#999', marginLeft: 8 }}>
            S&P 500 11개 섹터 실시간 비교
            {data?.updatedAt && ` · ${new Date(data.updatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* 뷰 모드 */}
          {(['cards', 'relative', 'cycle'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              fontSize: 10, padding: '3px 9px', borderRadius: 4, cursor: 'pointer',
              fontFamily: 'inherit', border: '1px solid',
              borderColor: view === v ? '#1a56db' : '#e0e0e0',
              background:  view === v ? '#eef2ff' : 'white',
              color:       view === v ? '#1a56db' : '#666',
              fontWeight:  view === v ? 600 : 400,
            }}>
              {v === 'cards' ? '카드' : v === 'relative' ? '상대강도' : '경기사이클'}
            </button>
          ))}
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#999', background: 'none', border: '1px solid #e0e0e0', borderRadius: 4, cursor: 'pointer', padding: '3px 8px', fontFamily: 'inherit' }}>
            <RefreshCw size={10} style={{ animation: loading ? 'spin 1s linear infinite' : undefined }} /> 갱신
          </button>
        </div>
      </div>

      {/* ── 요약 배너 ── */}
      {data && (
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #f0f0f0', overflowX: 'auto' }}>
          {/* S&P 기준 */}
          <div style={{ padding: '10px 18px', borderRight: '1px solid #f0f0f0', minWidth: 0, flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: '#bbb', marginBottom: 2 }}>S&P 500 (기준선)</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: chgColor(data.spxYtd), fontFamily: 'JetBrains Mono, monospace' }}>{fmt1(data.spxYtd)}</span>
              <span style={{ fontSize: 10, color: chgColor(data.spxChange) }}>{fmt2(data.spxChange)} 오늘</span>
            </div>
          </div>
          {/* 상승/하락 */}
          <div style={{ padding: '10px 18px', borderRight: '1px solid #f0f0f0', flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: '#bbb', marginBottom: 2 }}>오늘 등락</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#15803d' }}>▲{upCount}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#b91c1c' }}>▼{downCount}</span>
            </div>
          </div>
          {/* 최고 섹터 */}
          {bestYtd && (
            <div style={{ padding: '10px 18px', borderRight: '1px solid #f0f0f0', flexShrink: 0 }}>
              <div style={{ fontSize: 9, color: '#bbb', marginBottom: 2 }}>52주 최고 섹터</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>{bestYtd.nameKo}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#15803d', fontFamily: 'JetBrains Mono, monospace' }}>{fmt1(bestYtd.ytd)}</span>
              </div>
            </div>
          )}
          {/* 최저 섹터 */}
          {worstYtd && (
            <div style={{ padding: '10px 18px', borderRight: '1px solid #f0f0f0', flexShrink: 0 }}>
              <div style={{ fontSize: 9, color: '#bbb', marginBottom: 2 }}>52주 최저 섹터</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>{worstYtd.nameKo}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#b91c1c', fontFamily: 'JetBrains Mono, monospace' }}>{fmt1(worstYtd.ytd)}</span>
              </div>
            </div>
          )}
          {/* 경기 사이클 신호 */}
          {data.cycleSignal && (
            <div style={{ padding: '10px 18px', flex: 1 }}>
              <div style={{ fontSize: 9, color: '#bbb', marginBottom: 2 }}>경기 사이클 신호</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#111' }}>📍 {data.cycleSignal}</div>
            </div>
          )}
        </div>
      )}

      {/* ── 정렬 옵션 (카드/상대강도 뷰에서만) ── */}
      {view !== 'cycle' && (
        <div style={{ display: 'flex', gap: 6, padding: '8px 20px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: '#bbb', fontWeight: 600 }}>정렬:</span>
          {([['ytd', '52주수익'], ['changePct', '일간등락'], ['rangePos', '52주위치'], ['relToSpx', 'S&P대비']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setSortBy(key)} style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
              border: '1px solid', borderColor: sortBy === key ? '#1a56db' : '#e0e0e0',
              background: sortBy === key ? '#eef2ff' : 'white',
              color: sortBy === key ? '#1a56db' : '#666', fontWeight: sortBy === key ? 600 : 400,
            }}>{label}</button>
          ))}
        </div>
      )}

      {/* ── 콘텐츠 ── */}
      <div style={{ padding: 16 }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[...Array(11)].map((_, i) => (
              <div key={i} style={{ height: 140, background: '#f9fafb', borderRadius: 8, animation: 'shimmer 1.5s infinite' }} />
            ))}
          </div>
        ) : !data ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#bbb' }}>데이터 없음</div>
        ) : view === 'cards' ? (
          /* 카드 그리드 */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {sorted.map((s, i) => (
              <SectorCard key={s.symbol} s={s} spxYtd={data.spxYtd} rank={i + 1} />
            ))}
          </div>
        ) : view === 'relative' ? (
          /* 상대 강도 바 차트 */
          <div style={{ padding: '0 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 60, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#bbb' }}>
                <span style={{ color: '#b91c1c', fontWeight: 600 }}>◀ S&P 500 대비 언더퍼폼</span>
                <span style={{ color: '#15803d', fontWeight: 600 }}>S&P 500 대비 아웃퍼폼 ▶</span>
              </div>
              <div style={{ width: 50, flexShrink: 0 }} />
            </div>
            {sorted.map(s => <RelativeBar key={s.symbol} s={s} maxAbs={maxAbs} />)}
            <div style={{ marginTop: 10, fontSize: 9, color: '#bbb', textAlign: 'center' }}>
              기준: S&P 500 52주 수익률 {fmt1(data.spxYtd)} 대비 초과/미달 수익률
            </div>
          </div>
        ) : (
          /* 경기 사이클 뷰 */
          <CycleView sectors={data.sectors} dominantCycle={data.dominantCycle} />
        )}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes shimmer{0%,100%{opacity:.6}50%{opacity:1}}`}</style>
    </div>
  );
}
