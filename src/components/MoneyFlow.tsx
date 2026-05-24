'use client';
import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Minus, ArrowRight, AlertTriangle } from 'lucide-react';

interface Signal {
  id: string; label: string; value: string;
  direction: 'risk-on' | 'risk-off' | 'neutral';
  score: number; detail: string;
}
interface AssetFlow {
  name: string; category: string; ytd: number; changePct: number;
  flow: 'strong-in' | 'in' | 'neutral' | 'out' | 'strong-out';
}
interface FlowScenario {
  period: string; label: string;
  riskBias: 'risk-on' | 'neutral' | 'risk-off';
  narrative: string; inflow: string[]; outflow: string[];
  keyRisk: string; confidence: number;
}
interface MoneyFlowData {
  riskMode: 'risk-on' | 'neutral' | 'risk-off';
  riskScore: number; riskLabel: string;
  signals: Signal[]; assetFlows: AssetFlow[];
  scenarios: FlowScenario[]; updatedAt: string;
}

// ─── 스타일 상수 ──────────────────────────────────────────────────────────────
const RISK_STYLE = {
  'risk-on':  { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', label: '위험선호 (Risk-On)', dot: '#22c55e' },
  'neutral':  { color: '#92400e', bg: '#fffbeb', border: '#fde68a', label: '중립 (Neutral)',      dot: '#f59e0b' },
  'risk-off': { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', label: '위험회피 (Risk-Off)', dot: '#ef4444' },
};
const FLOW_STYLE = {
  'strong-in':  { icon: '▲▲', color: '#15803d', bg: '#dcfce7', label: '강한 유입' },
  'in':         { icon: '▲',  color: '#16803c', bg: '#f0fdf4', label: '유입'      },
  'neutral':    { icon: '─',  color: '#92400e', bg: '#fffbeb', label: '중립'      },
  'out':        { icon: '▼',  color: '#b91c1c', bg: '#fef2f2', label: '유출'      },
  'strong-out': { icon: '▼▼', color: '#7f1d1d', bg: '#fee2e2', label: '강한 유출' },
};
const CAT_COLOR: Record<string, string> = {
  '주식': '#1a56db', '섹터': '#7c3aed', '방어': '#6b7280',
  '안전': '#b45309', '신흥국': '#e11d48', '원자재': '#b45309', '암호화폐': '#f59e0b',
};

// ─── 점수 바 ──────────────────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  // -10 ~ +10 → 0 ~ 100%
  const pct  = Math.max(0, Math.min(100, (score + 10) / 20 * 100));
  const mode = score >= 3 ? 'risk-on' : score <= -3 ? 'risk-off' : 'neutral';
  const rs   = RISK_STYLE[mode];
  return (
    <div>
      <div style={{ position: 'relative', height: 14, borderRadius: 7, background: 'linear-gradient(to right, #fecaca 0%, #fef9c3 50%, #bbf7d0 100%)' }}>
        {/* 중앙선 */}
        <div style={{ position: 'absolute', left: '50%', top: 0, width: 2, height: '100%', background: 'rgba(0,0,0,0.1)', transform: 'translateX(-50%)' }} />
        {/* 마커 */}
        <div style={{
          position: 'absolute', top: -3, bottom: -3, left: `${pct}%`,
          transform: 'translateX(-50%)', width: 8, borderRadius: 4,
          background: rs.color, boxShadow: `0 0 0 2.5px white, 0 0 0 4px ${rs.color}`,
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#bbb', marginTop: 4 }}>
        <span style={{ color: '#b91c1c', fontWeight: 600 }}>◀ Risk-Off</span>
        <span style={{ color: '#666' }}>중립</span>
        <span style={{ color: '#15803d', fontWeight: 600 }}>Risk-On ▶</span>
      </div>
    </div>
  );
}

// ─── 신호 행 ──────────────────────────────────────────────────────────────────
function SignalRow({ s }: { s: Signal }) {
  const rs = RISK_STYLE[s.direction];
  const dots = s.score >= 2 ? '●●' : s.score >= 1 ? '●○' : s.score <= -2 ? '●●' : s.score <= -1 ? '●○' : '○○';
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '120px 140px 80px 1fr',
      alignItems: 'center', gap: 10, padding: '7px 0',
      borderBottom: '1px solid #f5f5f5',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#111' }}>{s.label}</div>
      <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#555' }}>{s.value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontSize: 9, fontWeight: 700, color: rs.color,
          background: rs.bg, padding: '2px 6px', borderRadius: 3,
        }}>
          <span style={{ letterSpacing: -1, fontSize: 8 }}>{dots}</span>
          {s.score >= 0 ? s.score > 0 ? 'ON' : '—' : 'OFF'}
        </div>
      </div>
      <div style={{ fontSize: 10, color: '#666', lineHeight: 1.4 }}>{s.detail}</div>
    </div>
  );
}

