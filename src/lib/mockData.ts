// Mock data engine for DH Stock platform
// Real API integration ready - replace functions with actual API calls

export interface Stock {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  // Valuation
  pe: number;
  pb: number;
  ps: number;
  peg: number;
  evEbitda: number;
  // Quality
  roe: number;
  roa: number;
  roic: number;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  // Growth
  epsGrowthYoy: number;
  epsGrowth5y: number;
  revenueGrowthYoy: number;
  revenueGrowth5y: number;
  // Financial Health
  debtToEquity: number;
  currentRatio: number;
  quickRatio: number;
  interestCoverage: number;
  fcfYield: number;
  // Momentum
  rsi14: number;
  rs52w: number; // relative strength vs S&P500
  high52w: number;
  low52w: number;
  priceVs52wHigh: number; // % below 52w high
  ma50: number;
  ma200: number;
  // Dividend
  dividendYield: number;
  dividendGrowth5y: number;
  payoutRatio: number;
  // CANSLIM
  cEpsGrowthQtr: number; // C: Current EPS growth
  aEpsGrowth3y: number;  // A: Annual EPS growth 3yr avg
  nNewHigh: boolean;     // N: Near new high
  sVolumeSurge: number;  // S: Volume surge ratio
  iInstitOwnership: number; // I: Institutional ownership %
  // Magic Formula
  earningsYield: number;  // EBIT/EV
  returnOnCapital: number; // EBIT/(NetWorkingCapital + FixedAssets)
  magicFormulaRank: number;
  // Scores
  qualityScore: number;
  valueScore: number;
  momentumScore: number;
  growthScore: number;
  overallScore: number;
}

export interface PortfolioPosition {
  id: string;
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  sector: string;
  purchaseDate: string;
}

export interface MarketIndex {
  name: string;
  ticker: string;
  value: number;
  change: number;
  changePct: number;
  color: string;
}

export interface SectorData {
  sector: string;
  changePct: number;
  marketCap: number;
  pe: number;
  stocks: number;
}

export interface MacroEvent {
  date: string;
  event: string;
  actual: string | null;
  forecast: string;
  previous: string;
  importance: 'high' | 'medium' | 'low';
  category?: 'fed' | 'earnings' | 'indicator' | 'market';
  ticker?: string;
  description?: string;
  impactCommentary?: string;
}

export interface LegendaryPortfolio {
  investor: string;
  title: string;
  style: string;
  holdings: { ticker: string; name: string; weight: number; action: 'Buy' | 'Hold' | 'Sell' }[];
}

// ─── Market Indices ─────────────────────────────── 2026-05-22 실제 종가 ─────
export const marketIndices: MarketIndex[] = [
  { name: 'S&P 500',      ticker: 'SPX', value: 7473.47,  change:  -39.19, changePct: -0.52, color: '#ef4444' },
  { name: 'NASDAQ',       ticker: 'COMP', value: 26293.10, change: -136.32, changePct: -0.52, color: '#ef4444' },
  { name: 'DOW JONES',    ticker: 'DJI',  value: 50579.70, change:  -81.44, changePct: -0.16, color: '#ef4444' },
  { name: 'VIX',          ticker: 'VIX',  value: 17.03,   change:    0.89,  changePct:  5.52, color: '#f59e0b' },
  { name: 'Russell 2000', ticker: 'RUT',  value: 2869.23,  change:  -11.24, changePct: -0.39, color: '#ef4444' },
  { name: '10Y Treasury', ticker: 'TNX',  value: 4.56,    change:    0.04,  changePct:  0.89, color: '#f59e0b' },
];

// ─── Sector Performance ───────────────────────────────────────────────────────
export const sectorData: SectorData[] = [
  { sector: 'Technology', changePct: 1.85, marketCap: 14200, pe: 28.4, stocks: 147 },
  { sector: 'Healthcare', changePct: 0.42, marketCap: 6800, pe: 22.1, stocks: 132 },
  { sector: 'Financials', changePct: 0.73, marketCap: 7100, pe: 13.8, stocks: 98 },
  { sector: 'Consumer Disc.', changePct: -0.31, marketCap: 5200, pe: 24.7, stocks: 84 },
  { sector: 'Industrials', changePct: 0.55, marketCap: 4800, pe: 20.3, stocks: 76 },
  { sector: 'Communication', changePct: 1.12, marketCap: 3900, pe: 17.6, stocks: 53 },
  { sector: 'Consumer Staples', changePct: -0.22, marketCap: 3400, pe: 19.2, stocks: 61 },
  { sector: 'Energy', changePct: -0.88, marketCap: 2900, pe: 11.4, stocks: 54 },
  { sector: 'Real Estate', changePct: -1.15, marketCap: 2100, pe: 35.1, stocks: 45 },
  { sector: 'Materials', changePct: 0.28, marketCap: 1900, pe: 16.8, stocks: 38 },
  { sector: 'Utilities', changePct: -0.65, marketCap: 1600, pe: 18.9, stocks: 34 },
];

