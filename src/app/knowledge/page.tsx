'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Search } from 'lucide-react';

// ─── 콘텐츠 데이터 ────────────────────────────────────────────────────────────
const CHAPTERS = [
  {
    id: 'why-nasdaq',
    icon: '🇺🇸',
    title: '왜 나스닥인가',
    subtitle: '미국 주식, 특히 나스닥에 투자해야 하는 구조적 이유',
    topics: [
      {
        q: '세계 주식시장에서 미국의 비중은?',
        a: '2024년 기준 전 세계 주식시장 시가총액에서 미국이 차지하는 비중은 약 60~65%.\n\n• 2위 일본: ~6%\n• 3위 영국: ~4%\n• 한국 전체: ~2% 미만\n\n미국을 모르면 글로벌 투자의 절반 이상을 모르는 것. 미국 증시가 흔들리면 전 세계 증시가 함께 흔들리는 이유.',
        tag: '핵심', highlight: true,
      },
      {
        q: '나스닥이 S&P 500보다 좋은 이유가 있나?',
        a: '나스닥 100(QQQ)은 기술·성장주 중심으로 구성되어 장기 수익률이 S&P 500을 압도한 역사.\n\n• 2010~2024년 QQQ 누적 수익: 약 +1,100%\n• 같은 기간 SPY(S&P 500): 약 +530%\n• 같은 기간 코스피: 약 +60~80%\n\n단, 변동성도 더 높음. 2022년 QQQ -32%, SPY -18%.\n\n→ 장기 투자자라면 단기 변동성을 감내할 수 있는 만큼 나스닥 비중이 유리.',
        tag: '성과', highlight: true,
      },
      {
        q: '미국 기업이 이익을 독점하는 구조적 이유',
        a: '1. 기축통화: 달러로 전 세계가 결제 → 미국 기업은 환율 리스크 없이 글로벌 매출\n2. 영어: 전 세계 공용어 → 소프트웨어·플랫폼 확장 비용 최소\n3. 네트워크 효과: 구글·메타·아마존·애플은 전 세계 사용자 기반으로 승자독식\n4. 자본시장: 나스닥 상장 = 전 세계 자본 유치 → 연구개발 투자 극대화\n5. 이민·인재: 전 세계 최고 인재가 실리콘밸리로 집중',
        tag: '구조',
      },
      {
        q: '한국 주식만 하면 안 되나? 코스피의 한계',
        a: '코스피는 왜 장기적으로 부진한가:\n\n• 재벌 지배구조: 주주환원(배당·자사주 소각) 인색\n• 수출 의존: 글로벌 경기 사이클에 수동적으로 끌려다님\n• 외국인 매도: 달러 강세·위험 회피 시 한국 시장에서 먼저 이탈\n• 반도체 쏠림: 삼성·SK하이닉스가 지수를 좌우\n\n코스피 2000p는 2007년에도 같은 수준이었음. 17년 동안 제자리.\n반면 S&P 500은 같은 기간 3배 이상 상승.',
        tag: '비교', highlight: true,
      },
      {
        q: '환율 위험이 있는데 미국 주식이 안전한가?',
        a: '원/달러 환율은 위험처럼 보이지만 장기적으로 미국 투자자에게 유리하게 작용.\n\n• 위기 시: 달러 강세 → 원화 약세 → 달러 자산 평가액 상승 (헷지 효과)\n• 평시: 미국 경제 성장 → 달러 강세 경향\n\n예) 코로나 폭락(2020): 증시 하락 vs 달러 강세 → 원화 기준 손실 일부 상쇄\n\n단, 원화 강세 시에는 반대 효과. 장기적으로는 미국 기업의 성장이 환율 변동을 압도.',
        tag: '환율',
      },
      {
        q: '나스닥에 투자하는 가장 쉬운 방법',
        a: '직접 미국 주식 매수:\n① 국내 증권사 → 해외주식 계좌 개설\n② QQQ(나스닥 100 ETF) 또는 개별 종목 매수\n③ 환전 → 달러로 매수\n\n국내 ETF로 간접 투자:\n• TIGER 미국나스닥100 (원화 투자, 환헷지 여부 확인)\n• KBSTAR 미국S&P500\n\n연금 계좌(IRP·ISA) 활용 시 절세 효과까지.',
        tag: '방법',
      },
      {
        q: '지금 당장 투자하기 무서운데 — 고점 아닌가?',
        a: '"항상 지금이 고점처럼 느껴진다"\n\n역사적 사실:\n• S&P 500이 역대 최고점을 경신한 날 → 이후 1년 수익률 평균 +14%\n• 최고점에 매수해도 10년 보유 시 손실 확률 거의 0%\n\n나스닥 1만p 돌파(2020.6) → "버블이다" → 이후 3년 뒤 2만p\n\n해결책: DCA(월 정액 분할 매수)로 타이밍 리스크 분산.\n"시장 타이밍보다 시장에 있는 시간이 중요하다"',
        tag: '심리', highlight: true,
      },
    ],
  },
  {
    id: 'return-compare',
    icon: '📊',
    title: '수익률 비교',
    subtitle: '자산별 연평균 수익률과 1억 투자 시 2배 도달 시점',
    topics: [],
  },
  {
    id: 'market',
    icon: '📈',
    title: '시장 지수 읽기',
    subtitle: 'S&P 500, NASDAQ, VIX 등 핵심 지수의 의미',
    topics: [
      {
        q: 'S&P 500이란?',
        a: '미국 대형주 500개의 시가총액 가중 평균 지수입니다. 미국 경제 전체의 건강도를 보는 대표 지표로, "시장이 올랐다"고 할 때 보통 이것을 의미합니다.\n\n• 500개 대형주 포함 (시가총액 기준 상위)\n• 미국 GDP의 약 80%를 차지하는 기업들\n• 글로벌 투자자들의 기준점(벤치마크)',
        tag: '지수', highlight: true,
      },
      {
        q: 'NASDAQ vs 다우존스(DJI)',
        a: 'NASDAQ은 기술주 중심(애플·엔비디아·구글 등), DJI는 블루칩 30개 종목의 가격 가중 평균입니다.\n\n• NASDAQ: 기술주·성장주 비중 높음 → 금리 민감\n• 다우존스: 전통 대형주 중심 → 상대적으로 방어적\n\n기술주 호불호에 따라 두 지수가 반대 방향으로 움직이기도 합니다.',
        tag: '지수',
      },
      {
        q: 'VIX 공포지수란?',
        a: '향후 30일간 S&P 500의 예상 변동성(옵션 가격에서 산출)입니다.\n\n• 15 이하: 시장 안정 → 위험 선호\n• 20~25: 주의 필요 → 불확실성 증가\n• 30 이상: 공포 구간 → 급락 가능성\n• 50 이상: 패닉 (2008년 금융위기, 2020년 코로나)\n\n폭락장에서 급등하고 반등장에서 급감합니다. 역발상 지표로도 사용됩니다.',
        tag: 'VIX', highlight: true,
      },
      {
        q: '10년물 국채금리(TNX)와 주식의 관계',
        a: '금리 상승 → 채권 매력 증가 → 주식 밸류에이션 압박 → 주가 하락 압력\n금리 하락 → 성장주·부동산 수혜\n\n특히 PER이 높은 기술주(미래 이익 기대)가 금리에 가장 민감합니다. 금리가 1% 오르면 PER 40배 종목이 PER 20배 종목보다 이론적으로 2배 더 타격을 받습니다.',
        tag: '금리',
      },
      {
        q: '장단기 금리차란? 왜 중요한가?',
        a: '미국 10년물 금리 − 2년물 금리.\n\n• 양수(정상): 장기 금리 > 단기 금리 → 경제 성장 기대\n• 음수(역전): 단기 금리 > 장기 금리 → 침체 선행 신호\n\n1980년 이후 금리 역전 후 평균 6~18개월 내 경기침체 발생. 가장 신뢰도 높은 경기 선행 지표 중 하나.',
        tag: '금리', highlight: true,
      },
    ],
  },
  {
    id: 'valuation',
    icon: '📊',
    title: '52주 저평가 분석',
    subtitle: '이 대시보드의 핵심 — 52주 위치의 의미와 활용',
    topics: [
      {
        q: '52주 위치(%)란 무엇인가?',
        a: '공식: (현재가 − 52주 최저가) ÷ (52주 최고가 − 52주 최저가) × 100\n\n• 0%에 가까울수록 52주 최저점 근처 → 상대적 저평가\n• 100%에 가까울수록 52주 최고점 근처 → 상대적 고평가\n\n절대적 가치가 아닌 최근 1년 범위 내 상대적 위치입니다. 저평가 구간에서 매수하면 평균 회귀(Mean Reversion) 효과를 기대할 수 있습니다.',
        tag: '핵심지표', highlight: true,
      },
      {
        q: '저평가 = 무조건 매수 신호인가?',
        a: '아닙니다. 구조적 하락(기업 실적 악화, 산업 쇠퇴)이면 계속 저점을 갱신합니다.\n\n52주 위치는 "싸 보인다"는 신호일 뿐이며, 반드시 다음을 함께 확인해야 합니다:\n• 기업 실적(EPS) 트렌드\n• 산업 성장성\n• 거시경제 환경\n• 기술적 지지선',
        tag: '주의',
      },
      {
        q: 'PER(주가수익비율)이란?',
        a: '공식: 주가 ÷ 주당순이익(EPS)\n\n시장이 이 기업의 이익 1원에 얼마를 지불하는지를 나타냅니다.\n\n• S&P 500 역사적 평균: 15~20배\n• 25배 이상: 다소 고평가 또는 강한 성장 기대\n• 10배 이하: 가치주 영역\n\n단, 성장주(AI·바이오 등)는 PER이 높아도 정당화될 수 있습니다.',
        tag: '밸류에이션',
      },
      {
        q: '시가총액(Market Cap)의 의미',
        a: '공식: 주가 × 발행주식수\n\n기업의 시장 평가액을 나타냅니다.\n\n• 메가캡 (Mega Cap): 1조달러↑ (Apple, NVDA 등)\n• 대형주 (Large Cap): 100억달러↑\n• 중형주 (Mid Cap): 20~100억달러\n• 소형주 (Small Cap): 20억달러 미만\n\n소형주가 경기에 더 민감하게 반응합니다.',
        tag: '밸류에이션',
      },
      {
        q: '평균 회귀(Mean Reversion)란?',
        a: '자산 가격이 과도하게 오르거나 내리면 장기 평균으로 돌아오는 경향.\n\n이 대시보드의 반등·하락 추정이 바로 이 개념을 기반으로 합니다:\n• 52주 중간값 = 1차 평균 회귀 목표\n• 52주 고점·저점 = 최대 범위\n\n변동성이 낮고 역사적 저점에 가까울수록 평균 회귀 신뢰도가 높습니다.',
        tag: '핵심지표', highlight: true,
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
        a: '공식: 금 가격(온스) ÷ 은 가격(온스)\n→ "금 1온스로 은 몇 온스를 살 수 있나"\n\n• 80 이상 → 은이 금 대비 저평가 → 은 매수 유리\n• 65~80 → 역사적 정상 범위\n• 65 이하 → 금이 은 대비 저평가 → 금 매수 유리\n\n현재 ~59 = 금 저평가 구간 (은이 상대적으로 비쌈)\n\n은은 금보다 산업 수요 비중이 높아 경기에 더 민감합니다.',
        tag: '파생', highlight: true,
      },
      {
        q: '구리/금 비율이 경기를 예측하는 이유?',
        a: '구리: 건설·제조·전기차에 사용되는 경기 민감 금속\n금: 안전자산\n\n• 구리/금 비율 상승 → 경기 낙관, 위험 선호\n• 구리/금 비율 하락 → 경기 비관 또는 금 피난처 수요\n\n이 비율이 장기 국채금리와 유사하게 움직이는 경향이 있어 "닥터 코퍼(Dr. Copper)"라고 불립니다.',
        tag: '파생', highlight: true,
      },
      {
        q: '달러인덱스(DXY)가 자산에 미치는 영향',
        a: '달러 강세(DXY 상승):\n• 신흥국 자금 이탈 → 신흥국 증시·통화 약세\n• 원자재 가격 하락 (달러로 거래되므로)\n• 금·은 약세 경향\n\n달러 약세:\n• 신흥국·금·원자재·원화 강세\n\nDXY는 연준 금리정책의 방향을 선행하는 중요 지표입니다.',
        tag: '파생',
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
        a: 'Risk-On (위험 선호):\n투자자들이 수익을 위해 위험을 감수 → 주식·암호화폐·신흥국 상승\n→ 채권·금·달러 하락\n\nRisk-Off (위험 회피):\n불확실성 증가 → 주식 매도\n→ 금·미국채·달러 상승\n\n트리거: VIX 급등, 전쟁/지정학 이슈, 신용 이벤트, 연준 긴축 충격',
        tag: '자금흐름', highlight: true,
      },
      {
        q: '경기 사이클 4단계와 유리한 섹터',
        a: '① 회복 초기 (Early Cycle)\n→ 금융(XLF)·산업재(XLI)·임의소비재(XLY) 강세\n\n② 확장 중반 (Mid Cycle)\n→ 기술(XLK)·커뮤니케이션(XLC) 주도\n\n③ 후반 과열 (Late Cycle)\n→ 에너지(XLE)·소재(XLB) 강세, 방어 준비 시작\n\n④ 침체 (Recession)\n→ 헬스케어(XLV)·유틸리티(XLU)·필수소비재(XLP) 방어',
        tag: '사이클', highlight: true,
      },
      {
        q: '금이 오르면 주식은 내리나?',
        a: '반드시 그렇지는 않습니다. 두 가지 시나리오:\n\n1. 인플레 상승 시: 금·주식 동반 상승 가능\n2. 경기 공포 시: 금 급등 + 주식 급락 (전형적 Risk-Off)\n\n금 상승의 원인을 먼저 파악해야 합니다:\n• VIX가 함께 오르면 → Risk-Off 신호\n• VIX는 안정적인데 금만 오르면 → 인플레·달러 약세 신호',
        tag: '자금흐름',
      },
      {
        q: '채권과 주식은 왜 역의 관계를 갖나?',
        a: '채권 가격이 오르면 금리(수익률)는 내려갑니다.\n\n• 금리 하락 = 미래 이익의 현재가치 증가 → 주식 밸류에이션 상승\n• 금리 상승 = 반대\n\n하지만 인플레 공포 시엔 주식·채권이 동반 하락하기도 합니다 (2022년). 이 경우엔 현금과 금이 유일한 피난처.',
        tag: '자금흐름',
      },
    ],
  },
  {
    id: 'recovery',
    icon: '🎯',
    title: '반등·하락 추정 읽기',
    subtitle: '이 대시보드의 반등/하락 추정 수치 해석법',
    topics: [
      {
        q: '반등 추정은 어떻게 계산되나?',
        a: '목표가:\n• 1차: 52주 최저~최고의 중간값\n• 최대: 52주 고점\n\n예상 기간: 과거 1년 주간 수익률 데이터에서\n→ 연간 변동성(σ)과 평균 드리프트로 도달 시간 추정\n\n연간 환산 수익률: (1 + 총수익)^(12/예상개월) - 1\n\n변동성이 낮고 저점에 가까울수록 신뢰도 높음.',
        tag: '반등추정', highlight: true,
      },
      {
        q: '하락 추정은 어떻게 계산되나?',
        a: '대상: 52주 위치 70% 이상 고평가 자산\n\n① 1차 조정폭: 현재가 → 52주 중간값까지 하락 %\n② 최대 조정폭: 현재가 → 52주 저점까지 하락 %\n\n예상 기간: 하락폭을 연간 변동성의 절반(평균 하락 속도)으로 나눠 추정\n\n⚠ 고평가라도 모멘텀이 강하면 계속 상승 가능 — 추세 확인 필수.',
        tag: '하락추정',
      },
      {
        q: '신뢰도 높음 / 중간 / 낮음의 기준?',
        a: '신뢰도 높음:\n• 52주 위치 10% 이하 (저평가)\n• 연간 변동성 30% 미만 (안정적 자산)\n• 해당: 금, 채권, 대형주 ETF\n\n신뢰도 중간:\n• 52주 위치 10~25%\n• 변동성 30~60%\n\n신뢰도 낮음:\n• 변동성 60% 이상\n• 해당: 비트코인, 이더리움 등 고변동성 자산',
        tag: '신뢰도',
      },
      {
        q: '예상 기간은 얼마나 믿을 수 있나?',
        a: '통계적 추정값이므로 실제와 크게 다를 수 있습니다.\n\n연간 환산 수익률이 높더라도 기간이 길면 불확실성도 큽니다:\n• 1~6개월 예상: 비교적 신뢰 가능\n• 1~2년 예상: 방향성 참고 수준\n• 3년 이상: 장기 시나리오 아이디어 수준\n\n이 수치를 투자 결정의 유일한 근거로 쓰면 안 됩니다.',
        tag: '주의',
      },
    ],
  },
  {
    id: 'glossary',
    icon: '📖',
    title: '용어 사전',
    subtitle: '투자에서 자주 쓰는 용어 60개 이상 — 카테고리별 정리',
    topics: [
      // ── 시장 구조 ─────────────────────────────────────────────────────────
      {
        q: '불마켓 / 베어마켓 (Bull / Bear Market)',
        a: '불마켓(강세장): 고점 대비 20% 이상 상승한 상태 또는 지속적 상승 추세\n베어마켓(약세장): 고점 대비 20% 이상 하락한 상태\n\n어원: 황소(Bull)는 뿔을 위로 치받고, 곰(Bear)은 발톱을 아래로 긁는 모습에서.',
        tag: '시장구조', highlight: true,
      },
      {
        q: '조정 (Correction)',
        a: '고점 대비 -10% ~ -20% 하락. 베어마켓(-20% 이상)보다 얕은 하락. 상승 추세 중 자연스럽게 발생하며 과열을 식히는 역할.\n\n평균적으로 1년에 1~2회 발생하며 평균 3~4개월 지속.',
        tag: '시장구조',
      },
      {
        q: 'IPO (Initial Public Offering)',
        a: '기업이 처음으로 주식을 일반 투자자에게 공개 판매하는 것. 상장(上場).\n\n• 공모가: IPO 시 정해진 최초 판매 가격\n• 첫날 급등(팝)하거나 급락하는 경우 모두 흔함\n• 락업(Lock-up): 내부자 보호예수 기간(보통 180일) 후 물량 출회 주의',
        tag: '시장구조',
      },
      {
        q: '시가총액 (Market Capitalization)',
        a: '주가 × 발행주식수 = 기업의 시장 가치\n\n• 메가캡: 1조달러↑ (Apple, NVDA, Microsoft)\n• 대형주(Large Cap): 100억달러↑\n• 중형주(Mid Cap): 20~100억달러\n• 소형주(Small Cap): 2~20억달러\n• 마이크로캡: 2억달러 미만',
        tag: '시장구조',
      },
      {
        q: '유동성 (Liquidity)',
        a: '자산을 빠르게 현금화할 수 있는 정도.\n\n• 높은 유동성: 대형주, 미국채 → 스프레드 좁음, 빠른 매매\n• 낮은 유동성: 소형주, 부동산, NFT → 스프레드 넓음, 슬리피지 발생\n\n위기 시 유동성이 갑자기 고갈되는 "유동성 위기" 발생 가능.',
        tag: '시장구조',
      },
      {
        q: '숏 셀링 (Short Selling) / 공매도',
        a: '주가 하락에 베팅하는 전략.\n\n① 브로커에게 주식을 빌림\n② 현재가에 매도\n③ 주가 하락 후 낮은 가격에 다시 매수\n④ 빌린 주식 반환, 차익 실현\n\n이론적으로 손실 무한대 (주가가 계속 오를 수 있으므로). 개인 투자자에게 고위험.',
        tag: '시장구조',
      },
      {
        q: '스프레드 (Spread)',
        a: '매수호가(Bid)와 매도호가(Ask)의 차이.\n\n• 좁은 스프레드: 유동성 높음, 거래비용 낮음\n• 넓은 스프레드: 유동성 낮음, 거래비용 높음\n\n크레딧 스프레드: 회사채 금리 - 국채 금리. 경기 불안 시 확대.',
        tag: '시장구조',
      },
      // ── 밸류에이션 지표 ────────────────────────────────────────────────────
      {
        q: 'PER / P/E Ratio (주가수익비율)',
        a: '주가 ÷ 주당순이익(EPS)\n\n• S&P 500 역사적 평균: 15~20배\n• 10배 이하: 가치주 영역\n• 25배 이상: 다소 고평가 또는 강한 성장 기대\n• 100배 이상: 극단적 성장 기대 (AI 버블 주의)\n\n같은 업종끼리 비교해야 의미 있음.',
        tag: '밸류에이션', highlight: true,
      },
      {
        q: 'PBR / P/B Ratio (주가순자산비율)',
        a: '주가 ÷ 주당순자산(BPS)\n\n순자산 = 총자산 - 총부채 = 청산 시 주주에게 돌아올 가치\n\n• 1배 이하: 장부가 이하 거래 → 매우 저평가 가능\n• 3배 이상: 무형자산(브랜드·특허) 가치 포함\n\n금융주(은행) 분석에 특히 유용.',
        tag: '밸류에이션',
      },
      {
        q: 'EV/EBITDA',
        a: '기업가치(EV) ÷ 이자·세금·감가상각 전 이익(EBITDA)\n\n부채를 포함한 기업 전체의 밸류에이션. M&A에서 많이 사용.\n\n• 업종 평균 대비 낮으면 저평가\n• PER보다 부채 구조를 잘 반영함',
        tag: '밸류에이션',
      },
      {
        q: 'ROE (자기자본이익률)',
        a: '순이익 ÷ 자기자본 × 100\n\n주주가 투자한 자본으로 얼마나 이익을 냈는지.\n\n• 15% 이상: 우수\n• 20% 이상: 탁월 (워런 버핏의 기준)\n\nROE가 높아도 부채로 자기자본을 줄인 경우(레버리지)일 수 있으니 부채비율도 함께 확인.',
        tag: '밸류에이션',
      },
      {
        q: 'FCF (자유현금흐름)',
        a: '영업현금흐름 - 자본지출(CAPEX)\n\n실제로 기업이 자유롭게 쓸 수 있는 현금.\n순이익은 회계 조작 가능하지만 FCF는 조작이 어려워 더 신뢰할 수 있는 건강 지표.\n\n• FCF 마진 = FCF ÷ 매출 → 높을수록 우량',
        tag: '밸류에이션',
      },
      {
        q: 'DCF (현금흐름할인법)',
        a: '미래의 현금흐름을 현재가치로 환산하여 기업 가치를 산출하는 방법.\n\n• 할인율(WACC): 자본비용 = 금리가 오르면 할인율↑ → 현재가치↓\n• 단점: 가정(성장률, 할인율)에 따라 결과가 크게 달라짐\n\n"DCF로 뭐든 정당화할 수 있다" — 워렌 버핏',
        tag: '밸류에이션',
      },
      // ── 기술적 분석 ────────────────────────────────────────────────────────
      {
        q: '지지선 / 저항선 (Support / Resistance)',
        a: '지지선: 가격이 하락할 때 멈추는 구간 (매수세 집중)\n저항선: 가격이 상승할 때 막히는 구간 (매도세 집중)\n\n지지선이 무너지면 저항선이 되고, 저항선을 돌파하면 지지선이 됨.',
        tag: '기술분석',
      },
      {
        q: '이동평균선 (Moving Average)',
        a: '일정 기간의 가격 평균을 연결한 선.\n\n• 20일선: 단기 추세\n• 50일선: 중기 추세\n• 200일선: 장기 추세\n\n골든크로스: 단기선이 장기선을 위로 교차 → 상승 신호\n데드크로스: 단기선이 장기선을 아래로 교차 → 하락 신호',
        tag: '기술분석', highlight: true,
      },
      {
        q: 'RSI (상대강도지수)',
        a: '0~100 사이 값으로 과매수/과매도 판단.\n\n• 70 이상: 과매수 → 조정 가능\n• 30 이하: 과매도 → 반등 가능\n• 50 기준선: 추세 방향 판단\n\n다이버전스: 가격은 오르는데 RSI는 내리면 상승 약화 신호.',
        tag: '기술분석',
      },
      {
        q: 'MACD',
        a: '12일 지수이동평균 - 26일 지수이동평균\n\n• MACD선이 시그널선(9일 EMA)을 상향 돌파 → 매수 신호\n• MACD선이 시그널선을 하향 이탈 → 매도 신호\n• 히스토그램이 0선 위 = 강세, 아래 = 약세',
        tag: '기술분석',
      },
      {
        q: '볼린저 밴드 (Bollinger Bands)',
        a: '20일 이동평균 ± 2표준편차로 만든 상하단 밴드.\n\n• 상단 밴드 터치: 과매수 주의\n• 하단 밴드 터치: 과매도 → 반등 가능\n• 밴드 수축(스퀴즈): 큰 움직임 예고\n• 밴드 확장: 강한 추세 진행 중',
        tag: '기술분석',
      },
      {
        q: '거래량 (Volume)',
        a: '일정 기간 동안 거래된 주식 수.\n\n• 가격 상승 + 거래량 증가 → 강한 상승 (신뢰도 높음)\n• 가격 상승 + 거래량 감소 → 약한 상승 (모멘텀 약화)\n• 가격 하락 + 거래량 폭증 → 투매, 바닥 가능성\n\n거래량은 가격보다 먼저 방향을 보여주는 경향.',
        tag: '기술분석',
      },
      // ── 거시경제 ───────────────────────────────────────────────────────────
      {
        q: 'GDP (국내총생산)',
        a: '한 나라에서 일정 기간 생산된 모든 재화와 서비스의 시장 가치.\n\n• 전분기 대비 2분기 연속 감소 = 기술적 침체(Recession)\n• 미국 GDP 성장률 2~3%: 정상, 4%↑: 과열, 0% 이하: 침체\n\n발표: 분기마다 잠정치 → 수정치 → 확정치 순으로 발표.',
        tag: '거시경제', highlight: true,
      },
      {
        q: 'CPI / PCE (물가 지수)',
        a: 'CPI (소비자물가지수): 도시 소비자가 구매하는 상품·서비스 바구니의 가격 변화\nPCE (개인소비지출): 연준이 선호하는 인플레 지표\n\n• 2% 이하: 연준 목표치\n• 2~4%: 약한 인플레\n• 5%↑: 강한 인플레 → 금리 인상 압력',
        tag: '거시경제',
      },
      {
        q: '연준 (Federal Reserve / Fed)',
        a: '미국 중앙은행. 통화정책을 결정.\n\n• FOMC: 연 8회 회의, 기준금리 결정\n• 금리 인상: 인플레 억제, 경기 과열 방지\n• 금리 인하: 경기 부양, 유동성 공급\n• QE (양적완화): 채권 매입으로 시중 유동성 확대\n• QT (양적긴축): 채권 매각/만기 미연장으로 유동성 회수',
        tag: '거시경제', highlight: true,
      },
      {
        q: '실업률과 주식시장',
        a: '낮은 실업률 = 경기 호황 → 주식에 긍정적 (단, 임금 상승 → 인플레 우려)\n높은 실업률 = 경기 침체 → 연준 금리 인하 기대 → 주식에 긍정적(!)일 수도\n\n역설: 나쁜 경제지표 → 금리 인하 기대 → 주가 상승. "Bad news is good news"',
        tag: '거시경제',
      },
      {
        q: '무역수지 / 경상수지',
        a: '무역수지: 수출 - 수입. 흑자면 달러 유입, 적자면 달러 유출\n경상수지: 무역수지 + 서비스수지 + 소득수지\n\n미국은 만성 무역적자국이지만 달러 기축통화 지위로 유지.\n한국은 수출 의존도가 높아 글로벌 경기 민감.',
        tag: '거시경제',
      },
      // ── 채권 / 금리 ────────────────────────────────────────────────────────
      {
        q: '채권 가격과 금리의 관계',
        a: '채권 가격과 금리(수익률)는 반대로 움직임.\n\n예) 금리 5%짜리 채권 100달러 → 금리가 6%로 오르면\n새 채권이 더 유리 → 기존 채권 가격 하락\n\n• 금리 상승 → 채권 가격 하락\n• 금리 하락 → 채권 가격 상승\n\n채권 ETF(TLT 등)는 이 원리로 금리와 반대 방향.',
        tag: '채권·금리', highlight: true,
      },
      {
        q: '듀레이션 (Duration)',
        a: '금리 변화에 대한 채권 가격의 민감도.\n\n• 듀레이션 10 = 금리 1% 상승 시 채권 가격 약 10% 하락\n• 장기채(30년물)는 듀레이션이 길어 금리 민감도 높음\n• 단기채(2년물)는 듀레이션 짧아 상대적 안전\n\nTLT(20년 이상 미국채 ETF): 듀레이션 ~18, 금리 매우 민감.',
        tag: '채권·금리',
      },
      {
        q: '하이일드 채권 (High Yield / 정크본드)',
        a: '신용등급 BB 이하의 채권. 부도 위험이 높지만 높은 이자율 제공.\n\n• 투자등급: BBB 이상 (안전)\n• 하이일드: BB 이하 (위험, 고수익)\n\nHYG(하이일드 ETF)와 S&P 500이 비슷하게 움직임. 위기 시 스프레드(하이일드-국채 금리차) 확대.',
        tag: '채권·금리',
      },
      {
        q: '연방기금금리 (Fed Funds Rate)',
        a: '미국 은행들이 서로 단기 자금을 빌릴 때 적용하는 금리. 연준이 결정.\n\n모든 금리의 기준점:\n연방기금금리 → 은행 대출금리 → 모기지·자동차 할부 금리\n\n• 금리 인상 사이클: 인플레 억제\n• 금리 인하 사이클: 경기 부양, 주식 상승 동력',
        tag: '채권·금리',
      },
      // ── 섹터 / ETF ─────────────────────────────────────────────────────────
      {
        q: '주요 섹터 ETF 티커 정리',
        a: 'XLK: 기술 (Technology)\nXLC: 커뮤니케이션 (Communication Services)\nXLY: 임의소비재 (Consumer Discretionary)\nXLP: 필수소비재 (Consumer Staples)\nXLF: 금융 (Financials)\nXLI: 산업재 (Industrials)\nXLV: 헬스케어 (Health Care)\nXLE: 에너지 (Energy)\nXLB: 소재 (Materials)\nXLU: 유틸리티 (Utilities)\nXLRE: 부동산 (Real Estate)',
        tag: '섹터·ETF', highlight: true,
      },
      {
        q: '방어주 vs 성장주',
        a: '방어주: 경기 침체에도 수요가 유지되는 섹터\n→ 필수소비재(XLP), 유틸리티(XLU), 헬스케어(XLV)\n→ 배당수익률 높음, 변동성 낮음\n\n성장주: 경기 확장기에 이익이 빠르게 성장\n→ 기술(XLK), 임의소비재(XLY)\n→ PER 높음, 금리에 민감, 고변동성',
        tag: '섹터·ETF',
      },
      {
        q: '주요 주가지수 ETF',
        a: 'SPY / VOO / IVV: S&P 500 추종\nQQQ: 나스닥 100 추종 (기술주 집중)\nDIA: 다우존스 30 추종\nIWM: 러셀 2000 추종 (소형주)\nEFA: 선진국(미국 제외) 주식\nEEM: 신흥국 주식\nVT: 전세계 주식 (미국 포함)',
        tag: '섹터·ETF',
      },
      {
        q: '원자재 ETF',
        a: 'GLD / IAU: 금\nSLV: 은\nCOPPER / CPER: 구리\nGSG / DJP: 원자재 종합\nUSO: 원유(WTI)\nUNG: 천연가스\n\n레버리지 원자재 ETF는 장기 보유 시 롤오버 비용으로 성과 저하.',
        tag: '섹터·ETF',
      },
      // ── 암호화폐 ──────────────────────────────────────────────────────────
      {
        q: '비트코인 (BTC)의 특성',
        a: '총 발행량 2,100만 개 한정. 4년마다 반감기(Halving)로 신규 발행량 절반으로 감소.\n\n• 디지털 금: 희소성 + 탈중앙화\n• 변동성: 연간 ~60~80% (금의 4~5배)\n• 반감기 전후 역사적 상승 패턴 (2012, 2016, 2020, 2024)\n• ETF 승인(2024) → 기관 자금 유입 채널 생성',
        tag: '암호화폐',
      },
      {
        q: '알트코인 / 이더리움(ETH)',
        a: '비트코인 외 암호화폐 = 알트코인\n이더리움: 스마트컨트랙트 플랫폼, DeFi·NFT 기반\n\n• ETH/BTC 비율: 알트코인 시즌 판단 지표\n  - 상승: 알트코인 강세 (위험 선호)\n  - 하락: 비트코인으로 자금 집중 (위험 회피)\n\n암호화폐는 위험자산 중 가장 변동성이 높은 자산군.',
        tag: '암호화폐',
      },
      {
        q: '도미넌스 (Dominance)',
        a: '전체 암호화폐 시가총액 중 특정 코인의 비율.\n\nBTC 도미넌스:\n• 50% 이상: 비트코인 주도장 (알트코인 약세)\n• 40% 이하: 알트코인 시즌 가능성\n\n도미넌스 하락 = 알트코인으로 자금 이동 = 위험 선호.',
        tag: '암호화폐',
      },
      // ── 리스크 관리 ────────────────────────────────────────────────────────
      {
        q: '분산투자 (Diversification)',
        a: '여러 자산에 나눠 투자해 특정 자산의 손실이 전체에 미치는 영향을 줄임.\n\n• 자산 간 상관관계가 낮을수록 분산 효과 크다\n• 주식 + 채권 + 금 + 원자재의 전통적 배분\n\n단, 2022년처럼 주식·채권 동반 하락 시 분산 효과 제한적.',
        tag: '리스크관리',
      },
      {
        q: '손절 / 스탑로스 (Stop-Loss)',
        a: '사전에 정해놓은 손실 수준에서 자동으로 매도하는 주문.\n\n• -5% ~ -10%: 단기 트레이딩\n• -15% ~ -20%: 중장기 투자\n\n손절은 감정이 아닌 규칙으로. "손절을 두려워하면 더 큰 손실"',
        tag: '리스크관리', highlight: true,
      },
      {
        q: '레버리지 (Leverage)',
        a: '빌린 돈으로 더 큰 포지션을 취하는 것. 수익도 손실도 배가됨.\n\n2배 레버리지 ETF: 기초자산 1% 상승 시 2% 상승, 1% 하락 시 2% 하락\n\n• 레버리지 ETF의 복리 왜곡: 장기 보유 시 수익률이 기초자산 × 배율이 아님\n• 변동성 높을수록 레버리지 손해 → 단기 매매 도구',
        tag: '리스크관리',
      },
      {
        q: '샤프 비율 (Sharpe Ratio)',
        a: '(수익률 - 무위험수익률) ÷ 변동성\n\n위험 대비 초과 수익의 효율성 지표.\n\n• 1 이상: 양호\n• 2 이상: 우수\n• 0 이하: 무위험 자산(국채)보다 못한 위험 감수\n\n같은 수익률이라도 변동성이 낮으면 샤프 비율이 높다.',
        tag: '리스크관리',
      },
      {
        q: '헷징 (Hedging)',
        a: '기존 포지션의 손실을 줄이기 위한 반대 포지션.\n\n방법:\n• 인버스 ETF 매수 (SH=S&P 500 인버스)\n• 풋옵션 매수\n• 금·달러 편입 (위험자산 하락 시 상승 경향)\n\n완전한 헷징은 이익도 없애지만 심리적 안정 제공.',
        tag: '리스크관리',
      },
      // ── 투자 전략 ──────────────────────────────────────────────────────────
      {
        q: '가치투자 vs 성장투자',
        a: '가치투자: PER·PBR·FCF 등이 저평가된 기업 발굴\n대표: 워런 버핏, 벤저민 그레이엄\n\n성장투자: 이익 성장률 높은 기업에 프리미엄 지불\n대표: 피터 린치, 캐시 우드\n\n사이클: 금리 상승기에 가치주 유리, 금리 하락기에 성장주 유리',
        tag: '투자전략',
      },
      {
        q: '달러코스트 에버리징 (DCA)',
        a: '일정 금액을 정기적으로 분할 매수하는 전략.\n\n• 가격 높을 때: 적은 수량 매수\n• 가격 낮을 때: 많은 수량 매수\n→ 평균 매수 단가 낮춤\n\n"타이밍을 못 맞춰도 장기적으로 좋은 결과" — 지수·우량주에 특히 효과적.',
        tag: '투자전략',
      },
      {
        q: '배당투자 (Dividend Investing)',
        a: '정기적으로 배당금을 주는 주식에 투자.\n\n• 배당수익률 = 연간 배당금 ÷ 주가\n• 배당귀족: 25년 이상 배당 연속 증가 기업 (JNJ, KO, PG 등)\n• DRIP: 배당금을 자동으로 재투자 → 복리 효과\n\n유틸리티·필수소비재·부동산 섹터가 배당 높음.',
        tag: '투자전략',
      },
      {
        q: '포트폴리오 리밸런싱',
        a: '목표 비율에서 벗어난 자산 배분을 원래대로 조정.\n\n예) 주식 60% / 채권 40% 목표 → 주식 상승으로 75% / 25%\n→ 주식 일부 매도, 채권 추가 매수\n\n• 일반적으로 연 1~2회 또는 비율이 5~10% 벗어날 때\n• 자동으로 고점 매도, 저점 매수하는 효과',
        tag: '투자전략',
      },
      // ── 주문/거래 ──────────────────────────────────────────────────────────
      {
        q: '시장가 / 지정가 주문',
        a: '시장가(Market Order): 현재 가격으로 즉시 체결. 빠르지만 슬리피지 발생 가능\n\n지정가(Limit Order): 원하는 가격 이하에서만 매수 (또는 이상에서 매도)\n→ 원하는 가격에 체결되거나 안 될 수도 있음\n\n변동성 높은 시장에서는 시장가 주의.',
        tag: '주문·거래',
      },
      {
        q: '프리마켓 / 애프터마켓',
        a: '정규장(Regular): 미국 동부 시간 9:30~16:00\n\n프리마켓(Pre-Market): 4:00~9:30\n애프터마켓(After-Hours): 16:00~20:00\n\n• 실적 발표는 보통 장 마감 후 또는 개장 전에 발표\n• 비정규장은 유동성 낮아 스프레드 넓고 가격 왜곡 가능',
        tag: '주문·거래',
      },
      {
        q: '서킷브레이커 (Circuit Breaker)',
        a: '주가 급락 시 거래를 일시 중단하는 제도.\n\n미국 S&P 500 기준:\n• -7% 하락: 15분 거래 중단 (레벨 1)\n• -13% 하락: 15분 거래 중단 (레벨 2)\n• -20% 하락: 당일 거래 종료 (레벨 3)',
        tag: '주문·거래',
      },
      // ── 파생상품 ──────────────────────────────────────────────────────────
      {
        q: '옵션 (Options) 기초',
        a: '특정 가격(행사가)에 특정 날짜(만기)에 자산을 살(콜) 또는 팔(풋) 권리.\n\n콜옵션(Call): 주가 상승에 베팅\n풋옵션(Put): 주가 하락에 베팅\n\n매수자: 프리미엄만 손실 (손실 제한)\n매도자: 프리미엄 수익, 잠재 손실 무한대',
        tag: '파생상품',
      },
      {
        q: '선물 (Futures)',
        a: '미래 특정 날짜에 특정 가격으로 자산을 사고 파는 계약.\n\n• 원자재(원유·금·밀) 가격 선물\n• 주가지수 선물 (S&P 500 선물 /ES)\n• 통화 선물\n\n레버리지 효과 있어 증거금의 수십 배 거래 가능. 고위험.',
        tag: '파생상품',
      },
      // ── 기타 핵심 용어 ─────────────────────────────────────────────────────
      {
        q: 'ETF vs 뮤추얼펀드',
        a: 'ETF: 거래소에서 실시간 매매, 수수료 낮음(0.03~0.5%), 세금 효율적\n뮤추얼펀드: 하루 1번 마감 가격으로 거래, 수수료 높음(0.5~2%+), 적극 운용\n\n장기 투자에서 대부분의 적극 운용 펀드가 인덱스 ETF에 패배함.',
        tag: '기타',
      },
      {
        q: '인플레이션 vs 디플레이션 vs 스태그플레이션',
        a: '인플레이션: 물가 지속 상승 → 현금 가치 하락, 실물자산 유리\n디플레이션: 물가 지속 하락 → 소비 위축, 부채 부담 증가 (더 위험)\n스태그플레이션: 경기 침체 + 고인플레 동시 발생 → 최악의 상황\n(예: 1970년대 오일쇼크)',
        tag: '기타',
      },
      {
        q: 'FOMO / FOMO랠리',
        a: 'Fear Of Missing Out — 상승장을 놓칠까봐 두려움에 추격 매수.\n\n대표적 위험 패턴:\n• 이미 많이 오른 자산을 고점에 추격 매수\n• 소셜미디어 밈(Meme) 주식 추종\n\n반대: FOMO가 극대화될 때가 종종 고점 신호.',
        tag: '기타',
      },
      {
        q: 'SPX / NDX / DJI / RUT / VIX / TNX / DXY',
        a: 'SPX: S&P 500 (^GSPC) — 미국 대형주 500개\nNDX: 나스닥 100 (^NDX) — 기술주 100개\nDJI: 다우존스 (^DJI) — 블루칩 30개\nRUT: 러셀 2000 (^RUT) — 미국 소형주 2000개\nVIX: 공포지수 (^VIX) — S&P 500 옵션 내재변동성\nTNX: 10년물 국채금리 (^TNX)\nDXY: 달러인덱스 — 6개 주요통화 대비 달러 강도',
        tag: '기타', highlight: true,
      },
    ],
  },
];

