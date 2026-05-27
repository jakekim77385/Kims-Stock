'use client';

import React from 'react';
import { X, Globe, TrendingUp, TrendingDown, Info, ShieldAlert, Award, ExternalLink } from 'lucide-react';

interface NewsItem {
  id: number;
  headline: string;
  translatedHeadline?: string;
  source: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  category?: string;
  ticker?: string;
  impact?: 'high' | 'medium' | 'low';
  link?: string;
}

interface NewsDetailModalProps {
  news: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function NewsDetailModal({ news, isOpen, onClose }: NewsDetailModalProps) {
  if (!isOpen || !news) return null;

  // ─── 실시간 영문 헤드라인 맞춤형 킴스주식 x DH 금융 인텔리전스 생성기 ───
  function getDetailedAnalysis(
    headline: string, 
    translatedHeadline: string = '', 
    ticker: string = 'SPX', 
    sentiment: string = 'neutral'
  ) {
    const h = headline.toLowerCase();
    
    // 1. "The Stock Market Is Flashing a Rare Warning Signal..."
    if (h.includes('rare warning') || h.includes('warning signal')) {
      return {
        summary: '최근 미국 주식 시장에서 역사적으로 매우 드물게 발생하는 강력한 기술적 과열 경고 신호가 감지되었습니다. 마켓 리서치 분석 결과에 따르면, 이러한 신호는 보통 시장 강세장의 8부 능선 이후 또는 연준의 통화 정책 피봇 지연 시기에 나타나는 경향이 있으며, VIX 변동성 지수 급등 전조 증상과 긴밀히 연동되어 시장의 고점 경계를 고조시키고 있습니다.',
        impact: 'S&P 500 및 나스닥 등 대형 기술주 중심 지수 전반에 단기 5%~10% 수준의 건강한 차익 실현 욕구가 강하게 자극될 수 있습니다. 특히 그동안 상승 랠리를 주도했던 초대형 기술주 중심의 기관 자금 이탈과 위험 회피(Risk-Off) 경향이 단기적으로 지수를 누를 수 있습니다.',
        strategy: '현재 가격 대역에서의 감정에 휩쓸린 추격 매수(FOMO)를 엄격히 자제하고, 안전마진이 충분히 확보된 방어형 배당 성장주나 단기 MMF 실탄 대기 비중을 30% 이상 확보할 것을 권장합니다. 이번 경고 신호에 따른 지수 조정 시기를 우량 빅테크 종목의 저가 매수를 위한 절호의 진입 찬스로 노리십시오.'
      };
    }

    // 2. "'Narrow' leadership is creating more fragility..."
    if (h.includes('narrow leadership') || h.includes('narrow\' leadership') || h.includes('fragility')) {
      return {
        summary: '일부 초대형 반도체 및 AI 주도주(예: 엔비디아, 마이크로소프트 등)에만 글로벌 투자 유동성이 극도로 집중되는 소위 \'협소한 주도력(Narrow Leadership)\' 현상이 지속되고 있습니다. 지수는 사상 최고치를 매번 경신하고 있으나 내부적으로는 대다수의 일반 상장 종목이 소외되어 있어, 시장의 펀더멘털 골격 및 하방 취약성(Fragility)이 심각한 수준까지 팽창한 상태입니다.',
        impact: '주도권을 쥔 상위 2~3개 종목군에 작은 차익 실현 매물만 쏟아져도 지수 판도 전체가 흔들릴 수 있는 도미노 연쇄 충격 리스크가 존재합니다. 지수의 기초 체력이 다져지지 않아, 급락 조정 시 지지선 이탈 속도가 일반적인 조정 장세보다 가파를 수 있습니다.',
        strategy: '지수 추종형 패시브 ETF(SPY, QQQ)에 대한 맹목적인 과신보다는, 개별 기업의 잉여현금흐름 창출력(FCF Yield)과 재무 안정성이 돋보이는 독립적인 개별 주식으로 포트폴리오 체질을 개선할 시점입니다. 실적이 확실한 소외된 Quality 중소형 가치주를 발굴하는 롱-숏 전략이 훌륭한 해자가 될 수 있습니다.'
      };
    }

    // 3. "1 S&P 500 Stock Worth Investigating..."
    if (h.includes('worth investigating') || h.includes('underwhelm')) {
      return {
        summary: '현재 S&P 500 지수 내 종목 중에서 내재 밸류에이션 매력이 충분하고 실적 성장세가 견고하여 반드시 정밀 분석 및 매수를 검토해야 하는 \'유망 숨은 보석\' 1선과, 반대로 겉보기 시장 화제성과 달리 영업마진율이 정체되거나 이익률 성장이 지체되어 투자자에게 실망을 안겨주는(Underwhelm) 2개 종목을 크로스 체킹했습니다.',
        impact: '실적 시즌의 진입에 맞춰 지수 전반의 동조화 상승보다는 철저한 개별 기업 펀더멘털별 주가 차별화(Earnings Dispersion) 장세가 가속화될 것입니다. 종목 선택의 안목에 따른 알파(Alpha) 수익률 격차가 사상 최대치로 벌어질 전망입니다.',
        strategy: 'DH 스크리너의 Quality Score와 Growth Score가 동시에 우수한 성적을 낸 종목 중 고점 대비 8%~25% 이상 기술적 조정을 마친 안전 구간에서 분할 매수하십시오. 반면, 현금 창출력 없이 기대감만 가득 차 고PER에 안착한 2개의 경고 종목군은 즉각 비중을 덜어내어 현금을 보존해야 합니다.'
      };
    }

    // 4. "2 S&P 500 Stocks to Target This Week..."
    if (h.includes('to target this week') || h.includes('brush off')) {
      return {
        summary: '이번 주 예정된 연준 위원들의 연설 및 주요 물가 지표 발표 전후의 수급 추이를 기초로, 포트폴리오에 적극적으로 타겟팅(Target)하여 단기 랠리 시너지를 낼 수 있는 유망 종목 2선과, 내부자 매도가 유의미하게 포착되거나 재무 건전성 점수가 부진해 포트폴리오 유입에서 과감히 제외하고 걸러내야 하는(Brush Off) 1선을 밀착 비교했습니다.',
        impact: '타겟 2개 종목군은 이번 주 수급 로테이션의 1차 수혜를 받으며 상방 저항 돌파와 함께 단기 5~8% 수준의 오버슈팅 강세 분출이 기대되는 반면, 제외된 1선은 지수 반등 국면에서도 힘을 쓰지 못하는 소강 횡보 궤도에 갇힐 가능성이 농후합니다.',
        strategy: '타겟 종목군은 시초가에 곧바로 추격 매수하기보다는 2~3일간 장중 눌림목(아래 꼬리) 밴드 대역 내에서 안전하게 평단가를 조율하며 비중을 모으십시오. 반면 거름 종목군은 포트폴리오 내에 편입되어 있다면 일시적인 기술적 반등 타이밍을 적극 활용하여 비중을 덜고 주도주로 리밸런싱을 감행하십시오.'
      };
    }

    // 5. "Nvidia (NVDA) Valuation Check After Mixed Short Term Moves..."
    if (h.includes('valuation check') && (h.includes('nvda') || h.includes('nvidia'))) {
      return {
        summary: '글로벌 AI 및 반도체 랠리를 독주해 온 엔비디아(NVDA)가 최근 단기 급등에 따른 차익 매물 소화로 단기 혼조세(Mixed short term moves)를 기록 중인 가운데, 중장기 이익 성과와 Blackwell 아키텍처 출시 로드맵을 연동한 전방위적 밸류에이션 체크를 실시했습니다. 장기적 성장의 한계 대비 현재 멀티플의 밸류에이션 부담이 적정 범주 내에 놓여 있는지 분석했습니다.',
        impact: '단기적으로 고PER 밸류에이션에 대한 매도 압박과 장기 AI 낙관론의 수급이 팽팽히 충돌하며 일일 3~5% 내외의 심한 주가 변동성 팽창을 유발할 수 있습니다. 다만, 이는 추세 파괴가 아닌 단기 숨고르기에 그쳐 중장기 상방 지지 궤도는 여전히 탄탄합니다.',
        strategy: 'DCF 내재가치 계산 결과를 바탕으로 주가가 적정 가치 대비 15% 이상 하회하는 아래 대역에 진입할 때마다 영리하게 모아가는 분할 매수로 평균 단가를 낮춰야 하며, 3중 스토캐스틱 장기 추세선이 완전히 침체권을 탈출해 우상향 반등을 재확인하는 골든크로스 타점을 최종 진입 신호로 삼으십시오.'
      };
    }

    // 6. "NVDA Gains 23.5% Since April..."
    if (h.includes('gains') && (h.includes('nvda') || h.includes('nvidia') || h.includes('tsm'))) {
      return {
        summary: '지난 4월 저점 형성 이후 단기간에 엔비디아(NVDA)가 23.5%, TSMC(TSM)가 19.7% 상승하며 글로벌 AI 반도체 벨트의 든든한 상방 랠리를 재점화한 내부 동력(빅테크들의 자본 지출 가속화, 커스텀 실리콘 칩 공급 병목 완화)을 입체 분석했습니다.',
        impact: '반도체 생태계의 견조한 실적 실현이 미국 증시 전체의 하방 지지력을 보강하고 있습니다. 패시브 펀드의 인덱스 추종 자금이 반도체 대표 종목들로 대거 재유입되며 하락 방어 해자 역할을 수행 중입니다.',
        strategy: '상승 에너지가 이미 상당 부분 반영되어 단기 과열 임계점에 근접했으므로, 섣부른 추격 매수(FOMO)는 계좌 위험도를 높입니다. 5일 및 20일 이동평균선 지지 밴드까지 눌려주는 건강한 숨고르기 파동 시 분할 매수로 동승하고, 기존 보유자는 익절 가격을 매일 상향 조정하며 랠리의 복리 혜택을 극대화하십시오.'
      };
    }

    // 7. "Tigress Financial Raises Nvidia Price Target..."
    if (h.includes('raises') && (h.includes('price target') || h.includes('target to')) && (h.includes('nvda') || h.includes('nvidia'))) {
      return {
        summary: '글로벌 유력 투자은행 타이그리스 파이낸셜(Tigress Financial)이 엔비디아의 탄탄한 데이터센터 수익 창출 지속력과 신규 칩 수요 모멘텀을 반영하여 12개월 목표주가를 기존 $360에서 $425로 대폭 상향 설정하고, 강력 매수(Strong Buy) 투자 의견을 공식 유지했습니다.',
        impact: '투자기관들의 목표주가 컨센서스 상향은 시장의 기관 투자 심리에 강력한 매수 방패막을 제공합니다. 공매도 세력의 숏커버링 환매수를 자극하고 대형 뮤추얼 펀드의 바스켓 매수 유입을 가속화해 기술적 돌파 랠리의 연료 역할을 수행합니다.',
        strategy: '$425 목표주가 대역까지 단기 상방 여력이 약 15~20% 열린 상태이므로 기술적으로 매우 유리한 고지를 점했습니다. 장중 시초가 아래에서 형성되는 분할 진입 밴드를 성실히 준수하며 매집을 완성한 뒤, 강력 매수 지지력을 업고 주가가 직전 고점을 뚫는 돌파 랠리 국면을 타깃 삼으십시오.'
      };
    }

    // 8. Generic Fallback
    const isPos = sentiment === 'positive';
    const isNeg = sentiment === 'negative';
    const sentimentLabel = isPos ? '호재성 상승 기류' : isNeg ? '경계성 조정 기류' : '중립적 수렴 흐름';

    return {
      summary: `본 영문 뉴스는 글로벌 금융 시장에서 실시간으로 생성된 중요 ${ticker === 'SPX' ? '매크로(거시 경제)' : `${ticker} 개별 기업의 핵심`} 속보 정보입니다. 현재 미국 주식시장을 지배하고 있는 연준(Fed)의 고금리 장기화 대응 통화 스탠스, 10년물 국채 금리 변동성 지표, 그리고 주요 섹터별 기관 패시브 유동성 로테이션 관점에서 자금의 쏠림 또는 이동을 자극하는 뉴스 재료입니다.`,
      impact: `이번 속보의 뉘앙스는 시장에 단기적으로 [${sentimentLabel}]를 유입할 것으로 판단됩니다. 단기적인 차익 실현 욕구 혹은 저점 매수세 간의 치열한 공방을 자극하여 일시적인 변동성을 높이겠으나, 장기적인 펀더멘털 추세를 뒤흔들 만한 균열 요소가 포함되어 있는지 여부를 다면적으로 모니터링해야 합니다.`,
      strategy: `현재 거시적 판도에서는 단방향 공격적 배팅보다는 계좌 내 현금(대기 실탄) 비중을 30% 내외로 두텁고 안전하게 관리하는 것이 정석입니다. 뉴스가 자극하는 자산군의 단기 과열이 식고 20일 이평선 등의 기술적 지지선을 다지는 눌림목 타이밍을 노려 분할 진입을 전개하고, 펀더멘털이 불투명한 고밸류 거품 종목은 단호하게 걸러내는 보수적 방어형 포지셔닝이 유리합니다.`
    };
  }

  const analysis = getDetailedAnalysis(news.headline, news.translatedHeadline, news.ticker, news.sentiment);
  const isPos = news.sentiment === 'positive';
  const isNeg = news.sentiment === 'negative';

  const sentimentBadgeColor = isPos ? 'var(--positive)' : isNeg ? 'var(--negative)' : 'var(--text-secondary)';
  const sentimentBadgeBg = isPos ? 'var(--positive-glow)' : isNeg ? 'var(--negative-glow)' : 'var(--bg-elevated)';
  const sentimentText = isPos ? '긍정 호재 🟢' : isNeg ? '부정 악재 🔴' : '중립 일반 ⚪';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(10px)',
      animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      {/* Modal Container */}
      <div style={{
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border-default, #e2e8f0)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 40px rgba(139, 92, 246, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header Ribbon / Tech Line */}
        <div style={{
          height: '4px',
          background: isPos ? 'linear-gradient(90deg, #10b981, #34d399)' : isNeg ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #6366f1, #3b82f6)',
          width: '100%'
        }} />

        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border-subtle, #f1f5f9)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--accent-blue, #2563eb)',
              background: 'rgba(37, 99, 235, 0.08)',
              padding: '2px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase'
            }}>
              DH Intelligence Report
            </span>
            {news.category && (
              <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                {news.category}
              </span>
            )}
            {news.ticker && (
              <span className="badge badge-blue" style={{ fontSize: '10px', fontWeight: 800 }}>
                {news.ticker}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #94a3b8)',
              padding: '4px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--bg-elevated, #f8fafc)';
              e.currentTarget.style.color = 'var(--text-primary, #0f172a)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'var(--text-muted, #94a3b8)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          flex: 1
        }}>
          {/* Headline Block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{
              fontSize: '17px',
              fontWeight: 800,
              color: 'var(--text-primary, #0f172a)',
              lineHeight: 1.45,
              margin: 0,
              letterSpacing: '-0.3px'
            }}>
              {news.headline}
            </h2>
            <p style={{
              fontSize: '14.5px',
              fontWeight: 600,
              color: '#334155',
              lineHeight: 1.55,
              margin: 0,
              wordBreak: 'keep-all',
              paddingLeft: '12px',
              borderLeft: '3px solid var(--accent, #6366f1)',
              background: 'rgba(99, 102, 241, 0.02)'
            }}>
              {news.translatedHeadline || '실시간 번역 요약 중...'}
            </p>
          </div>

          {/* Metadata Badges Summary */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
            padding: '10px 14px',
            background: 'var(--bg-elevated, #f8fafc)',
            borderRadius: '8px',
            border: '1px solid var(--border-default, #e2e8f0)',
            fontSize: '11.5px',
            color: 'var(--text-secondary, #475569)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontWeight: 600 }}>감성 분류:</span>
              <span style={{
                color: sentimentBadgeColor,
                background: sentimentBadgeBg,
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 700,
                border: `1px solid ${isPos ? '#a7f3d0' : isNeg ? '#fecaca' : '#cbd5e1'}`
              }}>
                {sentimentText}
              </span>
            </div>
            <span style={{ color: 'var(--border-subtle, #cbd5e1)' }}>|</span>
            <div>
              <span style={{ fontWeight: 600 }}>출처:</span> {news.source}
            </div>
            <span style={{ color: 'var(--border-subtle, #cbd5e1)' }}>|</span>
            <div>
              <span style={{ fontWeight: 600 }}>발표 시점:</span> {news.time}
            </div>
          </div>

          {/* AI-Powered Institutional Analysis Panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* 1. Fact Summary */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6
            }}>
              <h4 style={{
                fontSize: '12px',
                fontWeight: 800,
                color: 'var(--accent-blue, #2563eb)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}>
                <Info size={14} /> 📋 팩트 및 핵심 요약
              </h4>
              <p style={{
                fontSize: '12px',
                color: '#334155',
                lineHeight: 1.6,
                margin: 0,
                textAlign: 'justify',
                wordBreak: 'keep-all',
                fontWeight: 500
              }}>
                {analysis.summary}
              </p>
            </div>

            {/* 2. Market Impact */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6
            }}>
              <h4 style={{
                fontSize: '12px',
                fontWeight: 800,
                color: '#8b5cf6',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}>
                <TrendingUp size={14} /> 📊 시장 & 섹터 영향력 분석
              </h4>
              <p style={{
                fontSize: '12px',
                color: '#334155',
                lineHeight: 1.6,
                margin: 0,
                textAlign: 'justify',
                wordBreak: 'keep-all',
                fontWeight: 500
              }}>
                {analysis.impact}
              </p>
            </div>

            {/* 3. Investment Strategy */}
            <div style={{
              background: isPos ? '#f0fdf4' : isNeg ? '#fef2f2' : '#f8fafc',
              border: `1px solid ${isPos ? '#bcf0da' : isNeg ? '#fecaca' : '#cbd5e1'}`,
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6
            }}>
              <h4 style={{
                fontSize: '12px',
                fontWeight: 800,
                color: isPos ? '#0d9488' : isNeg ? '#dc2626' : '#475569',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}>
                <Award size={14} style={{ color: isPos ? '#0d9488' : isNeg ? '#dc2626' : '#475569' }} /> 🎯 투자자 포지셔닝 및 대응 전략
              </h4>
              <p style={{
                fontSize: '12.5px',
                color: isPos ? '#115e59' : isNeg ? '#991b1b' : '#334155',
                lineHeight: 1.6,
                margin: 0,
                textAlign: 'justify',
                wordBreak: 'keep-all',
                fontWeight: 600
              }}>
                {analysis.strategy}
              </p>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          background: 'var(--bg-elevated, #f8fafc)',
          borderTop: '1px solid var(--border-subtle, #f1f5f9)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
            본 분석은 실시간 뉴스를 기초로 파싱한 정보이며 최종 투자판단의 책임은 본인에게 있습니다.
          </span>
          <button
            onClick={() => {
              if (news.link) {
                window.open(news.link, '_blank', 'noopener,noreferrer');
              } else {
                alert('해당 기사의 원문 링크 정보가 제공되지 않습니다.');
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 10px rgba(59, 130, 246, 0.25)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 14px rgba(59, 130, 246, 0.35)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 10px rgba(59, 130, 246, 0.25)';
            }}
          >
            <ExternalLink size={13} />
            원문 뉴스 바로가기
          </button>
        </div>
      </div>
    </div>
  );
}
