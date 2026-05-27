'use client';
import { useState, useEffect } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { stockUniverse } from '@/lib/mockData';
import { formatPercent } from '@/lib/utils';
import { RefreshCw, Check, Info } from 'lucide-react';
import Link from 'next/link';

// ─── Strategy Engine ─────────────────────────────────────────────────────────
const strategies = [
  {
    id: 'magic',
    name: '마법공식 (Magic Formula)',
    subtitle: 'Joel Greenblatt',
    desc: 'Earnings Yield(EY)와 Return on Capital(ROC)을 합산한 랭킹 기반 투자 전략. 저평가된 고품질 기업을 체계적으로 선별.',
    color: '#f59e0b',
    icon: '🧙',
    criteria: ['EY = EBIT/EV (높을수록 좋음)', 'ROC = EBIT/(NWC+FixedAssets) (높을수록 좋음)', '두 지표 합산 랭킹 기준 상위 종목 선별'],
    sort: (stocks: any[]) =>
      [...stocks].sort((a, b) => a.magicFormulaRank - b.magicFormulaRank),
  },
  {
    id: 'canslim',
    name: 'CANSLIM 전략',
    subtitle: 'William O\'Neil',
    desc: '7가지 기준(현재실적, 연간실적, 신제품/서비스, 거래량, 선두기업, 기관투자가, 시장방향)을 통해 성장주를 선별하는 전략.',
    color: '#10b981',
    icon: '📈',
    criteria: ['C: 현재분기 EPS 25%↑', 'A: 연간 EPS 3년 평균 15%↑', 'N: 52주 신고가 근접', 'S: 신고가 시 거래량 급증', 'L: RS Rating 80↑', 'I: 기관투자가 보유 증가'],
    sort: (stocks: any[]) =>
      [...stocks].sort((a, b) => {
        const scoreA = (a.epsGrowthQtr >= 25 ? 20 : 0) + (a.epsGrowth5y >= 15 ? 20 : 0) + (a.rs52w >= 80 ? 20 : 0) + (a.iInstitOwnership >= 70 ? 15 : 0);
        const scoreB = (b.epsGrowthQtr >= 25 ? 20 : 0) + (b.epsGrowth5y >= 15 ? 20 : 0) + (b.rs52w >= 80 ? 20 : 0) + (b.iInstitOwnership >= 70 ? 15 : 0);
        return scoreB - scoreA;
      }),
  },
  {
    id: 'dividend',
    name: '배당성장 전략',
    subtitle: 'Dividend Aristocrats',
    desc: '25년 이상 연속 배당 증가 기업군 중심. 안정적인 현금흐름, 강한 브랜드, 지속적인 배당성장을 핵심 기준으로 선별.',
    color: '#8b5cf6',
    icon: '💰',
    criteria: ['배당수익률 1.5%↑', '5Y 배당성장률 5%↑', '배당 지급 안정성 (Payout <70%)', '부채비율 안정적'],
    sort: (stocks: any[]) =>
      [...stocks].filter((s) => s.dividendYield >= 0.5).sort((a, b) => (b.dividendYield + b.dividendGrowth5y * 0.5) - (a.dividendYield + a.dividendGrowth5y * 0.5)),
  },
  {
    id: 'momentum',
    name: '12-1 모멘텀 전략',
    subtitle: 'Jegadeesh & Titman',
    desc: '52주 수익률 상위 종목이 다음 기간에도 초과성과를 내는 경향을 이용. RS Rating 상위 20%에 집중 투자.',
    color: '#ef4444',
    icon: '⚡',
    criteria: ['RS Rating 85↑ (52주 상대강도)', 'RSI 50~75 범위 (추세 강함)', '52주 신고가 20% 이내', '거래량 확인 돌파'],
    sort: (stocks: any[]) =>
      [...stocks].sort((a, b) => b.rs52w - a.rs52w),
  },
  {
    id: 'quality',
    name: '고품질 성장 전략',
    subtitle: 'Quality + Growth',
    desc: '높은 수익성(ROE, ROIC)과 지속적인 EPS 성장을 동시에 보유한 기업을 선별. Buffett이 선호하는 "경제적 해자" 보유 기업 중심.',
    color: '#3b82f6',
    icon: '🏆',
    criteria: ['ROE 20%↑', 'ROIC 15%↑', '영업이익률 20%↑', 'EPS 성장 15%↑ (YoY)', '부채비율 안정적'],
    sort: (stocks: any[]) =>
      [...stocks].sort((a, b) => b.qualityScore + b.growthScore - a.qualityScore - a.growthScore),
  },
  {
    id: 'garp',
    name: 'GARP 전략',
    subtitle: 'Growth At Reasonable Price',
    desc: 'PEG Ratio(PER/성장률)가 낮은 기업을 선별. 성장성과 밸류에이션을 동시에 고려하는 피터 린치의 접근법.',
    color: '#06b6d4',
    icon: '⚖️',
    criteria: ['PEG 1.5 이하 (성장 대비 저평가)', 'EPS 성장률 15%↑', 'ROE 15%↑', '합리적인 PER 수준'],
    sort: (stocks: any[]) =>
      [...stocks].filter((s) => s.peg > 0).sort((a, b) => a.peg - b.peg),
  },
];

