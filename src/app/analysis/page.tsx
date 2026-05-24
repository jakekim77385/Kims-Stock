'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { stockUniverse } from '@/lib/mockData';
import { useQuote, useHistory, type HistoryBar } from '@/lib/hooks';
import {
  formatPercent, formatMarketCap, formatVolume,
  getRSISignal, calcDCF
} from '@/lib/utils';

function AnalysisContent() {
  const params = useSearchParams();
  const tickerParam = params.get('ticker') || 'MSFT';

  // 실시간 API
  const { data: liveQuote, loading: quoteLoading, refresh } = useQuote(tickerParam, 60_000);

  // Fallback: mock 데이터 (재무/기술 탭용)
  const mockStock = stockUniverse.find((s) => s.ticker === tickerParam.replace('-','.')) || stockUniverse[1];

  // 실제 가격 (live 우선, fallback mock)
  const price     = liveQuote?.price     ?? mockStock.price;
  const change    = liveQuote?.change    ?? mockStock.change;
  const changePct = liveQuote?.changePct ?? mockStock.changePct;
  const name      = liveQuote?.name      ?? mockStock.name;
  const high52w   = liveQuote?.high52w   ?? mockStock.high52w;
  const low52w    = liveQuote?.low52w    ?? mockStock.low52w;
  const volume    = liveQuote?.volume    ?? mockStock.volume;
  const marketCap = liveQuote?.marketCap ? liveQuote.marketCap / 1_000_000 : mockStock.marketCap;
  const avgVolume = liveQuote?.avgVolume ?? mockStock.avgVolume;
  const stock     = mockStock; // mock 데이터는 재무/기술분석에서 계속 활용

  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState<'1mo'|'3mo'|'6mo'|'1y'>('6mo');
  const [dcfParams, setDcfParams] = useState({
    fcfPerShare: 12.0,
    growthRate: 15,
    terminalGrowth: 3,
    discountRate: 10,
    years: 10,
  });

  // 실시간 히스토리
  const { data: historyBars, loading: historyLoading } = useHistory(tickerParam, period);

  const intrinsicValue = calcDCF(dcfParams);
  const marginOfSafety = ((intrinsicValue - price) / intrinsicValue * 100);

  // RSI 라인 데이터 (mock 기반)
  const rsiData = (historyBars ?? []).slice(-60).map((d: HistoryBar, i: number) => ({
    date: d.date,
    rsi: 30 + Math.sin(i * 0.3) * 20 + Math.random() * 10,
  }));

  const tabs = [
    { id: 'overview', label: '개요' },
    { id: 'financials', label: '재무제표' },
    { id: 'dcf', label: 'DCF 밸류에이션' },
    { id: 'technical', label: '기술적 분석' },
    { id: 'scores', label: '투자 점수' },
  ];

  const metrics = [
    { label: '시가총액', value: formatMarketCap(marketCap) },
    { label: '거래량', value: formatVolume(volume) },
    { label: '52주 최고', value: `$${high52w.toFixed(2)}` },
    { label: '52주 최저', value: `$${low52w.toFixed(2)}` },
    { label: '50일 MA', value: `$${stock.ma50.toFixed(2)}`, sub: price > stock.ma50 ? '▲ 위' : '▼ 아래' },
    { label: '200일 MA', value: `$${stock.ma200.toFixed(2)}`, sub: price > stock.ma200 ? '▲ 위' : '▼ 아래' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stock Header */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 8,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
          }}>{tickerParam.slice(0, 2)}</div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700 }}>{tickerParam.replace('-','.')}</h1>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{name}</span>
              <span className="badge badge-blue">{stock.sector}</span>
              {quoteLoading
                ? <RefreshCw size={12} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
                : <button className="btn btn-ghost btn-sm" onClick={refresh} style={{ padding: '2px 8px', fontSize: 10 }}>갱신</button>}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
              <span style={{ fontSize: 30, fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
                ${price.toFixed(2)}
              </span>
              <span style={{
                fontSize: 15, fontWeight: 600,
                color: changePct >= 0 ? 'var(--positive)' : 'var(--negative)',
                display: 'flex', alignItems: 'center', gap: 3,
              }}>
                {changePct >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                {formatPercent(changePct)}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {changePct >= 0 ? '+' : ''}{change.toFixed(2)} 오늘
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {metrics.map((m) => (
              <div key={m.label}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{m.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono', marginTop: 2 }}>{m.value}</div>
                {m.sub && <div style={{ fontSize: 10, color: m.sub.includes('▲') ? 'var(--positive)' : 'var(--negative)' }}>{m.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid-4">
        {[
          { label: 'PER', value: stock.pe ? `${stock.pe.toFixed(1)}x` : 'N/A', desc: 'Price/Earnings', color: stock.pe < 25 ? 'var(--positive)' : stock.pe < 40 ? 'var(--warning)' : 'var(--negative)' },
          { label: 'ROE', value: `${stock.roe.toFixed(1)}%`, desc: '자기자본이익률', color: stock.roe >= 15 ? 'var(--positive)' : 'var(--warning)' },
          { label: 'EPS 성장', value: formatPercent(stock.epsGrowthYoy), desc: 'YoY 기준', color: stock.epsGrowthYoy >= 20 ? 'var(--positive)' : stock.epsGrowthYoy < 0 ? 'var(--negative)' : 'var(--warning)' },
          { label: 'Alpha Score', value: String(stock.overallScore), desc: '종합 투자 점수', color: stock.overallScore >= 80 ? 'var(--positive)' : stock.overallScore >= 60 ? 'var(--warning)' : 'var(--negative)' },
        ].map((stat) => (
          <div key={stat.label} className="metric-card">
            <div className="metric-label">{stat.label}</div>
            <div className="metric-value" style={{ color: stat.color, fontSize: 22 }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{stat.desc}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tab-list">
        {tabs.map((t) => (
          <button key={t.id} className={`tab-item${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Price Chart - 실시간 히스토리 */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">{tickerParam.replace('-','.')} 주가 차트 (실시간)</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['1mo','3mo','6mo','1y'] as const).map((p) => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className={`btn btn-sm ${period === p ? 'btn-secondary' : 'btn-ghost'}`}>{p}</button>
                ))}
              </div>
            </div>
            {historyLoading && !historyBars
              ? <div style={{ height: 280, background: 'var(--bg-elevated)', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
              : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={historyBars ?? []} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={changePct >= 0 ? '#3dbb77' : '#e05454'} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={changePct >= 0 ? '#3dbb77' : '#e05454'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date"
                    tickFormatter={(d) => new Date(d).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                    interval={Math.floor((historyBars?.length ?? 30) / 6)} />
                  <YAxis dataKey="close" domain={['auto', 'auto']} tickFormatter={(v) => `$${v.toFixed(0)}`} width={52} />
                  <Tooltip
                    formatter={(v: any) => [`$${Number(v).toFixed(2)}`, '종가']}
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, fontSize: 11 }}
                  />
                  <Area type="monotone" dataKey="close"
                    stroke={changePct >= 0 ? '#3dbb77' : '#e05454'} strokeWidth={1.5}
                    fill="url(#priceGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Key Ratios Grid */}
          <div className="grid-3">
            <div className="card">
              <div className="card-title" style={{ marginBottom: 14 }}>밸류에이션</div>
              {[
                { k: 'PER', v: `${stock.pe.toFixed(1)}x`, good: stock.pe < 25 },
                { k: 'PBR', v: `${stock.pb.toFixed(1)}x`, good: stock.pb < 5 },
                { k: 'PSR', v: `${stock.ps.toFixed(1)}x`, good: stock.ps < 5 },
                { k: 'PEG', v: `${stock.peg.toFixed(2)}x`, good: stock.peg < 1.5 },
                { k: 'EV/EBITDA', v: `${stock.evEbitda.toFixed(1)}x`, good: stock.evEbitda < 15 },
                { k: 'FCF Yield', v: `${stock.fcfYield.toFixed(1)}%`, good: stock.fcfYield > 3 },
              ].map((r) => (
                <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{r.k}</span>
                  <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', fontSize: 13, color: r.good ? 'var(--positive)' : 'var(--text-primary)' }}>{r.v}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-title" style={{ marginBottom: 14 }}>수익성</div>
              {[
                { k: 'ROE', v: `${stock.roe.toFixed(1)}%`, good: stock.roe >= 15 },
                { k: 'ROA', v: `${stock.roa.toFixed(1)}%`, good: stock.roa >= 8 },
                { k: 'ROIC', v: `${stock.roic.toFixed(1)}%`, good: stock.roic >= 12 },
                { k: '매출총이익률', v: `${stock.grossMargin.toFixed(1)}%`, good: stock.grossMargin >= 40 },
                { k: '영업이익률', v: `${stock.operatingMargin.toFixed(1)}%`, good: stock.operatingMargin >= 15 },
                { k: '순이익률', v: `${stock.netMargin.toFixed(1)}%`, good: stock.netMargin >= 10 },
              ].map((r) => (
                <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{r.k}</span>
                  <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', fontSize: 13, color: r.good ? 'var(--positive)' : 'var(--text-primary)' }}>{r.v}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-title" style={{ marginBottom: 14 }}>성장 & 안정성</div>
              {[
                { k: 'EPS 성장(YoY)', v: formatPercent(stock.epsGrowthYoy), good: stock.epsGrowthYoy >= 20 },
                { k: 'EPS 성장(5Y)', v: formatPercent(stock.epsGrowth5y), good: stock.epsGrowth5y >= 15 },
                { k: '매출 성장(YoY)', v: formatPercent(stock.revenueGrowthYoy), good: stock.revenueGrowthYoy >= 10 },
                { k: '부채비율', v: `${stock.debtToEquity.toFixed(1)}%`, good: stock.debtToEquity < 100 },
                { k: '유동비율', v: `${stock.currentRatio.toFixed(2)}`, good: stock.currentRatio >= 1.5 },
                { k: '이자보상배율', v: `${stock.interestCoverage.toFixed(1)}x`, good: stock.interestCoverage >= 5 },
              ].map((r) => (
                <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{r.k}</span>
                  <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', fontSize: 13, color: r.good ? 'var(--positive)' : 'var(--text-primary)' }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'financials' && (
        <div className="grid-2">
          {/* Revenue & EPS Growth */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>매출 성장 추이 (모의)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { year: '2020', revenue: stock.price * 0.5, eps: stock.pe * 0.4 },
                { year: '2021', revenue: stock.price * 0.7, eps: stock.pe * 0.55 },
                { year: '2022', revenue: stock.price * 0.85, eps: stock.pe * 0.7 },
                { year: '2023', revenue: stock.price * 0.95, eps: stock.pe * 0.85 },
                { year: '2024E', revenue: stock.price, eps: stock.pe },
              ]} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="매출" />
                <Bar dataKey="eps" fill="#10b981" radius={[4, 4, 0, 0]} name="EPS" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Margin Trend */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>이익률 트렌드 (모의)</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={[
                { year: '2020', gross: stock.grossMargin * 0.85, operating: stock.operatingMargin * 0.8, net: stock.netMargin * 0.75 },
                { year: '2021', gross: stock.grossMargin * 0.9, operating: stock.operatingMargin * 0.88, net: stock.netMargin * 0.85 },
                { year: '2022', gross: stock.grossMargin * 0.95, operating: stock.operatingMargin * 0.94, net: stock.netMargin * 0.92 },
                { year: '2023', gross: stock.grossMargin * 0.98, operating: stock.operatingMargin * 0.97, net: stock.netMargin * 0.96 },
                { year: '2024E', gross: stock.grossMargin, operating: stock.operatingMargin, net: stock.netMargin },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${v.toFixed(0)}%`} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: any) => [`${Number(v).toFixed(1)}%`]}
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }}
                />
                <Legend />
                <Line type="monotone" dataKey="gross" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="매출총이익률" />
                <Line type="monotone" dataKey="operating" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="영업이익률" />
                <Line type="monotone" dataKey="net" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="순이익률" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Financial Data Table */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-title" style={{ marginBottom: 12 }}>주요 재무 지표</div>
            <div className="scroll-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>지표</th>
                    <th>현재</th>
                    <th>업종 평균</th>
                    <th>평가</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: '순이익률', val: `${stock.netMargin.toFixed(1)}%`, avg: '18.2%', good: stock.netMargin > 18 },
                    { name: 'ROE', val: `${stock.roe.toFixed(1)}%`, avg: '22.4%', good: stock.roe > 22 },
                    { name: 'ROIC', val: `${stock.roic.toFixed(1)}%`, avg: '18.8%', good: stock.roic > 18 },
                    { name: '부채비율', val: `${stock.debtToEquity.toFixed(0)}%`, avg: '85%', good: stock.debtToEquity < 85 },
                    { name: 'EPS 성장 (5Y CAGR)', val: `${stock.epsGrowth5y.toFixed(1)}%`, avg: '12.0%', good: stock.epsGrowth5y > 12 },
                  ].map((r) => (
                    <tr key={r.name}>
                      <td>{r.name}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{r.val}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>{r.avg}</td>
                      <td>
                        <span className={`badge ${r.good ? 'badge-green' : 'badge-red'}`}>
                          {r.good ? '▲ 평균 상회' : '▼ 평균 하회'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dcf' && (
        <div className="grid-2">
          {/* DCF Calculator */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>DCF 내재가치 계산기</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: '주당 FCF ($)', key: 'fcfPerShare', min: 0.1, max: 100, step: 0.5 },
                { label: '성장률 (%)', key: 'growthRate', min: 0, max: 50, step: 1 },
                { label: '영구성장률 (%)', key: 'terminalGrowth', min: 0, max: 5, step: 0.5 },
                { label: '할인율 (WACC, %)', key: 'discountRate', min: 5, max: 20, step: 0.5 },
                { label: '예측 기간 (년)', key: 'years', min: 5, max: 20, step: 1 },
              ].map((p) => (
                <div key={p.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>{p.label}</label>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-blue)', fontFamily: 'JetBrains Mono' }}>
                      {dcfParams[p.key as keyof typeof dcfParams]}
                    </span>
                  </div>
                  <input type="range" min={p.min} max={p.max} step={p.step}
                    value={dcfParams[p.key as keyof typeof dcfParams]}
                    onChange={(e) => setDcfParams((prev) => ({ ...prev, [p.key]: Number(e.target.value) }))}
                    style={{ width: '100%', accentColor: 'var(--accent-blue)' }} />
                </div>
              ))}
            </div>
          </div>

          {/* DCF Result */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{
              background: marginOfSafety > 20 ? 'rgba(16,185,129,0.06)' : marginOfSafety > 0 ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)',
              borderColor: marginOfSafety > 20 ? 'rgba(16,185,129,0.3)' : marginOfSafety > 0 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                DCF 내재가치
              </div>
              <div style={{
                fontSize: 48, fontWeight: 900, fontFamily: 'JetBrains Mono',
                color: marginOfSafety > 20 ? 'var(--positive)' : marginOfSafety > 0 ? 'var(--accent-gold)' : 'var(--negative)',
              }}>
                ${intrinsicValue.toFixed(2)}
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>현재 주가</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono' }}>${stock.price.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>안전마진</span>
                  <span style={{
                    fontSize: 14, fontWeight: 800, fontFamily: 'JetBrains Mono',
                    color: marginOfSafety > 20 ? 'var(--positive)' : marginOfSafety > 0 ? 'var(--accent-gold)' : 'var(--negative)',
                  }}>{marginOfSafety.toFixed(1)}%</span>
                </div>
              </div>
              <div style={{
                marginTop: 16, padding: '12px', borderRadius: 8,
                background: marginOfSafety > 20 ? 'rgba(16,185,129,0.1)' : marginOfSafety > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                fontSize: 13, fontWeight: 600,
                color: marginOfSafety > 20 ? 'var(--positive)' : marginOfSafety > 0 ? 'var(--accent-gold)' : 'var(--negative)',
              }}>
                {marginOfSafety > 20 ? '✅ 매수 적극 검토 — 안전마진 충분'
                  : marginOfSafety > 0 ? '⚠️ 중립 — 소폭 저평가, 추가 분석 필요'
                  : '❌ 고평가 — 현재 가격이 내재가치 초과'}
              </div>
            </div>
            <div className="card">
              <div className="card-title" style={{ marginBottom: 12 }}>DCF 민감도 분석</div>
              <table className="data-table" style={{ fontSize: 11 }}>
                <thead>
                  <tr>
                    <th>성장률</th>
                    <th>할인율 8%</th>
                    <th>할인율 10%</th>
                    <th>할인율 12%</th>
                  </tr>
                </thead>
                <tbody>
                  {[10, 15, 20, 25].map((gr) => (
                    <tr key={gr}>
                      <td style={{ fontWeight: 600 }}>{gr}%</td>
                      {[8, 10, 12].map((dr) => {
                        const v = calcDCF({ ...dcfParams, growthRate: gr, discountRate: dr });
                        const mos = ((v - stock.price) / v * 100);
                        return (
                          <td key={dr} style={{
                            fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 11,
                            color: mos > 15 ? 'var(--positive)' : mos < -10 ? 'var(--negative)' : 'var(--accent-gold)',
                          }}>
                            ${v.toFixed(0)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'technical' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>RSI (14일) — 최근 60일</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={rsiData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date"
                  tickFormatter={(d) => new Date(d).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                  interval={9} />
                <YAxis domain={[0, 100]} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} />
                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '과매수 70', fill: '#ef4444', fontSize: 10 }} />
                <ReferenceLine y={30} stroke="#10b981" strokeDasharray="4 4" label={{ value: '과매도 30', fill: '#10b981', fontSize: 10 }} />
                <Line type="monotone" dataKey="rsi" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="grid-4">
            {[
              { label: 'RSI (14)', value: stock.rsi14.toFixed(1), signal: getRSISignal(stock.rsi14) },
              { label: '52주 고점 대비', value: `${stock.priceVs52wHigh.toFixed(1)}%`, signal: { label: stock.priceVs52wHigh > -5 ? '신고가 근접' : '고점 대비 하락', color: stock.priceVs52wHigh > -5 ? 'var(--positive)' : 'var(--text-muted)' } },
              { label: 'RS Rating', value: String(stock.rs52w), signal: { label: stock.rs52w >= 90 ? '최상위 10%' : stock.rs52w >= 80 ? '상위 20%' : '중간 이하', color: stock.rs52w >= 80 ? 'var(--positive)' : 'var(--text-muted)' } },
              { label: '거래량 vs 평균', value: `${((stock.volume / stock.avgVolume) * 100).toFixed(0)}%`, signal: { label: stock.volume > stock.avgVolume ? '평균 이상' : '평균 이하', color: stock.volume > stock.avgVolume ? 'var(--positive)' : 'var(--text-muted)' } },
            ].map((m) => (
              <div key={m.label} className="metric-card">
                <div className="metric-label">{m.label}</div>
                <div className="metric-value" style={{ fontSize: 22 }}>{m.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: m.signal.color, marginTop: 4 }}>{m.signal.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'scores' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>투자 팩터 점수</div>
            {[
              { label: '품질 (Quality)', score: stock.qualityScore, color: '#3b82f6', desc: 'ROE, ROIC, 이익률 기반' },
              { label: '가치 (Value)', score: stock.valueScore, color: '#10b981', desc: 'PER, PBR, FCF 기반' },
              { label: '모멘텀 (Momentum)', score: stock.momentumScore, color: '#f59e0b', desc: 'RS, RSI, MA 기반' },
              { label: '성장 (Growth)', score: stock.growthScore, color: '#8b5cf6', desc: 'EPS, 매출 성장률 기반' },
              { label: '종합 Alpha Score', score: stock.overallScore, color: '#ef4444', desc: '가중 평균 종합 점수' },
            ].map((f) => (
              <div key={f.label} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.desc}</div>
                  </div>
                  <div style={{
                    fontSize: 22, fontWeight: 900, fontFamily: 'JetBrains Mono',
                    color: f.score >= 80 ? 'var(--positive)' : f.score >= 60 ? 'var(--accent-gold)' : 'var(--negative)',
                  }}>{f.score}</div>
                </div>
                <div className="score-bar" style={{ height: 8 }}>
                  <div className="score-bar-fill" style={{ width: `${f.score}%`, background: f.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>투자 전략별 평가</div>
            {[
              { strategy: '워렌 버핏 가치투자', pass: stock.pe < 25 && stock.roe >= 15 && stock.debtToEquity < 150, criteria: `PER ${stock.pe.toFixed(0)}x · ROE ${stock.roe.toFixed(0)}%` },
              { strategy: 'CANSLIM (O\'Neil)', pass: stock.cEpsGrowthQtr >= 25 && stock.rs52w >= 80, criteria: `EPS성장 ${stock.cEpsGrowthQtr.toFixed(0)}% · RS ${stock.rs52w}` },
              { strategy: '마법공식 (Greenblatt)', pass: stock.magicFormulaRank <= 30, criteria: `MF랭킹 #${stock.magicFormulaRank}` },
              { strategy: '배당성장 투자', pass: stock.dividendYield >= 1.5 && stock.dividendGrowth5y >= 5, criteria: `배당 ${stock.dividendYield.toFixed(1)}% · 5Y성장 ${stock.dividendGrowth5y.toFixed(1)}%` },
              { strategy: '모멘텀 투자', pass: stock.rs52w >= 85 && stock.rsi14 >= 50 && stock.rsi14 <= 75, criteria: `RS ${stock.rs52w} · RSI ${stock.rsi14.toFixed(0)}` },
              { strategy: '고품질 성장', pass: stock.operatingMargin >= 20 && stock.epsGrowthYoy >= 15, criteria: `영업률 ${stock.operatingMargin.toFixed(0)}% · EPS성장 ${stock.epsGrowthYoy.toFixed(0)}%` },
            ].map((s) => (
              <div key={s.strategy} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0', borderBottom: '1px solid var(--border-subtle)',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: s.pass ? 'var(--positive-glow)' : 'rgba(239,68,68,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>
                  {s.pass ? '✅' : '❌'}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.strategy}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.criteria}</div>
                </div>
                <span className={`badge ${s.pass ? 'badge-green' : 'badge-red'} `} style={{ marginLeft: 'auto' }}>
                  {s.pass ? '통과' : '미통과'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>로딩 중...</div>}>
      <AnalysisContent />
    </Suspense>
  );
}
