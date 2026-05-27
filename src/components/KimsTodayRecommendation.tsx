'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Zap, TrendingUp, Calendar, Target, AlertCircle, 
  ArrowRight, Shield, Award, Newspaper, BarChart2, Globe 
} from 'lucide-react';

interface RecommendationItem {
  rank: number;
  rankText: string;
  ticker: string;
  name: string;
  sector: string;
  buyRange: string;
  targetPrice: string;
  stopLoss: string;
  holdingPeriod: string;
  holdingType: 'short' | 'medium' | 'long' | 'mix';
  holdingTypeLabel: string;
  holdingColor: string;
  technicalReason: string;
  macroReason: string;
  newsReason: string;
  tacticalPlan: string;
}

export default function KimsTodayRecommendation() {
  const router = useRouter();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const marketBrief = {
    date: new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }),
    sentiment: '탐욕 (Greed - 68)',
    brief: '연준 긴축 완화 우려 진정 및 인공지능(AI) 반도체 밸류체인으로의 메가 펀드 자금 집중 유입 포착. 시초가 갭상승 출발 시 추격 매수보다는 장 시작 후 분할 매수 밴드 내 진입이 매우 유리한 장세입니다.',
  };

  const items: RecommendationItem[] = [
    {
      rank: 1,
      rankText: '1st',
      ticker: 'NVDA',
      name: '엔비디아 (NVIDIA Corp.)',
      sector: '반도체 및 하이테크 IT',
      buyRange: '$112.00 ~ $116.00',
      targetPrice: '$135.00',
      stopLoss: '$105.00',
      holdingPeriod: '5일 스윙 & 2달 장기 분할 대응 (혼합 전략)',
      holdingType: 'mix',
      holdingTypeLabel: '단기/장기 혼합 ⚡',
      holdingColor: 'linear-gradient(135deg, #10b981, #059669)',
      technicalReason: '단기 스토캐스틱(5,3,3)이 20% 초과매도선에서 상승 골든크로스를 내며 반등 개시. 20일 이평선(추세 지지선) 부근에서 강한 아래꼬리 망치형 캔들 형성으로 상방 압력 결집.',
      macroReason: '글로벌 빅테크(MSFT, GOOGL, META)들의 차기 분기 AI 설비투자(CAPEX) 지속 확대 기조 확인. 금리 급등세가 진정되며 밸류에이션 부담 완화 및 성장 주도주 수급 쏠림.',
      newsReason: '대만 TSMC의 차세대 패키징(CoWoS) 가동률 극대화에 따른 하반기 블랙웰(Blackwell) 칩 공급 병목 현상 해소 가시화 공식 보도 및 아시아 데이터센터 메가 주문 수주 속보.',
      tacticalPlan: '시초가 부근 분할 매수 진입 후, 5거래일 이내 단기 돌파 파동 시 보유 비중의 50%를 $128.00 부근에서 선제 익절하여 수익 확보. 나머지 50% 잔량은 2개월간 $140.00 돌파를 타겟으로 끌고 가며 포트폴리오 메인 성장 동력으로 삼는 전략이 극도로 유리.',
    },
    {
      rank: 2,
      rankText: '2nd',
      ticker: 'PLTR',
      name: '팔란티어 테크놀로지스 (Palantir Technologies Inc.)',
      sector: '엔터프라이즈 AI 소프트웨어',
      buyRange: '$28.50 ~ $29.80',
      targetPrice: '$35.00',
      stopLoss: '$26.50',
      holdingPeriod: '5일 ~ 10거래일 초단기 돌파 매매',
      holdingType: 'short',
      holdingTypeLabel: '초단기 스윙 🎯',
      holdingColor: 'linear-gradient(135deg, #fb923c, #ea580c)',
      technicalReason: 'RSI 14 지표가 55 중단 돌파 후 상방 활성화 영역 진입. 볼린저 밴드 수축 후 상단 돌파에 성공하며 강한 거래량을 동반한 전형적인 상승 깃발형(Bull Flag) 패턴 완성.',
      macroReason: '미 국방부 및 민간 사이버 보안 부문의 연간 소프트웨어 AI 예산 집중 집행 수혜. 소프트웨어 중심 고마진 비즈니스 모델로 고금리 환경 내 가장 탄탄한 실적 방어력 증명.',
      newsReason: '미 육군(U.S. Army)과 4억 8천만 달러 규모의 차세대 AI 타겟팅 및 분산 정보 시스템(Maven) 독점 소프트웨어 공급 계약 체결 공식 보도 및 신규 AI 플랫폼(AIP)의 미국 대기업 도입 속보.',
      tacticalPlan: '장 시작 시 시초가 밴드 내에서 신속 매수. 본 종목은 강력한 거래 모멘텀을 탄 단기 트레이딩 목적이므로, 진입 후 5일 이내 단기 급등 오버슈팅 발생 시 $34.5 ~ $35.0 대역에서 전량 과감하게 수익실현 및 현금화 권장. 손절선 엄수 필수.',
    },
    {
      rank: 3,
      rankText: '3rd',
      ticker: 'TSLA',
      name: '테슬라 (Tesla Inc.)',
      sector: '전기차 및 모빌리티 AI',
      buyRange: '$172.00 ~ $176.00',
      targetPrice: '$215.00',
      stopLoss: '$158.00',
      holdingPeriod: '최소 2달 이상 중장기 지속 보유',
      holdingType: 'long',
      holdingTypeLabel: '2달+ 장기 홀딩 ⏳',
      holdingColor: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      technicalReason: '3중 스토캐스틱 중 장기선(20,12,12)이 15% 수준의 역사적 초과매도 바닥권에서 완벽한 U자형 라운딩 바닥을 형성하며 상향 턴. 이중 바닥(Double Bottom) 완성형 지지대 구축.',
      macroReason: '글로벌 인플레이션 하락 안정화에 따른 하반기 오토론(자동차 할부) 금리 인하 기대감 솔솔 작동. 에너지 저장 장치(Megapack)의 급성장세로 비(Non)자동차 부문 매출 기여 극대화.',
      newsReason: '완전 자율주행(FSD) v12.5 중국 및 유럽 도로 공식 테스트 승인 임박 속보와 연계하여, 3분기 내 로보택시(Robotaxi) 정식 공개 예정 및 상하이 기가팩토리 가동률 완전 정상화 공식화.',
      tacticalPlan: '급한 단기 차익 실현 목적보다는 바닥권에서 매물대를 소화하고 추세를 회복하는 과정에 있으므로, 최소 2달간 지속 보유하는 묵직한 전략이 유효. 170달러 초반의 단기 지지력을 믿고 2~3회 분할 매수로 평균단가를 안정적으로 맞추며 장기 상승 파동을 완전히 향유.',
    },
    {
      rank: 4,
      rankText: '4th',
      ticker: 'AAPL',
      name: '애플 (Apple Inc.)',
      sector: '컨슈머 디바이스 IT',
      buyRange: '$189.00 ~ $192.00',
      targetPrice: '$212.00',
      stopLoss: '$181.00',
      holdingPeriod: '1달 (약 4주) 안정적 추세 추종',
      holdingType: 'medium',
      holdingTypeLabel: '1달 스윙 홀딩 📅',
      holdingColor: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      technicalReason: '120일 이동평균선 장기 저항 매물을 기관의 연속 순매수로 돌파한 뒤 지지 안착 확인. 볼린저 밴드 이격도 수축 단계를 마친 후 거래량이 서서히 늘며 상방 확산 궤도 개시.',
      macroReason: '거시경제 불확실성 지속 시 막강한 자사주 매입 자금(연간 1,100억 달러 규모) 유입으로 인해 하방 경직성이 가장 뛰어난 대표적 경기 방어 성장주로서 메가 펀드 피난처 작동.',
      newsReason: '아이폰 차기 라인업(iPhone 16)에 완전히 통합되는 온디바이스 AI \'애플 인텔리전스\'의 아시아 핵심 부품 서플라이 체인 주문량이 전작 대비 15% 상향 조정되었다는 대만발 속보 유출.',
      tacticalPlan: '변동성이 크지 않고 묵직하게 추세를 타고 올라가는 경향이 강하므로, 금일 시초가 진입 이후 약 1달(4주) 동안 흔들림 없이 가이드라인을 추종하는 매매가 정답. 210달러 근방 도달 시 분할 익절하여 안전하게 누적 수익을 확정 짓는 다소 보수적이면서도 견고한 전술 권장.',
    },
    {
      rank: 5,
      rankText: '5th',
      ticker: 'LLY',
      name: '일라이 릴리 (Eli Lilly & Co.)',
      sector: '바이오 메디컬 헬스케어',
      buyRange: '$805.00 ~ $820.00',
      targetPrice: '$930.00',
      stopLoss: '$765.00',
      holdingPeriod: '2달 이상 장기 추세 편승 및 홀딩',
      holdingType: 'long',
      holdingTypeLabel: '2달+ 메가 트렌드 🧪',
      holdingColor: 'linear-gradient(135deg, #ec4899, #db2777)',
      technicalReason: '52주 역사적 신고가 영역을 가볍게 경신 후, 5일 이동평균선을 깨지 않고 철저하게 추종하는 전형적인 기관 매집 우상향 랠리. 추세 왜곡이 없는 정배열 확산의 정수.',
      macroReason: '거시 침체 우려 시에도 치료 필수성이 높은 헬스케어 분야의 독점주로서 시장 베타와 무관한 강력한 알파 초과수익 달성 가능. 글로벌 고령화 메가 트렌드 1수혜 기업.',
      newsReason: '차세대 경구용(먹는 알약) 비만 치료제 후보물질의 임상 3상 중간 결과가 주사제에 상응하는 우수한 체중 감소 효과 및 부작용 최소화를 달성했다는 글로벌 생명공학 포럼 속보 개시.',
      tacticalPlan: '이미 대세 상승 궤도에 진입하여 뒤를 돌아보지 않는 주도주이므로, 단기 조정을 기다리기보다 금일 권장 매수 밴드 진입 시 과감하게 승차하여 최소 2달 이상 동행해야 함. 이격도가 과도하게 벌어질 때만 일부 차익실현을 꾀하되, 장기 보유가 승률을 극대화시키는 왕도.',
    }
  ];

  return (
    <div style={{ padding: '24px 20px', background: 'var(--bg-canvas)', color: 'var(--text-primary)' }}>
      
      {/* 거시 및 센티먼트 통합 브리핑 대시보드 */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(26, 86, 219, 0.05) 0%, rgba(8, 145, 178, 0.05) 100%)',
        border: '1px solid rgba(26, 86, 219, 0.15)',
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* 네온 배경 효과 */}
        <div style={{
          position: 'absolute', top: -50, right: -50,
          width: 150, height: 150, borderRadius: '50%',
          background: 'rgba(8, 145, 178, 0.1)', filter: 'blur(40px)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color="var(--accent)" style={{ fill: 'var(--accent)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px', margin: 0 }}>
              킴스금일 Best 5 레이더 전략 <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}>({marketBrief.date} 장시작 대응)</span>
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>시장 심리 온도:</span>
            <span style={{
              fontSize: 11, fontWeight: 800, padding: '3px 8px',
              borderRadius: 20, background: 'var(--positive-glow)', color: 'var(--positive)',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              {marketBrief.sentiment}
            </span>
          </div>
        </div>
        <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0, letterSpacing: '-0.1px' }}>
          <strong>💡 시장 브리핑:</strong> {marketBrief.brief}
        </p>
      </div>

      {/* Best 5 종목 카드 리스트 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {items.map((item, idx) => {
          const isHovered = hoveredIndex === idx;
          return (
            <div
              key={item.ticker}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                background: 'white',
                border: isHovered ? '1px solid var(--accent)' : '1px solid var(--border-default)',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: isHovered 
                  ? '0 12px 24px -10px rgba(26, 86, 219, 0.15), var(--shadow-md)' 
                  : 'var(--shadow-sm)',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative'
              }}
            >
              {/* 왼쪽 모서리 순위 바 */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                background: isHovered ? 'var(--accent)' : '#e5e7eb'
              }} />

              {/* 상단 타이틀 영역 */}
              <div style={{
                display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)',
                background: isHovered ? 'rgba(26, 86, 219, 0.01)' : 'transparent',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* 대형 랭크 배지 */}
                  <div style={{
                    width: 38, height: 38, borderRadius: 8,
                    background: item.holdingColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 900, fontSize: 13, fontFamily: 'JetBrains Mono',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}>
                    {item.rankText}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span 
                        onClick={() => router.push(`/analysis?ticker=${item.ticker}`)}
                        style={{ 
                          fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', 
                          cursor: 'pointer', fontFamily: 'JetBrains Mono', letterSpacing: '-0.3px'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        {item.ticker}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.name}</span>
                      <span className="badge badge-gray" style={{ fontSize: 9.5 }}>{item.sector}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>권장 매수 밴드</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>{item.buyRange}</span>
                  </div>
                  <button 
                    onClick={() => router.push(`/analysis?ticker=${item.ticker}`)}
                    className="btn btn-ghost btn-sm"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 11, padding: '6px 12px', borderRadius: 6,
                      background: 'rgba(26, 86, 219, 0.05)', color: 'var(--accent)',
                      border: '1px solid rgba(26, 86, 219, 0.1)', fontWeight: 700
                    }}
                  >
                    분석 이동 <ArrowRight size={11} />
                  </button>
                </div>
              </div>

              {/* 본문 그리드: 3대 촉매 및 청산 시나리오 */}
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* 3대 추천 이유 그리드 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  
                  {/* 기술 분석 */}
                  <div style={{
                    background: 'var(--bg-elevated)', borderRadius: 8, padding: '14px 16px',
                    border: '1px solid var(--border-default)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <BarChart2 size={13} color="var(--accent)" />
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-primary)' }}>📊 기술적 매수 타점</span>
                    </div>
                    <p style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0 }}>
                      {item.technicalReason}
                    </p>
                  </div>

                  {/* 거시경제 */}
                  <div style={{
                    background: 'var(--bg-elevated)', borderRadius: 8, padding: '14px 16px',
                    border: '1px solid var(--border-default)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Award size={13} color="#8b5cf6" />
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-primary)' }}>🌐 거시 판도 촉매</span>
                    </div>
                    <p style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0 }}>
                      {item.macroReason}
                    </p>
                  </div>

                  {/* 뉴스속보 */}
                  <div style={{
                    background: 'var(--bg-elevated)', borderRadius: 8, padding: '14px 16px',
                    border: '1px solid var(--border-default)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Newspaper size={13} color="var(--positive)" />
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-primary)' }}>📰 뉴스속보 재료</span>
                    </div>
                    <p style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0 }}>
                      {item.newsReason}
                    </p>
                  </div>

                </div>

                {/* 청산 전술 및 보유 기간 가이드 (Holding & Exit Planner) */}
                <div style={{
                  background: 'rgba(26, 86, 219, 0.02)',
                  border: '1px solid rgba(26, 86, 219, 0.06)',
                  borderRadius: 10,
                  padding: '16px 20px'
                }}>
                  <div style={{ 
                    display: 'flex', flexWrap: 'wrap', alignItems: 'center', 
                    justifyContent: 'space-between', gap: 12, marginBottom: 12,
                    borderBottom: '1px dashed rgba(26, 86, 219, 0.1)', paddingBottom: 10
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Calendar size={14} color="var(--accent)" />
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>🎯 Kims Holding & Exit Tactics (청산 시나리오)</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                        background: item.holdingColor, color: 'white'
                      }}>
                        {item.holdingTypeLabel}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                        background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                        border: '1px solid var(--border-default)'
                      }}>
                        {item.holdingPeriod}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 20, alignItems: 'start' }}>
                    {/* 목표가 / 손절가 칩 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{
                        background: 'var(--bg-card)', border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: 6, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <span style={{ fontSize: 10, color: 'var(--positive)', fontWeight: 700 }}>목표가 ➔</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--positive)', fontFamily: 'JetBrains Mono' }}>{item.targetPrice}</span>
                      </div>
                      <div style={{
                        background: 'var(--bg-card)', border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: 6, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <span style={{ fontSize: 10, color: 'var(--negative)', fontWeight: 700 }}>손절선 ➔</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--negative)', fontFamily: 'JetBrains Mono' }}>{item.stopLoss}</span>
                      </div>
                    </div>

                    {/* 세부 전술 계획 */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'start' }}>
                      <Shield size={14} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />
                      <p style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0, letterSpacing: '-0.1px' }}>
                        <strong>행동 양식 지침:</strong> {item.tacticalPlan}
                      </p>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
