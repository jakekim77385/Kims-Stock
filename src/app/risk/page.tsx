'use client';
import { usePortfolioStore } from '@/lib/store';
import { calcPortfolioMetrics, calcMaxDrawdown, calcSharpeRatio } from '@/lib/utils';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import { stockUniverse } from '@/lib/mockData';

export default function RiskPage() {
  const { positions } = usePortfolioStore();
  const metrics = calcPortfolioMetrics(positions);

  const totalValue = metrics.totalValue;
  const confidence95 = 1.645;
  const dailyVol = 0.012;
  const varAmount = totalValue * dailyVol * confidence95;
  const varPct = (varAmount / totalValue) * 100;
  const maxDD = 18.4; // mock
  const sharpe = calcSharpeRatio(metrics.totalGainPct);
  const sortino = sharpe * 1.3;
  const beta = 1.08;

  // Sector concentration
  const sectorMap: Record<string, number> = {};
  positions.forEach((p) => {
    const val = p.shares * p.currentPrice;
    sectorMap[p.sector] = (sectorMap[p.sector] || 0) + val;
  });
  const maxSectorConc = Math.max(...Object.values(sectorMap).map((v) => (v / totalValue) * 100));

  // Risk scatter data (mock)
  const scatterData = stockUniverse.slice(0, 12).map((s) => ({
    name: s.ticker,
    risk: 10 + Math.random() * 20,
    return: s.epsGrowthYoy > 0 ? Math.min(s.epsGrowthYoy / 4, 30) : -5 + Math.random() * 10,
  }));

  const risks = [
    {
      label: '일일 VaR (95%)',
      value: `$${varAmount.toFixed(0)}`,
      valuePct: `${varPct.toFixed(2)}%`,
      level: varPct > 3 ? 'high' : varPct > 2 ? 'medium' : 'low',
      desc: '95% 신뢰수준에서 하루 최대 예상 손실',
    },
    {
      label: '최대낙폭 (Max Drawdown)',
      value: `-${maxDD.toFixed(1)}%`,
      valuePct: `고점 대비`,
      level: maxDD > 25 ? 'high' : maxDD > 15 ? 'medium' : 'low',
      desc: '이력 중 고점 대비 최대 하락 폭',
    },
    {
      label: '포트폴리오 베타',
      value: beta.toFixed(2),
      valuePct: 'vs S&P 500',
      level: beta > 1.5 ? 'high' : beta > 1.1 ? 'medium' : 'low',
      desc: '시장 대비 변동성 민감도 (1.0 = 시장과 동일)',
    },
    {
      label: '섹터 집중도',
      value: `${maxSectorConc.toFixed(1)}%`,
      valuePct: '최대 단일 섹터',
      level: maxSectorConc > 50 ? 'high' : maxSectorConc > 35 ? 'medium' : 'low',
      desc: '특정 섹터 과도 집중 위험',
    },
  ];

  const levelColor = { high: 'var(--negative)', medium: 'var(--accent-gold)', low: 'var(--positive)' };
  const levelBg = { high: 'rgba(239,68,68,0.1)', medium: 'rgba(245,158,11,0.1)', low: 'rgba(16,185,129,0.1)' };
  const levelIcon = { high: ShieldAlert, medium: AlertTriangle, low: ShieldCheck };

  // Correlation (mock for holdings)
  const tickers = positions.map((p) => p.ticker);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>위험 관리 대시보드</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          VaR · 최대낙폭 · 베타 · 섹터집중도 · 상관관계 분석
        </p>
      </div>

      {/* Risk Metrics */}
      <div className="grid-4">
        {[
          { label: '샤프 비율', value: sharpe.toFixed(2), desc: '위험조정 수익률', color: sharpe >= 1 ? 'var(--positive)' : sharpe >= 0.5 ? 'var(--accent-gold)' : 'var(--negative)' },
          { label: '소르티노 비율', value: sortino.toFixed(2), desc: '하방위험 조정 수익률', color: sortino >= 1.5 ? 'var(--positive)' : sortino >= 1 ? 'var(--accent-gold)' : 'var(--negative)' },
          { label: '포트폴리오 수익률', value: `${metrics.totalGainPct >= 0 ? '+' : ''}${metrics.totalGainPct.toFixed(2)}%`, desc: '취득원가 대비', color: metrics.totalGainPct >= 0 ? 'var(--positive)' : 'var(--negative)' },
          { label: '보유 종목 수', value: String(positions.length), desc: '분산 투자 수준', color: positions.length >= 10 ? 'var(--positive)' : positions.length >= 5 ? 'var(--accent-gold)' : 'var(--negative)' },
        ].map((m) => (
          <div key={m.label} className="metric-card">
            <div className="metric-label">{m.label}</div>
            <div className="metric-value" style={{ fontSize: 24, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{m.desc}</div>
          </div>
        ))}
      </div>

      {/* Risk Indicators */}
      <div className="grid-4">
        {risks.map((r) => {
          const Icon = levelIcon[r.level as keyof typeof levelIcon];
          return (
            <div key={r.label} className="card" style={{ borderColor: levelColor[r.level as keyof typeof levelColor] + '44' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Icon size={18} color={levelColor[r.level as keyof typeof levelColor]} />
                <span style={{ fontSize: 12, fontWeight: 600, color: levelColor[r.level as keyof typeof levelColor] }}>
                  {r.level === 'high' ? '⚠ 위험' : r.level === 'medium' ? '△ 주의' : '✓ 양호'}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>{r.label}</div>
              <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'JetBrains Mono', color: levelColor[r.level as keyof typeof levelColor] }}>
                {r.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{r.valuePct}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>{r.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Risk/Return Scatter + Correlation */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 4 }}>위험 vs 수익 산포도</div>
          <div className="card-subtitle" style={{ marginBottom: 12 }}>종목별 변동성 대비 기대수익률</div>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="risk" name="위험(변동성)" unit="%" tick={{ fontSize: 11 }} label={{ value: '위험(변동성%)', position: 'bottom', fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis dataKey="return" name="수익률" unit="%" tick={{ fontSize: 11 }} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(v: any, name: any) => [`${Number(v).toFixed(1)}%`, name]}
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }}
              />
              <Scatter data={scatterData} fill="#3b82f6">
                {scatterData.map((d, i) => (
                  <Cell key={i} fill={d.return > 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Correlation Matrix */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 4 }}>포트폴리오 상관관계 매트릭스</div>
          <div className="card-subtitle" style={{ marginBottom: 12 }}>보유 종목 간 상관계수 (1 = 완전 상관)</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 11, width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '4px 6px', color: 'var(--text-muted)' }}></th>
                  {tickers.map((t) => (
                    <th key={t} style={{ padding: '4px 6px', color: 'var(--text-muted)', fontWeight: 600 }}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickers.map((row, ri) => (
                  <tr key={row}>
                    <td style={{ padding: '4px 6px', fontWeight: 700, color: 'var(--accent-blue)' }}>{row}</td>
                    {tickers.map((col, ci) => {
                      const corr = ri === ci ? 1 : (Math.random() * 0.6 + 0.2) * (ri % 2 === ci % 2 ? 1 : -1);
                      const absCorr = Math.abs(corr);
                      return (
                        <td key={col} style={{
                          padding: '6px 8px',
                          textAlign: 'center',
                          background: ri === ci ? 'rgba(59,130,246,0.2)' :
                            absCorr > 0.7 ? 'rgba(239,68,68,0.15)' :
                            absCorr > 0.4 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.08)',
                          borderRadius: 4,
                          fontFamily: 'JetBrains Mono',
                          fontWeight: ri === ci ? 800 : 600,
                          color: ri === ci ? 'var(--accent-blue)' : corr < 0 ? 'var(--positive)' : absCorr > 0.7 ? 'var(--negative)' : 'var(--text-primary)',
                        }}>
                          {ri === ci ? '1.00' : corr.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--positive)', marginRight: 8 }}>■ 낮은 상관 (분산효과 ↑)</span>
            <span style={{ color: 'var(--accent-gold)', marginRight: 8 }}>■ 중간 상관</span>
            <span style={{ color: 'var(--negative)' }}>■ 높은 상관 (분산효과 ↓)</span>
          </div>
        </div>
      </div>

      {/* Risk Tips */}
      <div className="card" style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <div className="card-title" style={{ marginBottom: 12, color: 'var(--accent-blue)' }}>💡 위험 관리 체크리스트</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { title: '분산투자', items: ['섹터당 최대 30% 이하', '단일 종목 최대 15% 이하', '최소 10~15개 종목 보유'] },
            { title: '손절 규칙', items: ['개별 종목 -8% 자동 검토', '포트폴리오 -15% 재평가', '주력 종목 변동 시 재검토'] },
            { title: '리밸런싱', items: ['분기 1회 정기 리밸런싱', '섹터 배분 목표치 유지', '수익 실현 후 재투자'] },
          ].map((section) => (
            <div key={section.title}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{section.title}</div>
              {section.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--positive)' }}>✓</span>
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