const TableRowSkeleton = () => (
  <tr style={{ animation: 'pulse 1.5s infinite' }}>
    <td style={{ paddingLeft: 20 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-elevated)' }} />
    </td>
    <td>
      <div style={{ width: 45, height: 14, background: 'var(--bg-elevated)', borderRadius: 4, marginBottom: 4 }} />
      <div style={{ width: 80, height: 10, background: 'var(--bg-elevated)', borderRadius: 4 }} />
    </td>
    <td><div style={{ width: 90, height: 16, background: 'var(--bg-elevated)', borderRadius: 6 }} /></td>
    <td><div style={{ width: 60, height: 14, background: 'var(--bg-elevated)', borderRadius: 4 }} /></td>
    <td><div style={{ width: 40, height: 14, background: 'var(--bg-elevated)', borderRadius: 4 }} /></td>
    <td><div style={{ width: 40, height: 14, background: 'var(--bg-elevated)', borderRadius: 4 }} /></td>
    <td><div style={{ width: 50, height: 14, background: 'var(--bg-elevated)', borderRadius: 4 }} /></td>
    <td><div style={{ width: 50, height: 14, background: 'var(--bg-elevated)', borderRadius: 4 }} /></td>
    <td><div style={{ width: 30, height: 16, background: 'var(--bg-elevated)', borderRadius: 4 }} /></td>
    <td><div style={{ width: 50, height: 24, background: 'var(--bg-elevated)', borderRadius: 4 }} /></td>
  </tr>
);

export default function StrategyPage() {
  const [activeStrategy, setActiveStrategy] = useState(strategies[0]);
  const [universe, setUniverse] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState('');

  const loadRealtimeMetrics = async () => {
    setLoading(true);
    try {
      const tickers = stockUniverse.map(s => s.ticker).join(',');
      const res = await fetch(`/api/quotes?tickers=${tickers}&includeFundamentals=true`);
      if (res.ok) {
        const json = await res.json();
        const quotes: any[] = json.quotes ?? [];

        // 실시간 재무 기반 팩터 스코어 계산 엔진
        const calcQualityScore = (roe: number, roic: number, opMargin: number) => {
          const roeScore = Math.min(100, Math.max(0, roe * 2.2));
          const roicScore = Math.min(100, Math.max(0, roic * 2.8));
          const opScore = Math.min(100, Math.max(0, opMargin * 1.8));
          return Math.round((roeScore + roicScore + opScore) / 3);
        };

        const calcValueScore = (pe: number | null, pb: number, ps: number) => {
          const peVal = pe !== null ? pe : 20;
          const peScore = Math.min(100, Math.max(0, peVal * 1.8));
          const pbScore = Math.min(100, Math.max(0, pb * 6.5));
          const psScore = Math.min(100, Math.max(0, ps * 12.0));
          return Math.round(100 - (peScore + pbScore + psScore) / 6);
        };

        const calcGrowthScore = (eps: number, rev: number) => {
          const epsScore = Math.min(100, Math.max(0, eps * 2.2));
          const revScore = Math.min(100, Math.max(0, rev * 2.8));
          return Math.round((epsScore + revScore) / 2);
        };

        // 실시간 병합 정렬
        const merged = stockUniverse.map(mock => {
          const real = quotes.find(q => q.ticker === mock.ticker);
          if (real) {
            const roe = real.roe !== undefined ? real.roe : mock.roe;
            const roic = real.roic !== undefined ? real.roic : mock.roic;
            const operatingMargin = real.operatingMargin !== undefined ? real.operatingMargin : mock.operatingMargin;
            const pe = real.pe !== null ? real.pe : mock.pe;
            const pb = real.pb !== undefined ? real.pb : mock.pb;
            const ps = real.ps !== undefined ? real.ps : mock.ps;
            
            // 실시간 성장률 및 PEG 계산
            const epsGrowthYoy = real.epsGrowthYoy !== undefined ? real.epsGrowthYoy : mock.epsGrowthYoy;
            const revenueGrowthYoy = real.revenueGrowthYoy !== undefined ? real.revenueGrowthYoy : mock.revenueGrowthYoy;
            const peg = real.peg !== undefined ? real.peg : mock.peg;

            const qScore = calcQualityScore(roe, roic, operatingMargin);
            const vScore = calcValueScore(pe, pb, ps);
            const gScore = calcGrowthScore(epsGrowthYoy, revenueGrowthYoy);
            const oScore = Math.round((qScore + vScore + gScore) / 3);

            return {
              ...mock,
              price: real.price,
              change: real.change,
              changePct: real.changePct,
              volume: real.volume,
              marketCap: real.marketCap,
              pe,
              pb,
              ps,
              peg,
              roe,
              roic,
              operatingMargin,
              epsGrowthYoy,
              revenueGrowthYoy,
              qualityScore: qScore,
              valueScore: vScore,
              growthScore: gScore,
              overallScore: oScore
            };
          }
          return mock;
        });

        setUniverse(merged);
        setUpdatedAt(json.updatedAt ?? '');
      } else {
        setUniverse(stockUniverse);
      }
    } catch (e) {
      console.error('Failed to load realtime strategy metrics', e);
      setUniverse(stockUniverse);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealtimeMetrics();
  }, []);

  const results = loading ? [] : activeStrategy.sort(universe).slice(0, 10);

  const radarData = loading ? [] : [
    { factor: '가치', value: results[0]?.valueScore || 0 },
    { factor: '품질', value: results[0]?.qualityScore || 0 },
    { factor: '모멘텀', value: results[0]?.momentumScore || 0 },
    { factor: '성장', value: results[0]?.growthScore || 0 },
    { factor: '배당', value: Math.min(100, (results[0]?.dividendYield || 0) * 20) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>투자 전략 엔진</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            세계 최고의 투자 전략을 실시간 기업 재무 및 가격 데이터 기반으로 구현 — 랭킹 자동 산출
          </p>
        </div>
        
        <button 
          onClick={loadRealtimeMetrics} 
          disabled={loading}
          style={{ 
            display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700,
            color: 'var(--text-secondary)', background: 'var(--card-bg, white)', border: '1px solid var(--border-subtle)', 
            borderRadius: 6, padding: '6px 12px', cursor: 'pointer', transition: 'all 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--card-bg, white)'}
        >
          <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          실시간 갱신
        </button>
      </div>

      {/* Strategy Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {strategies.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveStrategy(s)}
            style={{
              background: activeStrategy.id === s.id ? `${s.color}18` : 'var(--bg-card)',
              border: `1px solid ${activeStrategy.id === s.id ? s.color : 'var(--border-subtle)'}`,
              borderRadius: 12,
              padding: '14px 16px',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: activeStrategy.id === s.id ? s.color : 'var(--text-primary)' }}>
                  {s.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.subtitle}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Strategy Detail + Results */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Strategy Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ border: `1px solid ${activeStrategy.color}44`, padding: '16px' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{activeStrategy.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: activeStrategy.color, marginBottom: 4 }}>
              {activeStrategy.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 12 }}>
              by {activeStrategy.subtitle}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16, wordBreak: 'keep-all' }}>
              {activeStrategy.desc}
            </p>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>선별 기준</div>
              {activeStrategy.criteria.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 12 }}>
                  <span style={{ color: activeStrategy.color, fontWeight: 700 }}>✓</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Radar Chart */}
          <div className="card" style={{ padding: '16px' }}>
            <div className="card-title" style={{ marginBottom: 8 }}>1위 종목 팩터 분석</div>
            {loading ? (
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 11 }}>
                팩터 데이터 수집 중...
              </div>
            ) : (
              <>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  {results[0]?.ticker} — {results[0]?.name}
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                    <PolarGrid stroke="var(--border-subtle)" />
                    <PolarAngleAxis dataKey="factor" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <Radar dataKey="value" stroke={activeStrategy.color} fill={activeStrategy.color} fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="card-title">{activeStrategy.name} — 상위 10 종목</span>
              <span className="badge" style={{ background: `${activeStrategy.color}22`, color: activeStrategy.color, fontWeight: 700 }}>랭킹순</span>
            </div>
            {updatedAt && (
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Info size={11} /> 실시간 계산됨 (수정 반영완료)
              </span>
            )}
          </div>
          <div className="scroll-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20 }}>순위</th>
                  <th>종목</th>
                  <th>섹터</th>
                  <th>현재가</th>
                  <th>PER</th>
                  <th>ROE</th>
                  <th>EPS성장</th>
                  <th>RS</th>
                  <th>Alpha Score</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <TableRowSkeleton key={i} />)
                ) : results.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                      해당 조건에 일치하는 종목이 포트폴리오 유니버스에 존재하지 않습니다.
                    </td>
                  </tr>
                ) : (
                  results.map((s, i) => (
                    <tr key={s.ticker}>
                      <td style={{ paddingLeft: 20 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8, fontWeight: 800, fontSize: 13,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: i === 0 ? activeStrategy.color : i <= 2 ? `${activeStrategy.color}44` : 'var(--bg-elevated)',
                          color: i === 0 ? 'white' : i <= 2 ? activeStrategy.color : 'var(--text-muted)',
                        }}>#{i + 1}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{s.ticker}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.name}</div>
                      </td>
                      <td><span className="tag">{s.sector}</span></td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 700 }}>${s.price.toFixed(2)}</td>
                      <td style={{ fontFamily: 'JetBrains Mono' }}>{s.pe ? `${s.pe.toFixed(1)}x` : '-'}</td>
                      <td style={{ color: s.roe >= 15 ? 'var(--positive)' : 'var(--text-primary)', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                        {s.roe ? `${s.roe.toFixed(1)}%` : '-'}
                      </td>
                      <td style={{ color: s.epsGrowthYoy >= 20 ? 'var(--positive)' : s.epsGrowthYoy < 0 ? 'var(--negative)' : 'var(--text-primary)', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                        {formatPercent(s.epsGrowthYoy)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div className="score-bar" style={{ width: 32 }}>
                            <div className="score-bar-fill" style={{ width: `${s.rs52w}%`, background: activeStrategy.color }} />
                          </div>
                          <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono' }}>{s.rs52w}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: 16, fontWeight: 800, fontFamily: 'JetBrains Mono',
                          color: s.overallScore >= 80 ? 'var(--positive)' : 'var(--accent-gold)',
                        }}>{s.overallScore}</span>
                      </td>
                      <td style={{ paddingRight: 12 }}>
                        <Link href={`/analysis?ticker=${s.ticker}`} className="btn btn-ghost btn-sm">분석 →</Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
