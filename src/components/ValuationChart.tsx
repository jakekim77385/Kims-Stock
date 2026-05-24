'use client';
import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Info } from 'lucide-react';

interface ValuationAsset {
  symbol:    string;
  name:      string;
  category:  string;
  color:     string;
  price:     number;
  changePct: number;
  high52w:   number;
  low52w:    number;
  rangePos:  number;
  fromHigh:  number;
  ytd:       number;
  currency:  string;
  derived?:  boolean;
  note?:     string;
}

// ─── 상수 ────────────────────────────────────────────────────────────────────
const CATEGORY_ORDER = ['미국증시','섹터ETF','글로벌','채권','원자재','암호화폐','파생지표'];
const CATEGORY_ICON: Record<string, string> = {
  '미국증시':'🇺🇸', '섹터ETF':'📊', '글로벌':'🌏',
  '채권':'🏦', '원자재':'🥇', '암호화폐':'₿', '파생지표':'📐',
};
const CAT_COLOR: Record<string, string> = {
  '미국증시':'#1a56db','섹터ETF':'#7c3aed','글로벌':'#e11d48',
  '채권':'#0891b2','원자재':'#b45309','암호화폐':'#f59e0b','파생지표':'#374151',
};
const TABS = [
  { id: 'all',    label: '전체' },
  { id: '미국증시', label: '🇺🇸 미국' },
  { id: '섹터ETF', label: '📊 섹터' },
  { id: '글로벌',  label: '🌏 글로벌' },
  { id: '채권',    label: '🏦 채권' },
  { id: '원자재',  label: '🥇 원자재' },
  { id: '암호화폐', label: '₿ 코인' },
  { id: '파생지표', label: '📐 파생' },
] as const;

type TabId = typeof TABS[number]['id'];
type SortKey = 'rangePos' | 'ytd' | 'fromHigh';

// ─── 평가 라벨 ───────────────────────────────────────────────────────────────
function valLabel(pos: number) {
  if (pos <= 20) return { t: '매우 저평가', c: '#15803d', bg: '#dcfce7' };
  if (pos <= 40) return { t: '저평가',      c: '#16803c', bg: '#f0fdf4' };
  if (pos <= 60) return { t: '적정',        c: '#92400e', bg: '#fffbeb' };
  if (pos <= 80) return { t: '다소 고평가', c: '#b45309', bg: '#fef3c7' };
  return               { t: '고평가',       c: '#b91c1c', bg: '#fef2f2' };
}

function barColor(pos: number) {
  if (pos <= 20) return '#15803d';
  if (pos <= 40) return '#22c55e';
  if (pos <= 60) return '#f59e0b';
  if (pos <= 80) return '#fb923c';
  return '#ef4444';
}

function fmtPrice(v: number, cur: string) {
  if (!v) return '—';
  const p = cur === 'USD' ? '$' : cur === 'KRW' ? '₩' : cur === 'JPY' ? '¥' : cur === 'EUR' ? '€' : cur === '%' ? '' : '';
  const s = cur === '%' ? '%' : '';
  if (v >= 100000) return p + v.toLocaleString('en-US', { maximumFractionDigits: 0 }) + s;
  if (v >= 1000)   return p + v.toLocaleString('en-US', { maximumFractionDigits: 0 }) + s;
  if (v >= 10)     return p + v.toLocaleString('en-US', { maximumFractionDigits: 2 }) + s;
  return p + v.toFixed(4) + s;
}

