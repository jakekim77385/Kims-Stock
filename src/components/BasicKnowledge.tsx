'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

// ─── 데이터 ───────────────────────────────────────────────────────────────────
const CHAPTERS = [
  {
    id: 'market',
    icon: '📈',
    title: '시장 지수 읽기',
    subtitle: 'S&P 500, NASDAQ, VIX의 의미',
    topics: [
      {
        q: 'S&P 500이란?',
        a: '미국 대형주 500개의 시가총액 가중 평균 지수. 미국 경제 전체의 건강도를 보는 대표 지표. "시장이 올랐다"고 할 때 보통 이것을 의미한다.',
        tag: '지수',
      },
      {
        q: 'NASDAQ vs 다우존스(DJI)',
        a: 'NASDAQ은 기술주 중심(애플·엔비디아·구글 등), DJI는 블루칩 30개 종목. 기술주 호불호에 따라 두 지수가 반대 방향으로 움직이기도 한다.',
        tag: '지수',
      },
      {
        q: 'VIX 공포지수란?',
        a: '향후 30일간 S&P 500의 예상 변동성. 15 이하 = 시장 안정, 20~25 = 주의 필요, 30 이상 = 공포 구간. 폭락장에서 급등하고 반등장에서 급감한다.',
        tag: 'VIX',
        highlight: true,
      },
      {
        q: '10년물 국채금리(TNX)와 주식의 관계',
        a: '금리 상승 → 채권 매력 증가 → 주식 밸류에이션 압박 → 주가 하락 압력. 반대로 금리 하락 → 성장주·부동산 수혜. 특히 PER 높은 기술주가 금리에 민감하다.',
        tag: '금리',
      },
      {
        q: '버핏 지수(Buffett Indicator)란?',
        a: '미국 증시 전체 시가총액을 미국 GDP로 나눈 비율. 워런 버핏이 "가장 신뢰하는 단일 시장 밸류에이션 지표"로 꼽았다.\n\n75% 이하: 매우 저평가\n75% ~ 90%: 저평가\n90% ~ 115%: 적정 가치\n115% ~ 135%: 고평가\n135% 이상: 매우 고평가 (버블 우려)\n\n현재 미국 시장은 역사적으로 매우 높은 수준(190%+)에 도달해 있어 시장의 장기적인 과열 위험을 경고하고 있다.',
        tag: '버핏지수',
        highlight: true,
      },
    ],
  },
  {
    id: 'valuation',
    icon: '📊',
    title: '52주 저평가 분석',
    subtitle: '이 대시보드의 핵심 — 52주 위치의 의미',
    topics: [
      {
        q: '52주 위치(%)란 무엇인가?',
        a: '(현재가 − 52주 최저가) ÷ (52주 최고가 − 52주 최저가) × 100\n\n0%에 가까울수록 52주 최저점 근처 → "상대적 저평가"\n100%에 가까울수록 52주 최고점 근처 → "상대적 고평가"\n\n절대적 가치가 아닌 최근 1년 범위 내 상대적 위치다.',
        tag: '핵심지표',
        highlight: true,
      },
      {
        q: '저평가 = 무조건 매수 신호?',
        a: '아니다. 구조적 하락(기업 실적 악화, 산업 쇠퇴)이면 계속 저점을 갱신한다. 52주 위치는 "싸 보인다"는 신호일 뿐, 반드시 실적·모멘텀·매크로를 함께 봐야 한다.',
        tag: '주의',
      },
      {
        q: 'PER(주가수익비율)이란?',
        a: '주가 ÷ 주당순이익(EPS). 시장이 이 기업의 이익 1원에 얼마를 지불하는지. 낮을수록 저평가, 높을수록 고평가 경향. 단, 성장주(AI·바이오)는 PER이 높아도 정당화될 수 있다.',
        tag: '밸류에이션',
      },
      {
        q: '시가총액(Market Cap)의 의미',
        a: '주가 × 발행주식수. 기업의 시장 평가액. 대형주(Large Cap) = 100억달러↑, 중형주(Mid Cap) = 20~100억달러, 소형주(Small Cap) = 20억달러 미만. 소형주가 경기 민감도 높다.',
        tag: '밸류에이션',
      },
    ],
  },
  {
    id: 'derived',
    icon: '📐',
    title: '파생지표 해석',
    subtitle: '금은비·구리금비·장단기금리차의 실전 해석',
    topics: [
      {
        q: '금은비(Gold/Silver Ratio)란?',
        a: '금 가격 ÷ 은 가격 = "금 1온스로 은 몇 온스를 살 수 있나"\n\n80 이상 → 은이 금 대비 저평가 → 은 매수 유리\n65~80 → 역사적 정상 범위\n65 이하 → 금이 은 대비 저평가 → 금 매수 유리\n\n현재 ~59 = 금 저평가 구간 (은이 상대적으로 비쌈)',
        tag: '파생',
        highlight: true,
      },
      {
        q: '구리/금 비율이 경기를 예측하는 이유?',
        a: '구리는 건설·제조에 쓰이는 경기 민감 금속 → 경기 좋으면 수요 증가 → 가격 상승.\n금은 안전자산.\n\n구리/금 비율 상승 → 경기 낙관\n구리/금 비율 하락 → 경기 비관 또는 금 피난처 수요 증가',
        tag: '파생',
      },
      {
        q: '장단기 금리차(10Y - 2Y)란?',
        a: '미국 10년물 금리 − 2년물 금리.\n\n양수(정상) = 장기 금리 > 단기 금리 = 경제 성장 기대\n음수(역전) = 단기 금리 > 장기 금리 = 역사적으로 경기침체 선행 신호\n\n1980년 이후 금리 역전 후 평균 6~18개월 내 침체 발생.',
        tag: '파생',
        highlight: true,
      },
    ],
  },
  {
    id: 'macro',
    icon: '🌊',
    title: '자금 흐름 & 경기 사이클',
    subtitle: 'Risk-On/Off, 경기 국면별 유리한 자산',
    topics: [
      {
        q: 'Risk-On vs Risk-Off란?',
        a: 'Risk-On: 투자자들이 수익을 위해 위험을 감수 → 주식·암호화폐·신흥국 상승, 채권·금·달러 하락\nRisk-Off: 위험 회피 → 주식 매도, 금·채권·달러 상승\n\nVIX 급등, 지정학 이슈, 신용 이벤트 시 Risk-Off 전환.',
        tag: '자금흐름',
        highlight: true,
      },
      {
        q: '경기 사이클 4단계와 유리한 섹터',
        a: '① 회복 초기(Early): 금융·산업재·임의소비재 강세\n② 확장 중반(Mid): 기술·커뮤니케이션 주도\n③ 후반 과열(Late): 에너지·소재 강세, 방어 준비\n④ 침체(Recession): 헬스케어·유틸리티·필수소비재 안전\n\n현재 사이클 위치를 파악해 섹터 배분을 결정한다.',
        tag: '사이클',
      },
      {
        q: '달러 강세가 자산에 미치는 영향',
        a: '달러 강세 → 신흥국 자금 이탈 (외채 부담 증가) → 신흥국 증시·원자재 약세\n달러 약세 → 신흥국·금·원자재 강세\n\nDXY(달러인덱스)가 연준 정책 방향의 선행 지표 역할을 한다.',
        tag: '자금흐름',
      },
      {
        q: '금이 오르면 주식은 내리나?',
        a: '반드시 그렇지는 않다. 두 가지 경우:\n1. 인플레 상승 시: 금·주식 동반 상승 가능\n2. 경기 공포 시: 금 급등 + 주식 급락 (전형적 Risk-Off)\n\n금 상승의 이유를 먼저 파악해야 한다.',
        tag: '자금흐름',
      },
    ],
  },
  {
    id: 'recovery',
    icon: '📈',
    title: '반등·하락 추정 읽기',
    subtitle: '이 대시보드의 반등/하락 추정 수치 해석법',
    topics: [
      {
        q: '반등 추정은 어떻게 계산되나?',
        a: '목표: 52주 중간값(1차) / 52주 고점(최대)\n기간: 과거 1년 주간 수익률의 변동성(σ)과 평균 드리프트로 도달 시간 추정\n연간 수익률: (1 + 총수익)^(12/예상개월) - 1\n\n변동성이 낮고 저점에 가까울수록 신뢰도 높음.',
        tag: '반등추정',
        highlight: true,
      },
      {
        q: '하락 추정은 어떻게 계산되나?',
        a: '대상: 52주 위치 70%↑ 고평가 자산\n① 1차 조정폭: 현재가 → 52주 중간값까지 하락 %\n② 최대 조정폭: 현재가 → 52주 저점까지 하락 %\n\n고평가라도 모멘텀이 강하면 계속 상승 가능 — 추세 확인 필수.',
        tag: '하락추정',
      },
      {
        q: '예상 기간은 얼마나 믿을 수 있나?',
        a: '통계적 추정값이므로 실제와 크게 다를 수 있다. 참고용으로만 활용할 것.\n\n신뢰도 높음 = 저평가 + 낮은 변동성 + 역사적 저점\n신뢰도 낮음 = 고변동성(BTC, ETH 등) 자산\n\n연간 환산 수익률이 높더라도 기간이 길면 불확실성도 크다.',
        tag: '주의',
      },
    ],
  },
];