// ─── 수익률 비교표 ─────────────────────────────────────────────────────────────
const RETURN_DATA = [
  { label: '은행 예금',          sublabel: '(정기예금 장기 평균)',   rate: 3.0,  color: '#94a3b8', barColor: '#cbd5e1', category: '예금·채권' },
  { label: '국채 (채권)',        sublabel: '(10년물 장기 평균)',     rate: 3.5,  color: '#64748b', barColor: '#94a3b8', category: '예금·채권' },
  { label: '물가상승률',         sublabel: '(CPI 10년 평균 — 참고)', rate: 3.0,  color: '#f97316', barColor: '#fed7aa', category: '기준선',   isRef: true },
  { label: '부동산 수도권',      sublabel: '(한국 수도권 평균)',     rate: 4.8,  color: '#a855f7', barColor: '#e9d5ff', category: '부동산' },
  { label: '서울 중위 아파트',   sublabel: '(서울 중간값 기준)',     rate: 6.5,  color: '#8b5cf6', barColor: '#ddd6fe', category: '부동산' },
  { label: '서울 상위 아파트',   sublabel: '(강남·서초·송파 기준)', rate: 9.0,  color: '#7c3aed', barColor: '#c4b5fd', category: '부동산' },
  { label: 'S&P 500',           sublabel: '(미국 대형주 지수)',     rate: 10.5, color: '#0ea5e9', barColor: '#bae6fd', category: '미국주식' },
  { label: '나스닥 100 (QQQ)',   sublabel: '(기술주 중심)',          rate: 14.5, color: '#1d4ed8', barColor: '#bfdbfe', category: '미국주식', isBest: true },
];