// ─── Macro Events Calendar ────────────────────────────────────────────────────
export const macroEvents: MacroEvent[] = [
  {
    date: '2026-05-20',
    event: 'FOMC 의사록 공개 (Minutes)',
    actual: '완화적',
    forecast: '-',
    previous: '-',
    importance: 'medium',
    category: 'fed',
    description: '지난 연방공개시장위원회(FOMC) 회의의 상세 논의 내용이 담긴 의사록이 공개됩니다.',
    impactCommentary: '인플레이션 둔화에 대한 연준 위원들의 확신 정도와 향후 금리 인하 경로에 대한 구체적인 힌트가 들어있어 시장 금리에 변동성을 줄 수 있습니다.'
  },
  {
    date: '2026-05-22',
    event: 'NVIDIA 1분기 실적 발표 (어닝)',
    actual: '서프라이즈',
    forecast: 'EPS $5.52',
    previous: 'EPS $1.09',
    importance: 'high',
    category: 'earnings',
    ticker: 'NVDA',
    description: '글로벌 AI 반도체 대장주 엔비디아의 분기 실적 발표입니다.',
    impactCommentary: 'AI 수요의 지속 가능성을 가늠할 수 있는 핵심 지표로, 결과에 따라 기술주 전반 및 나스닥 지수에 막대한 영향을 미칩니다.'
  },
  {
    date: '2026-05-27',
    event: '메모리얼 데이 (미국 증시 휴장)',
    actual: null,
    forecast: '-',
    previous: '-',
    importance: 'high',
    category: 'market',
    description: '미국 연방 공휴일인 메모리얼 데이로 주식 및 채권 시장이 휴장합니다.',
    impactCommentary: '시장 거래량이 전후로 감소할 수 있으나, 휴장일 동안의 지정학적 이슈나 주말 뉴스가 화요일 개장 시 급격히 반영될 수 있으니 유의가 필요합니다.'
  },
  {
    date: '2026-05-28',
    event: '5월 콘퍼런스보드 소비자신뢰지수',
    actual: null,
    forecast: '98.2',
    previous: '97.0',
    importance: 'medium',
    category: 'indicator',
    description: '미국 소비자들이 인지하는 경기 상황과 향후 전망을 수치화한 지표입니다.',
    impactCommentary: '예상치 상회 시 소비 활력 유지를 시사하여 경기 연착륙 가능성을 높이며, 달러화 강세 및 기술주 호재로 작용할 수 있습니다.'
  },
  {
    date: '2026-05-29',
    event: 'Costco 분기 실적 발표 (어닝)',
    actual: null,
    forecast: 'EPS $3.68',
    previous: 'EPS $3.42',
    importance: 'medium',
    category: 'earnings',
    ticker: 'COST',
    description: '대형 창고형 할인매장 코스트코의 실적 발표입니다.',
    impactCommentary: '미국 중산층 소비 심리와 실질 소비 활력의 바로미터 역할을 합니다.'
  },
  {
    date: '2026-05-29',
    event: '1분기 GDP 성장률 수정치 (Annualized)',
    actual: null,
    forecast: '2.4%',
    previous: '2.4%',
    importance: 'high',
    category: 'indicator',
    description: '미국 경제의 성장 속도를 나타내는 대표적인 거시지표의 분기 두 번째 집계치입니다.',
    impactCommentary: '수정치가 속보치보다 대폭 개선될 경우 미국 경제의 강한 펀더멘털을 방증하며, 연준의 고금리 장기화 명분을 제공하여 채권 금리가 상승할 수 있습니다.'
  },
  {
    date: '2026-05-30',
    event: '4월 PCE 개인소비지출 물가지수 (YoY)',
    actual: null,
    forecast: '2.7%',
    previous: '2.7%',
    importance: 'high',
    category: 'indicator',
    description: '연방준비제도(Fed)가 물가 지표로 가장 선호하는 개인소비지출 기준의 물가 상승률입니다.',
    impactCommentary: '근원 PCE 수치가 예상치를 하회할 경우 하반기 금리 인하 기대가 극대화되며 증시 전반에 강한 랠리를 유발할 가능성이 높습니다.'
  },
  {
    date: '2026-06-04',
    event: '5월 ISM 제조업 구매관리자지수 (PMI)',
    actual: null,
    forecast: '49.8',
    previous: '49.2',
    importance: 'medium',
    category: 'indicator',
    description: '미국 제조기업들의 구매 담당 실무자들을 대상으로 조사한 경기 동향 지표입니다.',
    impactCommentary: '50을 기준으로 경기 확장과 위축을 나타내며, 50을 돌파하여 확장 국면에 진입할 시 견조한 성장 모멘텀으로 인식됩니다.'
  },
  {
    date: '2026-06-06',
    event: '5월 비농업 고용지수 & 실업률',
    actual: null,
    forecast: '185K / 3.9%',
    previous: '175K / 3.9%',
    importance: 'high',
    category: 'indicator',
    description: '농업 부문을 제외한 미국의 신규 일자리 창출 수 및 실업률 지표입니다.',
    impactCommentary: '매달 첫째 주 금요일 발표되는 노동 시장 핵심 지표로, 고용이 예상보다 너무 강하면 인플레이션 우려로 증시에 부담이 되고, 적절히 식어가는 지표가 확인되면 호재로 인식됩니다.'
  },
  {
    date: '2026-06-11',
    event: '5월 소비자물가지수 (CPI YoY)',
    actual: null,
    forecast: '3.3%',
    previous: '3.4%',
    importance: 'high',
    category: 'indicator',
    description: '소비재 및 서비스의 가격 변동을 측정하는 미국 경제의 대표적인 물가 지표입니다.',
    impactCommentary: 'FOMC 회의 바로 전날 또는 당일 발표되는 경우가 많아 시장 극강의 변동성을 불러옵니다. 금리 인하 시점을 결정짓는 가장 직접적인 변수입니다.'
  },
  {
    date: '2026-06-12',
    event: 'FOMC 정례 회의 1일차',
    actual: null,
    forecast: '-',
    previous: '-',
    importance: 'high',
    category: 'fed',
    description: '연방준비제도 이사들이 모여 기준금리를 결정하는 이틀간의 회의 중 첫날입니다.',
    impactCommentary: '회의 기간 중 특별한 공식 성명은 없으나 위원들의 발언이나 유출 이슈 등에 따라 채권 시장이 매우 민감하게 반응할 수 있습니다.'
  },
  {
    date: '2026-06-12',
    event: '5월 생산자물가지수 (PPI YoY)',
    actual: null,
    forecast: '2.1%',
    previous: '2.2%',
    importance: 'high',
    category: 'indicator',
    description: '국내 생산자가 공급하는 상품 및 서비스의 가격 변동을 나타내는 도매 물가 지표입니다.',
    impactCommentary: 'CPI의 선행 지표 성격을 띠기 때문에, 도매 물가 둔화가 확인되면 향후 소비자 물가도 동반 둔화될 것이라는 안도감을 형성합니다.'
  },
  {
    date: '2026-06-13',
    event: 'FOMC 기준금리 결정 & 파월 기자회견',
    actual: null,
    forecast: '5.25% - 5.50%',
    previous: '5.25% - 5.50%',
    importance: 'high',
    category: 'fed',
    description: '기준금리 동결 여부 발표 및 점도표(Dot Plot), 연준 의장의 기자회견이 포함된 시장 최고 중요 이벤트입니다.',
    impactCommentary: '금리 동결 시에도 함께 공개되는 점도표 상 연내 금리 인하 횟수 전망 변화와 파월 의장의 매파/비둘기파적 발언 뉘앙스에 따라 증시 방향성이 크게 갈립니다.'
  },
  {
    date: '2026-06-15',
    event: '5월 미국 소매판매 (Retail Sales MoM)',
    actual: null,
    forecast: '0.3%',
    previous: '0.2%',
    importance: 'high',
    category: 'indicator',
    description: '미국 소비자들이 매장 등에서 지출한 총액의 월간 변동률입니다.',
    impactCommentary: '미국 GDP의 70%가 소비로 이루어져 있는 만큼, 소비의 실질 체력을 나타내며 경기 침체 여부를 판별하는 핵심 척도입니다.'
  },
  {
    date: '2026-06-18',
    event: '제롬 파월 연준 의장 이코노믹 클럽 대담',
    actual: null,
    forecast: '-',
    previous: '-',
    importance: 'high',
    category: 'fed',
    description: '파월 연준 의장이 공식 석상에 나와 현재 통화정책 경로와 경제 상태에 대해 토론을 펼칩니다.',
    impactCommentary: 'FOMC 금리 결정 직후인 만큼, 추가적인 힌트가 제기될 가능성이 있어 투자자들이 이목을 집중시키는 주요 이벤트입니다.'
  },
  {
    date: '2026-06-19',
    event: '준틴스 국경일 (미국 증시 휴장)',
    actual: null,
    forecast: '-',
    previous: '-',
    importance: 'high',
    category: 'market',
    description: '미국의 노예해방 기념일인 준틴스(Juneteenth)로 금융시장 전체가 휴장합니다.',
    impactCommentary: '주중 휴장으로 시장의 거래 대금 활력이 전반적으로 떨어질 수 있습니다.'
  },
  {
    date: '2026-06-21',
    event: '미국 선물옵션 동시 만기일 (Quadruple Witching)',
    actual: null,
    forecast: '-',
    previous: '-',
    importance: 'high',
    category: 'market',
    description: '지수 선물, 지수 옵션, 개별 주식 옵션, 개별 주식 선물이 동시에 만기되는 날입니다.',
    impactCommentary: '통상 3, 6, 9, 12월 셋째 주 금요일에 발생하며, 장 마감 무렵 기관들의 대규모 포트폴리오 리밸런싱과 롤오버로 인해 극심한 장중 거래량 폭발과 주가 흔들림 현상이 발생합니다.'
  },
  {
    date: '2026-06-28',
    event: '5월 PCE 개인소비지출 물가지수 (YoY)',
    actual: null,
    forecast: '2.6%',
    previous: '2.7%',
    importance: 'high',
    category: 'indicator',
    description: '5월 한 달간의 연준 선호 근원 PCE 물가 상승 지표입니다.',
    impactCommentary: '인플레이션 둔화 추세가 잘 정착되고 있는지 확인하기 위한 마지막 조각입니다.'
  },
  {
    date: '2026-07-02',
    event: '연준 베이지북 공개 (Beige Book)',
    actual: null,
    forecast: '-',
    previous: '-',
    importance: 'medium',
    category: 'fed',
    description: '미국 12개 연방준비은행 관할 지역의 경기 판단 동향을 요약한 보고서입니다.',
    impactCommentary: '실제 현장 실물경기가 뜨거운지 차갑게 식어가고 있는지 연준 위원들의 시각을 담아내어 향후 통화정책 방향의 기초 자료로 활용됩니다.'
  },
  {
    date: '2026-07-04',
    event: '미국 독립기념일 (증시 휴장)',
    actual: null,
    forecast: '-',
    previous: '-',
    importance: 'high',
    category: 'market',
    description: 'Independence Day 연방 공휴일로 금융 시장이 문을 닫습니다.',
    impactCommentary: '미국의 최대 명절 중 하나로 연휴 기간 소비 지표 호재 기대감이 주중에 반영될 수 있습니다.'
  },
  {
    date: '2026-07-04',
    event: '6월 비농업 고용지수 & 실업률',
    actual: null,
    forecast: '170K / 4.0%',
    previous: '185K / 3.9%',
    importance: 'high',
    category: 'indicator',
    description: '6월 한 달간 미국 일자리 창출 체력과 실질 실업률 상황입니다.',
    impactCommentary: '실업률이 심리적 마지노선인 4.0%로 올라서는지가 주요 관전 포인트입니다.'
  },
  {
    date: '2026-07-12',
    event: '6월 소비자물가지수 (CPI YoY)',
    actual: null,
    forecast: '3.1%',
    previous: '3.3%',
    importance: 'high',
    category: 'indicator',
    description: '미국 인플레이션의 전반적인 하향 안정 흐름을 판독할 6월 CPI 결과입니다.',
    impactCommentary: '3.0% 벽 아래로 진입할 조짐이 보인다면 금리 인하 기대가 한층 더 공고해집니다.'
  },
  {
    date: '2026-07-15',
    event: '러셀 지수 연례 리밸런싱 (Russell Rebalance)',
    actual: null,
    forecast: '-',
    previous: '-',
    importance: 'medium',
    category: 'market',
    description: 'FTSE 러셀이 주관하는 미국 러셀 1000/2000/3000 지수의 편입/편출 구성 종목 조정이 최종 시행됩니다.',
    impactCommentary: '중소형주 위주의 대규모 수급 유입 및 이탈이 강하게 나타나므로, 리밸런싱 해당 종목들의 급등락에 유의해야 합니다.'
  },
  {
    date: '2026-07-24',
    event: 'Alphabet 2분기 실적 발표 (어닝)',
    actual: null,
    forecast: 'EPS $1.85',
    previous: 'EPS $1.44',
    importance: 'high',
    category: 'earnings',
    ticker: 'GOOGL',
    description: '구글 모기업 알파벳의 분기 어닝 릴리즈입니다.',
    impactCommentary: '클라우드 부문 성장률과 광고 단가 흐름, 그리고 AI 검색 도입 효과가 실적에 어떻게 영향을 미쳤는지 집중 분석됩니다.'
  },
  {
    date: '2026-07-28',
    event: 'Apple 2분기 실적 발표 (어닝)',
    actual: null,
    forecast: 'EPS $1.51',
    previous: 'EPS $1.40',
    importance: 'high',
    category: 'earnings',
    ticker: 'AAPL',
    description: '시가총액 1위 기업 애플의 분기 매출 및 EPS 발표입니다.',
    impactCommentary: '아이폰 출하량 동향과 서비스 부문 매출 성장세가 글로벌 하드웨어 및 모바일 생태계의 향방을 시사합니다.'
  },
  {
    date: '2026-07-29',
    event: 'Microsoft 2분기 실적 발표 (어닝)',
    actual: null,
    forecast: 'EPS $3.10',
    previous: 'EPS $2.94',
    importance: 'high',
    category: 'earnings',
    ticker: 'MSFT',
    description: '마이크로소프트의 클라우드(Azure) 및 소프트웨어 어닝 릴리즈입니다.',
    impactCommentary: '애저(Azure) 클라우드의 성장률 둔화 유무 및 코파일럿(Copilot) 매출 기여도가 주요 관전 포인트입니다.'
  }
];

