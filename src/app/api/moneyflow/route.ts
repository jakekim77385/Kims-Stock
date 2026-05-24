// GET /api/moneyflow — 거시 자금 흐름 분석
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 0;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const YFClass = (require('yahoo-finance2') as { default: new (opts?: object) => typeof import('yahoo-finance2').default }).default;
const yf = new YFClass({ suppressNotices: ['yahooSurvey'] }) as any;

let cache: { data: MoneyFlowData; expiresAt: number } | null = null;

// ─── 타입 ─────────────────────────────────────────────────────────────────────
export interface Signal {
  id:        string;
  label:     string;
  value:     string;
  direction: 'risk-on' | 'risk-off' | 'neutral';
  score:     number;   // -2 ~ +2 (양수 = risk-on)
  detail:    string;
}

export interface AssetFlow {
  name:      string;
  category:  string;
  ytd:       number;
  changePct: number;
  flow:      'strong-in' | 'in' | 'neutral' | 'out' | 'strong-out';
}

export interface FlowScenario {
  period:     string;
  label:      string;
  riskBias:   'risk-on' | 'neutral' | 'risk-off';
  narrative:  string;
  inflow:     string[];   // 예상 자금 유입 자산
  outflow:    string[];   // 예상 자금 유출 자산
  keyRisk:    string;
  confidence: number;     // 0-100
}

export interface MoneyFlowData {
  riskMode:    'risk-on' | 'neutral' | 'risk-off';
  riskScore:   number;    // -10 ~ +10
  riskLabel:   string;
  signals:     Signal[];
  assetFlows:  AssetFlow[];
  scenarios:   FlowScenario[];
  updatedAt:   string;
}

// ─── 자금 흐름 판단 유틸 ──────────────────────────────────────────────────────
function flowTag(ytd: number, changePct: number): AssetFlow['flow'] {
  const score = ytd * 0.7 + changePct * 0.3;
  if (score >  15) return 'strong-in';
  if (score >   3) return 'in';
  if (score > - 3) return 'neutral';
  if (score > -15) return 'out';
  return 'strong-out';
}

async function q(symbol: string) {
  try {
    const r = await yf.quote(symbol);
    return r;
  } catch { return null; }
}

