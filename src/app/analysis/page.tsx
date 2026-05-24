'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { stockUniverse, type Stock } from '@/lib/mockData';
import { useQuote, useHistory, type HistoryBar } from '@/lib/hooks';
import {
  formatPercent, formatMarketCap, formatVolume,
  getRSISignal, calcDCF
} from '@/lib/utils';

interface ScenarioResult {
  pos: number;
  boxState: string;
  positionDesc: string;
  weeklyBull: string;
  weeklyBear: string;
  monthlyScenario: string;
  expectedMonthlyBand: string;
}

function getFallbackStock(ticker: string, liveQuote?: any): Stock {
  const price = liveQuote?.price ?? 0;
  const high52w = liveQuote?.high52w ?? (price > 0 ? price * 1.25 : 100);
  const low52w = liveQuote?.low52w ?? (price > 0 ? price * 0.75 : 50);
  const name = liveQuote?.name ?? ticker.toUpperCase();

  return {
    ticker: ticker.toUpperCase(),
    name: name,
    sector: 'Technology',
    industry: 'Software',
    price: price,
    change: liveQuote?.change ?? 0,
    changePct: liveQuote?.changePct ?? 0,
    volume: liveQuote?.volume ?? 0,
    avgVolume: liveQuote?.avgVolume ?? 1,
    marketCap: liveQuote?.marketCap ? liveQuote.marketCap / 1_000_000 : 0,
    pe: liveQuote?.pe ?? 0,
    pb: 0,
    ps: 0,
    peg: 0,
    evEbitda: 0,
    roe: 0,
    roa: 0,
    roic: 0,
    grossMargin: 0,
    operatingMargin: 0,
    netMargin: 0,
    epsGrowthYoy: 0,
    epsGrowth5y: 0,
    revenueGrowthYoy: 0,
    revenueGrowth5y: 0,
    debtToEquity: 0,
    currentRatio: 0,
    quickRatio: 0,
    interestCoverage: 0,
    fcfYield: 0,
    rsi14: 50,
    rs52w: 50,
    high52w: high52w,
    low52w: low52w,
    priceVs52wHigh: high52w > 0 ? ((price - high52w) / high52w) * 100 : 0,
    ma50: price > 0 ? price * 0.98 : 0,
    ma200: price > 0 ? price * 0.95 : 0,
    dividendYield: 0,
    dividendGrowth5y: 0,
    payoutRatio: 0,
    cEpsGrowthQtr: 0,
    aEpsGrowth3y: 0,
    nNewHigh: false,
    sVolumeSurge: 1.0,
    iInstitOwnership: 50,
    earningsYield: 0,
    returnOnCapital: 0,
    magicFormulaRank: 50,
    qualityScore: 50,
    valueScore: 50,
    momentumScore: 50,
    growthScore: 50,
    overallScore: 50,
  };
}

