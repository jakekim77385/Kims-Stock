'use client';
import { useState } from 'react';
import { legendaryPortfolios } from '@/lib/mockData';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const philosophies = [
  {
    investor: 'Warren Buffett',
    avatar: '🦁',
    style: '가치투자',
    quote: '"훌륭한 기업을 공정한 가격에 사는 것이 공정한 기업을 훌륭한 가격에 사는 것보다 훨씬 낫다."',
    rules: [
      'ROE 15% 이상 지속 유지',
      'PER이 합리적인 수준 (성장 대비)',
      '강력한 경제적 해자(Moat) 보유',
      '이해할 수 있는 비즈니스 모델',
      '경영진 신뢰성 및 자본배분 능력',
      '장기 보유 — 10년 이상 관점',
    ],
    keyMetrics: ['ROE', 'FCF Yield', 'Economic Moat', 'Owner Earnings'],
    color: '#f59e0b',
    returns: '+22.2% CAGR (1965-2023)',
  },
  {
    investor: 'Peter Lynch',
    avatar: '🦊',
    style: 'GARP · 성장가치',
    quote: '"PEG Ratio가 1 미만이면 성장 대비 저평가. 당신 주변에서 위대한 주식을 찾아라."',
    rules: [
      'PEG Ratio 1.0 이하 (PER/성장률)',
      '투자자가 이해하는 비즈니스',
      '독점적 위치 또는 틈새 시장 지배',
      '인스티튜셔널 보유 낮은 숨겨진 성장주',
      '재고 증가 시 경고 신호',
      'EPS 장기 성장 궤적 확인',
    ],
    keyMetrics: ['PEG Ratio', 'EPS Growth', '매출 성장', '재고/매출 비율'],
    color: '#10b981',
    returns: '+29.2% CAGR (마젤란 펀드 13년)',
  },
  {
    investor: 'William O\'Neil',
    avatar: '⚡',
    style: 'CANSLIM · 성장모멘텀',
    quote: '"최고의 주식은 항상 비싸 보인다. 그러나 더 비싸진다."',
    rules: [
      'C: 현재 분기 EPS 25% 이상 성장',
      'A: 연간 EPS 25% 이상 성장 (3년)',
      'N: 신제품·서비스·경영진 변화',
      'S: 신고가 돌파 + 거래량 급증',
      'L: RS Rating 80 이상 (상위 20%)',
      'I: 기관투자가 증가 중인 종목',
    ],
    keyMetrics: ['RS Rating', 'EPS QoQ Growth', '52W High', 'Volume Surge'],
    color: '#3b82f6',
    returns: '+2,763% (IBD 최고 종목군)',
  },
  {
    investor: 'Joel Greenblatt',
    avatar: '🧙',
    style: '마법공식 · 퀀트가치',
    quote: '"시장을 이기는 것은 간단하다. 다만 쉽지 않을 뿐이다."',
    rules: [
      'EY (Earnings Yield) = EBIT/EV 높음',
      'ROC (자본수익률) = EBIT/Capital 높음',
      '두 지표 합산 랭킹 상위 30~50개 매수',
      '1년 보유 후 연 1회 리밸런싱',
      '5~7년 이상 장기 시계열 적용',
      '소형주 포함 시 알파 극대화',
    ],
    keyMetrics: ['Earnings Yield', 'ROIC', 'EV/EBIT', '복합 랭킹'],
    color: '#8b5cf6',
    returns: '+30.8% CAGR (1988-2004)',
  },
];