export async function GET() {
  if (cache && Date.now() < cache.expiresAt) {
    return NextResponse.json(cache.data);
  }

  // ── 핵심 지표 조회 ────────────────────────────────────────────────────────
  const [vix, gold, tlt, dxy, spx, copper, xlk, xlu, xlp, xle, xlf, btc, eth, tnx, rut, eem] =
    await Promise.all([
      q('^VIX'), q('GC=F'), q('TLT'), q('DX-Y.NYB'),
      q('^GSPC'), q('HG=F'), q('XLK'), q('XLU'), q('XLP'),
      q('XLE'), q('XLF'), q('BTC-USD'), q('ETH-USD'),
      q('^TNX'), q('^RUT'), q('EEM'),
    ]);

  const vixVal   = vix?.regularMarketPrice       ?? 20;
  const goldYtd  = gold?.fiftyTwoWeekChangePercent ?? 0;
  const tltYtd   = tlt?.fiftyTwoWeekChangePercent  ?? 0;
  const dxyChg   = dxy?.regularMarketChangePercent ?? 0;
  const spxYtd   = spx?.fiftyTwoWeekChangePercent  ?? 0;
  const copperYtd= copper?.fiftyTwoWeekChangePercent ?? 0;
  const xlkYtd   = xlk?.fiftyTwoWeekChangePercent  ?? 0;
  const xluYtd   = xlu?.fiftyTwoWeekChangePercent  ?? 0;
  const xlpYtd   = xlp?.fiftyTwoWeekChangePercent  ?? 0;
  const xleYtd   = xle?.fiftyTwoWeekChangePercent  ?? 0;
  const btcYtd   = btc?.fiftyTwoWeekChangePercent  ?? 0;
  const tnxVal   = tnx?.regularMarketPrice          ?? 4.5;

  // 섹터 로테이션: 방어주(XLU,XLP) vs 성장주(XLK)
  const defensiveYtd = (xluYtd + xlpYtd) / 2;
  const growthYtd    = xlkYtd;
  const sectorDiff   = growthYtd - defensiveYtd;

  // 구리/금 비율 (구리 52주 수익률로 경기 방향 대리)
  const copperGoldSignal = copperYtd - goldYtd;  // 양수 = 구리 > 금 = 경기낙관

  // ── 신호 계산 ──────────────────────────────────────────────────────────────
  // VIX 공포 지수
  const vixScore = vixVal < 15 ? 2 : vixVal < 20 ? 1 : vixVal < 25 ? 0 : vixVal < 30 ? -1 : -2;
  const vixDir   = vixScore >= 1 ? 'risk-on' : vixScore <= -1 ? 'risk-off' : 'neutral';

  // 금 (안전자산): 상승 = risk-off
  const goldScore = goldYtd > 20 ? -2 : goldYtd > 5 ? -1 : goldYtd > -5 ? 0 : 1;
  const goldDir   = goldScore <= -1 ? 'risk-off' : goldScore >= 1 ? 'risk-on' : 'neutral';

  // 채권 TLT (금리 하락=채권 상승=안전선호): 상승 = risk-off
  const tltScore = tltYtd > 10 ? -2 : tltYtd > 0 ? -1 : tltYtd > -10 ? 1 : 2;
  const tltDir   = tltScore >= 1 ? 'risk-on' : tltScore <= -1 ? 'risk-off' : 'neutral';

  // 달러 (달러 강세 = 신흥국 자금 이탈 = risk-off)
  const dxyScore = dxyChg > 0.5 ? -1 : dxyChg < -0.5 ? 1 : 0;
  const dxyDir   = dxyScore >= 1 ? 'risk-on' : dxyScore <= -1 ? 'risk-off' : 'neutral';

  // 섹터 로테이션 (성장주 > 방어주 = risk-on)
  const sectorScore = sectorDiff > 20 ? 2 : sectorDiff > 5 ? 1 : sectorDiff > -5 ? 0 : sectorDiff > -20 ? -1 : -2;
  const sectorDir   = sectorScore >= 1 ? 'risk-on' : sectorScore <= -1 ? 'risk-off' : 'neutral';

  // 구리/금 (구리 > 금 = 경기낙관 = risk-on)
  const copperScore = copperGoldSignal > 20 ? 2 : copperGoldSignal > 0 ? 1 : copperGoldSignal > -20 ? -1 : -2;
  const copperDir   = copperScore >= 1 ? 'risk-on' : copperScore <= -1 ? 'risk-off' : 'neutral';

  // 암호화폐 (투기적 수요 = risk-on 선행)
  const btcScore = btcYtd > 30 ? 2 : btcYtd > 0 ? 1 : btcYtd > -30 ? -1 : -2;
  const btcDir   = btcScore >= 1 ? 'risk-on' : btcScore <= -1 ? 'risk-off' : 'neutral';

  const signals: Signal[] = [
    {
      id: 'vix', label: 'VIX 공포지수',
      value: vixVal.toFixed(1),
      direction: vixDir as Signal['direction'], score: vixScore,
      detail: vixVal < 15 ? '극도의 낙관 — 과열 주의' : vixVal < 20 ? '안정적 — 위험선호' : vixVal < 25 ? '중립 — 관망' : vixVal < 30 ? '불안 — 위험회피' : '공포 — 강한 위험회피',
    },
    {
      id: 'gold', label: '금 (안전자산)',
      value: `52주 ${goldYtd >= 0 ? '+' : ''}${goldYtd.toFixed(1)}%`,
      direction: goldDir as Signal['direction'], score: goldScore,
      detail: goldYtd > 15 ? '안전자산 강한 수요 → Risk-Off 흐름 지배적' : goldYtd > 0 ? '금 완만 상승 → 헤지 수요 존재' : '금 약세 → 위험자산 선호',
    },
    {
      id: 'bond', label: '미국 채권 TLT',
      value: `52주 ${tltYtd >= 0 ? '+' : ''}${tltYtd.toFixed(1)}%`,
      direction: tltDir as Signal['direction'], score: tltScore,
      detail: tltYtd > 5 ? '채권 강세 → 금리 하락 기대 → 위험회피' : tltYtd < -5 ? '채권 약세 → 금리 상승 → 인플레/위험선호' : '채권 중립',
    },
    {
      id: 'dxy', label: '달러 인덱스',
      value: `일간 ${dxyChg >= 0 ? '+' : ''}${dxyChg.toFixed(2)}%`,
      direction: dxyDir as Signal['direction'], score: dxyScore,
      detail: dxyChg > 0.3 ? '달러 강세 → 신흥국 자금 이탈, 원자재 압박' : dxyChg < -0.3 ? '달러 약세 → 신흥국·원자재로 자금 이동' : '달러 보합 — 방향성 대기',
    },
    {
      id: 'sector', label: '섹터 로테이션',
      value: `성장${growthYtd >= 0 ? '+' : ''}${growthYtd.toFixed(0)}% vs 방어${defensiveYtd >= 0 ? '+' : ''}${defensiveYtd.toFixed(0)}%`,
      direction: sectorDir as Signal['direction'], score: sectorScore,
      detail: sectorDiff > 10 ? '기술·성장 아웃퍼폼 → 공격적 포지션 우세' : sectorDiff < -10 ? '유틸·필수소비재 아웃퍼폼 → 방어적 포지션 우세' : '섹터 균형 — 로테이션 혼조',
    },
    {
      id: 'copper', label: '구리/금 비율',
      value: `구리${copperYtd >= 0 ? '+' : ''}${copperYtd.toFixed(0)}% / 금${goldYtd >= 0 ? '+' : ''}${goldYtd.toFixed(0)}%`,
      direction: copperDir as Signal['direction'], score: copperScore,
      detail: copperGoldSignal > 10 ? '구리 강세 → 경기 확장 기대 높음' : copperGoldSignal < -10 ? '금 강세 > 구리 → 경기 둔화 우려' : '경기 방향성 불분명',
    },
    {
      id: 'crypto', label: '암호화폐 (투기지수)',
      value: `BTC 52주 ${btcYtd >= 0 ? '+' : ''}${btcYtd.toFixed(0)}%`,
      direction: btcDir as Signal['direction'], score: btcScore,
      detail: btcYtd > 30 ? '강한 투기 수요 → Risk-On 선행 신호' : btcYtd > 0 ? '완만 회복 중' : '투기 수요 위축 → Risk-Off 진입 가능',
    },
  ];

  // ── 종합 점수 ──────────────────────────────────────────────────────────────
  const totalScore = signals.reduce((s, sig) => s + sig.score, 0);
  const maxPossible = signals.length * 2;
  const normalizedScore = Math.round((totalScore / maxPossible) * 10);

  const riskMode: MoneyFlowData['riskMode'] =
    normalizedScore >= 3  ? 'risk-on'  :
    normalizedScore <= -3 ? 'risk-off' : 'neutral';

  const riskLabel =
    normalizedScore >= 6  ? '강한 위험선호 (Risk-On)' :
    normalizedScore >= 3  ? '위험선호 우세' :
    normalizedScore >= 1  ? '중립 (Risk-On 기울기)' :
    normalizedScore > -1  ? '중립' :
    normalizedScore > -3  ? '중립 (Risk-Off 기울기)' :
    normalizedScore > -6  ? '위험회피 우세' :
    '강한 위험회피 (Risk-Off)';

  // ── 자산별 자금 흐름 현황 ──────────────────────────────────────────────────
  const assetFlows: AssetFlow[] = [
    { name: 'S&P 500 (미국주식)',   category: '주식',   ytd: spxYtd,    changePct: spx?.regularMarketChangePercent ?? 0,  flow: flowTag(spxYtd,    spx?.regularMarketChangePercent ?? 0) },
    { name: 'Russell 2000 (소형주)', category: '주식',   ytd: rut?.fiftyTwoWeekChangePercent ?? 0, changePct: rut?.regularMarketChangePercent ?? 0, flow: flowTag(rut?.fiftyTwoWeekChangePercent ?? 0, rut?.regularMarketChangePercent ?? 0) },
    { name: '기술주 ETF (XLK)',     category: '섹터',   ytd: xlkYtd,    changePct: xlk?.regularMarketChangePercent ?? 0,  flow: flowTag(xlkYtd,    xlk?.regularMarketChangePercent ?? 0) },
    { name: '에너지 ETF (XLE)',     category: '섹터',   ytd: xleYtd,    changePct: xle?.regularMarketChangePercent ?? 0,  flow: flowTag(xleYtd,    xle?.regularMarketChangePercent ?? 0) },
    { name: '금융주 ETF (XLF)',     category: '섹터',   ytd: xlf?.fiftyTwoWeekChangePercent ?? 0, changePct: xlf?.regularMarketChangePercent ?? 0, flow: flowTag(xlf?.fiftyTwoWeekChangePercent ?? 0, xlf?.regularMarketChangePercent ?? 0) },
    { name: '방어주 ETF (XLU/XLP)', category: '방어',   ytd: defensiveYtd, changePct: (xlu?.regularMarketChangePercent ?? 0 + (xlp?.regularMarketChangePercent ?? 0)) / 2, flow: flowTag(defensiveYtd, 0) },
    { name: '금 (Gold)',            category: '안전',   ytd: goldYtd,   changePct: gold?.regularMarketChangePercent ?? 0, flow: flowTag(goldYtd,   gold?.regularMarketChangePercent ?? 0) },
    { name: '미국채권 (TLT)',        category: '안전',   ytd: tltYtd,    changePct: tlt?.regularMarketChangePercent ?? 0,  flow: flowTag(tltYtd,    tlt?.regularMarketChangePercent ?? 0) },
    { name: '신흥국 (EEM)',          category: '신흥국', ytd: eem?.fiftyTwoWeekChangePercent ?? 0, changePct: eem?.regularMarketChangePercent ?? 0, flow: flowTag(eem?.fiftyTwoWeekChangePercent ?? 0, eem?.regularMarketChangePercent ?? 0) },
    { name: '구리 (Copper)',         category: '원자재', ytd: copperYtd, changePct: copper?.regularMarketChangePercent ?? 0, flow: flowTag(copperYtd, copper?.regularMarketChangePercent ?? 0) },
    { name: 'Bitcoin',              category: '암호화폐', ytd: btcYtd,   changePct: btc?.regularMarketChangePercent ?? 0,  flow: flowTag(btcYtd,    btc?.regularMarketChangePercent ?? 0) },
    { name: 'Ethereum',             category: '암호화폐', ytd: eth?.fiftyTwoWeekChangePercent ?? 0, changePct: eth?.regularMarketChangePercent ?? 0, flow: flowTag(eth?.fiftyTwoWeekChangePercent ?? 0, eth?.regularMarketChangePercent ?? 0) },
  ];

  // ── 시나리오 생성 ──────────────────────────────────────────────────────────
  // 핵심 상태 파악
  const isRiskOn   = normalizedScore >= 3;
  const isRiskOff  = normalizedScore <= -3;
  const vixHigh    = vixVal > 25;
  const goldStrong = goldYtd > 15;
  const bondStrong = tltYtd > 5;
  const dxyStrong  = dxyChg > 0.3;
  const techStrong = xlkYtd > spxYtd;

  const scenarios: FlowScenario[] = [
    // 단기 (1-3개월) — 현재 모멘텀 연장
    {
      period: '단기',
      label: '1~3개월',
      riskBias: normalizedScore >= 1 ? 'risk-on' : normalizedScore <= -1 ? 'risk-off' : 'neutral',
      narrative: isRiskOn
        ? `현재 위험선호 모멘텀이 강합니다. VIX ${vixVal.toFixed(0)}로 시장 안정, 기술주 주도 상승 지속 가능성. 단, 단기 과매수에 따른 변동성 확대 구간 주의.`
        : isRiskOff
        ? `위험회피 모드 우세. 금·채권으로 안전자산 자금 이동 중. 주식 단기 약세 압력 지속 가능. VIX ${vixVal.toFixed(0)} — 추가 공포 확산 시 낙폭 확대 가능.`
        : `뚜렷한 방향 없는 혼조세. 단기 이벤트(FOMC, 고용지표 등)에 따라 방향성 결정될 전망. 포지션 중립 유지 권장.`,
      inflow:  isRiskOn  ? ['미국 대형주', '기술주', '비트코인'] : isRiskOff ? ['금', '미국 국채', '달러'] : ['금', '대형 배당주'],
      outflow: isRiskOn  ? ['채권', '방어주', '달러'] : isRiskOff ? ['소형주', '신흥국', '암호화폐'] : ['소형주', '신흥국'],
      keyRisk: isRiskOn  ? 'FOMC 긴축 서프라이즈 / 지정학 리스크 급등' : isRiskOff ? '신용 이벤트 / 기업 실적 쇼크' : '예상보다 강한 인플레 데이터',
      confidence: 65,
    },
    // 중기 (3-12개월) — 금리 사이클 기반
    {
      period: '중기',
      label: '3~12개월',
      riskBias: tnxVal > 4.5 ? 'neutral' : 'risk-on',
      narrative: tnxVal > 5.0
        ? `10년물 금리 ${tnxVal.toFixed(2)}%로 고금리 지속. 주식 밸류에이션 압박 지속, 금융주·에너지 상대적 유리. 금리 인하 기대 형성 시 성장주 반등 트리거.`
        : tnxVal > 4.0
        ? `10년물 금리 ${tnxVal.toFixed(2)}% 수준. 금리 방향이 핵심 변수. 연준 피봇 신호 강화 시 채권·성장주 동반 상승. 인플레 재점화 시 원자재 강세.`
        : `금리 하락 국면. 성장주·채권 동반 수혜. 달러 약세 진입 시 신흥국·원자재·금 강세 예상.`,
      inflow:  tnxVal > 4.5
        ? ['에너지', '금융주', '금', '인프라'] 
        : ['기술주', '채권 ETF', '신흥국', '금'],
      outflow: tnxVal > 4.5
        ? ['고밸류 성장주', '장기채권', '암호화폐']
        : ['달러', '단기채권', '방어주'],
      keyRisk: '연준 금리 경로 변화 / 기업 이익 성장률 둔화 / 중국 경기 회복 여부',
      confidence: 55,
    },
    // 장기 (1-3년) — 구조적 트렌드
    {
      period: '장기',
      label: '1~3년',
      riskBias: 'risk-on',
      narrative: `구조적으로 AI 인프라 투자 사이클, 에너지 전환, 신흥국(인도·동남아) 성장이 장기 자금 흐름을 주도할 전망. 달러 패권 약화 시나리오 하에서 금·실물자산 장기 강세 유지. 부채 사이클 정점 통과 후 금리 정상화와 함께 성장주 재부상 예상.`,
      inflow:  ['AI/반도체 (미국)', '인도·동남아 증시', '금·실물자산', '에너지 전환 인프라', '비트코인 (제도권 편입)'],
      outflow: ['전통 채권 (장기)', '중국 A주 (구조적 리스크)', '고금리 의존 부동산'],
      keyRisk: '미국 재정 지속가능성 / 달러 패권 도전 / AI 거품 형성 여부 / 지정학 분쟁 확대',
      confidence: 45,
    },
  ];

  const data: MoneyFlowData = {
    riskMode, riskScore: normalizedScore, riskLabel,
    signals, assetFlows, scenarios,
    updatedAt: new Date().toISOString(),
  };

  cache = { data, expiresAt: Date.now() + 60_000 };
  return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=60' } });
}