// ─── Stock Universe ───────────────────── 2026-05-22 실제 종가 기준 ───────────
export const stockUniverse: Stock[] = [
  {
    ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology', industry: 'Consumer Electronics',
    price: 308.82, change: -1.94, changePct: -0.62, volume: 48200000, avgVolume: 52000000, marketCap: 4680000,
    pe: 30.8, pb: 52.4, ps: 8.2, peg: 2.3, evEbitda: 23.4,
    roe: 160.5, roa: 22.8, roic: 48.2, grossMargin: 46.5, operatingMargin: 31.2, netMargin: 25.9,
    epsGrowthYoy: 10.1, epsGrowth5y: 14.2, revenueGrowthYoy: 4.0, revenueGrowth5y: 9.8,
    debtToEquity: 185.4, currentRatio: 1.07, quickRatio: 1.02, interestCoverage: 28.1, fcfYield: 3.2,
    rsi14: 52.4, rs52w: 68, high52w: 325.00, low52w: 218.24, priceVs52wHigh: -5.0, ma50: 210.8, ma200: 230.4,
    dividendYield: 0.50, dividendGrowth5y: 5.8, payoutRatio: 15.4,
    cEpsGrowthQtr: 10.1, aEpsGrowth3y: 12.0, nNewHigh: false, sVolumeSurge: 0.93, iInstitOwnership: 61.2,
    earningsYield: 3.9, returnOnCapital: 48.2, magicFormulaRank: 48,
    qualityScore: 88, valueScore: 50, momentumScore: 58, growthScore: 62, overallScore: 66,
  },
  {
    ticker: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', industry: 'Software',
    price: 418.57, change: -2.18, changePct: -0.52, volume: 20100000, avgVolume: 22000000, marketCap: 3110000,
    pe: 35.4, pb: 12.8, ps: 12.8, peg: 1.8, evEbitda: 26.8,
    roe: 38.2, roa: 17.1, roic: 28.4, grossMargin: 69.8, operatingMargin: 44.6, netMargin: 35.9,
    epsGrowthYoy: 22.4, epsGrowth5y: 20.8, revenueGrowthYoy: 17.6, revenueGrowth5y: 16.4,
    debtToEquity: 38.2, currentRatio: 1.28, quickRatio: 1.21, interestCoverage: 42.8, fcfYield: 2.4,
    rsi14: 58.2, rs52w: 82, high52w: 468.35, low52w: 380.23, priceVs52wHigh: -10.6, ma50: 408.2, ma200: 420.8,
    dividendYield: 0.68, dividendGrowth5y: 10.2, payoutRatio: 24.1,
    cEpsGrowthQtr: 22.4, aEpsGrowth3y: 18.4, nNewHigh: false, sVolumeSurge: 0.91, iInstitOwnership: 71.8,
    earningsYield: 3.5, returnOnCapital: 28.4, magicFormulaRank: 36,
    qualityScore: 94, valueScore: 46, momentumScore: 72, growthScore: 88, overallScore: 80,
  },
  {
    ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Communication', industry: 'Internet Services',
    price: 382.97, change: -2.14, changePct: -0.56, volume: 22400000, avgVolume: 24800000, marketCap: 4720000,
    pe: 20.8, pb: 6.4, ps: 6.8, peg: 1.0, evEbitda: 15.4,
    roe: 32.8, roa: 15.4, roic: 24.2, grossMargin: 58.2, operatingMargin: 33.8, netMargin: 26.4,
    epsGrowthYoy: 49.1, epsGrowth5y: 22.4, revenueGrowthYoy: 14.0, revenueGrowth5y: 15.8,
    debtToEquity: 4.8, currentRatio: 2.14, quickRatio: 2.09, interestCoverage: 68.4, fcfYield: 4.8,
    rsi14: 52.8, rs52w: 74, high52w: 414.45, low52w: 291.34, priceVs52wHigh: -7.6, ma50: 372.4, ma200: 368.2,
    dividendYield: 0.42, dividendGrowth5y: 0.0, payoutRatio: 8.8,
    cEpsGrowthQtr: 49.1, aEpsGrowth3y: 24.8, nNewHigh: false, sVolumeSurge: 0.90, iInstitOwnership: 68.4,
    earningsYield: 6.8, returnOnCapital: 24.2, magicFormulaRank: 10,
    qualityScore: 88, valueScore: 80, momentumScore: 66, growthScore: 90, overallScore: 82,
  },
  {
    ticker: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', industry: 'Semiconductors',
    price: 220.90, change: -5.28, changePct: -2.33, volume: 285000000, avgVolume: 310000000, marketCap: 5390000,
    pe: 34.8, pb: 28.4, ps: 22.4, peg: 0.4, evEbitda: 29.8,
    roe: 123.8, roa: 55.2, roic: 82.4, grossMargin: 78.4, operatingMargin: 61.8, netMargin: 55.6,
    epsGrowthYoy: 145.0, epsGrowth5y: 68.4, revenueGrowthYoy: 85.0, revenueGrowth5y: 52.4,
    debtToEquity: 38.4, currentRatio: 4.17, quickRatio: 3.89, interestCoverage: 248.8, fcfYield: 2.8,
    rsi14: 44.8, rs52w: 52, high52w: 153.13, low52w: 78.50, priceVs52wHigh: -7.0, ma50: 112.4, ma200: 118.8,
    dividendYield: 0.03, dividendGrowth5y: 8.4, payoutRatio: 1.0,
    cEpsGrowthQtr: 145.0, aEpsGrowth3y: 88.4, nNewHigh: false, sVolumeSurge: 0.92, iInstitOwnership: 65.8,
    earningsYield: 3.4, returnOnCapital: 82.4, magicFormulaRank: 22,
    qualityScore: 96, valueScore: 44, momentumScore: 48, growthScore: 99, overallScore: 82,
  },
  {
    ticker: 'META', name: 'Meta Platforms', sector: 'Communication', industry: 'Social Media',
    price: 610.26, change: -3.82, changePct: -0.62, volume: 14800000, avgVolume: 16200000, marketCap: 1556000,
    pe: 26.8, pb: 8.4, ps: 9.2, peg: 0.8, evEbitda: 19.8,
    roe: 38.4, roa: 20.8, roic: 32.4, grossMargin: 82.4, operatingMargin: 42.8, netMargin: 38.2,
    epsGrowthYoy: 52.0, epsGrowth5y: 28.4, revenueGrowthYoy: 27.1, revenueGrowth5y: 18.4,
    debtToEquity: 8.4, currentRatio: 2.68, quickRatio: 2.65, interestCoverage: 84.2, fcfYield: 3.6,
    rsi14: 58.4, rs52w: 84, high52w: 740.91, low52w: 524.67, priceVs52wHigh: -17.6, ma50: 598.4, ma200: 602.8,
    dividendYield: 0.26, dividendGrowth5y: 0.0, payoutRatio: 7.0,
    cEpsGrowthQtr: 52.0, aEpsGrowth3y: 32.4, nNewHigh: false, sVolumeSurge: 0.91, iInstitOwnership: 74.2,
    earningsYield: 5.0, returnOnCapital: 32.4, magicFormulaRank: 7,
    qualityScore: 90, valueScore: 74, momentumScore: 72, growthScore: 92, overallScore: 84,
  },
  {
    ticker: 'BRK.B', name: 'Berkshire Hathaway', sector: 'Financials', industry: 'Insurance',
    price: 486.38, change: -1.84, changePct: -0.38, volume: 3600000, avgVolume: 3900000, marketCap: 1062000,
    pe: 22.8, pb: 1.7, ps: 2.2, peg: 1.9, evEbitda: 15.4,
    roe: 8.4, roa: 4.2, roic: 7.0, grossMargin: 28.4, operatingMargin: 13.2, netMargin: 10.4,
    epsGrowthYoy: 18.4, epsGrowth5y: 13.8, revenueGrowthYoy: 9.4, revenueGrowth5y: 7.2,
    debtToEquity: 28.4, currentRatio: 1.82, quickRatio: 1.74, interestCoverage: 18.4, fcfYield: 4.2,
    rsi14: 54.2, rs52w: 78, high52w: 502.00, low52w: 380.00, priceVs52wHigh: -3.1, ma50: 479.2, ma200: 462.8,
    dividendYield: 0.00, dividendGrowth5y: 0.0, payoutRatio: 0.0,
    cEpsGrowthQtr: 18.4, aEpsGrowth3y: 13.8, nNewHigh: false, sVolumeSurge: 0.92, iInstitOwnership: 58.4,
    earningsYield: 5.6, returnOnCapital: 7.0, magicFormulaRank: 90,
    qualityScore: 80, valueScore: 84, momentumScore: 68, growthScore: 60, overallScore: 73,
  },
  {
    ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', industry: 'Pharmaceuticals',
    price: 234.34, change: 1.08, changePct: 0.46, volume: 7200000, avgVolume: 8400000, marketCap: 564000,
    pe: 23.8, pb: 5.8, ps: 4.8, peg: 2.8, evEbitda: 14.8,
    roe: 24.4, roa: 9.8, roic: 15.4, grossMargin: 68.8, operatingMargin: 22.4, netMargin: 20.2,
    epsGrowthYoy: 6.4, epsGrowth5y: 6.8, revenueGrowthYoy: 4.4, revenueGrowth5y: 4.8,
    debtToEquity: 42.8, currentRatio: 1.38, quickRatio: 1.02, interestCoverage: 18.4, fcfYield: 4.2,
    rsi14: 56.4, rs52w: 72, high52w: 244.38, low52w: 143.13, priceVs52wHigh: -4.1, ma50: 228.4, ma200: 218.8,
    dividendYield: 2.98, dividendGrowth5y: 5.8, payoutRatio: 70.8,
    cEpsGrowthQtr: 6.4, aEpsGrowth3y: 6.8, nNewHigh: false, sVolumeSurge: 0.86, iInstitOwnership: 72.8,
    earningsYield: 5.2, returnOnCapital: 15.4, magicFormulaRank: 28,
    qualityScore: 80, valueScore: 74, momentumScore: 62, growthScore: 44, overallScore: 65,
  },
  {
    ticker: 'V', name: 'Visa Inc.', sector: 'Financials', industry: 'Payment Processing',
    price: 328.88, change: -1.84, changePct: -0.56, volume: 5800000, avgVolume: 6400000, marketCap: 672000,
    pe: 32.4, pb: 14.8, ps: 17.8, peg: 1.8, evEbitda: 25.4,
    roe: 46.8, roa: 18.4, roic: 38.4, grossMargin: 80.8, operatingMargin: 65.4, netMargin: 52.8,
    epsGrowthYoy: 12.8, epsGrowth5y: 14.8, revenueGrowthYoy: 10.2, revenueGrowth5y: 11.4,
    debtToEquity: 52.4, currentRatio: 1.42, quickRatio: 1.40, interestCoverage: 28.4, fcfYield: 2.8,
    rsi14: 57.8, rs52w: 76, high52w: 370.00, low52w: 269.64, priceVs52wHigh: -11.1, ma50: 320.4, ma200: 314.8,
    dividendYield: 0.64, dividendGrowth5y: 15.8, payoutRatio: 20.8,
    cEpsGrowthQtr: 12.8, aEpsGrowth3y: 13.8, nNewHigh: false, sVolumeSurge: 0.91, iInstitOwnership: 91.8,
    earningsYield: 3.8, returnOnCapital: 38.4, magicFormulaRank: 20,
    qualityScore: 92, valueScore: 58, momentumScore: 60, growthScore: 74, overallScore: 76,
  },
  {
    ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Disc.', industry: 'E-Commerce',
    price: 266.32, change: -1.24, changePct: -0.46, volume: 28400000, avgVolume: 32800000, marketCap: 2820000,
    pe: 38.4, pb: 7.8, ps: 3.8, peg: 0.9, evEbitda: 22.4,
    roe: 20.4, roa: 7.8, roic: 16.8, grossMargin: 48.8, operatingMargin: 11.2, netMargin: 8.8,
    epsGrowthYoy: 94.0, epsGrowth5y: 28.4, revenueGrowthYoy: 11.0, revenueGrowth5y: 18.8,
    debtToEquity: 62.4, currentRatio: 1.12, quickRatio: 0.84, interestCoverage: 12.4, fcfYield: 2.4,
    rsi14: 56.4, rs52w: 76, high52w: 292.42, low52w: 192.63, priceVs52wHigh: -8.9, ma50: 256.8, ma200: 248.4,
    dividendYield: 0.00, dividendGrowth5y: 0.0, payoutRatio: 0.0,
    cEpsGrowthQtr: 94.0, aEpsGrowth3y: 32.4, nNewHigh: false, sVolumeSurge: 0.87, iInstitOwnership: 63.4,
    earningsYield: 2.8, returnOnCapital: 16.8, magicFormulaRank: 55,
    qualityScore: 80, valueScore: 52, momentumScore: 68, growthScore: 88, overallScore: 75,
  },
  {
    ticker: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Disc.', industry: 'Electric Vehicles',
    price: 426.01, change: 12.48, changePct: 3.01, volume: 102400000, avgVolume: 108200000, marketCap: 1364000,
    pe: 184.8, pb: 18.4, ps: 12.4, peg: 8.4, evEbitda: 82.4,
    roe: 10.2, roa: 4.8, roic: 8.4, grossMargin: 17.8, operatingMargin: 6.2, netMargin: 5.8,
    epsGrowthYoy: -42.0, epsGrowth5y: 28.4, revenueGrowthYoy: 1.4, revenueGrowth5y: 24.8,
    debtToEquity: 18.4, currentRatio: 1.72, quickRatio: 1.42, interestCoverage: 22.4, fcfYield: 0.8,
    rsi14: 66.4, rs52w: 82, high52w: 488.54, low52w: 214.50, priceVs52wHigh: -12.8, ma50: 398.4, ma200: 358.8,
    dividendYield: 0.00, dividendGrowth5y: 0.0, payoutRatio: 0.0,
    cEpsGrowthQtr: -42.0, aEpsGrowth3y: 18.4, nNewHigh: false, sVolumeSurge: 0.95, iInstitOwnership: 45.8,
    earningsYield: 0.8, returnOnCapital: 8.4, magicFormulaRank: 92,
    qualityScore: 42, valueScore: 18, momentumScore: 72, growthScore: 38, overallScore: 38,
  },
  {
    ticker: 'JPM', name: 'JPMorgan Chase', sector: 'Financials', industry: 'Banking',
    price: 306.38, change: -1.44, changePct: -0.47, volume: 8400000, avgVolume: 9200000, marketCap: 874000,
    pe: 14.2, pb: 2.2, ps: 4.2, peg: 1.6, evEbitda: 10.4,
    roe: 16.8, roa: 1.4, roic: 13.2, grossMargin: 58.4, operatingMargin: 36.8, netMargin: 30.2,
    epsGrowthYoy: 14.8, epsGrowth5y: 12.4, revenueGrowthYoy: 10.8, revenueGrowth5y: 9.4,
    debtToEquity: 142.4, currentRatio: 1.18, quickRatio: 1.14, interestCoverage: 4.8, fcfYield: 7.2,
    rsi14: 54.2, rs52w: 74, high52w: 320.48, low52w: 207.65, priceVs52wHigh: -4.4, ma50: 298.4, ma200: 284.8,
    dividendYield: 1.50, dividendGrowth5y: 8.4, payoutRatio: 21.4,
    cEpsGrowthQtr: 14.8, aEpsGrowth3y: 14.8, nNewHigh: false, sVolumeSurge: 0.91, iInstitOwnership: 74.8,
    earningsYield: 8.8, returnOnCapital: 13.2, magicFormulaRank: 12,
    qualityScore: 82, valueScore: 86, momentumScore: 68, growthScore: 68, overallScore: 78,
  },
  {
    ticker: 'KO', name: 'Coca-Cola Co.', sector: 'Consumer Staples', industry: 'Beverages',
    price: 81.48, change: 0.38, changePct: 0.47, volume: 11200000, avgVolume: 12800000, marketCap: 350000,
    pe: 31.4, pb: 11.4, ps: 7.2, peg: 4.8, evEbitda: 22.4,
    roe: 38.2, roa: 8.2, roic: 12.4, grossMargin: 60.2, operatingMargin: 22.8, netMargin: 22.4,
    epsGrowthYoy: 7.2, epsGrowth5y: 5.8, revenueGrowthYoy: 2.8, revenueGrowth5y: 5.8,
    debtToEquity: 184.8, currentRatio: 1.12, quickRatio: 0.98, interestCoverage: 12.4, fcfYield: 3.2,
    rsi14: 58.4, rs52w: 68, high52w: 84.81, low52w: 58.97, priceVs52wHigh: -3.9, ma50: 79.2, ma200: 73.8,
    dividendYield: 2.94, dividendGrowth5y: 4.8, payoutRatio: 92.4,
    cEpsGrowthQtr: 7.2, aEpsGrowth3y: 5.8, nNewHigh: false, sVolumeSurge: 0.88, iInstitOwnership: 68.4,
    earningsYield: 4.0, returnOnCapital: 12.4, magicFormulaRank: 44,
    qualityScore: 80, valueScore: 60, momentumScore: 60, growthScore: 36, overallScore: 59,
  },
  {
    ticker: 'COST', name: 'Costco Wholesale', sector: 'Consumer Staples', industry: 'Retail',
    price: 1028.24, change: -7.84, changePct: -0.76, volume: 2200000, avgVolume: 2600000, marketCap: 457000,
    pe: 58.4, pb: 16.8, ps: 1.4, peg: 3.2, evEbitda: 38.4,
    roe: 29.4, roa: 8.8, roic: 22.4, grossMargin: 12.8, operatingMargin: 4.2, netMargin: 2.8,
    epsGrowthYoy: 16.4, epsGrowth5y: 14.8, revenueGrowthYoy: 8.4, revenueGrowth5y: 10.8,
    debtToEquity: 42.4, currentRatio: 0.96, quickRatio: 0.48, interestCoverage: 28.4, fcfYield: 1.6,
    rsi14: 58.4, rs52w: 80, high52w: 1078.23, low52w: 748.87, priceVs52wHigh: -4.6, ma50: 1012.4, ma200: 965.8,
    dividendYield: 0.41, dividendGrowth5y: 12.8, payoutRatio: 24.2,
    cEpsGrowthQtr: 16.4, aEpsGrowth3y: 15.8, nNewHigh: false, sVolumeSurge: 0.85, iInstitOwnership: 72.8,
    earningsYield: 2.2, returnOnCapital: 22.4, magicFormulaRank: 64,
    qualityScore: 88, valueScore: 40, momentumScore: 74, growthScore: 72, overallScore: 70,
  },
  {
    ticker: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', industry: 'Health Insurance',
    price: 388.47, change: 4.28, changePct: 1.11, volume: 6800000, avgVolume: 5400000, marketCap: 356000,
    pe: 14.8, pb: 3.8, ps: 0.72, peg: 1.0, evEbitda: 9.8,
    roe: 26.4, roa: 7.2, roic: 16.8, grossMargin: 22.8, operatingMargin: 7.2, netMargin: 4.8,
    epsGrowthYoy: -38.0, epsGrowth5y: 14.8, revenueGrowthYoy: 9.8, revenueGrowth5y: 12.4,
    debtToEquity: 82.4, currentRatio: 0.72, quickRatio: 0.68, interestCoverage: 8.4, fcfYield: 6.8,
    rsi14: 44.8, rs52w: 28, high52w: 631.17, low52w: 280.00, priceVs52wHigh: -38.4, ma50: 348.4, ma200: 442.8,
    dividendYield: 2.24, dividendGrowth5y: 14.8, payoutRatio: 33.2,
    cEpsGrowthQtr: -38.0, aEpsGrowth3y: 14.8, nNewHigh: false, sVolumeSurge: 1.26, iInstitOwnership: 88.4,
    earningsYield: 8.4, returnOnCapital: 16.8, magicFormulaRank: 18,
    qualityScore: 72, valueScore: 88, momentumScore: 24, growthScore: 52, overallScore: 60,
  },
  {
    ticker: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare', industry: 'Biopharmaceuticals',
    price: 215.70, change: 1.24, changePct: 0.58, volume: 5800000, avgVolume: 6200000, marketCap: 380000,
    pe: 68.4, pb: 38.4, ps: 7.2, peg: 2.8, evEbitda: 24.8,
    roe: 52.4, roa: 8.8, roic: 14.8, grossMargin: 70.4, operatingMargin: 26.4, netMargin: 16.4,
    epsGrowthYoy: 6.8, epsGrowth5y: 9.8, revenueGrowthYoy: 5.8, revenueGrowth5y: 10.2,
    debtToEquity: 484.8, currentRatio: 0.74, quickRatio: 0.68, interestCoverage: 6.4, fcfYield: 3.8,
    rsi14: 58.4, rs52w: 74, high52w: 227.52, low52w: 155.77, priceVs52wHigh: -5.2, ma50: 210.4, ma200: 198.8,
    dividendYield: 3.24, dividendGrowth5y: 8.8, payoutRatio: 224.8,
    cEpsGrowthQtr: 6.8, aEpsGrowth3y: 8.4, nNewHigh: false, sVolumeSurge: 0.94, iInstitOwnership: 68.4,
    earningsYield: 4.2, returnOnCapital: 14.8, magicFormulaRank: 34,
    qualityScore: 72, valueScore: 66, momentumScore: 66, growthScore: 48, overallScore: 63,
  },
];