export default function LegendsPage() {
  const [selected, setSelected] = useState(legendaryPortfolios[0]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>전설 투자가 포트폴리오</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          세계 최고 투자가들의 철학 · 기준 · 현재 포트폴리오 분석
        </p>
      </div>

      {/* Philosophy Cards */}
      <div className="grid-4">
        {philosophies.map((p) => (
          <div key={p.investor} className="card card-hover" style={{
            borderTop: `3px solid ${p.color}`,
            cursor: 'default',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{p.avatar}</div>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>{p.investor}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: p.color, marginBottom: 10 }}>{p.style}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 12 }}>
              {p.quote}
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>핵심 원칙</div>
              {p.rules.slice(0, 3).map((r, i) => (
                <div key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3, display: 'flex', gap: 5 }}>
                  <span style={{ color: p.color }}>·</span>{r}
                </div>
              ))}
            </div>
            <div style={{
              padding: '8px 10px', borderRadius: 8,
              background: `${p.color}15`,
              fontSize: 11, fontWeight: 700, color: p.color,
              textAlign: 'center',
            }}>
              📊 {p.returns}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Portfolio View */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">13F 포트폴리오 분석</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {legendaryPortfolios.map((lp) => (
              <button key={lp.investor} onClick={() => setSelected(lp)}
                className={`btn btn-sm ${selected.investor === lp.investor ? 'btn-primary' : 'btn-ghost'}`}>
                {lp.investor.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
          <div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>{selected.investor}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{selected.title}</div>
              <div style={{ fontSize: 12, color: 'var(--accent-blue)', fontStyle: 'italic' }}>{selected.style}</div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>종목</th>
                  <th>비중</th>
                  <th>포지션 비율</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {selected.holdings.map((h) => (
                  <tr key={h.ticker}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{h.ticker}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{h.name}</div>
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{h.weight.toFixed(1)}%</td>
                    <td style={{ width: 160 }}>
                      <div className="score-bar" style={{ height: 8 }}>
                        <div className="score-bar-fill" style={{
                          width: `${h.weight}%`,
                          background: h.action === 'Buy' ? '#10b981' : h.action === 'Sell' ? '#ef4444' : '#3b82f6',
                        }} />
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${h.action === 'Buy' ? 'badge-green' : h.action === 'Sell' ? 'badge-red' : 'badge-blue'}`}>
                        {h.action === 'Buy' ? <ArrowUpRight size={11} /> : h.action === 'Sell' ? <ArrowDownRight size={11} /> : null}
                        {h.action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Insights */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
              전략 인사이트
            </div>
            <div className="card" style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.2)', padding: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {selected.investor === 'Warren Buffett' && '버핏의 포트폴리오는 Apple 한 종목에 40% 이상 집중. AAPL을 단순 기술주가 아닌 "소비재 기업"으로 분류, 강력한 브랜드와 에코시스템을 평가. 금융주 (BAC, AXP)에도 강한 확신.'}
                {selected.investor === 'Michael Burry' && '버리는 서방시장이 고평가됐다고 보고, 중국 빅테크(BABA, JD)에 대거 투자. 극도의 저평가 + 역발상 투자 철학. 단기 변동성을 감내하는 컨빅션 투자.'}
                {selected.investor === 'Cathie Wood' && '캐시 우드는 파괴적 혁신 기업에 집중. Tesla, Coinbase, Roku 등 5~10년 테마 투자. 단기 변동성 높지만, 장기 미래 기술 테마에 베팅.'}
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                배울 점
              </div>
              {['집중 투자 vs 분산 투자 균형', '컨빅션 기반 포지션 크기 결정', '장기 테마와 단기 촉매 구분', '자신의 원칙 일관성 유지'].map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, fontSize: 12 }}>
                  <span style={{ color: 'var(--accent-gold)' }}>💡</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Comparison Table */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 14 }}>전략별 핵심 지표 비교</div>
        <div className="scroll-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>투자가</th>
                <th>스타일</th>
                <th>핵심 밸류에이션</th>
                <th>최소 ROE</th>
                <th>EPS 성장</th>
                <th>보유 기간</th>
                <th>집중도</th>
                <th>연평균 수익률</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'W. Buffett', style: '가치투자', val: 'PER/FCF', roe: '15%+', eps: '상관없음', hold: '10년+', conc: '집중형', ret: '22.2%' },
                { name: 'P. Lynch', style: 'GARP', val: 'PEG<1.5', roe: '15%+', eps: '15~25%', hold: '1~3년', conc: '분산형', ret: '29.2%' },
                { name: 'W. O\'Neil', style: 'CANSLIM', val: 'RS>80', roe: '상관없음', eps: '25%+', hold: '3~18개월', conc: '집중형', ret: '30%+' },
                { name: 'J. Greenblatt', style: '마법공식', val: 'EY+ROC', roe: '25%+', eps: '상관없음', hold: '1년', conc: '분산형', ret: '30.8%' },
              ].map((row) => (
                <tr key={row.name}>
                  <td style={{ fontWeight: 700 }}>{row.name}</td>
                  <td><span className="badge badge-blue">{row.style}</span></td>
                  <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{row.val}</td>
                  <td style={{ color: 'var(--positive)', fontFamily: 'JetBrains Mono' }}>{row.roe}</td>
                  <td style={{ fontFamily: 'JetBrains Mono' }}>{row.eps}</td>
                  <td>{row.hold}</td>
                  <td>{row.conc}</td>
                  <td style={{ fontWeight: 800, fontFamily: 'JetBrains Mono', color: 'var(--accent-gold)' }}>{row.ret}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
