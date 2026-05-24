'use client';
import { useState, useEffect } from 'react';
import { 
  RefreshCw, TrendingUp, TrendingDown, Info, ShieldAlert,
  ArrowRightLeft, Landmark, Coins, Globe, CircleDollarSign, CheckCircle2,
  AlertTriangle, ShieldCheck
} from 'lucide-react';
import { useComparison, type AssetRow } from '@/lib/hooks';

interface MoneyFlowData {
  riskMode: 'risk-on' | 'neutral' | 'risk-off';
  riskScore: number;
  riskLabel: string;
  assetFlows: { name: string; category: string; ytd: number; changePct: number; flow: string }[];
  updatedAt: string;
}

export default function MacroAnalysis() {
  const { data: compData, loading: compLoading, refresh: refreshComp } = useComparison();
  const [mfData, setMfData] = useState<MoneyFlowData | null>(null);
  const [mfLoading, setMfLoading] = useState(true);

  const loadMoneyFlow = async () => {
    setMfLoading(true);
    try {
      const r = await fetch('/api/moneyflow');
      if (r.ok) {
        const j = await r.json();
        setMfData(j);
      }
    } catch (e) {
      console.error('Failed to load moneyflow', e);
    } finally {
      setMfLoading(false);
    }
  };

  useEffect(() => {
    loadMoneyFlow();
  }, []);

  const refreshAll = () => {
    refreshComp();
    loadMoneyFlow();
  };

  const loading = compLoading || mfLoading;

  if (loading && (!compData || !mfData)) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#bbb', fontSize: 12 }}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block', color: 'var(--accent)' }} />
        글로벌 거시 경제(Macro) 판도 분석 중...
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const rows = compData?.rows ?? [];
  
  // ─── 지표 그룹핑 ─────────────────────────────────────────────────────────────
  const nasdaq = rows.find(r => r.ticker === 'COMP');
  const sp500 = rows.find(r => r.ticker === 'SPX');
  const dow = rows.find(r => r.ticker === 'DJI');
  const russell = rows.find(r => r.ticker === 'RUT');
  
  const nikkei = rows.find(r => r.ticker === 'NKY');
  const hangseng = rows.find(r => r.ticker === 'HSI');
  const ftse = rows.find(r => r.ticker === 'UKX');
  
  const tnx = rows.find(r => r.ticker === '10Y');
  const vix = rows.find(r => r.ticker === 'VIX');
  
  const gold = rows.find(r => r.ticker === 'GOLD');
  const silver = rows.find(r => r.ticker === 'SLVR');
  const wti = rows.find(r => r.ticker === 'WTI');
  
  const dxy = rows.find(r => r.ticker === 'DXY');
  const usdjpy = rows.find(r => r.ticker === 'JPY');
  const eurusd = rows.find(r => r.ticker === 'EUR');
  
  const btc = mfData?.assetFlows.find(f => f.name.toLowerCase().includes('bitcoin'));
  const eth = mfData?.assetFlows.find(f => f.name.toLowerCase().includes('ethereum'));

  // ─── 동적 현금 비중 계산기 (Quantitative Model) ──────────────────────────────
  const dxyValue = dxy?.value ?? 104;
  const dxyPremium = dxyValue > 104.5 ? 5 : 0;
  
  const tnxValue = tnx?.value ?? 4.4;
  const tnxPremium = tnxValue > 4.5 ? 5 : 0;
  
  const vixValue = vix?.value ?? 17;
  const vixPremium = vixValue < 14 ? 10 : vixValue > 24 ? -10 : 0;
  
  const spxPos = sp500 && (sp500.high52w - sp500.low52w) > 0 
    ? ((sp500.value - sp500.low52w) / (sp500.high52w - sp500.low52w)) * 100 
    : 80;
  const pricePremium = spxPos > 85 ? 10 : spxPos < 40 ? -5 : 0;

  const recommendedCash = Math.max(10, Math.min(50, 20 + dxyPremium + tnxPremium + vixPremium + pricePremium));
  const recommendedStock = 100 - recommendedCash;

  const macroScore = mfData?.riskScore ?? 0;
  const isHighRisk = recommendedCash >= 35;

  // ─── 동적 금리/FOMC 전망 모델링 ──────────────────────────────────────────────
  let cutProb = Math.max(5, Math.min(95, Math.round((4.95 - tnxValue) * 120)));
  const pauseProb = 100 - cutProb;
  
  const fedStanceScore = Math.max(-5, Math.min(5, Math.round((4.25 - tnxValue) * 5)));
  const fedStanceLabel = 
    fedStanceScore <= -3 ? '매파적 (Hawkish)' : 
    fedStanceScore <= -1 ? '약한 매파적' : 
    fedStanceScore >= 3 ? '비둘기파적 (Dovish)' : 
    fedStanceScore >= 1 ? '약한 비둘기파적' : '중립적';

  // ─── 실시간 동적 매크로 이슈 위험도 분석 (Qualitative Logic) ───────────────────
  const goldFlow = mfData?.assetFlows.find(f => f.name.toLowerCase().includes('gold') || f.name.includes('금'));
  const goldYtd = goldFlow?.ytd ?? 0;
  const wtiValue = wti?.value ?? 78;

  // 1. 지정학 리스크 점수 산출
  const geoRiskLevel = (vixValue > 22 || goldYtd > 15 || wtiValue > 82) ? 'Critical' : (vixValue > 16 || wtiValue > 78) ? 'High' : 'Moderate';
  const geoRiskColor = geoRiskLevel === 'Critical' ? 'var(--negative)' : geoRiskLevel === 'High' ? '#d97706' : '#15803d';

  // 2. 금리/재정 리스크 점수 산출
  const fiscalRiskLevel = (tnxValue > 4.65) ? 'Critical' : (tnxValue > 4.4) ? 'High' : 'Moderate';
  const fiscalRiskColor = fiscalRiskLevel === 'Critical' ? 'var(--negative)' : fiscalRiskLevel === 'High' ? '#d97706' : '#15803d';

  return (
    <div>
      {/* ── 헤더 ── */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '12px 20px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' 
      }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            🌐 실시간 글로벌 거시(Macro) 판도 분석
          </span>
          <span style={{ fontSize: 10, color: '#999', marginTop: 2, display: 'block' }}>
            환율 · 금리 · 글로벌 주식 · 원자재 · 크립토 복합 판도 및 포지셔닝 모델링
          </span>
        </div>
        <button 
          onClick={refreshAll} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600,
            color: '#6b7280', background: 'white', border: '1px solid #d1d5db', 
            borderRadius: 5, cursor: 'pointer', padding: '5px 10px', fontFamily: 'inherit',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}
        >
          <RefreshCw size={11} /> 전체 갱신
        </button>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* ── 상단 2열 요약 대시보드 ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
          
          {/* ① 권장 자산 포지셔닝 & 현금 비중 가이드 */}
          <div style={{ 
            padding: 20, border: '1px solid var(--border-subtle)', borderRadius: 10, 
            background: 'linear-gradient(135deg, #f8faff 0%, #f1f5f9 100%)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1e3a8a', background: '#dbeafe', padding: '2px 8px', borderRadius: 15 }}>
                  포지셔닝 권고 모델
                </span>
                <span style={{ fontSize: 10, color: '#64748b' }}>
                  미국 S&P 500 위치: {spxPos.toFixed(0)}% (고가 영역)
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', margin: '10px 0' }}>
                {/* 원형 그래프 시뮬레이션 */}
                <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
                  <svg width="90" height="90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--accent)" strokeWidth="3" 
                      strokeDasharray={`${recommendedStock} ${recommendedCash}`} strokeDashoffset="25" />
                  </svg>
                  <div style={{ 
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>
                      {recommendedStock}:{recommendedCash}
                    </span>
                    <span style={{ fontSize: 8, color: '#64748b', fontWeight: 600 }}>주식:현금</span>
                  </div>
                </div>
                
                {/* 권장 현금 비중 텍스트 */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    권장 현금 비중: <span style={{ color: isHighRisk ? 'var(--negative)' : 'var(--positive)' }}>{recommendedCash}%</span>
                  </h3>
                  <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.6, marginTop: 6, margin: '6px 0 0' }}>
                    {isHighRisk 
                      ? `⚠️ 지수가 52주 고점 근처(${spxPos.toFixed(0)}%)이고 연준 고금리가 장기화됨에 따라 현금을 ${recommendedCash}% 수준으로 두텁게 확보해 변동성에 대응할 때입니다.`
                      : `✅ 시장 변동성이 안정화되고 밸류에이션 매력도가 상승하여 현금 비중을 ${recommendedCash}% 수준으로 소폭 낮추고 우량 주식 포지션을 늘리기에 적합합니다.`}
                  </p>
                </div>
              </div>
            </div>

            {/* 자산 관리 팁 */}
            <div style={{ 
              marginTop: 10, padding: '10px 12px', background: 'white', borderRadius: 8, 
              border: '1px solid #e2e8f0', display: 'flex', gap: 8, alignItems: 'flex-start' 
            }}>
              <Landmark size={14} style={{ color: '#1e3a8a', flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 10.5, color: '#334155', lineHeight: 1.5 }}>
                <strong>거시 대응 팁:</strong> 현시점 고금리 혜택을 주는 초단기 채권(SGOV) 또는 머니마켓(MMF)에 현금성 자산을 {recommendedCash}% 예치해두고, S&P 500 조정 또는 VIX 25 돌파 시 우량 빅테크 분할 매수 실탄으로 대기해 두세요.
              </span>
            </div>
          </div>

          {/* ② 거시 종합 판도 점수 */}
          <div style={{ 
            padding: 20, border: '1px solid var(--border-subtle)', borderRadius: 10, 
            background: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>거시 경제 심리 환경</span>
                <span style={{ fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Info size={11} /> 7대 매크로 팩터 가중치 모델
                </span>
              </div>

              <div style={{ textAlign: 'center', margin: '10px 0' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>종합 판도 스코어</span>
                <h2 style={{ 
                  fontSize: 24, fontWeight: 900, margin: '2px 0 6px',
                  color: macroScore >= 3 ? 'var(--positive)' : macroScore <= -3 ? 'var(--negative)' : '#d97706'
                }}>
                  {mfData?.riskLabel ?? '중립 지대'}
                </h2>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <span>매크로 위험 선호 점수:</span>
                  <strong style={{ 
                    fontSize: 13.5, 
                    color: macroScore > 0 ? 'var(--positive)' : macroScore < 0 ? 'var(--negative)' : '#d97706',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}>
                    {macroScore > 0 ? '+' : ''}{macroScore}
                  </strong>
                  <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 500 }}>(범위: -10 ~ +10)</span>
                </div>
              </div>
            </div>

            {/* 온도계형 게이지 */}
            <div style={{ marginTop: 12 }}>
              <div style={{ height: 10, borderRadius: 5, background: 'linear-gradient(90deg, var(--negative) 0%, #fffbeb 50%, var(--positive) 100%)', position: 'relative' }}>
                <div style={{ 
                  position: 'absolute', top: -3, width: 16, height: 16, borderRadius: '50%',
                  background: 'white', border: '3px solid #1e293b', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  left: `calc(${((macroScore + 10) / 20) * 100}% - 8px)`, transition: 'left 0.3s ease'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', marginTop: 6 }}>
                <span style={{ color: 'var(--negative)', fontWeight: 700 }}>위험회피 (Risk-Off)</span>
                <span>중립</span>
                <span style={{ color: 'var(--positive)', fontWeight: 700 }}>위험선호 (Risk-On)</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── 🏛️ 연준 금리 전망 & FOMC Watch ── */}
        <div style={{ 
          padding: '16px 20px', border: '1px solid #fde68a', borderRadius: 10, 
          background: '#fffbeb', display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr 1fr', gap: 20,
          alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
        }}>
          {/* 1. 현재 금리 & 연준 기조 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#78350f', background: '#fef3c7', padding: '1px 5px', borderRadius: 3 }}>POLICY RATE</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#78350f' }}>연준 기준 금리</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#451a03', fontFamily: 'JetBrains Mono' }}>
              5.25% ~ 5.50%
            </div>
            <div style={{ fontSize: 10.5, color: '#78350f', marginTop: 3 }}>
              기조: <strong style={{ color: fedStanceScore < 0 ? 'var(--negative)' : 'var(--positive)' }}>{fedStanceLabel}</strong>
            </div>
          </div>

          {/* 2. 차기 FOMC 예측 확률 바 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 700, color: '#78350f', marginBottom: 6 }}>
              <span>차기 FOMC 금리 예측 (6월 예정)</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>동결 {pauseProb}% vs 인하 {cutProb}%</span>
            </div>
            <div style={{ height: 10, background: '#e2e8f0', borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${pauseProb}%`, height: '100%', background: '#b45309', transition: 'width 0.3s' }} title={`동결: ${pauseProb}%`} />
              <div style={{ width: `${cutProb}%`, height: '100%', background: '#16803c', transition: 'width 0.3s' }} title={`인하: ${cutProb}%`} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, color: '#78350f', marginTop: 4, fontWeight: 600 }}>
              <span>동결 지배적 ({pauseProb >= 50 ? '유력' : '주의'})</span>
              <span>인하 기대 ({cutProb >= 50 ? '유력' : '낮음'})</span>
            </div>
          </div>

          {/* 3. 연내 남은 인하 횟수 전망 */}
          <div style={{ borderLeft: '1px solid #fde68a', paddingLeft: 20 }}>
            <span style={{ fontSize: 9.5, color: '#78350f', fontWeight: 600 }}>연내 잔여 금리 인하 기대</span>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#451a03', marginTop: 4 }}>
              {cutProb > 45 ? '총 2회 인하 전망' : cutProb > 15 ? '총 1회 인하 전망' : '인하 보류 (동결 지속)'}
            </div>
            <span style={{ fontSize: 9, color: '#b45309', display: 'block', marginTop: 2 }}>
              {cutProb > 15 ? '연말 단계적 피봇 예상' : '고물가에 의한 장기 동결'}
            </span>
          </div>

          {/* 4. 장단기 금리차 (10Y - 2Y) */}
          <div style={{ borderLeft: '1px solid #fde68a', paddingLeft: 20 }}>
            <span style={{ fontSize: 9.5, color: '#78350f', fontWeight: 600 }}>장단기 금리차 (10Y-2Y)</span>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--negative)', marginTop: 4, fontFamily: 'JetBrains Mono' }}>
              -0.36%pt
            </div>
            <span style={{ fontSize: 9, color: '#b45309', display: 'block', marginTop: 2 }}>
              역전 현상 지속 (경기침체 경보)
            </span>
          </div>

        </div>

        {/* ── 📝 [NEW] 글로벌 & 미국 주요 마켓 이슈 분석기 ── */}
        <div style={{ 
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
          border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 20, background: 'white'
        }}>
          {/* A. 글로벌 / 국제적 이슈 분석 */}
          <div style={{ paddingRight: 8 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 12px' }}>
              <Globe size={14} /> 🌐 국제적 이슈 & 지정학 리스크
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* 이슈 1 */}
              <div style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: 6, borderLeft: `3px solid ${geoRiskColor}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>1. 중동 & 유럽 지정학적 군사 갈등</span>
                  <span style={{ fontSize: 8.5, fontWeight: 700, color: geoRiskColor, background: geoRiskLevel === 'Moderate' ? '#f0fdf4' : '#fef2f2', padding: '1px 5px', borderRadius: 3 }}>
                    위험: {geoRiskLevel}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, lineHeight: 1.4 }}>
                  • **현황:** 우크라이나 장기전 및 중동 물류 통로 불안 지속.<br />
                  • <strong style={{ color: '#475569' }}>증시 영향:</strong> 유가({wtiValue.toFixed(1)}$) 및 안전자산 금 가격 급등세 유도, 해운 운임비 자극으로 물가 불확실성 상존.
                </div>
              </div>
              
              {/* 이슈 2 */}
              <div style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: 6, borderLeft: '3px solid #d97706' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>2. 글로벌 공급망 재편 및 관세 갈등</span>
                  <span style={{ fontSize: 8.5, fontWeight: 700, color: '#d97706', background: '#fffbeb', padding: '1px 5px', borderRadius: 3 }}>
                    위험: High
                  </span>
                </div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, lineHeight: 1.4 }}>
                  • **현황:** 반도체/배터리 자국 우선주의 및 미-중 무역 분쟁 확산.<br />
                  • <strong style={{ color: '#475569' }}>증시 영향:</strong> 빅테크 하드웨어 공급 지연 요인, 다국적 기업의 마진 압박 및 생산 시설 이전 비용 가중.
                </div>
              </div>
              
              {/* 이슈 3 */}
              <div style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: 6, borderLeft: '3px solid #15803d' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>3. 글로벌 통화 완화 공조 (중국/유럽)</span>
                  <span style={{ fontSize: 8.5, fontWeight: 700, color: '#15803d', background: '#f0fdf4', padding: '1px 5px', borderRadius: 3 }}>
                    위험: 호재 (Moderate)
                  </span>
                </div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, lineHeight: 1.4 }}>
                  • **현황:** 유럽중앙은행(ECB)의 인하 공조 및 중국 경기 부양 통화 공급.<br />
                  • <strong style={{ color: '#475569' }}>증시 영향:</strong> 글로벌 외화 유동성 보강, 미국외 글로벌 지수 하방 지지 역할. 엔캐리 트레이드 청산 리스크 모니터링 필요.
                </div>
              </div>
            </div>
          </div>
          
          {/* B. 미국내 주요 이슈 분석 */}
          <div style={{ paddingLeft: 8, borderLeft: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#9d174d', display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 12px' }}>
              <Landmark size={14} /> 🇺🇸 미국내 핵심 경제 & 정치 이슈
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* 이슈 1 */}
              <div style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: 6, borderLeft: `3px solid ${fiscalRiskColor}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>1. 연준의 고금리 장기화 기조 (Higher for Longer)</span>
                  <span style={{ fontSize: 8.5, fontWeight: 700, color: fiscalRiskColor, background: fiscalRiskLevel === 'Moderate' ? '#f0fdf4' : '#fef2f2', padding: '1px 5px', borderRadius: 3 }}>
                    위험: {fiscalRiskLevel}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, lineHeight: 1.4 }}>
                  • **현황:** 인플레이션 고착화 대응으로 금리 인하 예상 시점 지연.<br />
                  • <strong style={{ color: '#475569' }}>증시 영향:</strong> 고밸류 기술주의 PER 멀티플 할인 압박 및 일반 기업 신규 채무 조달 비용 상승 장기화.
                </div>
              </div>
              
              {/* 이슈 2 */}
              <div style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: 6, borderLeft: '3px solid #d97706' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>2. 미 재정 적자 및 국채 발행 규모 확대</span>
                  <span style={{ fontSize: 8.5, fontWeight: 700, color: '#d97706', background: '#fffbeb', padding: '1px 5px', borderRadius: 3 }}>
                    위험: High
                  </span>
                </div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, lineHeight: 1.4 }}>
                  • **현황:** 연방 부채 한도 증가에 따른 장기 국채 대규모 공급.<br />
                  • <strong style={{ color: '#475569' }}>증시 영향:</strong> 국채 물량 부담으로 인한 장기 금리({tnxValue.toFixed(2)}%) 하방 경직성 및 시장의 대규모 자금 흡수(크라우딩 아웃).
                </div>
              </div>
              
              {/* 이슈 3 */}
              <div style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: 6, borderLeft: '3px solid #15803d' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>3. 견조한 고용 탄력성 & 경기 연착륙</span>
                  <span style={{ fontSize: 8.5, fontWeight: 700, color: '#15803d', background: '#f0fdf4', padding: '1px 5px', borderRadius: 3 }}>
                    위험: 안전 (Moderate)
                  </span>
                </div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, lineHeight: 1.4 }}>
                  • **현황:** 강한 노동 시장 복원력 유지 및 견고한 GDP 성장률.<br />
                  • <strong style={{ color: '#475569' }}>증시 영향:</strong> 경기 불황(Recession) 위험을 전격적으로 낮추어 빅테크 및 소비재 기업의 기본 이익(EPS) 성장을 강력 지지.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 하단 거시 5대 동향 상세 분석 그리드 ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          
          {/* 1. 나스닥 & 글로벌 주식 */}
          <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, background: '#fafafa', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', background: 'white', display: 'flex', alignItems: 'center', gap: 6, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
              <Globe size={13} color="#1d4ed8" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#1e3a8a' }}>글로벌 주식 판세</span>
            </div>
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, flex: 1, justifyContent: 'space-between' }}>
              <div>
                {/* 나스닥 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>나스닥 100</span>
                  <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: (nasdaq?.changePct ?? 0) >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                    {(nasdaq?.changePct ?? 0) >= 0 ? '+' : ''}{(nasdaq?.changePct ?? 0).toFixed(2)}%
                  </span>
                </div>
                {/* S&P 500 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: '#475569' }}>S&P 500</span>
                  <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: (sp500?.changePct ?? 0) >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                    {(sp500?.changePct ?? 0) >= 0 ? '+' : ''}{(sp500?.changePct ?? 0).toFixed(2)}%
                  </span>
                </div>
                {/* 러셀 소형주 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: '#475569' }}>러셀 2000</span>
                  <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: (russell?.changePct ?? 0) >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                    {(russell?.changePct ?? 0) >= 0 ? '+' : ''}{(russell?.changePct ?? 0).toFixed(2)}%
                  </span>
                </div>
                {/* 니케이 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>니케이 225</span>
                  <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: (nikkei?.changePct ?? 0) >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                    {(nikkei?.changePct ?? 0) >= 0 ? '+' : ''}{(nikkei?.changePct ?? 0).toFixed(2)}%
                  </span>
                </div>
                {/* 항셍 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>항셍 지수</span>
                  <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: (hangseng?.changePct ?? 0) >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                    {(hangseng?.changePct ?? 0) >= 0 ? '+' : ''}{(hangseng?.changePct ?? 0).toFixed(2)}%
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 9.5, color: '#64748b', lineHeight: 1.4, borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 8 }}>
                💡 <strong>판도 분석:</strong> {(nasdaq?.changePct ?? 0) > (russell?.changePct ?? 0) ? '빅테크 대형주 쏠림 현상 지속. 소형주 상승 둔화로 낙폭 대비 주의.' : '소형주 주도 순환매 포지션 확대 중.'}
              </div>
            </div>
          </div>

          {/* 2. 금리 & 채권 */}
          <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, background: '#fafafa', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', background: 'white', display: 'flex', alignItems: 'center', gap: 6, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
              <Landmark size={13} color="#d97706" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309' }}>금리 & 채권 변동</span>
            </div>
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, flex: 1, justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>미 10년물 금리</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono', color: '#0f172a' }}>
                    {tnx?.value.toFixed(2)}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 9, color: '#64748b' }}>일간 변동</span>
                  <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: (tnx?.changePct ?? 0) >= 0 ? 'var(--negative)' : 'var(--positive)' }}>
                    {(tnx?.changePct ?? 0) >= 0 ? '▲' : '▼'} {(tnx?.changePct ?? 0).toFixed(2)}%
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>VIX 공포지수</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono', color: vixValue >= 22 ? 'var(--negative)' : '#0f172a' }}>
                    {vix?.value.toFixed(1)}pt
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 9, color: '#64748b' }}>변동성 위험</span>
                  <span style={{ fontSize: 9.5, fontWeight: 600, color: vixValue >= 25 ? 'var(--negative)' : vixValue >= 18 ? '#d97706' : 'var(--positive)' }}>
                    {vixValue >= 25 ? '고공포' : vixValue >= 18 ? '중도 주의' : '안정 국면'}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 9.5, color: '#64748b', lineHeight: 1.4, borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 8 }}>
                💡 <strong>판도 분석:</strong> 10년물 금리가 {tnxValue.toFixed(2)}% 선에 위치하여 주식 멀티플 할인 압박을 {tnxValue > 4.5 ? '고강도로 주는 중.' : '안만하게 지지하는 수준.'}
              </div>
            </div>
          </div>

          {/* 3. 환율 (DXY / 주요 환율) */}
          <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, background: '#fafafa', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', background: 'white', display: 'flex', alignItems: 'center', gap: 6, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
              <ArrowRightLeft size={13} color="#7c3aed" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9' }}>환율 & 달러 판세</span>
            </div>
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, flex: 1, justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>달러 인덱스</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono', color: dxyValue > 105 ? 'var(--negative)' : '#0f172a' }}>
                    {dxy?.value.toFixed(2)}pt
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 9, color: '#64748b' }}>달러 추이</span>
                  <span style={{ fontSize: 9.5, fontWeight: 600, color: dxyValue > 105 ? 'var(--negative)' : 'var(--positive)' }}>
                    {dxyValue > 105 ? '강달러 (압박)' : '안정적 달러화'}
                  </span>
                </div>

                {/* 엔화 및 유로화 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <span style={{ fontSize: 11, color: '#475569' }}>USD/JPY</span>
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{usdjpy?.value.toFixed(1)} ¥</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: '#475569' }}>EUR/USD</span>
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>${eurusd?.value.toFixed(4)}</span>
                </div>
              </div>
              <div style={{ fontSize: 9.5, color: '#64748b', lineHeight: 1.4, borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 8 }}>
                💡 <strong>판도 분석:</strong> 달러인덱스 {dxyValue.toFixed(1)} 수준으로 신흥국 자금 이탈 강도 {dxyValue > 105 ? '상승 중.' : '보통 수준 유지.'}
              </div>
            </div>
          </div>

          {/* 4. 원자재 & 금/은 */}
          <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, background: '#fafafa', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', background: 'white', display: 'flex', alignItems: 'center', gap: 6, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
              <CircleDollarSign size={13} color="#16803c" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d' }}>원자재 & 실물자산</span>
            </div>
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, flex: 1, justifyContent: 'space-between' }}>
              <div>
                {/* 금 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>금 (Gold)</span>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
                    ${gold?.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 9, color: '#64748b' }}>일간 변동</span>
                  <span style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono', color: (gold?.changePct ?? 0) >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                    {(gold?.changePct ?? 0) >= 0 ? '+' : ''}{(gold?.changePct ?? 0).toFixed(2)}%
                  </span>
                </div>

                {/* 은 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>은 (Silver)</span>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
                    ${silver?.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 9, color: '#64748b' }}>일간 변동</span>
                  <span style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono', color: (silver?.changePct ?? 0) >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                    {(silver?.changePct ?? 0) >= 0 ? '+' : ''}{(silver?.changePct ?? 0).toFixed(2)}%
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 9.5, color: '#64748b', lineHeight: 1.4, borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 8 }}>
                💡 <strong>금은비 분석:</strong> {(gold && silver && silver.value > 0) ? `금은비 ${(gold.value / silver.value).toFixed(1)}배. 역사적 정상 범위 내에서 ${gold.value / silver.value > 80 ? '은이 상대적 저평가.' : '금이 상대적 저평가.'}` : '실물자산 가격 수집 중.'}
              </div>
            </div>
          </div>

          {/* 5. 암호화폐 */}
          <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, background: '#fafafa', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', background: 'white', display: 'flex', alignItems: 'center', gap: 6, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
              <Coins size={13} color="#f59e0b" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#d97706' }}>투기 & 암호화폐</span>
            </div>
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, flex: 1, justifyContent: 'space-between' }}>
              <div>
                {/* 비트코인 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>Bitcoin</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: '#0f172a' }}>
                    {btc ? `${btc.flow === 'strong-in' || btc.flow === 'in' ? '유입강화' : '유출지배'}` : '조회 중'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 9, color: '#64748b' }}>52주 수익</span>
                  <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: (btc?.ytd ?? 0) >= 0 ? 'var(--positive)' : 'var(--negative)', fontWeight: 600 }}>
                    {(btc?.ytd ?? 0) >= 0 ? '+' : ''}{(btc?.ytd ?? 0).toFixed(1)}%
                  </span>
                </div>

                {/* 이더리움 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>Ethereum</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: '#0f172a' }}>
                    {eth ? `${eth.flow === 'strong-in' || eth.flow === 'in' ? '유입강화' : '유출지배'}` : '조회 중'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 9, color: '#64748b' }}>52주 수익</span>
                  <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: (eth?.ytd ?? 0) >= 0 ? 'var(--positive)' : 'var(--negative)', fontWeight: 600 }}>
                    {(eth?.ytd ?? 0) >= 0 ? '+' : ''}{(eth?.ytd ?? 0).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 9.5, color: '#64748b', lineHeight: 1.4, borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 8 }}>
                💡 <strong>판도 분석:</strong> 크립토 52주 누적 성과가 {(btc?.ytd ?? 0) > 30 ? '엄청난 유동성 유입을 증명하며 위험 선호 지배 중.' : '상승세 둔화 국면.'}
              </div>
            </div>
          </div>

        </div>

        {/* ── 판도 분석 종합 코멘터리 ── */}
        <div style={{ 
          padding: '14px 18px', border: '1px solid #e2e8f0', borderRadius: 8, 
          background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 6 
        }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 5, margin: 0 }}>
            <CheckCircle2 size={13} color="var(--positive)" /> 종합 매크로 판도 리포트
          </h4>
          <p style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.6, margin: 0 }}>
            현재 미국 주식 시장의 전반적인 판도는 **달러 인덱스 {dxyValue.toFixed(1)}pt선** 및 **미국 10년물 금리 {tnxValue.toFixed(2)}%선**의 압박 속에서 움직이고 있습니다.
            지수가 52주 고점의 **{spxPos.toFixed(0)}% 영역**에 위치하고 있으므로, 투자 심리가 비교적 탐욕스러울 때 **현금 비중을 {recommendedCash}% 수준으로 적절히 늘리는 전략**이 장기적으로 높은 방어율을 제공합니다.
            금-은은 인플레이션 헤지성 자금 흐름을 강력히 지지하며, 크립토 판도 역시 위험 선호(Risk-On) 심리의 훌륭한 선행 바로미터 역할을 하고 있습니다.
          </p>
        </div>

      </div>
    </div>
  );
}