// ─── Chart Data Generators ────────────────────────────────────────────────────
export function generatePriceHistory(
  basePrice: number,
  days: number = 365,
  volatility: number = 0.015
): { date: string; price: number; volume: number }[] {
  const data = [];
  let price = basePrice * 0.75;
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.48) * volatility;
    price = price * (1 + change);
    data.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(price * 100) / 100,
      volume: Math.round((Math.random() * 0.8 + 0.6) * 50000000),
    });
  }
  // Ensure last price matches
  if (data.length > 0) {
    data[data.length - 1].price = basePrice;
  }
  return data;
}

export function generateIndexHistory(
  baseValue: number,
  days: number = 365
): { date: string; value: number }[] {
  const data = [];
  let value = baseValue * 0.78;
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.47) * 0.008;
    value = value * (1 + change);
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
    });
  }
  if (data.length > 0) {
    data[data.length - 1].value = baseValue;
  }
  return data;
}

// ─── Legendary Investor Portfolios ───────────────────────────────────────────
export const legendaryPortfolios: LegendaryPortfolio[] = [
  {
    investor: 'Warren Buffett',
    title: 'Berkshire Hathaway (13F)',
    style: '가치투자 — 내재가치 이하 우량 기업 장기보유',
    holdings: [
      { ticker: 'AAPL', name: 'Apple', weight: 40.8, action: 'Hold' },
      { ticker: 'BAC', name: 'Bank of America', weight: 11.2, action: 'Hold' },
      { ticker: 'AXP', name: 'American Express', weight: 9.4, action: 'Hold' },
      { ticker: 'KO', name: 'Coca-Cola', weight: 8.2, action: 'Hold' },
      { ticker: 'CVX', name: 'Chevron', weight: 6.8, action: 'Hold' },
    ],
  },
  {
    investor: 'Michael Burry',
    title: 'Scion Asset Mgmt (13F)',
    style: '역발상 가치투자 — 극도로 저평가된 자산',
    holdings: [
      { ticker: 'BABA', name: 'Alibaba', weight: 21.4, action: 'Buy' },
      { ticker: 'JD', name: 'JD.com', weight: 18.2, action: 'Buy' },
      { ticker: 'GOOG', name: 'Alphabet', weight: 14.8, action: 'Hold' },
      { ticker: 'META', name: 'Meta', weight: 12.4, action: 'Buy' },
      { ticker: 'AMZN', name: 'Amazon', weight: 10.2, action: 'Hold' },
    ],
  },
  {
    investor: 'Cathie Wood',
    title: 'ARK Invest (ETF Holdings)',
    style: '혁신 성장주 — 파괴적 기술 장기 테마',
    holdings: [
      { ticker: 'TSLA', name: 'Tesla', weight: 10.4, action: 'Buy' },
      { ticker: 'COIN', name: 'Coinbase', weight: 8.8, action: 'Buy' },
      { ticker: 'ROKU', name: 'Roku', weight: 7.2, action: 'Buy' },
      { ticker: 'SHOP', name: 'Shopify', weight: 6.4, action: 'Buy' },
      { ticker: 'CRSP', name: 'CRISPR Tx', weight: 5.8, action: 'Hold' },
    ],
  },
];

