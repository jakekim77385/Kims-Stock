'use client';
import { useState } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { usePortfolioStore } from '@/lib/store';
import { calcPortfolioMetrics, formatPercent, formatCurrency, calcSharpeRatio } from '@/lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#84cc16'];

export default function PortfolioPage() {
  const { positions, addPosition, removePosition } = usePortfolioStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ ticker: '', name: '', shares: '', avgCost: '', currentPrice: '', sector: '', purchaseDate: '' });

  const metrics = calcPortfolioMetrics(positions);
  const sharpe = calcSharpeRatio(metrics.totalGainPct);

  // Sector allocation
  const sectorMap: Record<string, number> = {};
  positions.forEach((p) => {
    const val = p.shares * p.currentPrice;
    sectorMap[p.sector] = (sectorMap[p.sector] || 0) + val;
  });
  const sectorData = Object.entries(sectorMap).map(([sector, value]) => ({
    sector,
    value,
    pct: (value / metrics.totalValue) * 100,
  }));

  // Performance history (mock)
  const perfHistory = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const factor = 0.95 + (i / 30) * 0.07 + (Math.random() - 0.48) * 0.02;
    return {
      date: date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
      portfolio: metrics.totalValue * factor,
      sp500: metrics.totalCost * (0.97 + (i / 30) * 0.05),
    };
  });

  const handleAdd = () => {
    if (!form.ticker || !form.shares || !form.avgCost) return;
    addPosition({
      ticker: form.ticker.toUpperCase(),
      name: form.name || form.ticker.toUpperCase(),
      shares: Number(form.shares),
      avgCost: Number(form.avgCost),
      currentPrice: Number(form.currentPrice) || Number(form.avgCost),
      sector: form.sector || 'Other',
      purchaseDate: form.purchaseDate || new Date().toISOString().split('T')[0],
    });
    setForm({ ticker: '', name: '', shares: '', avgCost: '', currentPrice: '', sector: '', purchaseDate: '' });
    setShowAddForm(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>포트폴리오 관리</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>수익률 추적 · 섹터 배분 · 위험 분석</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={15} /> 종목 추가
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="card" style={{ border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.05)' }}>
          <div className="card-title" style={{ marginBottom: 16 }}>새 종목 추가</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: '티커 *', key: 'ticker', placeholder: 'AAPL' },
              { label: '종목명', key: 'name', placeholder: 'Apple Inc.' },
              { label: '주수 *', key: 'shares', placeholder: '10', type: 'number' },
              { label: '평균단가 * ($)', key: 'avgCost', placeholder: '180.00', type: 'number' },
              { label: '현재가 ($)', key: 'currentPrice', placeholder: '189.00', type: 'number' },
              { label: '섹터', key: 'sector', placeholder: 'Technology' },
              { label: '매수일', key: 'purchaseDate', placeholder: '2024-01-01', type: 'date' },
            ].map((f) => (
              <div key={f.key}>
                <label className="form-label">{f.label}</label>
                <input className="input" type={f.type || 'text'} placeholder={f.placeholder}
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleAdd}>추가 확인</button>
            <button className="btn btn-ghost" onClick={() => setShowAddForm(false)}>취소</button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid-4">
        {[
          { label: '포트폴리오 총가치', value: formatCurrency(metrics.totalValue, 0).replace('$', '$').replace(/\B(?=(\d{3})+(?!\d))/g, ','),
            rawValue: metrics.totalValue, prefix: '$' },
          { label: '총 손익', value: `${metrics.totalGain >= 0 ? '+' : ''}$${Math.abs(metrics.totalGain).toFixed(0)}`, color: metrics.totalGain >= 0 ? 'var(--positive)' : 'var(--negative)' },
          { label: '수익률', value: formatPercent(metrics.totalGainPct), color: metrics.totalGainPct >= 0 ? 'var(--positive)' : 'var(--negative)' },
          { label: '샤프 비율', value: sharpe.toFixed(2), color: sharpe >= 1 ? 'var(--positive)' : sharpe >= 0.5 ? 'var(--accent-gold)' : 'var(--negative)', desc: '위험조정 수익률' },
        ].map((m, i) => (
          <div key={i} className="metric-card">
            <div className="metric-label">{m.label}</div>
            <div className="metric-value" style={{ fontSize: 22, color: (m as { color?: string }).color || 'var(--text-primary)' }}>
              {m.value}
            </div>
            {(m as { desc?: string }).desc && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{(m as { desc: string }).desc}</div>}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        {/* Performance Chart */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>포트폴리오 vs S&P 500 (30일)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={perfHistory} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="spGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" interval={4} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: any, name: any) => [`$${Number(v).toFixed(0)}`, String(name) === 'portfolio' ? '내 포트폴리오' : 'S&P 500 기준']}
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }}
              />
              <Legend formatter={(v) => v === 'portfolio' ? '내 포트폴리오' : 'S&P 500 기준'} />
              <Area type="monotone" dataKey="portfolio" stroke="#10b981" strokeWidth={2} fill="url(#portGrad)" dot={false} />
              <Area type="monotone" dataKey="sp500" stroke="#3b82f6" strokeWidth={1.5} fill="url(#spGrad)" dot={false} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sector Pie */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>섹터 배분</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={sectorData} dataKey="value" nameKey="sector" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {sectorData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => [`$${Number(v).toFixed(0)}`, '가치']}
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sectorData.map((s, i) => (
              <div key={s.sector} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                <span style={{ fontSize: 11, flex: 1 }}>{s.sector}</span>
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{s.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span className="card-title">보유 종목 ({positions.length}개)</span>
        </div>
        <div className="scroll-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>종목</th>
                <th>섹터</th>
                <th>주수</th>
                <th>평균단가</th>
                <th>현재가</th>
                <th>평가액</th>
                <th>손익</th>
                <th>수익률</th>
                <th>비중</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => {
                const value = p.shares * p.currentPrice;
                const cost = p.shares * p.avgCost;
                const gain = value - cost;
                const gainPct = (gain / cost) * 100;
                const weight = (value / metrics.totalValue) * 100;
                return (
                  <tr key={p.id}>
                    <td style={{ paddingLeft: 20 }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{p.ticker}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.name}</div>
                    </td>
                    <td><span className="tag">{p.sector}</span></td>
                    <td style={{ fontFamily: 'JetBrains Mono' }}>{p.shares}</td>
                    <td style={{ fontFamily: 'JetBrains Mono' }}>${p.avgCost.toFixed(2)}</td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>${p.currentPrice.toFixed(2)}</td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 700 }}>${value.toFixed(0)}</td>
                    <td style={{ fontFamily: 'JetBrains Mono', color: gain >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                      {gain >= 0 ? '+' : ''}${gain.toFixed(0)}
                    </td>
                    <td>
                      <span className={`badge ${gainPct >= 0 ? 'badge-green' : 'badge-red'}`}>
                        {gainPct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {formatPercent(gainPct)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="score-bar" style={{ width: 60 }}>
                          <div className="score-bar-fill" style={{ width: `${weight}%`, background: '#3b82f6' }} />
                        </div>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>{weight.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td style={{ paddingRight: 16 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => removePosition(p.id)}>
                        <Trash2 size={13} color="var(--negative)" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
