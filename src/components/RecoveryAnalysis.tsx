'use client';
import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Shield, AlertTriangle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface RecoveryAsset {
  symbol:         string;
  name:           string;
  category:       string;
  color:          string;
  price:          number;
  high52w:        number;
  low52w:         number;
  rangePos:       number;
  targetMid:      number;
  targetHigh:     number;
  returnToMid:    number;
  returnToHigh:   number;
  annualVol:      number;
  monthlyDrift:   number;
  monthsToMid:    number;
  monthsToHigh:   number;
  annualizedMid:  number;
  annualizedHigh: number;
  confidence:     'high' | 'medium' | 'low';
  confidenceNote: string;
  maxDrawdown:    number;
  currency:       string;
}

const CONF_STYLE: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  high:   { icon: <Shield size={10} />,        color: '#15803d', bg: '#f0fdf4', label: '신뢰도 높음' },
  medium: { icon: <AlertTriangle size={10} />, color: '#92400e', bg: '#fffbeb', label: '신뢰도 중간' },
  low:    { icon: <AlertCircle size={10} />,   color: '#b91c1c', bg: '#fef2f2', label: '신뢰도 낮음' },
};

const CAT_ICON: Record<string, string> = {
  '미국증시':'🇺🇸','섹터ETF':'📊','글로벌':'🌏','채권':'🏦','원자재':'🥇','암호화폐':'₿',
};

function fmtPrice(v: number, cur: string) {
  if (!v) return '—';
  const p = cur === 'USD' ? '$' : cur === 'KRW' ? '₩' : cur === 'JPY' ? '¥' : cur === 'EUR' ? '€' : '';
  if (v >= 10000) return p + v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (v >= 100)   return p + v.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return p + v.toFixed(4);
}

function monthLabel(m: number) {
  if (m <= 0)  return '이미 도달';
  if (m < 1)   return '~1개월 이내';
  if (m < 3)   return `~${Math.ceil(m)}개월`;
  if (m < 12)  return `${Math.round(m)}개월`;
  const y = Math.round(m / 12 * 10) / 10;
  return `약 ${y}년`;
}

function RangeMiniBar({ pos, color }: { pos: number; color: string }) {
  return (
    <div style={{ position: 'relative', height: 6, background: 'linear-gradient(to right,#dcfce7,#fffbeb,#fef2f2)', borderRadius: 3, width: 80 }}>
      <div style={{
        position: 'absolute', top: -2, bottom: -2,
        left: `${pos}%`, transform: 'translateX(-50%)',
        width: 4, borderRadius: 2, background: color,
        boxShadow: `0 0 0 1.5px white, 0 0 0 2.5px ${color}`,
      }} />
    </div>
  );
}