// ─── Default Portfolio ─────────────────────────────── 2026-05-22 실제가 반영 ─
export const defaultPortfolio: PortfolioPosition[] = [
  { id: '1', ticker: 'MSFT', name: 'Microsoft', shares: 10, avgCost: 380.00, currentPrice: 418.57, sector: 'Technology', purchaseDate: '2024-01-15' },
  { id: '2', ticker: 'GOOGL', name: 'Alphabet', shares: 15, avgCost: 150.00, currentPrice: 382.97, sector: 'Communication', purchaseDate: '2024-02-01' },
  { id: '3', ticker: 'V', name: 'Visa', shares: 20, avgCost: 255.00, currentPrice: 328.88, sector: 'Financials', purchaseDate: '2024-03-10' },
  { id: '4', ticker: 'JPM', name: 'JPMorgan', shares: 25, avgCost: 175.00, currentPrice: 306.38, sector: 'Financials', purchaseDate: '2024-01-20' },
  { id: '5', ticker: 'ABBV', name: 'AbbVie', shares: 30, avgCost: 155.00, currentPrice: 215.70, sector: 'Healthcare', purchaseDate: '2024-04-05' },
];

export interface NewsItem {
  id: number;
  headline: string;
  source: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
  ticker: string;
  impact: 'high' | 'medium' | 'low';
}