function ReturnComparisonTable() {
  const maxRate = 15;
  const categories = ['기준선', '예금·채권', '부동산', '미국주식'] as const;
  const catLabel: Record<string, string> = {
    '기준선': '📌 기준선',
    '예금·채권': '🏦 예금·채권',
    '부동산': '🏠 부동산',
    '미국주식': '📈 미국 주식',
  };

  return (
    <div>
      {/* 헤더 */}
      <div style={{ padding: '14px 20px', background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', color: 'white', borderRadius: '10px 10px 0 0' }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>📊 자산별 연평균 수익률 비교</div>
        <div style={{ fontSize: 11, opacity: 0.85 }}>
          장기 역사적 평균 기준 &nbsp;·&nbsp; <strong style={{ color: '#93c5fd' }}>72 법칙</strong>: 2배 도달 연수 = 72 ÷ 연평균 수익률(%)
          &nbsp;·&nbsp; 물가상승률은 투자 수익률이 아닌 기준선(구매력 침식)
        </div>
      </div>

      {/* 카드 그리드 */}
      <div style={{ background: '#f8faff', border: '1px solid #e8f0fe', borderTop: 'none', padding: '16px 20px' }}>
        {categories.map(cat => {
          const items = RETURN_DATA.filter(d => d.category === cat);
          return (
            <div key={cat} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>
                {catLabel[cat]}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 10 }}>
                {items.map(d => {
                  const doublingYears = d.isRef ? null : (72 / d.rate).toFixed(1);
                  const barW = (d.rate / maxRate) * 100;
                  return (
                    <div key={d.label} style={{
                      background: d.isBest ? '#eff6ff' : d.isRef ? '#fff7ed' : 'white',
                      border: `1px solid ${d.isBest ? '#93c5fd' : d.isRef ? '#fed7aa' : '#e5e7eb'}`,
                      borderTop: `3px solid ${d.color}`,
                      borderRadius: 8, padding: '12px 14px',
                      position: 'relative',
                    }}>
                      {d.isBest && (
                        <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 8, fontWeight: 700, color: '#1d4ed8', background: '#dbeafe', padding: '2px 6px', borderRadius: 3 }}>
                          🏆 최고
                        </span>
                      )}
                      <div style={{ fontSize: 12, fontWeight: 700, color: d.isRef ? '#ea580c' : '#111', marginBottom: 2 }}>{d.label}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 10 }}>{d.sublabel}</div>

                      {/* 수익률 */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                        <span style={{ fontSize: 22, fontWeight: 800, color: d.color, fontFamily: 'JetBrains Mono, monospace' }}>
                          {d.isRef ? '' : '+'}{d.rate}%
                        </span>
                        <span style={{ fontSize: 10, color: '#9ca3af' }}>/ 년</span>
                      </div>

                      {/* 바 */}
                      <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, marginBottom: 8 }}>
                        <div style={{ height: '100%', width: `${barW}%`, background: d.isRef ? '#fb923c' : d.color, borderRadius: 3 }} />
                      </div>

                      {/* 2배 도달 */}
                      {doublingYears ? (
                        <div style={{ background: d.isBest ? '#dbeafe' : '#f3f4f6', borderRadius: 5, padding: '6px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>💰 1억 → 2억</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: d.isBest ? '#1d4ed8' : '#374151', fontFamily: 'JetBrains Mono, monospace' }}>
                            {doublingYears}<span style={{ fontSize: 11, fontWeight: 500 }}>년</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ background: '#fff7ed', borderRadius: 5, padding: '6px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: '#ea580c', fontWeight: 600 }}>구매력 침식 기준선</div>
                          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>이 이상 벌어야 실질 수익</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* 전체 비교 요약 */}
        <div style={{ background: '#1e3a8a', borderRadius: 10, padding: '14px 18px', marginTop: 4 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 10, fontWeight: 600 }}>
            ⏱ 1억 원 → 2억 원 도달: 자산별 소요 연수 비교
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60 }}>
            {RETURN_DATA.filter(d => !d.isRef).map(d => {
              const yrs = 72 / d.rate;
              const maxYrs = 72 / 3.0;  // 은행예금 기준 최대
              const barH = ((maxYrs - yrs) / (maxYrs - 72 / 14.5)) * 48 + 12;
              return (
                <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 9, color: d.isBest ? '#93c5fd' : 'rgba(255,255,255,0.8)', fontWeight: d.isBest ? 700 : 500, fontFamily: 'JetBrains Mono, monospace' }}>
                    {yrs.toFixed(1)}년
                  </div>
                  <div style={{ width: '100%', height: barH, background: d.isBest ? '#3b82f6' : 'rgba(255,255,255,0.2)', borderRadius: '3px 3px 0 0', minHeight: 8 }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            {RETURN_DATA.filter(d => !d.isRef).map(d => (
              <div key={d.label} style={{ flex: 1, fontSize: 8, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 1.3 }}>
                {d.label.replace(' (QQQ)', '').replace(' 100', '').replace(' 아파트', '')}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 9, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
            ※ 역사적 장기 평균 기준. 세금·수수료·거래비용 미반영. 투자 조언이 아닙니다.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 토픽 카드 ────────────────────────────────────────────────────────────────
function TopicCard({ topic }: { topic: typeof CHAPTERS[0]['topics'][0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: `1px solid ${topic.highlight ? '#bfdbfe' : '#f0f0f0'}`,
      borderLeft: `3px solid ${topic.highlight ? '#1d4ed8' : '#e5e7eb'}`,
      borderRadius: 8, background: topic.highlight ? '#f8faff' : 'white',
      marginBottom: 8, overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', textAlign: 'left', padding: '11px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer', gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, flexShrink: 0,
            color: topic.highlight ? '#1d4ed8' : '#6b7280',
            background: topic.highlight ? '#dbeafe' : '#f3f4f6',
            padding: '2px 7px', borderRadius: 4,
          }}>{topic.tag}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111', lineHeight: 1.4 }}>{topic.q}</span>
        </div>
        <div style={{ color: '#bbb', flexShrink: 0 }}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>
      {open && (
        <div style={{
          padding: '12px 14px 14px',
          fontSize: 12.5, color: '#374151', lineHeight: 2,
          whiteSpace: 'pre-line',
          borderTop: `1px solid ${topic.highlight ? '#bfdbfe' : '#f5f5f5'}`,
          background: topic.highlight ? '#f0f6ff' : '#fafafa',
        }}>
          {topic.a}
        </div>
      )}
    </div>
  );
}

// ─── 검색 ────────────────────────────────────────────────────────────────────
function useSearch(query: string) {
  if (!query.trim()) return null;
  const q = query.toLowerCase();
  const results: { chapterTitle: string; topic: typeof CHAPTERS[0]['topics'][0] }[] = [];
  CHAPTERS.forEach(ch => {
    ch.topics.forEach(t => {
      if (t.q.toLowerCase().includes(q) || t.a.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q)) {
        results.push({ chapterTitle: `${ch.icon} ${ch.title}`, topic: t });
      }
    });
  });
  return results;
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────
export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState(CHAPTERS[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  const active = CHAPTERS.find(c => c.id === activeTab) ?? CHAPTERS[0];
  const searchResults = useSearch(searchQuery);

  const totalTopics = CHAPTERS.reduce((s, c) => s + c.topics.length, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── 페이지 헤더 ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <BookOpen size={20} color="#1d4ed8" />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>기초 지식</h1>
        </div>
        <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
          이 대시보드에서 사용하는 시장 지표와 투자 개념을 챕터별로 정리했습니다.
          <span style={{ color: '#1d4ed8', fontWeight: 600 }}> 파란 테두리</span> 항목이 특히 중요합니다.
          &nbsp;총 {CHAPTERS.length}개 챕터 · {totalTopics}개 항목
        </p>
      </div>

      {/* ── 검색 ── */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={14} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="용어, 지표, 개념 검색... (예: VIX, 금은비, 52주)"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '10px 14px 10px 36px',
            fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 8,
            background: 'white', color: '#111', fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, lineHeight: 1 }}
          >×</button>
        )}
      </div>

      {/* ── 검색 결과 ── */}
      {searchResults !== null ? (
        <div style={{ border: '1px solid #e8f0fe', borderRadius: 10, overflow: 'hidden', background: 'white' }}>
          <div style={{ padding: '10px 16px', background: '#f8faff', borderBottom: '1px solid #e8f0fe' }}>
            <span style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 600 }}>
              검색 결과 {searchResults.length}개
            </span>
            {searchResults.length === 0 && <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>"{searchQuery}" 에 대한 결과가 없습니다</span>}
          </div>
          <div style={{ padding: 16 }}>
            {searchResults.map((r, i) => (
              <div key={i}>
                <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 600, marginBottom: 4, marginTop: i > 0 ? 4 : 0 }}>{r.chapterTitle}</div>
                <TopicCard topic={r.topic} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── 챕터 뷰 ── */
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden', background: 'white' }}>

          {/* 챕터 탭 */}
          <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', overflowX: 'auto', background: '#fafbff' }}>
            {CHAPTERS.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveTab(c.id)}
                style={{
                  padding: '11px 18px', fontSize: 12, fontWeight: activeTab === c.id ? 700 : 500,
                  cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit',
                  color: activeTab === c.id ? '#1d4ed8' : '#6b7280',
                  borderBottom: `2px solid ${activeTab === c.id ? '#1d4ed8' : 'transparent'}`,
                  marginBottom: -1, whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span style={{ fontSize: 14 }}>{c.icon}</span>
                <span>{c.title}</span>
                {c.id !== 'return-compare' && (
                  <span style={{ fontSize: 9, color: '#bbb', background: '#f3f4f6', padding: '1px 5px', borderRadius: 8 }}>
                    {c.topics.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* 챕터 부제목 */}
          <div style={{ padding: '10px 20px', background: '#fafbff', borderBottom: '1px solid #f5f5f5' }}>
            <span style={{ fontSize: 11, color: '#6b7280' }}>
              <strong style={{ color: '#111' }}>{active.icon} {active.title}</strong>
              {' — '}{active.subtitle}
            </span>
          </div>

          {/* 토픽 목록 */}
          <div style={{ padding: '16px 20px' }}>
            {active.id === 'return-compare' ? (
              <ReturnComparisonTable />
            ) : (
              active.topics.map((t, i) => <TopicCard key={i} topic={t} />)
            )}
          </div>

          {/* 하단 안내 */}
          <div style={{ padding: '10px 20px', background: '#f8faff', borderTop: '1px solid #e8f0fe', fontSize: 10, color: '#9ca3af', lineHeight: 1.6 }}>
            💡 <strong style={{ color: '#6b7280' }}>파란 테두리</strong> 항목이 이 대시보드에서 특히 중요한 개념입니다.
            &nbsp;모든 수치는 참고용이며 투자 조언이 아닙니다.
          </div>
        </div>
      )}
    </div>
  );
}