// ─── 토픽 카드 ────────────────────────────────────────────────────────────────
function TopicCard({ topic }: { topic: typeof CHAPTERS[0]['topics'][0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: `1px solid ${topic.highlight ? '#bfdbfe' : '#f0f0f0'}`,
      borderLeft: `3px solid ${topic.highlight ? '#1d4ed8' : '#e5e7eb'}`,
      borderRadius: 6, background: topic.highlight ? '#f8faff' : 'white',
      marginBottom: 6,
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', textAlign: 'left', padding: '9px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer', gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, color: topic.highlight ? '#1d4ed8' : '#6b7280',
            background: topic.highlight ? '#dbeafe' : '#f3f4f6',
            padding: '1px 6px', borderRadius: 3, flexShrink: 0,
          }}>{topic.tag}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>{topic.q}</span>
        </div>
        <div style={{ color: '#bbb', flexShrink: 0 }}>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </button>
      {open && (
        <div style={{
          padding: '0 12px 10px 12px',
          fontSize: 11.5, color: '#444', lineHeight: 1.9,
          whiteSpace: 'pre-line',
          borderTop: '1px solid #f5f5f5',
          paddingTop: 10,
        }}>
          {topic.a}
        </div>
      )}
    </div>
  );
}

// ─── 챕터 패널 ────────────────────────────────────────────────────────────────
function ChapterPanel({ ch }: { ch: typeof CHAPTERS[0] }) {
  return (
    <div style={{ padding: '16px 20px' }}>
      {ch.topics.map((t, i) => <TopicCard key={i} topic={t} />)}
    </div>
  );
}