function generateScenario(ticker: string, price: number, low52w: number, high52w: number, changePct: number): ScenarioResult {
  const pos = Math.max(0, Math.min(100, Math.round(((price - low52w) / (high52w - low52w)) * 100)));
  
  // Resistance & Support levels based on actual 52w bounds and current price
  const resistance1 = price * 1.05;
  const resistance2 = price >= high52w * 0.95 ? high52w * 1.05 : high52w;
  const support1 = price * 0.95;
  const support2 = price <= low52w * 1.05 ? low52w * 0.95 : low52w;
  
  let boxState = '';
  let positionDesc = '';
  let weeklyBull = '';
  let weeklyBear = '';
  let monthlyScenario = '';
  let expectedMonthlyBand = '';
  
  if (price >= high52w * 0.985) {
    boxState = '🔥 52주 신고가 돌파 (강력한 상승 돌파구)';
    positionDesc = `현재 주가($${price.toFixed(2)})는 52주 최고가($${high52w.toFixed(2)})를 상향 돌파하며 역사적/연중 신고가 밴드에 안착했습니다. 매물 압박이 전무한 상태로, 매수세가 극대화된 강력한 상승 모멘텀 국면입니다.`;
    weeklyBull = `상방 매물 압박이 없어 주봉 기준 상승세를 유지할 경우 $${resistance1.toFixed(2)} ~ $${(price * 1.08).toFixed(2)} 구간까지 모멘텀 랠리 연장 가능.`;
    weeklyBear = `돌파 이후 단기 차익 실현 출회 시, 직전 고점인 $${high52w.toFixed(2)} 수준의 지지력 테스트 예상.`;
    monthlyScenario = `월간 기준 이평선 이격 과열을 다지며 추가 우상향 예상. 대량 거래를 동반한 장대 음봉이 출현하지 않는 한 전형적인 주도주 랠리가 이어질 가능성이 높습니다.`;
    expectedMonthlyBand = `$${high52w.toFixed(2)} ~ $${(price * 1.15).toFixed(2)}`;
  } else if (price <= low52w * 1.015) {
    boxState = '❄️ 52주 최저점 갱신 (과매도 지지력 테스트)';
    positionDesc = `현재 주가($${price.toFixed(2)})는 52주 최저가($${low52w.toFixed(2)}) 부근의 극심한 매도 과열 구간에 진입했습니다. 하방 지지 매수세와 추가 투매 압력이 대립하는 민감한 저점 국면입니다.`;
    weeklyBull = `기술적 반등 성공 시 단기 과매도 해소 과정에서 $${(price * 1.06).toFixed(2)} 및 20일 이평선 수준까지 가벼운 회복 반등 시도.`;
    weeklyBear = `직전 최저가인 $${low52w.toFixed(2)} 이탈 시 추가 신저가 갱신에 따른 패닉셀 가중. $${(low52w * 0.95).toFixed(2)}까지 하방 지지 대역 후퇴 우려.`;
    monthlyScenario = `월간 기준 바닥권 다지기(Double Bottom) 형성 과정이 필요합니다. 악재 선반영 여부가 핵심이며, 2~3주간 저점을 깨지 않고 횡보해야 추세 전환의 기틀이 마련됩니다.`;
    expectedMonthlyBand = `$${(low52w * 0.92).toFixed(2)} ~ $${(price * 1.10).toFixed(2)}`;
  } else if (pos >= 80) {
    boxState = '📈 박스권 상단 대기 (돌파 임계점 도달)';
    positionDesc = `52주 채널 기준 최고가 근방(상위 ${pos}%)에 위치하며 장기 박스권 상단 저항 대역에 맞닿아 있습니다. 전고점 돌파를 앞두고 에너지를 응축하는 매물 소화 단계입니다.`;
    weeklyBull = `거래량을 동반하며 52주 고점인 $${high52w.toFixed(2)} 돌파에 성공할 경우, 박스권 돌파 상승 파동이 본격화되어 $${(high52w * 1.05).toFixed(2)}까지 즉각 확장 가능.`;
    weeklyBear = `상단 매물 돌파 실패 시 박스권 내부로 일시적 후퇴. $${(price * 0.94).toFixed(2)} 대역의 중간 지지선까지 완만한 기술적 조정 예상.`;
    monthlyScenario = `월간으로는 '컵 앤 핸들(Cup & Handle)' 혹은 '상승 깃발형' 패턴을 형성하고 있습니다. 금월 내 박스권 상단을 뚫고 안착 시 중장기 우상향 추세가 본격적으로 개시될 시나리오가 유력합니다.`;
    expectedMonthlyBand = `$${(price * 0.92).toFixed(2)} ~ $${(high52w * 1.10).toFixed(2)}`;
  } else if (pos <= 20) {
    boxState = '📉 박스권 하단 지지 (저점 매수 유효 대역)';
    positionDesc = `52주 주가 채널의 극하단 대역(하위 ${pos}%)에 위치하며 바닥 지지선에 접근한 상태입니다. 역사적 밸류에이션 매력이 부각되는 저가 매수(Buy the Dip) 유효 구간입니다.`;
    weeklyBull = `바닥 지지선인 $${low52w.toFixed(2)} 지지에 성공할 경우, 낙폭 과대에 따른 숏커버링 및 저점 매수세 유입으로 $${(price * 1.07).toFixed(2)} 대역으로의 빠른 기술적 리바운드 기대.`;
    weeklyBear = `시장 하락 등 외부 악재 결합으로 바닥 지지 붕괴 시, 최저점 지지선인 $${low52w.toFixed(2)} 인근까지 주가가 밀리며 지지력 재테스트 진행.`;
    monthlyScenario = `금월 내 바닥 다지기를 성공적으로 마칠 경우 점진적인 U자형 반등 시나리오가 작동할 수 있습니다. 단, 중기 이평선들의 역배열 저항 소화를 위한 매물 청산 기간이 수주간 필요합니다.`;
    expectedMonthlyBand = `$${(low52w * 0.98).toFixed(2)} ~ $${(price * 1.15).toFixed(2)}`;
  } else if (pos >= 40 && pos <= 60) {
    boxState = '🔄 박스권 중단 횡보 (중기 균형 및 수렴 국면)';
    positionDesc = `52주 주가 채널의 정중앙 부근(${pos}%)에서 뚜렷한 모멘텀 없이 수주 동안 횡보 흐름을 이어가고 있습니다. 50일 및 200일 이동평균선이 수렴하며 방향성 탐색을 위해 힘을 응축하는 중기 수렴 국면입니다.`;
    weeklyBull = `박스권 상단 저항선인 $${(price * 1.06).toFixed(2)} 대역 돌파 시 단기 상승 모멘텀을 타며 52주 상단 임계점인 $${(price * 1.12).toFixed(2)} 선까지 돌격 가능.`;
    weeklyBear = `중단 지지력 약화 시 박스권 하단 완충 대역인 $${(price * 0.93).toFixed(2)} 부근까지 변동성이 아래로 열릴 위험 존재.`;
    monthlyScenario = `금월은 전형적인 '수렴형 삼각 패턴(Symmetrical Triangle)'을 완성해 갈 예정입니다. 수렴 막바지에 다다르고 있어 금월 말 혹은 차월 초 실적 발표나 거시 지표에 따라 위아래로 매우 강력한 변동성 방향이 폭발할 시나리오가 예상됩니다.`;
    expectedMonthlyBand = `$${(price * 0.90).toFixed(2)} ~ $${(price * 1.10).toFixed(2)}`;
  } else {
    boxState = '⚖️ 박스권 안정 구간 (추세 지속 및 균형 채널)';
    positionDesc = `52주 등락 범위의 균형 대역(${pos}%) 내에서 비교적 예측 가능한 채널을 그리며 완만하게 추세를 유지하고 있습니다. 극단적 쏠림이 없는 건강한 매물 소화 구간입니다.`;
    weeklyBull = `상승 추세선 상단을 타는 완만한 우상향 흐름 유지 시 $${(price * 1.05).toFixed(2)} 수준을 무난히 터치하며 박스권 상단 조준.`;
    weeklyBear = `단기 매물 누적으로 완만한 하방 채널 진입 시 $${(price * 0.95).toFixed(2)}선에서 1차적인 완충 지지선 확보 작동 예정.`;
    monthlyScenario = `월간으로는 기존의 채널형 우상향 트랙을 그대로 지속할 시나리오가 유력합니다. 거래량이 안정적으로 유지되는 한 시장 지수와 연동된 안정적 흐름이 지속될 것입니다.`;
    expectedMonthlyBand = `$${(price * 0.93).toFixed(2)} ~ $${(price * 1.08).toFixed(2)}`;
  }

  return {
    pos,
    boxState,
    positionDesc,
    weeklyBull,
    weeklyBear,
    monthlyScenario,
    expectedMonthlyBand
  };
}