// ─── 파생지표 전용 게이지 ──────────────────────────────────────────────────────
function DerivedRow({ a }: { a: ValuationAsset }) {
  // 지표별 설정
  const CONFIG: Record<string, {
    min: number; max: number;
    zones: { from: number; to: number; color: string; label: string; who: string }[];
    unit: string;
    desc: string;
  }> = {
    GOLD_SILVER: {
      min: 40, max: 120,
      zones: [
        { from: 40,  to: 65,  color: '#15803d', label: '금 저평가',  who: '금이 은 대비 상대적으로 저렴' },
        { from: 65,  to: 80,  color: '#f59e0b', label: '금·은 균형', who: '역사적 평균 수준의 밸류에이션' },
        { from: 80,  to: 120, color: '#b91c1c', label: '은 저평가',  who: '은이 금 대비 상대적으로 저렴' },
      ],
      unit: '', desc: '금÷은 가격비. 높으면 은이 저평가, 낮으면 금이 저평가.',
    },
    COPPER_GOLD: {
      min: 0.0001, max: 0.0006,
      zones: [
        { from: 0.0001, to: 0.00025, color: '#b91c1c', label: '경기 침체',  who: '구리 약세 → 역사적 경기 위축 신호' },
        { from: 0.00025,to: 0.0004,  color: '#f59e0b', label: '경기 중립',  who: '방향성 탐색 구간' },
        { from: 0.0004, to: 0.0006,  color: '#15803d', label: '경기 확장',  who: '구리 강세 → 실물 경제 확장세' },
      ],
      unit: '', desc: '구리÷금 비율. 높을수록 경기 낙관, 낮을수록 침체 우려.',
    },
    YIELD_SPREAD: {
      min: -2, max: 3,
      zones: [
        { from: -2,  to: 0,   color: '#b91c1c', label: '장단기 역전', who: '10Y < 2Y — 역사적 경기 침체 선행 지표' },
        { from: 0,   to: 1,   color: '#f59e0b', label: '정상화 초입', who: '역전 현상 해소 및 정상화 과정' },
        { from: 1,   to: 3,   color: '#15803d', label: '정상 수익률', who: '전형적인 경제 성장 및 확장 국면' },
      ],
      unit: '%', desc: '미국 10년물 국채금리 - 단기금리 차이.',
    },
  };

  const cfg = CONFIG[a.symbol];
  if (!cfg) return <AssetBar a={a} />;

  const { min, max, zones, unit, desc } = cfg;
  const val   = a.price;
  const span  = max - min;
  const pos   = Math.max(0, Math.min(100, ((val - min) / span) * 100));
  const zone  = zones.find((z) => val >= z.from && val < z.to) ?? zones[zones.length - 1];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '156px 1fr 78px 60px 68px',
      alignItems: 'center', gap: 10,
      padding: '10px 0',
      borderBottom: '1px solid #f5f5f5',
    }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#fafafa')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
    >
      {/* 자산명 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 3, height: 14, borderRadius: 1, background: '#374151', flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: '#111' }}>{a.name}</span>
          <span style={{ fontSize: 9, color: '#999', fontStyle: 'italic' }}>파생</span>
        </div>
        <div style={{ fontSize: 9, color: '#999', paddingLeft: 8, marginTop: 1, lineHeight: 1.2 }}>
          {desc}
          <div style={{ color: zone.color, fontWeight: 700, marginTop: 2, fontSize: 8.5 }}>{zone.who}</div>
        </div>
      </div>

      {/* 커스텀 게이지 */}
      <div>
        {/* 구역 배경 바 */}
        <div style={{ position: 'relative', height: 12, borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
          {zones.map((z, i) => (
            <div key={i} style={{
              flex: (z.to - z.from) / span,
              background: z.color,
              opacity: 0.18,
            }} />
          ))}
          {/* 현재값 마커 */}
          <div style={{
            position: 'absolute', top: -2, bottom: -2,
            left: `${pos}%`, transform: 'translateX(-50%)',
            width: 4, borderRadius: 2,
            background: zone.color,
            boxShadow: `0 0 0 2px white, 0 0 0 3.5px ${zone.color}`,
          }} />
        </div>
        {/* 구역 라벨 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#bbb', marginTop: 3 }}>
          {zones.map((z, i) => (
            <span key={i} style={{ color: z.color, fontWeight: 600 }}>{z.label}</span>
          ))}
        </div>
      </div>

      {/* 해석 라벨 */}
      <div style={{
        fontSize: 10, fontWeight: 700,
        color: zone.color,
        background: zone.color + '18',
        padding: '3px 6px', borderRadius: 3,
        textAlign: 'center', whiteSpace: 'nowrap',
        lineHeight: 1.3,
      }}>
        {zone.label}
      </div>

      {/* 52주 위치 */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: zone.color }}>
          {a.rangePos}%
        </div>
        <div style={{ fontSize: 8, color: '#bbb', marginTop: 1 }}>52주위치</div>
      </div>

      {/* 현재값 */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: zone.color }}>
          {val >= 1 ? val.toFixed(2) : val.toFixed(5)}{unit}
        </div>
        <div style={{ fontSize: 8, color: '#bbb', marginTop: 1 }}>현재값</div>
      </div>
    </div>
  );
}

