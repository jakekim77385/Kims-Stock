'use client';
import { useState, useEffect } from 'react';
import { RefreshCw, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';

interface RecoveryAsset {
  symbol: string; name: string; category: string; color: string;
  price: number; high52w: number; low52w: number; rangePos: number;
  targetMid: number; targetLow: number;
  returnToMid: number; returnToLow: number;
  monthsToLow: number; annualizedLow: number;
  annualVol: number; monthlyDrift: number;
  confidence: 'high' | 'medium' | 'low';
  confidenceNote: string; maxDrawdown: number; currency: string;
}

const CAT_ICON: Record<string, string> = {
  '미국증시':'🇺🇸','섹터ETF':'📊','글로벌':'🌏','채권':'🏦','원자재':'🥇','암호화폐':'₿',
};

function fmt(v: number, cur: string) {
  if (v == null || v === 0) return '—';
  const p = cur === 'USD' ? '$' : cur === 'KRW' ? '₩' : cur === 'JPY' ? '¥' : cur === 'EUR' ? '€' : '';
  if (Math.abs(v) >= 10000) return p + v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (Math.abs(v) >= 100)   return p + v.toFixed(2);
  return p + v.toFixed(4);
}

function months(m: number) {
  if (!m || m <= 0) return '—';
  if (m < 3)  return `~${Math.ceil(m)}개월`;
  if (m < 12) return `${Math.round(m)}개월`;
  return `약 ${(Math.round(m / 12 * 10) / 10)}년`;
}

// 1차 기간 계산 (중간값 하락폭 비율로)
function midMonths(a: RecoveryAsset): number {
  const lo = Math.abs(a.returnToLow);
  const mi = Math.abs(a.returnToMid);
  if (lo === 0 || a.monthsToLow === 0) return 0;
  return parseFloat((a.monthsToLow * mi / lo).toFixed(1));
}

function midAnnualized(a: RecoveryAsset): number {
  const m = midMonths(a);
  const r = Math.abs(a.returnToMid);
  if (m <= 0 || r <= 0) return 0;
  return parseFloat((-((1 + r / 100) ** (12 / m) - 1) * 100).toFixed(1));
}

function PosBadge({ pos }: { pos: number }) {
  const c = pos >= 90 ? '#b91c1c' : pos >= 80 ? '#ef4444' : '#fb923c';
  const bg = pos >= 90 ? '#fef2f2' : pos >= 80 ? '#fef2f2' : '#fff7ed';
  return (
    <span style={{
      fontSize: 12, fontWeight: 800, color: c,
      background: bg, padding: '2px 8px', borderRadius: 4,
      fontFamily: 'JetBrains Mono, monospace',
    }}>{pos}%</span>
  );
}

function DeclineRow({ a }: { a: RecoveryAsset }) {
  const [open, setOpen] = useState(false);
  const bc = a.rangePos >= 90 ? '#b91c1c' : a.rangePos >= 80 ? '#ef4444' : '#fb923c';

  const d1pct  = a.returnToMid < 0 ? a.returnToMid : 0;
  const d2pct  = a.returnToLow < 0 ? a.returnToLow : 0;
  const m1     = midMonths(a);
  const ann1   = midAnnualized(a);
  const m2     = a.monthsToLow;
  const ann2   = a.annualizedLow;

  return (
    <div style={{ border: `1px solid #fee2e2`, borderRadius: 6, borderLeft: `3px solid ${bc}`, background: 'white', marginBottom: 4 }}>
      {/* 메인 행 */}
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 0,
          padding: '10px 14px', cursor: 'pointer',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#fff5f5')}
        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
      >
        {/* 자산명 — 160px */}
        <div style={{ width: 160, flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>{a.name}</div>
          <div style={{ fontSize: 9, color: '#999', marginTop: 2 }}>
            {CAT_ICON[a.category]}{a.category} &nbsp;
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmt(a.price, a.currency)}</span>
          </div>
        </div>

        {/* 52주위치 — 70px */}
        <div style={{ width: 70, flexShrink: 0, textAlign: 'center' }}>
          <PosBadge pos={a.rangePos} />
          {/* 미니바 */}
          <div style={{ position: 'relative', height: 4, background: '#f5f5f5', borderRadius: 2, marginTop: 4 }}>
            <div style={{ position: 'absolute', left: `${a.rangePos}%`, top: -2, width: 8, height: 8, borderRadius: '50%', background: bc, transform: 'translateX(-50%)', boxShadow: `0 0 0 2px white, 0 0 0 3px ${bc}` }} />
          </div>
        </div>

        {/* ① 1차 조정 — 120px */}
        <div style={{ width: 120, flexShrink: 0, paddingLeft: 12 }}>
          <div style={{ fontSize: 9, color: '#bbb', marginBottom: 2 }}>① 1차 (중간값)</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#b91c1c', fontFamily: 'JetBrains Mono, monospace' }}>
            {d1pct !== 0 ? `${d1pct.toFixed(1)}%` : '—'}
          </div>
          <div style={{ fontSize: 9, color: '#999' }}>{fmt(a.targetMid, a.currency)}</div>
        </div>

        {/* ② 최대 조정 — 120px */}
        <div style={{ width: 120, flexShrink: 0, paddingLeft: 8 }}>
          <div style={{ fontSize: 9, color: '#bbb', marginBottom: 2 }}>② 최대 (52주 저점)</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#7f1d1d', fontFamily: 'JetBrains Mono, monospace' }}>
            {d2pct !== 0 ? `${d2pct.toFixed(1)}%` : '—'}
          </div>
          <div style={{ fontSize: 9, color: '#999' }}>{fmt(a.targetLow, a.currency)}</div>
        </div>

        {/* 기간 ① — 100px */}
        <div style={{ width: 100, flexShrink: 0, paddingLeft: 8 }}>
          <div style={{ fontSize: 9, color: '#bbb', marginBottom: 2 }}>기간①</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>{months(m1)}</div>
          {ann1 !== 0 && <div style={{ fontSize: 10, color: '#b91c1c', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>연 {ann1.toFixed(1)}%</div>}
        </div>

        {/* 기간 ② — 100px */}
        <div style={{ width: 100, flexShrink: 0, paddingLeft: 8 }}>
          <div style={{ fontSize: 9, color: '#bbb', marginBottom: 2 }}>기간②</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>{months(m2)}</div>
          {ann2 !== 0 && <div style={{ fontSize: 10, color: '#7f1d1d', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>연 {ann2.toFixed(1)}%</div>}
        </div>

        {/* 신뢰도 — flex 1 */}
        <div style={{ flex: 1, paddingLeft: 8 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600,
            color: a.confidence === 'high' ? '#b45309' : '#6b7280',
            background: a.confidence === 'high' ? '#fef3c7' : '#f9fafb',
            padding: '3px 8px', borderRadius: 4,
          }}>
            {a.confidence === 'high' ? '⊙ 신뢰도 높음' : a.confidence === 'medium' ? '△ 신뢰도 중간' : '○ 신뢰도 낮음'}
          </div>
        </div>

        {/* 토글 */}
        <div style={{ flexShrink: 0, color: '#bbb', paddingLeft: 4 }}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {/* 확장 상세 */}
      {open && (
        <div style={{ borderTop: '1px solid #fee2e2', background: '#fff5f5', padding: '10px 14px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            ['연간 변동성', `${a.annualVol.toFixed(1)}%`],
            ['최근 1년 최대 낙폭', `${a.maxDrawdown.toFixed(1)}%`],
            ['52주 고점', fmt(a.high52w, a.currency)],
            ['52주 저점', fmt(a.low52w, a.currency)],
            ['신뢰도 근거', a.confidenceNote],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 9, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#b91c1c' }}>{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DeclineAnalysis() {
  const [assets,  setAssets]  = useState<RecoveryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState<string | null>(null);
  const [minPos,  setMinPos]  = useState(70);

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

  const shown = assets
    .filter(a => a.rangePos >= minPos && a.returnToLow < 0)
    .sort((a, b) => b.rangePos - a.rangePos);

  const avgDecline = shown.length > 0
    ? (shown.reduce((s, a) => s + a.returnToMid, 0) / shown.length)
    : 0;

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 700 }}>📉 고평가 자산 하락 추정</span>
          <span style={{ fontSize: 10, color: '#999', marginLeft: 8 }}>
            52주 중간값·저점 회귀 기준 · 변동성 기반 추정
            {updated && ` · ${new Date(updated).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <select value={minPos} onChange={e => setMinPos(Number(e.target.value))}
            style={{ fontSize: 10, padding: '3px 6px', border: '1px solid #e0e0e0', borderRadius: 4, background: 'white', fontFamily: 'inherit', cursor: 'pointer' }}>
            <option value={90}>매우 고평가 (90%↑)</option>
            <option value={80}>고평가 (80%↑)</option>
            <option value={70}>다소 고평가 (70%↑)</option>
            <option value={60}>60%↑ 전체</option>
          </select>
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#999', background: 'none', border: '1px solid #e0e0e0', borderRadius: 4, cursor: 'pointer', padding: '3px 8px', fontFamily: 'inherit' }}>
            <RefreshCw size={10} style={{ animation: loading ? 'spin 1s linear infinite' : undefined }} /> 갱신
          </button>
        </div>
      </div>

      {/* 요약 배너 */}
      {!loading && shown.length > 0 && (
        <div style={{ display: 'flex', gap: 24, padding: '8px 20px', background: '#fef2f2', borderBottom: '1px solid #fecaca', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: 10, color: '#b91c1c' }}>대상 자산 </span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#b91c1c', fontFamily: 'JetBrains Mono, monospace' }}>{shown.length}개</span>
          </div>
          <div>
            <span style={{ fontSize: 10, color: '#b91c1c' }}>평균 1차 조정폭 </span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#b91c1c', fontFamily: 'JetBrains Mono, monospace' }}>{avgDecline.toFixed(1)}%</span>
          </div>
          <div style={{ fontSize: 11, color: '#b91c1c', marginLeft: 'auto' }}>
            ⚠ 상승 모멘텀 지속 시 추정 무효 — 참고용
          </div>
        </div>
      )}

      {/* 컬럼 헤더 */}
      <div style={{ display: 'flex', gap: 0, padding: '6px 14px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', alignItems: 'center' }}>
        {[
          ['자산', '160px'], ['52주위치', '70px'], ['① 1차 조정폭', '120px'],
          ['② 최대 조정폭', '120px'], ['기간① · 연하락률', '100px'], ['기간② · 연하락률', '100px'], ['신뢰도', ''],
        ].map(([h, w]) => (
          <div key={h} style={{ width: w || undefined, flex: w ? undefined : 1, paddingLeft: w === '160px' ? 0 : 8, flexShrink: 0, fontSize: 9, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
        ))}
      </div>

      {/* 목록 */}
      <div style={{ padding: '8px 14px', maxHeight: 580, overflowY: 'auto' }}>
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 54, background: '#fff0f0', borderRadius: 6, marginBottom: 4, animation: 'shimmer 1.5s infinite' }} />
          ))
        ) : shown.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#bbb', fontSize: 12 }}>해당 조건의 고평가 자산 없음</div>
        ) : (
          shown.map(a => <DeclineRow key={a.symbol} a={a} />)
        )}
      </div>

      {/* 면책 */}
      <div style={{ padding: '8px 20px', background: '#fafafa', borderTop: '1px solid #f0f0f0', fontSize: 9, color: '#bbb' }}>
        * ① 1차 조정: 52주 중간값까지 예상 하락폭 &nbsp;|&nbsp; ② 최대 조정: 52주 저점까지 최대 하락폭 &nbsp;|&nbsp; 본 정보는 투자 조언 아님
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes shimmer{0%,100%{opacity:.6}50%{opacity:1}}`}</style>
    </div>
  );
}