function calculateStochastic(bars: HistoryBar[], period: number, smoothK: number): number[] {
  if (bars.length === 0) return [];
  
  // Calculate raw %K
  const rawK: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (i < period - 1) {
      rawK.push(50); // Default middle value for early bars
      continue;
    }
    
    // Find lowest low and highest high in the last 'period' bars
    let lowestLow = bars[i].low;
    let highestHigh = bars[i].high;
    for (let j = i - period + 1; j <= i; j++) {
      if (bars[j].low < lowestLow) lowestLow = bars[j].low;
      if (bars[j].high > highestHigh) highestHigh = bars[j].high;
    }
    
    const range = highestHigh - lowestLow;
    const currentClose = bars[i].close;
    
    const k = range > 0 ? ((currentClose - lowestLow) / range) * 100 : 50;
    rawK.push(k);
  }
  
  // Smooth raw %K to get %D (which will be our line)
  const stochLines: number[] = [];
  for (let i = 0; i < rawK.length; i++) {
    if (i < smoothK - 1) {
      stochLines.push(rawK[i]);
      continue;
    }
    
    // Calculate simple moving average of %K over smoothK periods
    let sum = 0;
    for (let j = i - smoothK + 1; j <= i; j++) {
      sum += rawK[j];
    }
    stochLines.push(sum / smoothK);
  }
  
  return stochLines;
}

interface KimsDiagnosticResult {
  title: string;
  desc: string;
  badgeColor: string;
  badgeBg: string;
  
  // Individual statuses
  shortStatus: string;
  midStatus: string;
  longStatus: string;
  
  shortTrend: 'up' | 'down' | 'flat';
  midTrend: 'up' | 'down' | 'flat';
  longTrend: 'up' | 'down' | 'flat';

  // Call to action
  actionCode: 'STRONG_BUY' | 'STRONG_SELL' | 'BUY' | 'SELL' | 'HOLD';
  actionTitle: string;
  actionDesc: string;
  actionBadgeColor: string;
  actionBadgeBg: string;
}