function AssetCard({ a }: { a: RecoveryAsset }) {
  const [open, setOpen] = useState(false);
  const cs   = CONF_STYLE[a.confidence];
  const bc   = a.rangePos <= 20 ? '#15803d' : a.rangePos <= 40 ? '#22c55e' : a.rangePos <= 60 ? '#f59e0b' : '#fb923c';
  const upMid  = a.returnToMid  > 0;
  const upHigh = a.returnToHigh > 0;

  return (
    <div style={{
      border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden',
      background: 'white',
      borderLeft: `3px solid ${a.color}`,
    }}>
      {/* 헤더 행 */}
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'grid',
          gridTemplateColumns: '180px 80px 110px 110px 90px 90px 100px 28px',
          alignItems: 'center', gap: 8, padding: '10px 14px',
          cursor: 'pointer',
          background: open ? '#fafafa' : 'white',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#fafafa')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = open ? '#fafafa' : 'white')}
      >
        {/* 자산명 */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>{a.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <span style={{ fontSize: 9, color: '#999' }}>{CAT_ICON[a.category]}{a.category}</span>
            <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#555' }}>
              {fmtPrice(a.price, a.currency)}
            </span>
          </div>
        </div>

        {/* 52주 위치 바 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <RangeMiniBar pos={a.rangePos} color={bc} />
          <span style={{ fontSize: 10, fontWeight: 700, color: bc, fontFamily: 'JetBrains Mono, monospace' }}>
            {a.rangePos}%
          </span>
        </div>

        {/* 1차 목표 */}
        <div>
          <div style={{ fontSize: 9, color: '#999', marginBottom: 2 }}>① 1차 목표 (중간값)</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: upMid ? '#15803d' : '#b91c1c', fontFamily: 'JetBrains Mono, monospace' }}>
            {upMid ? '+' : ''}{a.returnToMid.toFixed(1)}%
          </div>
          <div style={{ fontSize: 9, color: '#999' }}>{fmtPrice(a.targetMid, a.currency)}</div>
        </div>

        {/* 2차 목표 */}
        <div>
          <div style={{ fontSize: 9, color: '#999', marginBottom: 2 }}>② 2차 목표 (52주 고점)</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: upHigh ? '#1a56db' : '#b91c1c', fontFamily: 'JetBrains Mono, monospace' }}>
            {upHigh ? '+' : ''}{a.returnToHigh.toFixed(1)}%
          </div>
          <div style={{ fontSize: 9, color: '#999' }}>{fmtPrice(a.targetHigh, a.currency)}</div>
        </div>

        {/* 예상 기간 (중간) */}
        <div>
          <div style={{ fontSize: 9, color: '#999', marginBottom: 2 }}>예상기간①</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#111' }}>{monthLabel(a.monthsToMid)}</div>
          {a.annualizedMid > 0 && (
            <div style={{ fontSize: 10, color: '#16803c', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, marginTop: 1 }}>
              연 +{a.annualizedMid.toFixed(1)}%
            </div>
          )}
        </div>

        {/* 예상 기간 (고점) */}
        <div>
          <div style={{ fontSize: 9, color: '#999', marginBottom: 2 }}>예상기간②</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#555' }}>{monthLabel(a.monthsToHigh)}</div>
          {a.annualizedHigh > 0 && (
            <div style={{ fontSize: 10, color: '#1a56db', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, marginTop: 1 }}>
              연 +{a.annualizedHigh.toFixed(1)}%
            </div>
          )}
        </div>

        {/* 신뢰도 */}
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontSize: 10, fontWeight: 600,
            color: cs.color, background: cs.bg,
            padding: '3px 7px', borderRadius: 4,
          }}>
            {cs.icon} {cs.label}
          </div>
        </div>

        {/* 토글 */}
        <div style={{ color: '#bbb', display: 'flex', justifyContent: 'flex-end' }}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {/* 펼침 상세 */}
      {open && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 0, borderTop: '1px solid #f5f5f5', background: '#fafafa',
        }}>
          {[
            { label: '연간 변동성', value: `${a.annualVol.toFixed(1)}%`, note: '높을수록 예측 불확실' },
            { label: '월평균 상승률', value: `${a.monthlyDrift > 0 ? '+' : ''}${a.monthlyDrift.toFixed(2)}%`, note: '1년 히스토리 기반' },
            { label: '최대 낙폭 (1년)', value: `${a.maxDrawdown.toFixed(1)}%`, note: '추가 하락 리스크' },
            { label: '신뢰도 근거', value: a.confidenceNote, note: '' },
          ].map((item) => (
            <div key={item.label} style={{ padding: '10px 14px', borderRight: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 9, color: '#999', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>{item.value}</div>
              {item.note && <div style={{ fontSize: 9, color: '#bbb', marginTop: 2 }}>{item.note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 메인 ────────────────────────────────────────────────────────────────────
export default function RecoveryAnalysis() {
  const [assets,  setAssets]  = useState<RecoveryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState<string | null>(null);
  const [filter,  setFilter]  = useState<'all' | 'undervalued'>('undervalued');
  const [maxPos,  setMaxPos]  = useState(50); // 표시 기준 rangePos

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/recovery');
      const j = await r.json();
      setAssets(j.assets ?? []);
      setUpdated(j.updatedAt ?? null);
    } catch { /**/ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const shown = assets.filter((a) =>
    filter === 'all' ? true : a.rangePos <= maxPos && a.returnToMid > 0
  );

  const avgReturn = shown.length
    ? (shown.reduce((s, a) => s + a.returnToMid, 0) / shown.length).toFixed(1)
    : '—';

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 700 }}>📈 반등 · 예상 수익률 분석</span>
          <span style={{ fontSize: 10, color: '#999', marginLeft: 8 }}>
            52주 중간값 회귀 기준 · 변동성 기반 추정
            {updated && ` · ${new Date(updated).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* 필터 */}
          <select value={maxPos} onChange={(e) => setMaxPos(Number(e.target.value))}
            style={{ fontSize: 10, padding: '3px 6px', border: '1px solid #e0e0e0', borderRadius: 4, background: 'white', color: '#444', fontFamily: 'inherit', cursor: 'pointer' }}>
            <option value={25}>매우 저평가 (25% 이하)</option>
            <option value={40}>저평가 (40% 이하)</option>
            <option value={50}>적정 이하 (50% 이하)</option>
            <option value={70}>70% 이하 전체</option>
          </select>
          <button onClick={() => setFilter((v) => v === 'all' ? 'undervalued' : 'all')}
            style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid', borderColor: filter === 'undervalued' ? '#1a56db' : '#e0e0e0', background: filter === 'undervalued' ? '#eef2ff' : 'white', color: filter === 'undervalued' ? '#1a56db' : '#666' }}>
            {filter === 'undervalued' ? '저평가만 표시' : '전체 표시'}
          </button>
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#999', background: 'none', border: '1px solid #e0e0e0', borderRadius: 4, cursor: 'pointer', padding: '3px 8px', fontFamily: 'inherit' }}>
            <RefreshCw size={10} style={{ animation: loading ? 'spin 1s linear infinite' : undefined }} />갱신
          </button>
        </div>
      </div>

      {/* 요약 배너 */}
      {!loading && shown.length > 0 && (
        <div style={{ display: 'flex', gap: 20, padding: '8px 20px', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
            <span style={{ fontSize: 10, color: '#15803d' }}>대상 자산</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#15803d', fontFamily: 'JetBrains Mono, monospace' }}>{shown.length}개</span>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
            <span style={{ fontSize: 10, color: '#15803d' }}>평균 예상 수익 (1차)</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#15803d', fontFamily: 'JetBrains Mono, monospace' }}>+{avgReturn}%</span>
          </div>
          <div style={{ fontSize: 11, color: '#16803c', marginLeft: 'auto' }}>
            ⚠️ 통계적 추정값 — 투자 결정은 본인 판단으로
          </div>
        </div>
      )}

      {/* 컬럼 헤더 */}
      <div style={{ display: 'grid', gridTemplateColumns: '180px 80px 110px 110px 90px 90px 100px 28px', gap: 8, padding: '6px 14px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
        {['자산','52주위치','① 1차 목표 수익','② 2차 목표 수익','기간① · 연수익','기간② · 연수익','신뢰도',''].map((h) => (
          <div key={h} style={{ fontSize: 9, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
        ))}
      </div>

      {/* 목록 */}
      <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 560, overflowY: 'auto' }}>
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 52, background: '#f5f5f5', borderRadius: 6, animation: 'shimmer 1.5s infinite' }} />
          ))
        ) : shown.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#bbb', fontSize: 12 }}>해당 조건의 자산 없음</div>
        ) : (
          shown.map((a) => <AssetCard key={a.symbol} a={a} />)
        )}
      </div>

      {/* 면책 고지 */}
      <div style={{ padding: '8px 20px', background: '#fafafa', borderTop: '1px solid #f0f0f0', fontSize: 9, color: '#bbb', lineHeight: 1.6 }}>
        * 예상 수익률: 52주 중간값(1차) / 52주 고점(2차) 기준 평균 회귀 추정 &nbsp;|&nbsp;
        * 예상 기간: 과거 1년 주간 수익률 기반 통계 추정 — 실제와 크게 다를 수 있음 &nbsp;|&nbsp;
        * 본 정보는 참고용이며 투자 조언이 아닙니다
      </div>
      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{opacity:.6} 50%{opacity:1} 100%{opacity:.6} }
      `}</style>
    </div>
  );
}