// ─── 메인 ────────────────────────────────────────────────────────────────────
export default function BasicKnowledge() {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(CHAPTERS[0].id);

  const active = CHAPTERS.find(c => c.id === activeTab) ?? CHAPTERS[0];

  return (
    <div style={{ border: '1px solid #e8f0fe', borderRadius: 10, overflow: 'hidden', background: 'white' }}>

      {/* ── 헤더 (항상 표시) ── */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
          padding: '12px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: expanded ? '1px solid #e8f0fe' : 'none',
          background: expanded ? '#f8faff' : 'white',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BookOpen size={16} color="#1d4ed8" />
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8' }}>DH 기초</span>
            <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 8 }}>
              이 대시보드의 지표와 개념 해설 — 클릭하면 {expanded ? '접힘' : '펼쳐짐'}
            </span>
          </div>
          {/* 챕터 미리보기 뱃지 */}
          {!expanded && (
            <div style={{ display: 'flex', gap: 5, marginLeft: 4 }}>
              {CHAPTERS.map(c => (
                <span key={c.id} style={{ fontSize: 10, color: '#9ca3af', background: '#f3f4f6', padding: '1px 7px', borderRadius: 10 }}>
                  {c.icon} {c.title}
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ color: '#9ca3af' }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* ── 펼침 콘텐츠 ── */}
      {expanded && (
        <>
          {/* 챕터 탭 */}
          <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', overflowX: 'auto', background: '#fafbff' }}>
            {CHAPTERS.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveTab(c.id)}
                style={{
                  padding: '10px 18px', fontSize: 11.5, fontWeight: activeTab === c.id ? 700 : 500,
                  cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit',
                  color: activeTab === c.id ? '#1d4ed8' : '#6b7280',
                  borderBottom: `2px solid ${activeTab === c.id ? '#1d4ed8' : 'transparent'}`,
                  marginBottom: -1, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <span>{c.icon}</span>
                <span>{c.title}</span>
                <span style={{ fontSize: 9, color: '#bbb' }}>{c.topics.length}</span>
              </button>
            ))}
          </div>

          {/* 챕터 설명 */}
          <div style={{ padding: '8px 20px 0', background: '#fafbff', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontSize: 10, color: '#6b7280' }}>
              <strong style={{ color: '#1d4ed8' }}>{active.icon} {active.title}</strong>
              {' — '}{active.subtitle}
            </span>
          </div>

          {/* 토픽 목록 */}
          <ChapterPanel ch={active} />

          {/* 하단 안내 */}
          <div style={{
            padding: '8px 20px', background: '#f8faff',
            borderTop: '1px solid #e8f0fe',
            fontSize: 10, color: '#9ca3af', lineHeight: 1.6,
          }}>
            💡 <strong style={{ color: '#6b7280' }}>파란 테두리</strong> 항목이 이 대시보드에서 특히 중요한 개념입니다.
            모든 수치는 참고용이며 투자 조언이 아닙니다.
          </div>
        </>
      )}
    </div>
  );
}