function getKimsDiagnostic(
  curr: { short: number; mid: number; long: number },
  prev: { short: number; mid: number; long: number }
): KimsDiagnosticResult {
  // 1. Short-term (5,3,3)
  let shortTrend: 'up' | 'down' | 'flat' = 'flat';
  if (curr.short > prev.short) shortTrend = 'up';
  else if (curr.short < prev.short) shortTrend = 'down';

  let shortStatus = '';
  if (shortTrend === 'up') {
    if (curr.short <= 25) {
      shortStatus = '단기 과매도 바닥 통과 후 상승 전환 (매수 개시 타점 🟢)';
    } else if (curr.short >= 75) {
      shortStatus = '단기 과열 영역 상승 진입 (추격 매수 극도로 불리 🔴)';
    } else {
      shortStatus = '단기 중간 지대 점진적 상승 지속 (상승 모멘텀 유지 🟢)';
    }
  } else if (shortTrend === 'down') {
    if (curr.short <= 25) {
      shortStatus = '단기 과매도권 진입 중 (바닥 탐색 과정, 매수 보류 🔵)';
    } else if (curr.short >= 75) {
      shortStatus = '단기 과열 최고조 후 꺾임 (차익 매물 출회 시작 🔴)';
    } else {
      shortStatus = '단기 상승 동력 둔화 및 숨고르기 조정 중 (보류 🔵)';
    }
  } else {
    shortStatus = '단기 보조지표 보합 횡보 (방향성 탐색 중 ⚖️)';
  }

  // 2. Mid-term (10,6,6)
  let midTrend: 'up' | 'down' | 'flat' = 'flat';
  if (curr.mid > prev.mid) midTrend = 'up';
  else if (curr.mid < prev.mid) midTrend = 'down';

  let midStatus = '';
  if (midTrend === 'up') {
    if (curr.mid <= 30) {
      midStatus = '중기 스윙 침체권 바닥 확인 후 서서히 상승 유턴 (반전 🟢)';
    } else if (curr.mid >= 70) {
      midStatus = '중기 스윙 상승 궤도 최고점 도달 (매수 과열 경보 🔴)';
    } else {
      midStatus = '중기 상승 채널 형성 및 안정적 우상향 지속 (스윙 유리 🟢)';
    }
  } else if (midTrend === 'down') {
    if (curr.mid <= 30) {
      midStatus = '중기 침체구간 하락 진행 (추가 바닥 확인 필요 🔵)';
    } else if (curr.mid >= 70) {
      midStatus = '중기 과열 해소를 위한 추세 이탈 꺾임 시작 (주의 🔴)';
    } else {
      midStatus = '중기 상승 트랙 이탈 및 추세 조정 진행 중 (비중 축소 🔵)';
    }
  } else {
    midStatus = '중기 스윙 추세 방향성 수렴 (보합세 지속 ⚖️)';
  }

  // 3. Long-term (20,12,12)
  let longTrend: 'up' | 'down' | 'flat' = 'flat';
  if (curr.long > prev.long) longTrend = 'up';
  else if (curr.long < prev.long) longTrend = 'down';

  let longStatus = '';
  if (longTrend === 'up') {
    if (curr.long <= 30) {
      longStatus = '장기 대세 바닥 다진 후 강력한 추세 반전 시작 (최적 타점 🟢)';
    } else if (curr.long >= 70) {
      longStatus = '장기 우상향 사이클 정점 도달 (장기 비중 조절 검토 🔴)';
    } else {
      longStatus = '장기 우상향 추세 궤도 안정적 안착 (장기 보유 우호적 🟢)';
    }
  } else if (longTrend === 'down') {
    if (curr.long <= 30) {
      longStatus = '장기 대세 침체 장기화 (중장기 추세 암흑기 지속 🔵)';
    } else if (curr.long >= 70) {
      longStatus = '장기 우상향 채널 붕괴 및 하락 사이클 진입 (대피 요망 🔴)';
    } else {
      longStatus = '장기 우상향 동력 약화 및 추세 둔화 진행 중 (장기 조정 주의 🔵)';
    }
  } else {
    longStatus = '장기 대세 주기 방향성 탐색 중 (수렴 중 ⚖️)';
  }

  // 4. Combined Action recommendation
  let title = '⚖️ 시장 중립 (추세 대기 국면)';
  let desc = '단기, 중기, 장기 에너지가 서로 혼조세를 보이며 뚜렷한 방향성을 결정하지 않은 중립 국면입니다. 박스권 내부 등락을 보이며 다음 추세 발산을 준비 중입니다.';
  let badgeColor = '#64748b';
  let badgeBg = 'rgba(100, 116, 139, 0.08)';

  let actionCode: 'STRONG_BUY' | 'STRONG_SELL' | 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let actionTitle = '⚖️ 시장 관망 및 분할 매매 유효 (Neutral)';
  let actionDesc = '단기, 중기, 장기 에너지가 서로 다른 방향으로 분산되어 움직이고 있어 강한 단방향 모멘텀이 부재합니다. 공격적인 추가 매수는 지양하며, 보유 비중을 유지한 채 명확한 상단 저항선 돌파 혹은 하단 지지선 안착을 확인한 후 진입하는 것이 유리합니다.';
  let actionBadgeColor = '#64748b';
  let actionBadgeBg = 'rgba(100, 116, 139, 0.08)';

  const isAllUp = shortTrend === 'up' && midTrend === 'up' && longTrend === 'up';
  const isAllDown = shortTrend === 'down' && midTrend === 'down' && longTrend === 'down';

  if (curr.short <= 25 && curr.mid <= 25 && curr.long <= 25) {
    title = '🔥 시그니처 3중 바닥 (쓰리바닥 극저점 매수 찬스)';
    desc = '단기, 중기, 장기 스토캐스틱 에너지가 모두 과매도 구간(25 이하)으로 동시 진입한 극도의 저평가 지점입니다. 역사적으로 강한 기술적 반등과 추세 반전이 일어날 확률이 최고조에 달한 타점입니다.';
    badgeColor = '#ef4444';
    badgeBg = 'rgba(239, 68, 68, 0.08)';

    actionCode = 'STRONG_BUY';
    actionTitle = '🔥 초강력 매수 추천 타점 (Triple Bottom Reversal)';
    actionDesc = '단기/중기/장기 파동이 모두 역사적 침체 끝자락에 동시 도달했습니다. 이 시점에서의 매수는 손실 리스크가 극도로 제한되며 상승 시 먹을 수 있는 기대 수익(손익비)이 최대로 팽창하는 절호의 매수 찬스입니다. 적극적인 분할 매수 진입을 강력하게 추천합니다.';
    actionBadgeColor = '#ef4444';
    actionBadgeBg = 'rgba(239, 68, 68, 0.08)';
  } else if (curr.short >= 75 && curr.mid >= 75 && curr.long >= 75) {
    title = '⚠️ 시그니처 3중 천정 (단기 과열 - 비중 조절/익절 대역)';
    desc = '단기, 중기, 장기 에너지가 모두 과열 구간(75 이상)으로 동시 치솟은 과열 고점 영역입니다. 신규 매수는 리스크가 극도로 높으며, 보유 물량의 분할 매도 및 수익 실현을 진지하게 검토해야 하는 경보 구간입니다.';
    badgeColor = '#d97706';
    badgeBg = 'rgba(217, 119, 6, 0.08)';

    actionCode = 'STRONG_SELL';
    actionTitle = '🚨 강력 매도 및 리스크 대피 (Triple Top Overbought)';
    actionDesc = '모든 시계열의 지표가 75% 이상의 초과열 광기 영역에 머물러 있습니다. 단기 차익 실현용 차가운 음봉이 언제 출현해도 이상하지 않으므로 추가 매수를 엄격히 제한하고, 현재 비중의 최소 30%~50% 이상을 현금화하여 수익을 확정 지으실 것을 경고합니다.';
    actionBadgeColor = '#dc2626';
    actionBadgeBg = 'rgba(220, 38, 38, 0.08)';
  } else if (isAllUp) {
    title = '🚀 정배열 동시 우상향 (강력 상승 모멘텀)';
    desc = '단기, 중기, 장기 파동의 고점이 일제히 상방으로 나란히 정렬되어 발산하는 전형적인 상승 강세 국면입니다. 하방 압력을 매수세가 완전히 압도하고 있습니다.';
    badgeColor = '#8b5cf6';
    badgeBg = 'rgba(139, 92, 246, 0.08)';

    actionCode = 'BUY';
    actionTitle = '🔥 초강력 매수 추천 타점 (Triple Bullish Trend)';
    actionDesc = '단기/중기/장기 스토캐스틱 기울기가 전부 우상향 정배열 상승 흐름을 만들며 일치했습니다. 모든 매수 시그널이 상승을 완벽히 지지하고 있어 강하고 빠른 추가 시세 분출이 기대됩니다. 비중 확대 및 적극 매수를 추천합니다.';
    actionBadgeColor = '#3b82f6';
    actionBadgeBg = 'rgba(59, 130, 246, 0.08)';
  } else if (isAllDown) {
    title = '📉 역배열 동시 우하향 (강력 하락 모멘텀)';
    desc = '단기, 중기, 장기 파동이 동시에 고개를 숙이고 아래로 꽂히는 추세 하락 국면입니다. 바닥 지지 라인을 뚫고 강하게 흘러내릴 수 있는 위험천만한 대역입니다.';
    badgeColor = '#dc2626';
    badgeBg = 'rgba(220, 38, 38, 0.08)';

    actionCode = 'SELL';
    actionTitle = '🚨 즉각 리스크 관리 / 전량 매도 (Triple Bearish)';
    actionDesc = '단기/중기/장기 파동 모두가 일제히 하향세를 그리며 떨어지고 있습니다. 하방 지지 압력이 완전히 붕괴한 상태이므로 신규 진입은 금물이며, 리스크 최소화를 위해 손절 및 비중 축소를 포함한 전량 대피 전략을 시행하시길 강력히 경고합니다.';
    actionBadgeColor = '#e11d48';
    actionBadgeBg = 'rgba(225, 29, 72, 0.08)';
  } else if (curr.long >= 50 && (curr.short <= 30 || curr.mid <= 30) && (shortTrend === 'up' || midTrend === 'up')) {
    title = '📈 눌림목 분할 매수 유효 대역 (상승 추세 중 조정)';
    desc = '장기 에너지는 강한 우상향 추세(50 이상)를 견고히 지켜내고 있으나, 단기 및 중기가 일시적으로 바닥을 치고 매도세를 소화한 뒤 다시 머리를 돌려세우는 영리한 조정 완료 대역입니다.';
    badgeColor = '#10b981';
    badgeBg = 'rgba(16, 185, 129, 0.08)';

    actionCode = 'BUY';
    actionTitle = '📈 눌림목 우상향 분할 매수 유효 (Bullish Pullback)';
    actionDesc = '장기 대세 추세는 훼손되지 않은 상승 트랙에 놓여 있지만, 최근 단/중기 조정으로 가격 거품이 빠지며 저가 매수 매력이 매력적으로 팽창했습니다. 전형적인 "우상향 장세 속 눌림목 매수 타점"이므로 서서히 분할 매수로 수량을 모아가기 매우 좋은 진입점입니다.';
    actionBadgeColor = '#059669';
    actionBadgeBg = 'rgba(5, 150, 105, 0.08)';
  } else if (curr.long < 50 && longTrend === 'down' && (curr.short >= 70 || curr.mid >= 70) && (shortTrend === 'down' || midTrend === 'down')) {
    title = '📉 데드캣 바운드 끝자락 조정 임박';
    desc = '장기 에너지는 이미 대세 우하향으로 꺾였으나, 단기/중기 지표가 일시적 반등으로 인해 과열된 뒤 다시 아래로 꺾이기 일보직전인 하락 장세 속 일시 조정 국면입니다.';
    badgeColor = '#3b82f6';
    badgeBg = 'rgba(59, 130, 246, 0.08)';

    actionCode = 'SELL';
    actionTitle = '📉 속임수 반등 탈출 및 비중 축소 (Bearish Rebound)';
    actionDesc = '장기 대세 하락 궤도가 작동 중인 상황에서 발생한 일시적 기술적 반등(Dead Cat Bounce)이 끝자락에 달했습니다. 단기/중기 파동이 고점에서 꺾이기 시작하므로 즉각 현금 비중을 확대하고 물량을 처분해 비중을 대폭 덜어낼 것을 조언합니다.';
    actionBadgeColor = '#ea580c';
    actionBadgeBg = 'rgba(234, 88, 12, 0.08)';
  }

  return {
    title, desc, badgeColor, badgeBg,
    shortStatus, midStatus, longStatus,
    shortTrend, midTrend, longTrend,
    actionCode, actionTitle, actionDesc,
    actionBadgeColor, actionBadgeBg
  };
}