// ─── 자산 흐름 칩 ─────────────────────────────────────────────────────────────
function FlowChip({ a }: { a: AssetFlow }) {
  const fs = FLOW_STYLE[a.flow];
  const cc = CAT_COLOR[a.category] ?? '#666';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 10px', border: `1px solid ${fs.bg}`,
      borderLeft: `3px solid ${cc}`,
      borderRadius: 5, background: 'white',
    }}>
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: '#111' }}>{a.name}</div>
        <div style={{ fontSize: 9, color: '#999', marginTop: 1 }}>
          52주 {a.ytd >= 0 ? '+' : ''}{a.ytd.toFixed(1)}% &nbsp;|&nbsp; 일간 {a.changePct >= 0 ? '+' : ''}{a.changePct.toFixed(2)}%
        </div>
      </div>
      <div style={{
        fontSize: 9, fontWeight: 700, color: fs.color, background: fs.bg,
        padding: '3px 7px', borderRadius: 3, whiteSpace: 'nowrap',
        display: 'flex', alignItems: 'center', gap: 3,
      }}>
        <span style={{ fontSize: 8 }}>{fs.icon}</span> {fs.label}
      </div>
    </div>
  );
}

// ─── 시나리오 카드 ────────────────────────────────────────────────────────────
function ScenarioCard({ sc }: { sc: FlowScenario }) {
  const rs = RISK_STYLE[sc.riskBias];
  return (
    <div style={{
      border: `1px solid ${rs.border}`, borderRadius: 8, overflow: 'hidden',
      background: 'white', flex: 1, minWidth: 0,
    }}>
      {/* 헤더 */}
      <div style={{ padding: '10px 14px', background: rs.bg, borderBottom: `1px solid ${rs.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <span style={{ fontSize: 9, fontWeight: 700, color: rs.color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{sc.period}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#111', marginLeft: 6 }}>{sc.label}</span>
          </div>
          <div style={{
            fontSize: 9, fontWeight: 600, color: rs.color,
            background: 'white', padding: '2px 7px', borderRadius: 3,
          }}>{rs.label}</div>
        </div>
        {/* 신뢰도 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ flex: 1, height: 4, background: '#e5e7eb', borderRadius: 2 }}>
            <div style={{ width: `${sc.confidence}%`, height: '100%', background: rs.color, borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 9, color: '#999' }}>추정 신뢰도 {sc.confidence}%</span>
        </div>
      </div>
      {/* 내용 */}
      <div style={{ padding: '12px 14px' }}>
        <p style={{ fontSize: 11, color: '#444', lineHeight: 1.7, marginBottom: 10, margin: '0 0 10px' }}>
          {sc.narrative}
        </p>
        {/* 자금 흐름 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#15803d', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
              <TrendingUp size={9} /> 자금 유입 예상
            </div>
            {sc.inflow.map((item) => (
              <div key={item} style={{ fontSize: 10, color: '#166534', background: '#f0fdf4', padding: '2px 6px', borderRadius: 3, marginBottom: 2 }}>
                → {item}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#b91c1c', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
              <TrendingDown size={9} /> 자금 유출 예상
            </div>
            {sc.outflow.map((item) => (
              <div key={item} style={{ fontSize: 10, color: '#991b1b', background: '#fef2f2', padding: '2px 6px', borderRadius: 3, marginBottom: 2 }}>
                ← {item}
              </div>
            ))}
          </div>
        </div>
        {/* 핵심 리스크 */}
        <div style={{ marginTop: 10, padding: '6px 8px', background: '#fffbeb', borderRadius: 4, display: 'flex', gap: 5, alignItems: 'flex-start' }}>
          <AlertTriangle size={10} style={{ color: '#92400e', flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 10, color: '#92400e', lineHeight: 1.4 }}><strong>핵심 리스크:</strong> {sc.keyRisk}</span>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 ────────────────────────────────────────────────────────────────────
export default function MoneyFlow() {
  const [data,    setData]    = useState<MoneyFlowData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/moneyflow');
      const j = await r.json();
      setData(j);
    } catch { /**/ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading || !data) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#bbb', fontSize: 12 }}>
        <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px', display: 'block' }} />
        거시 자금 흐름 분석 중 (약 5~10초)...
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const rs = RISK_STYLE[data.riskMode];
  const inflows  = data.assetFlows.filter((a) => a.flow === 'strong-in' || a.flow === 'in');
  const outflows = data.assetFlows.filter((a) => a.flow === 'strong-out' || a.flow === 'out');
  const neutrals = data.assetFlows.filter((a) => a.flow === 'neutral');

  return (
    <div>
      {/* ── 헤더 ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 700 }}>🌊 거시 자금 흐름 분석</span>
          <span style={{ fontSize: 10, color: '#999', marginLeft: 8 }}>
            7개 신호 복합 분석 · {data.updatedAt && new Date(data.updatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준
          </span>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#999', background: 'none', border: '1px solid #e0e0e0', borderRadius: 4, cursor: 'pointer', padding: '3px 8px', fontFamily: 'inherit' }}>
          <RefreshCw size={10} /> 갱신
        </button>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── 종합 Risk 게이지 ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ padding: 16, border: `1px solid ${rs.border}`, borderRadius: 8, background: rs.bg }}>
            <div style={{ fontSize: 10, color: rs.color, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>현재 시장 모드</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: rs.color, marginBottom: 8 }}>{data.riskLabel}</div>
            <div style={{ fontSize: 11, color: rs.color, marginBottom: 12, opacity: 0.9, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>종합 점수:</span>
              <strong style={{ fontSize: 13.5, fontFamily: 'JetBrains Mono, monospace' }}>
                {data.riskScore > 0 ? '+' : ''}{data.riskScore}
              </strong>
              <span style={{ opacity: 0.7, fontSize: 9.5 }}>(범위: -10 ~ +10)</span>
            </div>
            <ScoreBar score={data.riskScore} />
          </div>

          {/* 신호 요약 */}
          <div style={{ padding: 16, border: '1px solid #f0f0f0', borderRadius: 8, background: 'white' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#666', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>신호 분포</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['risk-on', 'neutral', 'risk-off'] as const).map((mode) => {
                const count = data.signals.filter((s) => s.direction === mode).length;
                const modeRs = RISK_STYLE[mode];
                return (
                  <div key={mode} style={{ padding: '6px 12px', background: modeRs.bg, border: `1px solid ${modeRs.border}`, borderRadius: 6, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: modeRs.color }}>{count}</div>
                    <div style={{ fontSize: 9, color: modeRs.color, fontWeight: 600 }}>{modeRs.label.split(' ')[0]}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 10, fontSize: 10, color: '#666', lineHeight: 1.6 }}>
              {data.signals.filter(s => s.direction === 'risk-on').map(s => s.label).join(', ')} → <span style={{ color: '#15803d', fontWeight: 600 }}>ON</span><br />
              {data.signals.filter(s => s.direction === 'risk-off').map(s => s.label).join(', ')} → <span style={{ color: '#b91c1c', fontWeight: 600 }}>OFF</span>
            </div>
          </div>
        </div>

        {/* ── 7개 신호 상세 ── */}
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '8px 16px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', display: 'grid', gridTemplateColumns: '120px 140px 80px 1fr', gap: 10 }}>
            {['지표', '현재값', '방향', '해석'].map((h) => (
              <div key={h} style={{ fontSize: 9, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>
          <div style={{ padding: '2px 16px 8px' }}>
            {data.signals.map((s) => <SignalRow key={s.id} s={s} />)}
          </div>
        </div>

        {/* ── 현재 자금 흐름 현황 ── */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#111', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            현재 자금 흐름 현황
            <span style={{ fontSize: 10, color: '#999', fontWeight: 400 }}>52주 수익률 기반 추정</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 20px 1fr', gap: 12, alignItems: 'start' }}>
            {/* 유입 */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#15803d', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <TrendingUp size={11} /> 자금 유입 중 ({inflows.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {inflows.map((a) => <FlowChip key={a.name} a={a} />)}
                {neutrals.map((a) => <FlowChip key={a.name} a={a} />)}
              </div>
            </div>
            {/* 화살표 */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 20, color: '#d1d5db' }}>
              <ArrowRight size={16} />
            </div>
            {/* 유출 */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#b91c1c', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <TrendingDown size={11} /> 자금 유출 중 ({outflows.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {outflows.map((a) => <FlowChip key={a.name} a={a} />)}
              </div>
            </div>
          </div>
        </div>

        {/* ── 단기/중기/장기 시나리오 ── */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#111', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            기간별 자금 흐름 시나리오
            <span style={{ fontSize: 10, color: '#999', fontWeight: 400 }}>현재 데이터 기반 통계적 추정 — 투자 조언 아님</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
            {data.scenarios.map((sc) => <ScenarioCard key={sc.period} sc={sc} />)}
          </div>
        </div>

        {/* 면책 */}
        <div style={{ fontSize: 9, color: '#bbb', lineHeight: 1.6, borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
          * 본 분석은 VIX, 금, 채권, 달러, 섹터 수익률, 구리/금 비율, 암호화폐 7개 지표의 52주 시장 데이터를 기반으로 통계적으로 추정한 참고 자료입니다.
          실제 자금 흐름(ETF AUM, 기관 포지셔닝 데이터)과 다를 수 있으며, 투자 결정은 본인 판단으로 하시기 바랍니다.
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
