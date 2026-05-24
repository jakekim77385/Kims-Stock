'use client';
import { useState } from 'react';
import { macroEvents } from '@/lib/mockData';
import { Calendar, AlertTriangle, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';

const news = [
  { id: 1, headline: 'Fed 의장 파월, 인플레이션 둔화 확인시 금리 인하 가능 시사', source: 'Reuters', time: '2시간 전', sentiment: 'positive', category: '매크로', ticker: 'SPX', impact: 'high' },
  { id: 2, headline: 'NVIDIA, 2분기 어닝 가이던스 대폭 상향… AI 수요 강세 지속', source: 'Bloomberg', time: '4시간 전', sentiment: 'positive', category: 'Tech', ticker: 'NVDA', impact: 'high' },
  { id: 3, headline: 'Apple, 인도 제조 비중 확대 — 중국 의존도 감소 전략 가속', source: 'WSJ', time: '6시간 전', sentiment: 'positive', category: 'Tech', ticker: 'AAPL', impact: 'medium' },
  { id: 4, headline: 'UnitedHealth, 보험금 청구 급증으로 연간 실적 전망 하향', source: 'CNBC', time: '8시간 전', sentiment: 'negative', category: 'Healthcare', ticker: 'UNH', impact: 'high' },
  { id: 5, headline: 'Meta, AI 광고 플랫폼 효과로 광고 수익 29% 급증', source: 'FT', time: '10시간 전', sentiment: 'positive', category: 'Communication', ticker: 'META', impact: 'medium' },
  { id: 6, headline: '미국 소비자신뢰지수 예상치 상회 — 경기 연착륙 기대 강화', source: 'AP', time: '12시간 전', sentiment: 'positive', category: '매크로', ticker: 'SPX', impact: 'medium' },
  { id: 7, headline: 'JPMorgan, 하반기 금리 하락 수혜 섹터로 금융주·리츠 추천', source: 'JPMorgan Research', time: '14시간 전', sentiment: 'positive', category: 'Financials', ticker: 'JPM', impact: 'low' },
  { id: 8, headline: 'Tesla, 2분기 차량 인도 예상치 하회 — 수요 둔화 우려 재점화', source: 'Reuters', time: '1일 전', sentiment: 'negative', category: 'EV', ticker: 'TSLA', impact: 'high' },
];

const earningCalendar = [
  { ticker: 'NVDA', name: 'NVIDIA', date: '2026-05-28', eps_est: 5.52, eps_prev: 1.09, surprise_pct: null },
  { ticker: 'COST', name: 'Costco', date: '2026-05-29', eps_est: 3.68, eps_prev: 3.42, surprise_pct: null },
  { ticker: 'AAPL', name: 'Apple', date: '2026-07-30', eps_est: 1.51, eps_prev: 1.40, surprise_pct: null },
  { ticker: 'MSFT', name: 'Microsoft', date: '2026-07-29', eps_est: 3.10, eps_prev: 2.94, surprise_pct: null },
  { ticker: 'GOOGL', name: 'Alphabet', date: '2026-07-24', eps_est: 1.85, eps_prev: 1.44, surprise_pct: 28.5 },
  { ticker: 'META', name: 'Meta', date: '2026-04-30', eps_est: 4.30, eps_prev: 2.20, surprise_pct: 117.3 },
];

export default function NewsPage() {
  const [filter, setFilter] = useState('all');

  const categories = ['all', '매크로', 'Tech', 'Healthcare', 'Financials', 'EV', 'Communication'];

  const filtered = filter === 'all' ? news : news.filter((n) => n.category === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>뉴스 & 어닝 캘린더</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          시장 주요 뉴스 · 어닝 시즌 · 매크로 이벤트 추적
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
        {/* News Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {categories.map((c) => (
              <button key={c} onClick={() => setFilter(c)}
                className={`badge ${filter === c ? 'badge-blue' : 'badge-neutral'}`}
                style={{ cursor: 'pointer', border: 'none', padding: '5px 12px', fontSize: 12 }}>
                {c === 'all' ? '전체' : c}
              </button>
            ))}
          </div>

          {/* News Cards */}
          {filtered.map((n) => (
            <div key={n.id} className="card card-hover" style={{
              borderLeft: `3px solid ${n.sentiment === 'positive' ? 'var(--positive)' : 'var(--negative)'}`,
              cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className={`badge ${n.sentiment === 'positive' ? 'badge-green' : 'badge-red'}`}>
                    {n.sentiment === 'positive' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {n.sentiment === 'positive' ? '긍정' : '부정'}
                  </span>
                  <span className="badge badge-neutral">{n.category}</span>
                  {n.impact === 'high' && (
                    <span className="badge badge-red"><AlertTriangle size={10} /> 고영향</span>
                  )}
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.time}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 8 }}>
                {n.headline}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="badge badge-blue">{n.ticker}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>출처: {n.source}</span>
                </div>
                <ExternalLink size={13} color="var(--text-muted)" />
              </div>
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Earning Calendar */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">어닝 캘린더</div>
              <Calendar size={14} color="var(--text-muted)" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {earningCalendar.map((e) => (
                <div key={e.ticker} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 0', borderBottom: '1px solid var(--border-subtle)',
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    background: 'var(--bg-elevated)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, color: 'var(--accent-blue)',
                  }}>{e.ticker}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{e.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {new Date(e.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      &nbsp;· EPS 예상 ${e.eps_est.toFixed(2)}
                    </div>
                  </div>
                  {e.surprise_pct !== null && (
                    <span className={`badge ${e.surprise_pct > 0 ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 10 }}>
                      서프라이즈 {e.surprise_pct > 0 ? '+' : ''}{e.surprise_pct.toFixed(1)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Macro Calendar */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">매크로 이벤트</div>
              <span className="badge badge-red"><AlertTriangle size={10} /> 고위험</span>
            </div>
            {macroEvents.slice(0, 5).map((ev, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10,
                padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--border-subtle)' : undefined,
              }}>
                <div style={{
                  flexShrink: 0, width: 6, height: 6, borderRadius: '50%', marginTop: 6,
                  background: ev.importance === 'high' ? 'var(--negative)' : ev.importance === 'medium' ? 'var(--accent-gold)' : 'var(--neutral)',
                }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{ev.event}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {new Date(ev.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    &nbsp;· 예상 {ev.forecast} · 이전 {ev.previous}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