export const news: NewsItem[] = [
  { id: 1, headline: 'Fed 의장 파월, 인플레이션 둔화 확인시 금리 인하 가능 시사', source: 'Reuters', time: '2시간 전', sentiment: 'positive', category: '매크로', ticker: 'SPX', impact: 'high' },
  { id: 2, headline: 'NVIDIA, 2분기 어닝 가이던스 대폭 상향… AI 수요 강세 지속', source: 'Bloomberg', time: '4시간 전', sentiment: 'positive', category: 'Tech', ticker: 'NVDA', impact: 'high' },
  { id: 3, headline: 'Apple, 인도 제조 비중 확대 — 중국 의존도 감소 전략 가속', source: 'WSJ', time: '6시간 전', sentiment: 'positive', category: 'Tech', ticker: 'AAPL', impact: 'medium' },
  { id: 4, headline: 'UnitedHealth, 보험금 청구 급증으로 연간 실적 전망 하향', source: 'CNBC', time: '8시간 전', sentiment: 'negative', category: 'Healthcare', ticker: 'UNH', impact: 'high' },
  { id: 5, headline: 'Meta, AI 광고 플랫폼 효과로 광고 수익 29% 급증', source: 'FT', time: '10시간 전', sentiment: 'positive', category: 'Communication', ticker: 'META', impact: 'medium' },
  { id: 6, headline: '미국 소비자신뢰지수 예상치 상회 — 경기 연착륙 기대 강화', source: 'AP', time: '12시간 전', sentiment: 'positive', category: '매크로', ticker: 'SPX', impact: 'medium' },
  { id: 7, headline: 'JPMorgan, 하반기 금리 하락 수혜 섹터로 금융주·리츠 추천', source: 'JPMorgan Research', time: '14시간 전', sentiment: 'positive', category: 'Financials', ticker: 'JPM', impact: 'low' },
  { id: 8, headline: 'Tesla, 2분기 차량 인도 예상치 하회 — 수요 둔화 우려 재점화', source: 'Reuters', time: '1일 전', sentiment: 'negative', category: 'EV', ticker: 'TSLA', impact: 'high' },
];