function AnalysisContent() {
  const params = useSearchParams();
  const tickerParam = params.get('ticker') || 'MSFT';

  // 실시간 API
  const { data: liveQuote, loading: quoteLoading, refresh } = useQuote(tickerParam, 60_000);

  // Fallback: mock 데이터 (재무/기술 탭용)
  const mockStock = stockUniverse.find((s) => s.ticker === tickerParam.toUpperCase().replace('-','.')) || getFallbackStock(tickerParam, liveQuote);

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

  // 킴스주식 3중 스토캐스틱 라인 계산 (실시간 히스토리 기반)
  const barsForStoch = historyBars ?? [];
  const stochShort = calculateStochastic(barsForStoch, 5, 3);   // 단기 5,3,3
  const stochMid = calculateStochastic(barsForStoch, 10, 6);    // 중기 10,6,6
  const stochLong = calculateStochastic(barsForStoch, 20, 12);   // 장기 20,12,12

  const stochasticData = barsForStoch.map((bar, idx) => {
    return {
      date: bar.date,
      close: bar.close,
      short: stochShort[idx] !== undefined ? parseFloat(stochShort[idx].toFixed(1)) : 50,
      mid: stochMid[idx] !== undefined ? parseFloat(stochMid[idx].toFixed(1)) : 50,
      long: stochLong[idx] !== undefined ? parseFloat(stochLong[idx].toFixed(1)) : 50,
    };
  }).slice(-60);

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
                    fill="url(#priceGrad)" dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Dynamic Current Position & Weekly/Monthly Outlook Scenarios */}
          {(() => {
            const scenario = generateScenario(tickerParam, price, low52w, high52w, changePct);
            return (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 24px' }}>
                {/* Title */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>📍</span>
                    <h3 style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      주가 현 위치 상세 진단 및 금주·금월 시나리오 전망
                    </h3>
                  </div>
                  <span style={{ 
                    fontSize: 9.5, 
                    fontWeight: 800, 
                    color: 'var(--accent)', 
                    background: 'var(--accent-glow)', 
                    padding: '2px 8px', 
                    borderRadius: 4,
                    border: '1px solid var(--border-default)'
                  }}>
                    DH 실시간 인텔리전스
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
                  {/* Left Column: Current Position Diagnosis & Gauge */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, borderRight: '1px solid var(--border-subtle)', paddingRight: 24 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>
                        현 위치 기술적 진단 (52주 채널 분석)
                      </div>
                      <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {scenario.boxState}
                      </div>
                      <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 8, marginBottom: 0 }}>
                        {scenario.positionDesc}
                      </p>
                    </div>

                    {/* 52-Week Position Bar Gauge */}
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
                        <span>52주 최저 (${low52w.toFixed(2)})</span>
                        <span style={{ fontWeight: 800, color: 'var(--accent)' }}>52주 채널 내 위치: {scenario.pos}%</span>
                        <span>52주 최고 (${high52w.toFixed(2)})</span>
                      </div>
                      <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 4, position: 'relative', border: '1px solid var(--border-default)' }}>
                        <div style={{ 
                          position: 'absolute', 
                          left: 0, 
                          top: 0, 
                          height: '100%', 
                          width: `${scenario.pos}%`, 
                          background: 'linear-gradient(90deg, #60a5fa, #3b82f6)', 
                          borderRadius: 4 
                        }} />
                        <div style={{
                          position: 'absolute',
                          left: `calc(${scenario.pos}% - 5px)`,
                          top: -3,
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: 'white',
                          border: '3px solid #2563eb',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                        }} />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Weekly & Monthly Scenarios */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Weekly Scenarios */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>
                        금주 예상 돌파/조정 시나리오
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 11.5, lineHeight: 1.5 }}>
                          <span style={{ fontSize: 8.5, background: 'rgba(16,185,129,0.1)', color: '#059669', padding: '2px 5px', borderRadius: 3, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>상방 시나리오</span>
                          <span style={{ color: 'var(--text-primary)' }}>{scenario.weeklyBull}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 11.5, lineHeight: 1.5 }}>
                          <span style={{ fontSize: 8.5, background: 'rgba(239,68,68,0.1)', color: '#dc2626', padding: '2px 5px', borderRadius: 3, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>하방 시나리오</span>
                          <span style={{ color: 'var(--text-primary)' }}>{scenario.weeklyBear}</span>
                        </div>
                      </div>
                    </div>

                    {/* Monthly Scenarios */}
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', letterSpacing: '0.5px' }}>
                        <span>금월 중장기 전망 시나리오</span>
                        <span style={{ fontSize: 9.5, color: 'var(--accent)', background: 'var(--accent-glow)', padding: '1px 6px', borderRadius: 4, fontWeight: 800, border: '1px solid var(--border-default)' }}>
                          예상 밴드: {scenario.expectedMonthlyBand}
                        </span>
                      </div>
                      <p style={{ fontSize: 11.5, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                        {scenario.monthlyScenario}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Kim's Stock Signature Triple Momentum Panel */}
          {(() => {
            const lastData = stochasticData[stochasticData.length - 1] || { short: 50, mid: 50, long: 50 };
            const prevData = stochasticData[stochasticData.length - 2] || lastData;
            const diag = getKimsDiagnostic(lastData, prevData);
            
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
                  {/* Left Panel: Triple Stochastics Charts */}
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 24px' }}>
                    <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        📊 킴스주식 시그니처 3중 모멘텀 스토캐스틱 차트
                      </h3>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>최근 60일 관측선</span>
                    </div>

                    {/* 1. Short-term Stochastic Chart */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          단기 에너지 (Stochastic 5, 3, 3) 
                          <span style={{ 
                            fontSize: 8.5, 
                            color: diag.shortTrend === 'up' ? 'var(--positive)' : diag.shortTrend === 'down' ? 'var(--negative)' : 'var(--text-muted)', 
                            background: diag.shortTrend === 'up' ? 'rgba(16,185,129,0.08)' : diag.shortTrend === 'down' ? 'rgba(239,68,68,0.08)' : 'var(--bg-elevated)', 
                            padding: '1px 5px', 
                            borderRadius: 3, 
                            fontWeight: 800 
                          }}>
                            {diag.shortTrend === 'up' ? '▲ 상승세' : diag.shortTrend === 'down' ? '▼ 하락세' : '■ 보합'}
                          </span>
                        </span>
                        <span style={{ fontFamily: 'JetBrains Mono' }}>현재값: {lastData.short}%</span>
                      </div>
                      <ResponsiveContainer width="100%" height={85}>
                        <LineChart data={stochasticData} margin={{ top: 2, right: 4, bottom: 2, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                          <XAxis dataKey="date" hide />
                          <YAxis domain={[0, 100]} ticks={[20, 50, 80]} tick={{ fontSize: 8, fill: 'var(--text-muted)' }} width={18} />
                          <Tooltip
                            formatter={(v: any) => [`${v}%`, '단기']}
                            contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, fontSize: 10, padding: '2px 6px' }}
                          />
                          <ReferenceLine y={80} stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" />
                          <ReferenceLine y={20} stroke="#10b981" strokeWidth={1} strokeDasharray="3 3" />
                          <Line type="monotone" dataKey="short" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* 2. Mid-term Stochastic Chart */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: '#8b5cf6', marginBottom: 4 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          중기 에너지 (Stochastic 10, 6, 6)
                          <span style={{ 
                            fontSize: 8.5, 
                            color: diag.midTrend === 'up' ? 'var(--positive)' : diag.midTrend === 'down' ? 'var(--negative)' : 'var(--text-muted)', 
                            background: diag.midTrend === 'up' ? 'rgba(16,185,129,0.08)' : diag.midTrend === 'down' ? 'rgba(239,68,68,0.08)' : 'var(--bg-elevated)', 
                            padding: '1px 5px', 
                            borderRadius: 3, 
                            fontWeight: 800 
                          }}>
                            {diag.midTrend === 'up' ? '▲ 상승세' : diag.midTrend === 'down' ? '▼ 하락세' : '■ 보합'}
                          </span>
                        </span>
                        <span style={{ fontFamily: 'JetBrains Mono' }}>현재값: {lastData.mid}%</span>
                      </div>
                      <ResponsiveContainer width="100%" height={85}>
                        <LineChart data={stochasticData} margin={{ top: 2, right: 4, bottom: 2, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                          <XAxis dataKey="date" hide />
                          <YAxis domain={[0, 100]} ticks={[20, 50, 80]} tick={{ fontSize: 8, fill: 'var(--text-muted)' }} width={18} />
                          <Tooltip
                            formatter={(v: any) => [`${v}%`, '중기']}
                            contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, fontSize: 10, padding: '2px 6px' }}
                          />
                          <ReferenceLine y={80} stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" />
                          <ReferenceLine y={20} stroke="#10b981" strokeWidth={1} strokeDasharray="3 3" />
                          <Line type="monotone" dataKey="mid" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* 3. Long-term Stochastic Chart */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: '#3b82f6', marginBottom: 4 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          장기 에너지 (Stochastic 20, 12, 12)
                          <span style={{ 
                            fontSize: 8.5, 
                            color: diag.longTrend === 'up' ? 'var(--positive)' : diag.longTrend === 'down' ? 'var(--negative)' : 'var(--text-muted)', 
                            background: diag.longTrend === 'up' ? 'rgba(16,185,129,0.08)' : diag.longTrend === 'down' ? 'rgba(239,68,68,0.08)' : 'var(--bg-elevated)', 
                            padding: '1px 5px', 
                            borderRadius: 3, 
                            fontWeight: 800 
                          }}>
                            {diag.longTrend === 'up' ? '▲ 상승세' : diag.longTrend === 'down' ? '▼ 하락세' : '■ 보합'}
                          </span>
                        </span>
                        <span style={{ fontFamily: 'JetBrains Mono' }}>현재값: {lastData.long}%</span>
                      </div>
                      <ResponsiveContainer width="100%" height={85}>
                        <LineChart data={stochasticData} margin={{ top: 2, right: 4, bottom: 2, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                          <XAxis dataKey="date" tick={{ fontSize: 8, fill: 'var(--text-muted)' }} tickFormatter={(d) => new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} />
                          <YAxis domain={[0, 100]} ticks={[20, 50, 80]} tick={{ fontSize: 8, fill: 'var(--text-muted)' }} width={18} />
                          <Tooltip
                            formatter={(v: any) => [`${v}%`, '장기']}
                            contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, fontSize: 10, padding: '2px 6px' }}
                          />
                          <ReferenceLine y={80} stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" />
                          <ReferenceLine y={20} stroke="#10b981" strokeWidth={1} strokeDasharray="3 3" />
                          <Line type="monotone" dataKey="long" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right Panel: Diagnostic Commentary */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    {/* A. 3중 파동 개별 정밀 상태판 */}
                    <div className="card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                        <h4 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          🔍 단기·중기·장기 파동 개별 분석 현황
                        </h4>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                          { label: '단기 에너지 (5일 주기)', val: lastData.short, status: diag.shortStatus, color: '#f59e0b' },
                          { label: '중기 에너지 (10일 주기)', val: lastData.mid, status: diag.midStatus, color: '#8b5cf6' },
                          { label: '장기 에너지 (20일 주기)', val: lastData.long, status: diag.longStatus, color: '#3b82f6' },
                        ].map((wave, idx) => (
                          <div key={idx} style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: 5, 
                            padding: '10px 12px', 
                            background: 'var(--bg-elevated)', 
                            borderRadius: 6,
                            border: '1px solid var(--border-default)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 10.5, fontWeight: 700, color: wave.color }}>{wave.label}</span>
                              <span style={{ fontSize: 10.5, fontWeight: 800, fontFamily: 'JetBrains Mono', color: 'var(--text-primary)' }}>{wave.val}%</span>
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                              {wave.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* B. 종합 기상 특보 & 행동 지침서 */}
                    <div className="card" style={{
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: 12, 
                      padding: '20px 24px',
                      background: diag.badgeBg,
                      borderColor: `${diag.badgeColor}33`,
                      borderWidth: '1px',
                      borderStyle: 'solid'
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: diag.badgeColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        킴스주식 3중 모멘텀 종합 기상 특보
                      </div>
                      <h4 style={{ fontSize: 14.5, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                        {diag.title}
                      </h4>
                      <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                        {diag.desc}
                      </p>
                    </div>

                  </div>
                </div>

                {/* C. Action Opinion Box (최종 투자 행동 지침서) */}
                <div className="card" style={{ 
                  padding: '20px 24px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 20, 
                  background: diag.actionBadgeBg,
                  borderColor: `${diag.actionBadgeColor}44`,
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}>
                  <div style={{ 
                    width: 52, 
                    height: 52, 
                    borderRadius: 12, 
                    background: diag.actionBadgeBg,
                    border: `2px solid ${diag.actionBadgeColor}`,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: 24, 
                    flexShrink: 0,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                  }}>
                    {diag.actionCode === 'STRONG_BUY' ? '🔥' : diag.actionCode === 'BUY' ? '📈' : diag.actionCode === 'STRONG_SELL' ? '🚨' : diag.actionCode === 'SELL' ? '📉' : '⚖️'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h4 style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                        {diag.actionTitle}
                      </h4>
                      <span style={{ 
                        fontSize: 8.5, 
                        fontWeight: 800, 
                        color: 'white', 
                        background: diag.actionBadgeColor, 
                        padding: '2px 6px', 
                        borderRadius: 3 
                      }}>
                        {diag.actionCode}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 6, marginBottom: 0 }}>
                      {diag.actionDesc}
                    </p>
                  </div>
                </div>

                {/* Core Momentum Summary Cards */}
                <div className="card" style={{ padding: '20px 24px' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.5px' }}>
                    핵심 모멘텀 요약 지표
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {[
                      { label: 'RSI (14)', value: stock.rsi14.toFixed(1), color: lastData.short <= 30 ? 'var(--positive)' : lastData.short >= 70 ? 'var(--negative)' : 'var(--text-primary)' },
                      { label: '52주 고점 대비', value: `${stock.priceVs52wHigh.toFixed(1)}%`, color: stock.priceVs52wHigh > -5 ? 'var(--positive)' : 'var(--text-primary)' },
                      { label: 'RS Rating (강도)', value: String(stock.rs52w), color: stock.rs52w >= 80 ? 'var(--positive)' : 'var(--text-primary)' },
                      { label: '거래량 vs 평균', value: `${((stock.volume / stock.avgVolume) * 100).toFixed(0)}%`, color: stock.volume > stock.avgVolume ? 'var(--positive)' : 'var(--text-primary)' },
                    ].map((m) => (
                      <div key={m.label} style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 6, border: '1px solid var(--border-default)' }}>
                        <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 600 }}>{m.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'JetBrains Mono', color: m.color, marginTop: 4 }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })()}
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