// ─── 단일 행 ─────────────────────────────────────────────────────────────────
function AssetBar({ a, showCat }: { a: ValuationAsset; showCat?: boolean }) {
  const bc = barColor(a.rangePos);
  const vl = valLabel(a.rangePos);
  const range = a.high52w - a.low52w;
  const pct52lo = a.low52w  >= 1000 ? a.low52w.toFixed(0)  : a.low52w.toFixed(2);
  const pct52hi = a.high52w >= 1000 ? a.high52w.toFixed(0) : a.high52w.toFixed(2);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '156px 1fr 78px 60px 68px',
      alignItems: 'center', gap: 10,
      padding: '8px 0',
      borderBottom: '1px solid #f5f5f5',
      cursor: 'default',
    }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#fafafa')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
    >
      {/* 자산명 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 3, height: 14, borderRadius: 1, background: showCat ? CAT_COLOR[a.category] : a.color, flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#111' }}>{a.name}</span>
            {showCat && (
              <span style={{ fontSize: 9, color: '#999', marginLeft: 5 }}>
                {CATEGORY_ICON[a.category]}{a.category}
              </span>
            )}
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#999', paddingLeft: 8, marginTop: 1, fontFamily: 'JetBrains Mono, monospace' }}>
          {fmtPrice(a.price, a.currency)}
          {a.note && <span style={{ fontSize: 9, color: '#bbb', marginLeft: 5 }}>{a.note}</span>}
        </div>
      </div>

      {/* 52주 범위 바 */}
      <div>
        <div style={{
          position: 'relative', height: 10,
          background: 'linear-gradient(to right, #dcfce7 0%, #fef9c3 45%, #fef2f2 100%)',
          borderRadius: 5,
        }}>
          {/* 구분선 */}
          {[20, 40, 60, 80].map((p) => (
            <div key={p} style={{
              position: 'absolute', top: 0, left: `${p}%`,
              width: 1, height: '100%', background: 'rgba(0,0,0,0.07)',
            }} />
          ))}
          {/* 마커 */}
          {!a.derived && range > 0 && (
            <div style={{
              position: 'absolute', top: -3, bottom: -3,
              left: `${a.rangePos}%`,
              transform: 'translateX(-50%)',
              width: 4, borderRadius: 2,
              background: bc,
              boxShadow: `0 0 0 2px white, 0 0 0 3.5px ${bc}`,
            }} />
          )}
          {/* 파생지표는 전체 채우기 */}
          {a.derived && (
            <div style={{
              position: 'absolute', top: 0, left: 0, height: '100%',
              width: `${a.rangePos}%`, background: bc, borderRadius: 5, opacity: 0.5,
            }} />
          )}
        </div>
        {!a.derived && a.high52w > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#ccc', marginTop: 2 }}>
            <span>↓{pct52lo}</span>
            <span>↑{pct52hi}</span>
          </div>
        )}
      </div>

      {/* 평가 */}
      <div style={{ fontSize: 10, fontWeight: 600, color: vl.c, background: vl.bg, padding: '2px 6px', borderRadius: 3, textAlign: 'center', whiteSpace: 'nowrap' }}>
        {vl.t}
      </div>

      {/* 52주 위치 */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: bc }}>{a.rangePos}%</div>
        <div style={{ fontSize: 8, color: '#bbb', marginTop: 1 }}>52주위치</div>
      </div>

      {/* YTD */}
      <div style={{ textAlign: 'right' }}>
        {a.derived ? (
          <div style={{ fontSize: 10, color: '#999' }}>계산값</div>
        ) : (
          <>
            <div style={{
              fontSize: 11, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
              color: a.ytd >= 0 ? '#16803c' : '#b91c1c',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2,
            }}>
              {a.ytd >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
              {a.ytd >= 0 ? '+' : ''}{a.ytd.toFixed(1)}%
            </div>
            <div style={{ fontSize: 8, color: '#bbb', marginTop: 1 }}>52주수익</div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── 카테고리 요약 칩 ─────────────────────────────────────────────────────────
function CatSummary({ cat, items }: { cat: string; items: ValuationAsset[] }) {
  if (!items.length) return null;
  const real = items.filter((a) => !a.derived);
  const avg  = real.length ? Math.round(real.reduce((s, a) => s + a.rangePos, 0) / real.length) : 50;
  const vl   = valLabel(avg);
  const cheapest = [...real].sort((a, b) => a.rangePos - b.rangePos)[0];
  return (
    <div style={{
      padding: '10px 14px',
      borderRight: '1px solid #f0f0f0',
      borderBottom: '1px solid #f0f0f0',
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 11 }}>{CATEGORY_ICON[cat]}</span>
        <span style={{ fontSize: 10, color: '#666', fontWeight: 600 }}>{cat}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: vl.c, lineHeight: 1 }}>
        {avg}%
      </div>
      <div style={{ fontSize: 9, fontWeight: 600, color: vl.c, background: vl.bg, borderRadius: 3, padding: '1px 5px', display: 'inline-block', marginTop: 3 }}>
        {vl.t}
      </div>
      {cheapest && (
        <div style={{ fontSize: 9, color: '#999', marginTop: 3 }}>
          최저: <strong style={{ color: '#111' }}>{cheapest.name}</strong> {cheapest.rangePos}%
        </div>
      )}
    </div>
  );
}

// ─── 메인 ────────────────────────────────────────────────────────────────────
export default function ValuationChart() {
  const [assets,   setAssets]   = useState<ValuationAsset[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [updated,  setUpdated]  = useState<string | null>(null);
  const [tab,      setTab]      = useState<TabId>('all');
  const [sortBy,   setSortBy]   = useState<SortKey>('rangePos');
  const [showInfo, setShowInfo] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/valuation');
      const j = await r.json();
      setAssets(j.assets ?? []);
      setUpdated(j.updatedAt ?? null);
    } catch { /**/ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // 탭 필터
  const filtered = tab === 'all'
    ? assets
    : assets.filter((a) => a.category === tab);

  // 정렬
  const sorted = [...filtered].sort((a, b) =>
    sortBy === 'rangePos' ? a.rangePos - b.rangePos :
    sortBy === 'ytd'      ? a.ytd - b.ytd :
    a.fromHigh - b.fromHigh
  );

  // 카테고리별 그룹 (전체 탭)
  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: assets.filter((a) => a.category === cat),
  }));

  // Top 3 저평가
  const top3 = [...assets]
    .filter((a) => !a.derived && a.rangePos > 0)
    .sort((a, b) => a.rangePos - b.rangePos)
    .slice(0, 3);

  return (
    <div>
      {/* ── 헤더 ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px',
        background: '#fafafa', borderBottom: '1px solid #f0f0f0',
      }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 700 }}>📊 자산 상대 저평가 분석</span>
          <span style={{ fontSize: 10, color: '#999', marginLeft: 8 }}>
            52주 범위 기준 · 낮을수록 저평가
            {updated && ` · ${new Date(updated).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {/* 정렬 */}
          {(['rangePos','ytd','fromHigh'] as SortKey[]).map((k) => (
            <button key={k} onClick={() => setSortBy(k)} style={{
              fontSize: 10, padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
              fontFamily: 'inherit', border: '1px solid',
              borderColor: sortBy === k ? '#1a56db' : '#e0e0e0',
              background:  sortBy === k ? '#eef2ff'  : 'white',
              color:       sortBy === k ? '#1a56db'  : '#666',
              fontWeight:  sortBy === k ? 600 : 400,
            }}>
              {k === 'rangePos' ? '52주위치' : k === 'ytd' ? '52주수익' : '고점대비'}
            </button>
          ))}
          <button onClick={() => setShowInfo((v) => !v)} style={{
            background: 'none', border: '1px solid #e0e0e0', borderRadius: 4,
            cursor: 'pointer', padding: '3px 6px', color: '#999',
          }}><Info size={11} /></button>
          <button onClick={load} style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 10, color: '#999', background: 'none',
            border: '1px solid #e0e0e0', borderRadius: 4,
            cursor: 'pointer', padding: '3px 8px', fontFamily: 'inherit',
          }}>
            <RefreshCw size={10} style={{ animation: loading ? 'spin 1s linear infinite' : undefined }} />
            갱신
          </button>
        </div>
      </div>

      {/* ── 안내 박스 ── */}
      {showInfo && (
        <div style={{ padding: '10px 20px', background: '#f0f9ff', borderBottom: '1px solid #bae6fd', fontSize: 11, color: '#0369a1', lineHeight: 1.7 }}>
          <strong>52주 위치 계산:</strong> (현재가 − 52주최저) ÷ (52주최고 − 52주최저) × 100<br />
          0%에 가까울수록 52주 최저가 근처 <strong>→ 상대적 저평가</strong>. 100%에 가까울수록 52주 최고가 근처 <strong>→ 상대적 고평가</strong>.<br />
          <strong>파생지표:</strong> 금은비(80↑ 은 저평가 / 65↓ 금 저평가), 구리/금비(높을수록 경기낙관), 장단기금리차(음수=침체신호)
        </div>
      )}

      {/* ── 카테고리 요약 카드 ── */}
      {!loading && assets.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #f0f0f0' }}>
          {grouped.map(({ cat, items }) => <CatSummary key={cat} cat={cat} items={items} />)}
        </div>
      )}

      {/* ── Top 3 저평가 배너 ── */}
      {!loading && top3.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          padding: '7px 20px', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0',
        }}>
          <span style={{ fontSize: 11, color: '#15803d', fontWeight: 700 }}>🟢 현재 가장 저평가:</span>
          {top3.map((a, i) => (
            <span key={a.symbol} style={{ fontSize: 11, color: '#15803d' }}>
              {i > 0 && ' · '}<strong>{a.name}</strong> {a.rangePos}% ({valLabel(a.rangePos).t})
            </span>
          ))}
        </div>
      )}

      {/* ── 탭 네비게이션 ── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #f0f0f0', padding: '0 20px', overflowX: 'auto' }}>
        {TABS.map((t) => {
          const count = t.id === 'all' ? assets.filter((a) => !a.derived).length : assets.filter((a) => a.category === t.id).length;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 12px', fontSize: 11, fontWeight: tab === t.id ? 600 : 400,
              cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit',
              color: tab === t.id ? '#1a56db' : '#666',
              borderBottom: `2px solid ${tab === t.id ? '#1a56db' : 'transparent'}`,
              marginBottom: -1, whiteSpace: 'nowrap',
            }}>
              {t.label}
              <span style={{ fontSize: 9, color: '#bbb', marginLeft: 4 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── 범례 ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '6px 20px', background: '#fafafa', borderBottom: '1px solid #f5f5f5', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 9, color: '#999', fontWeight: 600 }}>52주 위치:</span>
        {[
          ['0–20%', '#15803d', '#dcfce7', '매우 저평가'],
          ['20–40%', '#22c55e', '#f0fdf4', '저평가'],
          ['40–60%', '#f59e0b', '#fffbeb', '적정'],
          ['60–80%', '#fb923c', '#fef3c7', '다소 고평가'],
          ['80–100%', '#ef4444', '#fef2f2', '고평가'],
        ].map(([rng, c, bg, lbl]) => (
          <div key={rng} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: c }} />
            <span style={{ fontSize: 9, color: '#666' }}>{rng} {lbl}</span>
          </div>
        ))}
      </div>

      {/* ── 컬럼 헤더 ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '156px 1fr 78px 60px 68px',
        gap: 10, padding: '6px 20px',
        background: '#fafafa', borderBottom: '1px solid #f0f0f0',
      }}>
        {['자산', `━━━ 52주 범위 내 위치 (${sortBy === 'rangePos' ? '▲ ' : ''}낮을수록 저평가) ━━━`, '평가', '52주위치', '52주수익'].map((h, i) => (
          <div key={h} style={{
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.05em', color: '#bbb',
            textAlign: i >= 3 ? 'right' : 'left',
          }}>{h}</div>
        ))}
      </div>

      {/* ── 자산 목록 ── */}
      <div style={{ padding: '2px 20px 16px', maxHeight: 520, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: '#bbb', fontSize: 12 }}>
            {[...Array(10)].map((_, i) => (
              <div key={i} style={{ height: 36, marginBottom: 2, background: `linear-gradient(90deg,#f5f5f5 ${i * 10}%,#ebebeb,#f5f5f5)`, borderRadius: 4, animation: 'shimmer 1.5s infinite' }} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#bbb', fontSize: 12 }}>데이터 없음</div>
        ) : (
          sorted.map((a) => a.derived
            ? <DerivedRow key={a.symbol} a={a} />
            : <AssetBar key={a.symbol} a={a} showCat={tab === 'all'} />
          )
        )}
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{opacity:.6} 50%{opacity:1} 100%{opacity:.6} }
      `}</style>
    </div>
  );
}
