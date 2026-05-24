'use client';
import { useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { stockUniverse } from '@/lib/mockData';
import { formatPercent, formatMarketCap } from '@/lib/utils';
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
    sort: (stocks: typeof stockUniverse) =>
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
    sort: (stocks: typeof stockUniverse) =>
      [...stocks].sort((a, b) => {
        const scoreA = (a.cEpsGrowthQtr >= 25 ? 20 : 0) + (a.aEpsGrowth3y >= 15 ? 20 : 0) + (a.nNewHigh ? 15 : 0) + (a.rs52w >= 80 ? 20 : 0) + (a.iInstitOwnership >= 70 ? 15 : 0);
        const scoreB = (b.cEpsGrowthQtr >= 25 ? 20 : 0) + (b.aEpsGrowth3y >= 15 ? 20 : 0) + (b.nNewHigh ? 15 : 0) + (b.rs52w >= 80 ? 20 : 0) + (b.iInstitOwnership >= 70 ? 15 : 0);
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
    sort: (stocks: typeof stockUniverse) =>
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
    sort: (stocks: typeof stockUniverse) =>
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
    sort: (stocks: typeof stockUniverse) =>
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
    sort: (stocks: typeof stockUniverse) =>
      [...stocks].filter((s) => s.peg > 0).sort((a, b) => a.peg - b.peg),
  },
];

export default function StrategyPage() {
  const [activeStrategy, setActiveStrategy] = useState(strategies[0]);

  const results = activeStrategy.sort(stockUniverse).slice(0, 10);

  const radarData = [
    { factor: '가치', value: results[0]?.valueScore || 0 },
    { factor: '품질', value: results[0]?.qualityScore || 0 },
    { factor: '모멘텀', value: results[0]?.momentumScore || 0 },
    { factor: '성장', value: results[0]?.growthScore || 0 },
    { factor: '배당', value: results[0]?.dividendYield * 10 || 0 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>투자 전략 엔진</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          세계 최고의 투자 전략을 정량적으로 구현 — 종목을 자동으로 랭킹화
        </p>
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
          <div className="card" style={{ border: `1px solid ${activeStrategy.color}44` }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{activeStrategy.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: activeStrategy.color, marginBottom: 4 }}>
              {activeStrategy.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 12 }}>
              by {activeStrategy.subtitle}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
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
          <div className="card">
            <div className="card-title" style={{ marginBottom: 8 }}>1위 종목 팩터 분석</div>
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
          </div>
        </div>

        {/* Results */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="card-title">{activeStrategy.name} — 상위 10 종목</span>
            <span className="badge" style={{ background: `${activeStrategy.color}22`, color: activeStrategy.color }}>랭킹순</span>
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
                {results.map((s, i) => (
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
                    <td style={{ fontFamily: 'JetBrains Mono' }}>{s.pe.toFixed(1)}x</td>
                    <td style={{ color: s.roe >= 15 ? 'var(--positive)' : 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>
                      {s.roe.toFixed(1)}%
                    </td>
                    <td style={{ color: s.epsGrowthYoy >= 20 ? 'var(--positive)' : s.epsGrowthYoy < 0 ? 'var(--negative)' : 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
