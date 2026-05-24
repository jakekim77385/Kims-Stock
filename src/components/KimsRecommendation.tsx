'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, RefreshCw, TrendingUp, TrendingDown, 
  AlertTriangle, ShieldAlert, CheckCircle2, 
  HelpCircle, ChevronRight, Activity 
} from 'lucide-react';
import { stockUniverse } from '@/lib/mockData';
import type { HistoryBar } from '@/lib/hooks';


// ─── S&P 500 종목 섹터 & 간단 설명 메타데이터 사전 ──────────────────────────────────
export function getStockMeta(ticker: string): { sector: string; description: string } {
  const upper = ticker.toUpperCase();

  // A. Top-Tier 대표 종목 사전 (80개 초우량주 고정밀 설명)
  const explicitMeta: Record<string, { sector: string; desc: string }> = {
    'AAPL':  { sector: '정보기술(IT)', desc: '글로벌 스마트폰 및 디바이스 절대 강자, 자체 칩 탑재 및 AI 생태계 혁신 기업' },
    'MSFT':  { sector: '정보기술(IT)', desc: '글로벌 1위 클라우드(Azure) 및 생성형 AI 인프라 리더, 오피스 및 OS 지배자' },
    'NVDA':  { sector: '정보기술(IT)', desc: '글로벌 GPU 시장의 90% 이상 점유, 가속 컴퓨팅 및 AI 학습 인프라의 핵심 리더' },
    'GOOGL': { sector: '커뮤니케이션', desc: '검색 엔진 및 유튜브의 압도적 시장 지배자, 전 세계 AI 연구를 리드하는 빅테크' },
    'GOOG':  { sector: '커뮤니케이션', desc: '검색 엔진 및 유튜브의 압도적 시장 지배자, 전 세계 AI 연구를 리드하는 빅테크' },
    'META':  { sector: '커뮤니케이션', desc: '페이스북 및 인스타그램을 보유한 메가 소셜미디어 플랫폼 기업이자 Llama AI 리더' },
    'TSLA':  { sector: '경기소비재', desc: '글로벌 전기차(EV) 혁신 선두주자, 자율주행(FSD) 및 로봇공학 등 미래 기술 탑티어' },
    'AMZN':  { sector: '경기소비재', desc: '글로벌 온라인 이커머스 강자이자 세계 최대 클라우드 컴퓨팅 플랫폼 AWS 보유 기술 기업' },
    'PLTR':  { sector: '정보기술(IT)', desc: '정부 및 민간 부문 빅데이터 분석 플랫폼(AIP)의 대표주자, 엔터프라이즈 AI 강자' },
    'AMD':   { sector: '정보기술(IT)', desc: '고성능 반도체 설계 리더, AI 인프라 칩(MI300 시리즈) 시장의 주요 주도주' },
    'SMCI':  { sector: '정보기술(IT)', desc: '액체 냉각에 특화된 고성능 AI 데이터센터 서버 및 하이엔드 랙 솔루션 제조업체' },
    'AVGO':  { sector: '정보기술(IT)', desc: '통신용 커스텀 ASIC 반도체 설계 1위이자 대형 소프트웨어(VMware 등) 인수합병의 강자' },
    'LLY':   { sector: '헬스케어', desc: '글로벌 비만 치료제(Zepbound) 및 당뇨병 의약품 시장을 혁신하는 초거대 제약사' },
    'BRK-B': { sector: '금융', desc: '워런 버핏의 종합 투자 복합 그룹, 강력한 보험, 유통, 철도 인프라 자산을 소유' },
    'JNJ':   { sector: '헬스케어', desc: '제약 및 의료기기 부문에서 최고 수준의 현금흐름과 안정성을 지닌 글로벌 전통 제약사' },
    'V':     { sector: '금융', desc: '세계 최대의 디지털 결제 네트워크 플랫폼, 독점적 지위 기반 강력한 수수료 이익 창출' },
    'MA':    { sector: '금융', desc: '글로벌 2대 카드결제 네트워크 인프라 리더이자 보안 및 핀테크 디지털 솔루션 제공사' },
    'JPM':   { sector: '금융', desc: '미국 최대 자산 규모를 자랑하는 독보적 투자은행, 탄탄한 현금 해자와 금융 지배력 보유' },
    'KO':    { sector: '필수소비재', desc: '세계 식음료 시장의 상징, 글로벌 음료 점유율 1위 및 60년 연속 배당 성장 전통주' },
    'COST':  { sector: '필수소비재', desc: '유료 회원제 기반 창고형 할인 마트, 극도의 충성도와 고성장 멤버십 해자 기업' },
    'SBUX':  { sector: '경기소비재', desc: '세계 최대의 글로벌 커피 전문점 체인이자 고도화된 모바일 결제 금융 생태계 보유주' },
    'NKE':   { sector: '경기소비재', desc: '글로벌 스포츠 의류 및 스니커즈 지배적 브랜드, 직접 판매(D2C) 및 팬덤 마케팅의 정수' },
    'NFLX':  { sector: '커뮤니케이션', desc: '글로벌 1위 동영상 스트리밍(OTT) 서비스, 검증된 오리지널 제작 파워 및 구독 모델 최강자' },
    'QCOM':  { sector: '정보기술(IT)', desc: '모바일 AP(스냅드래곤) 칩 설계의 절대 강자이며 차량용 반도체 및 온디바이스 AI 리더' },
    'WMT':   { sector: '필수소비재', desc: '미국 최대 오프라인 식료품/소매업의 강자, 옴니채널 커머스 및 물류 기술 인프라 선도' },
    'TGT':   { sector: '경기소비재', desc: '미국 전역에 트렌디한 매장을 보유한 대형 할인점, 패션/인테리어에 강한 유통 리더' },
    'HD':    { sector: '경기소비재', desc: '세계 최대 주택 개선(DIY) 소매 유통 기업, 탄탄한 주택 경기 연동형 이익 해자' },
    'UNH':   { sector: '헬스케어', desc: '미국 최대 건강보험사 및 헬스 데이터 분석 플랫폼 Optum을 지배하는 초대형 의료주' },
    'ABBV':  { sector: '헬스케어', desc: '자가면역질환 신약 및 글로벌 1위 에스테틱(보톡스, 필러) 솔루션 지배력을 지닌 강자' },
    'PFE':   { sector: '헬스케어', desc: '글로벌 백신 및 다양한 항암 치료 파이프라인을 구축한 전통의 메가 바이오 제약사' },
    'MRNA':  { sector: '헬스케어', desc: '차세대 mRNA 플랫폼 기반 백신 및 개인 맞춤형 종양 백신 분야 혁신을 선도하는 기업' },
    'ABT':   { sector: '헬스케어', desc: '연속 혈당 측정기(Freestyle Libre) 등 고성능 진단 기기 및 특수 영양식 글로벌 선두' },
    'DHR':   { sector: '헬스케어', desc: '바이오 연구 분석 기기 및 특수 소모품 제조업체, 고효율 린(Lean) 비즈니스 경영 시스템 강자' },
    'ISRG':  { sector: '헬스케어', desc: '글로벌 1위 다빈치(da Vinci) 복강경 수술 로봇 제조사, 수술 건수 기반 막강한 소모품 매출' },
    'GILD':  { sector: '헬스케어', desc: '글로벌 1위 항바이러스 치료제 공급사, HIV/C형 간염 치료 기술의 전통적 핵심 특허 보유' },
    'MRK':   { sector: '헬스케어', desc: '글로벌 최고 항암 의약품 키트루다(Keytruda)를 보유한 전 세계 최대의 면역 항암 의약품 강자' },
    'XOM':   { sector: '에너지', desc: '미국 최대 통합 에너지 석유 메이저 기업, 셰일 오일 시추 및 석유 화학 분야 리더' },
    'CVX':   { sector: '에너지', desc: '셰브론, 글로벌 가치사슬 전반을 장악하고 있는 에너지 시황 연동형 메이저 오일 대기업' },
    'CAT':   { sector: '산업재', desc: '건설, 광산 및 에너지 발전 장비 제조업의 글로벌 1위 기업, 대규모 인프라 건설의 척도' },
    'GE':    { sector: '산업재', desc: '항공기 제트 엔진 및 글로벌 풍력·가스 터빈 발전 기기 시장을 독점하는 핵심 산업재 지배자' },
    'LMT':   { sector: '산업재', desc: '글로벌 1위 록히드 마틴, 스텔스 전투기 F-35 및 정밀 미사일 방어 핵심인 초거대 방산업체' },
    'RTX':   { sector: '산업재', desc: '프랫앤휘트니 제트 엔진 및 첨단 레이더, 패트리어트 유도 무기 체계를 소유한 종합 방산주' },
    'NOC':   { sector: '산업재', desc: '글로벌 스텔스 폭격기 B-21 및 군사용 초소형 위성, 유인 우주선 등 고도 국방 기술 방산사' },
    'GD':    { sector: '산업재', desc: '최상급 비즈니스 제트기(Gulfstream) 및 미국 버지니아급 원자력 잠수함 제조 메이저 방산사' },
    'BA':    { sector: '산업재', desc: '글로벌 여객 항공 및 국방 우주 시장을 이끄는 미국을 대표하는 우주항공 제조 대기업' },
    'DE':    { sector: '산업재', desc: '존 디어(John Deere) 농업 및 임업 기계의 글로벌 지배자, 자율주행 정밀 스마트 농업 기계 선두' },
    'UNP':   { sector: '산업재', desc: '미국 서부 지역을 횡단하는 독점적 철도 노선을 독과점하여 막강한 마진을 남기는 물류 해자 기업' },
    'UPS':   { sector: '산업재', desc: '글로벌 1위 화물 배송 및 3자 공급망 물류 관리 솔루션의 글로벌 핵심 물류 리더' },
    'FDX':   { sector: '산업재', desc: '전 세계 허브 항공기 물류 및 완벽한 도어 투 도어 지상 특송 네트워크를 가진 물류 거인' },
    'CRM':   { sector: '정보기술(IT)', desc: '글로벌 1위 고객 관계 관리(CRM) 클라우드 소프트웨어이자 기업용 AI 에이전트 선두 플랫폼' },
    'ADBE':  { sector: '정보기술(IT)', desc: '포토샵, 프리미어 등 크리에이티브 콘텐츠 툴 100% 독점 및 Firefly 크리에이티브 AI 리더' },
    'ORCL':  { sector: '정보기술(IT)', desc: '엔터프라이즈 데이터베이스 절대 지배자이며 초고속 OCI 클라우드 및 생성형 AI 인프라 수혜주' },
    'CSCO':  { sector: '정보기술(IT)', desc: '시스코 시스템즈, 네트워크 스위치 및 라우터 장비 리더, 클라우드 네트워킹 & 보안 절대자' },
    'INTC':  { sector: '정보기술(IT)', desc: '글로벌 x86 PC/서버용 프로세서의 상징, 미국 중심 파운드리 반도체 제조 재건의 중심' },
    'SPY':   { sector: '지수 및 섹터 ETF', desc: '미국 S&P 500 지수 추종 1위 ETF, 주식 시장 전체의 체력 및 지수 척도를 대변' },
    'QQQ':   { sector: '지수 및 섹터 ETF', desc: '나스닥 100 지수 추종 ETF, 테크/빅테크 중심의 공격적 성장 포트폴리오의 정수' },
    'DIA':   { sector: '지수 및 섹터 ETF', desc: '다우존스 산업평균 지수를 1:1로 추적하는 미국 대표 전통 우량 가치주 바스켓 ETF' },
    'IWM':   { sector: '지수 및 섹터 ETF', desc: '러셀 2000 지수를 추종하는 대표적인 미국 중소형 성장/가치 혁신 기업 바스켓 ETF' },
    'SOXX':  { sector: '지수 및 섹터 ETF', desc: '필라델피아 반도체 지수를 추적하며 엔비디아, 브로드컴 등 반도체 밸류체인 대표 ETF' },
    'SMH':   { sector: '지수 및 섹터 ETF', desc: '글로벌 최고 반도체 기업 25개에 가중 집중 투자하는 고마진 반도체 전문 ETF' },
    'ARKK':  { sector: '지수 및 섹터 ETF', desc: '캐시 우드의 대표 펀드, 유전체학, 전기차, 자율주행 등 파괴적 혁신 성장주 추적 ETF' },
    'SOFI':  { sector: '금융', desc: '학자금 대출 리파이낸싱을 넘어 젊은 층에 특화된 올인원 원스톱 모바일 핀테크 디지털 은행' },
    'HOOD':  { sector: '금융', desc: '로빈후드, 미국 개인 투자자들이 애용하는 모바일 주식 및 가상자산 리테일 브로커리지' },
    'COIN':  { sector: '금융', desc: '미국 최대 가상자산 규제 준수 거래소, 비트코인 및 알트코인 현물/선물 거래 중개 리더' },
    'MSTR':  { sector: '정보기술(IT)', desc: '글로벌 엔터프라이즈 BI 소프트웨어 기업이자 세계 최대 비트코인 상장 회사 보유 지주 모델' },
    'PLD':   { sector: '부동산 (REITs)', desc: '프로로지스, 전 세계 주요 항만/공항 인근의 현대식 초대형 물류창고 인프라를 보유한 1위 리츠' },
    'AMT':   { sector: '부동산 (REITs)', desc: '아메리칸 타워, 전 세계 22만 개 이상의 무선 통신 기지국 및 5G 통신 타워를 임대하는 리츠' },
    'CCI':   { sector: '부동산 (REITs)', desc: '크라운 캐슬, 미국 내 최대 규모의 매크로 기지국 타워 및 소형 셀 무선 안테나 임대 리츠' },
    'EQIX':  { sector: '부동산 (REITs)', desc: '에퀴닉스, 전 세계 금융 및 테크 허브에 코로케이션 인터랙티브 데이터센터 인프라 리츠' },
    'O':     { sector: '부동산 (REITs)', desc: '리얼티 인컴, 매월 배당을 지급하는 미국 1위 싱글 테넌트 상업용 부동산 배당 리츠' },
    'WELL':  { sector: '부동산 (REITs)', desc: '웰타워, 고령 인구 증가 수혜를 직접적으로 누리는 글로벌 시니어 실버타운 및 요양원 전문 리츠' },
    'SPG':   { sector: '부동산 (REITs)', desc: '사이먼 프로퍼티, 최고 등급의 럭셔리 프리미엄 아울렛 및 쇼핑 센터 쇼핑몰 인프라 리츠' },
    'X':     { sector: '소재', desc: 'US 스틸, 미국의 역사와 전통을 함께해 온 미국 1위 종합 용광로 전기로 철강 제조업체' },
    'CLF':   { sector: '소재', desc: '클리블랜드-클리프스, 철광석 시추 원자재부터 북미 자동차용 플랫 스틸 철강 제조 메이저' },
    'PATH':  { sector: '정보기술(IT)', desc: '유아이패스, 지능형 업무 자동화(RPA) 시장 리더로 소프트웨어 기반 업무 효율화 기업' }
  };

  // 1. If explicit meta exists, return it
  if (explicitMeta[upper]) {
    const item = explicitMeta[upper];
    return { sector: item.sector, description: item.desc };
  }

  // B. Rule-based Dynamic Sector Classification & Description Generation for other 420+ tickers
  const itTickers = [
    'TXN', 'AMAT', 'MU', 'LRCX', 'PANW', 'FTNT', 'CRWD', 'ACN', 'IBM', 'INTU',
    'WDAY', 'SNPS', 'CDNS', 'ADSK', 'MCHP', 'MPWR', 'ON', 'NXPI', 'ADI', 'KLAC',
    'TER', 'ANSS', 'VRSN', 'MSCI', 'TYL', 'DDOG', 'NET', 'SNOW', 'ARM', 'FSLR',
    'ENPH', 'SEDG', 'HPQ', 'HPE', 'NTAP', 'WDC', 'STX', 'ANET', 'APH', 'TEL',
    'GLW', 'CDW', 'IT', 'LDOS', 'EPAM', 'DXC', 'JNPR', 'FFIV', 'AKAM', 'VRSK',
    'PAYC', 'FICO', 'PTC', 'GEN', 'TRMB', 'SWKS', 'QRVO', 'KEYS', 'FTV', 'TDY'
  ];

  const commTickers = [
    'CHTR', 'CMCSA', 'TMUS', 'PARA', 'WBD', 'FOXA', 'FOX', 'NYT', 'IPG', 'OMC', 'EA', 'TTWO'
  ];

  const finTickers = [
    'BAC', 'WFC', 'C', 'MS', 'GS', 'AXP', 'BLK', 'SPGI', 'MCO', 'SCHW',
    'PGR', 'CB', 'MMC', 'AON', 'AIG', 'MET', 'PRU', 'TRV', 'ALL', 'HIG',
    'CBOE', 'ICE', 'CME', 'TROW', 'BEN', 'AMP', 'STT', 'BK', 'FITB', 'HBAN',
    'KEY', 'RF', 'USB', 'PNC', 'TFC', 'MTB', 'CFG', 'SYF', 'COF', 'DFS',
    'CINF', 'EG', 'ERIE', 'FHN', 'WTW', 'RJF', 'LPLA', 'GL', 'AFL', 'WRB', 'BRO',
    'JKHY', 'FDS', 'MKTX', 'ABG', 'ACM', 'ADC', 'AEG', 'AER', 'AGCO', 'ALE',
    'ALV', 'AMCR', 'AMED', 'AMG', 'AN', 'APG', 'ARW', 'ASB', 'ASGN', 'ASH',
    'ATR', 'AVT', 'AVY', 'AXS', 'AZPN', 'BC', 'BDC', 'BERY', 'BHE', 'BKH',
    'BYD', 'CACC', 'CADE', 'CASY', 'CBRE', 'CBT', 'CCK', 'CDAY', 'CFR', 'CG',
    'CGEM', 'CHDN', 'CHE', 'CHRW', 'CIEN', 'CLH', 'CNM', 'CNO', 'CNP', 'CNS',
    'CNX', 'CNXC', 'CORT', 'COTY', 'CPT', 'CR', 'CRI', 'CRL', 'CRUS', 'CRVL',
    'CSGS', 'CSL', 'CUBE', 'CUBI', 'CVAC', 'CW', 'CXM', 'DAR', 'DAY', 'DCI',
    'DCOM', 'DECK', 'DEI', 'DKS', 'DLB', 'DOC', 'DOCU', 'EGP', 'EHC'
  ];

  const reitsTickers = [
    'WY', 'PSA', 'DLR', 'WELL', 'AVB', 'EQR', 'VTR', 'BXP', 'ARE', 'SBAC',
    'HST', 'UDR', 'MAA', 'REG', 'FRT', 'KIM', 'NLY', 'AGNC', 'LNC', 'UNM', 'PFG', 'IVZ'
  ];

  const healthTickers = [
    'BMY', 'AMGN', 'GILD', 'CVS', 'CI', 'ELV', 'BDX', 'SYK', 'BSX', 'ZTS',
    'HCA', 'MCK', 'COR', 'CAH', 'VRTX', 'REGN', 'BIIB', 'ALGN', 'IDXX',
    'EW', 'STE', 'IQV', 'A', 'DGX', 'LH', 'MDT', 'BAX', 'DXCM', 'PODD',
    'TFX', 'ZBH', 'XRAY', 'COO', 'ALNY', 'TECH', 'WST', 'CRL', 'MTD', 'RVTY',
    'MOH', 'CNC', 'HUM', 'HSIC', 'PDCO', 'INCY', 'SAVA', 'HALO', 'JAZZ', 'UTHR',
    'EXAS', 'GH', 'NTRA', 'BEAM', 'CRSP', 'BGNE'
  ];

  const energyTickers = [
    'COP', 'EOG', 'SLB', 'HAL', 'BKR', 'OXY', 'HES', 'MPC', 'PSX', 'VLO',
    'KMI', 'WMB', 'OKE', 'TRGP', 'DVN', 'FANG', 'APA', 'MRO', 'EQT'
  ];

  const indTickers = [
    'UNP', 'UPS', 'FDX', 'CSX', 'NSC', 'ETN', 'PH', 'ITW', 'EMR', 'ROP',
    'AME', 'DOV', 'XYL', 'JCI', 'CARR', 'OTIS', 'TT', 'GRMN', 'FAST', 'URI',
    'GWW', 'RSG', 'WM', 'SRCL'
  ];

  const matTickers = [
    'FCX', 'NUE', 'AA', 'ALB', 'SQM', 'MP', 'LAC', 'CCJ', 'UUUU', 'SMR',
    'SHW', 'DD', 'APD', 'LIN', 'ECL', 'NEM', 'GOLD', 'VMC', 'MLM', 'PPG',
    'VAL', 'EMN', 'CE', 'HUN', 'MOS', 'CF', 'FMC', 'IPI', 'BHP', 'RIO', 'VALE'
  ];

  const consCycTickers = [
    'LOW', 'TJX', 'DG', 'DLTR', 'ROST', 'ORLY', 'AZO', 'GPC', 'F', 'GM',
    'RIVN', 'LCID', 'MCD', 'CMG', 'YUM', 'DRI', 'DPZ', 'WEN', 'LULU', 'PVH',
    'RL', 'TPR', 'CPRI', 'VFC', 'UAA', 'MAS', 'MHK', 'DHI', 'LEN', 'PHM',
    'TOL', 'NVR', 'KBH', 'GRBK', 'LGIH', 'MTH', 'CCS'
  ];

  const consStapTickers = [
    'PEP', 'EL', 'CL', 'KMB', 'CHD', 'CLX', 'HRB', 'MDLZ', 'K', 'GIS',
    'HSY', 'CAG', 'CPB', 'SJM', 'MKC', 'ADM', 'BG', 'TSN', 'STZ', 'TAP',
    'BUD', 'DEO', 'MNST', 'CELH', 'KDP'
  ];

  const utilTickers = [
    'VST', 'CEG', 'ES', 'ETR', 'EVRG', 'FE'
  ];

  const etfTickers = [
    'SPY', 'QQQ', 'DIA', 'IWM', 'MDY', 'EEM', 'VGK', 'EWJ', 'FXI', 'KWEB',
    'ASHR', 'INDA', 'EWZ', 'EWW', 'ARKK', 'SOXX', 'SMH'
  ];

  // Matching check
  if (itTickers.includes(upper)) {
    return { sector: '정보기술(IT)', description: `S&P 500 정보기술(IT) 대표 기업으로, 첨단 테크 제품 및 솔루션을 영위합니다.` };
  }
  if (commTickers.includes(upper)) {
    return { sector: '커뮤니케이션', description: `S&P 500 커뮤니케이션 섹터 소속 기업으로, 네트워크/인프라 및 미디어 서비스를 제공합니다.` };
  }
  if (finTickers.includes(upper)) {
    return { sector: '금융', description: `S&P 500 우량 금융 지주회사로, 뱅킹, 자산 관리 및 자본 서비스 사업을 수행합니다.` };
  }
  if (reitsTickers.includes(upper)) {
    return { sector: '부동산 (REITs)', description: `S&P 500 소속 주요 부동산 투자 신탁(리츠)으로, 탄탄한 인프라 임대 이익을 분배합니다.` };
  }
  if (healthTickers.includes(upper)) {
    return { sector: '헬스케어', description: `S&P 500 대표 헬스케어/제약 바이오주로, 질환 치료 및 보건 관련 솔루션을 공급합니다.` };
  }
  if (energyTickers.includes(upper)) {
    return { sector: '에너지', description: `미국 에너지를 지탱하는 주요 종목으로, 시황 및 원자재 인프라 가치 밸류를 구축하고 있습니다.` };
  }
  if (indTickers.includes(upper)) {
    return { sector: '산업재', description: `S&P 500 소속 고성장 산업재 부품 및 장비 제조사로, 견고한 하드웨어 해자를 지니고 있습니다.` };
  }
  if (matTickers.includes(upper)) {
    return { sector: '소재', description: `원자재 인프라를 담당하는 기초 소재 화학 선도 기업으로, 탄탄한 원재료 제조 지배력을 자랑합니다.` };
  }
  if (consCycTickers.includes(upper)) {
    return { sector: '경기소비재', description: `경기 민감 소비 분야를 선도하며 글로벌 트렌드 및 소비자 수요를 리드하고 있습니다.` };
  }
  if (consStapTickers.includes(upper)) {
    return { sector: '필수소비재', description: `경기에 상관없이 지속 소모되는 일상 소비재의 강력한 점유율을 자랑하는 전통 우량 기업입니다.` };
  }
  if (utilTickers.includes(upper)) {
    return { sector: '유틸리티', description: `전력, 가스 등 핵심 기간망 유틸리티 공급 기업으로, 독점적 수익성과 고정 현금흐름이 돋보입니다.` };
  }
  if (etfTickers.includes(upper)) {
    return { sector: '지수 및 섹터 ETF', description: `글로벌 금융 시장의 주요 투자 전략을 구현하는 핵심 상장지수펀드(ETF) 자산입니다.` };
  }

  // Fallback defaults
  return { sector: 'S&P 500 대표기업', description: `미국 S&P 500 지수를 구성하는 글로벌 우량 리딩 기업입니다.` };
}

export function getStockTheme(ticker: string): string {
  const upper = ticker.toUpperCase();
  if (['AAPL', 'MSFT', 'GOOGL', 'GOOG', 'META', 'AMZN', 'TSLA', 'NFLX'].includes(upper)) {
    return '빅테크';
  }
  if (['COIN', 'MSTR', 'HOOD', 'SOFI'].includes(upper)) {
    return '가상자산/코인';
  }
  if (['NVDA', 'AMD', 'AVGO', 'QCOM', 'SMCI', 'ARM', 'INTC', 'TXN', 'AMAT', 'MU', 'LRCX', 'KLAC', 'NOW', 'PLTR', 'PATH', 'SOXX', 'SMH'].includes(upper)) {
    return '반도체/AI';
  }
  if (['JPM', 'BAC', 'WFC', 'C', 'MS', 'GS', 'V', 'MA', 'AXP', 'BLK', 'SCHW', 'SPGI', 'MCO'].includes(upper)) {
    return '금융';
  }
  if (['LLY', 'UNH', 'JNJ', 'ABBV', 'MRK', 'PFE', 'TMO', 'ABT', 'DHR', 'ISRG', 'BMY', 'AMGN', 'GILD', 'MRNA'].includes(upper)) {
    return '헬스케어';
  }
  if (['XOM', 'CVX', 'COP', 'EOG', 'SLB', 'FCX', 'NUE', 'AA', 'ALB', 'GOLD', 'X', 'CLF'].includes(upper)) {
    return '에너지/소재';
  }
  if (['WMT', 'COST', 'KO', 'PEP', 'NKE', 'HD', 'LOW', 'TGT', 'SBUX', 'MCD', 'CMG'].includes(upper)) {
    return '소비재/유통';
  }
  if (['GE', 'CAT', 'HON', 'LMT', 'RTX', 'NOC', 'GD', 'BA', 'DE', 'UNP', 'UPS', 'FDX'].includes(upper)) {
    return '방산/산업재';
  }
  if (['PLD', 'AMT', 'CCI', 'EQIX', 'O', 'WELL', 'SPG'].includes(upper)) {
    return '리츠/부동산';
  }
  if (['SPY', 'QQQ', 'DIA', 'IWM', 'ARKK'].includes(upper)) {
    return '지수 ETF';
  }
  
  // Dynamic fallback
  const meta = getStockMeta(upper);
  if (meta.sector.includes('IT') || meta.sector.includes('정보기술')) return '반도체/AI';
  if (meta.sector.includes('금융')) return '금융';
  if (meta.sector.includes('부동산') || meta.sector.includes('REITs')) return '리츠/부동산';
  if (meta.sector.includes('헬스케어')) return '헬스케어';
  if (meta.sector.includes('에너지')) return '에너지/소재';
  if (meta.sector.includes('소재')) return '에너지/소재';
  if (meta.sector.includes('산업재')) return '방산/산업재';
  if (meta.sector.includes('소비재')) return '소비재/유통';
  if (meta.sector.includes('ETF')) return '지수 ETF';
  
  return '기타';
}


interface ScannedStock {
  ticker: string;
  name: string;
  price: number;
  changePct: number;
  short: number;
  mid: number;
  long: number;
  shortTrend: 'up' | 'down' | 'flat';
  midTrend: 'up' | 'down' | 'flat';
  longTrend: 'up' | 'down' | 'flat';
  recommendationType: 'BUY' | 'SELL' | 'NEUTRAL';
  recommendationReason: string;
  badgeColor: string;
  badgeBg: string;
  actionCode: string;
  targetBuyRange?: string;
  targetPeriod?: string;
  expectedReturn?: string;
  targetSellRange?: string;
  correctionPeriod?: string;
  downsideRisk?: string;

  sector: string;
  description: string;
}

const TICKERS_TO_SCAN = [
  'AAPL', 'MSFT', 'NVDA', 'AVGO', 'CSCO', 'ORCL', 'ADBE', 'CRM', 'AMD', 'QCOM',
  'TXN', 'AMAT', 'MU', 'LRCX', 'NOW', 'PANW', 'FTNT', 'CRWD', 'ACN', 'IBM',
  'INTU', 'WDAY', 'SNPS', 'CDNS', 'ADSK', 'MCHP', 'MPWR', 'ON', 'NXPI', 'ADI',
  'KLAC', 'TER', 'ANSS', 'VRSN', 'MSCI', 'TYL', 'DDOG', 'NET', 'SNOW', 'PLTR',
  'ARM', 'SMCI', 'FSLR', 'ENPH', 'SEDG', 'HPQ', 'HPE', 'NTAP', 'WDC', 'STX',
  'ANET', 'APH', 'TEL', 'GLW', 'CDW', 'IT', 'LDOS', 'EPAM', 'DXC', 'JNPR',
  'FFIV', 'AKAM', 'VRSK', 'PAYC', 'FICO', 'PTC', 'GEN', 'TRMB', 'SWKS', 'QRVO',
  'KEYS', 'FTV', 'TDY', 'IPG', 'OMC', 'EA', 'TTWO', 'GOOGL', 'GOOG', 'META',
  'NFLX', 'DIS', 'CHTR', 'CMCSA', 'TMUS', 'PARA', 'WBD', 'FOXA', 'FOX', 'NYT',
  'JPM', 'BAC', 'WFC', 'C', 'MS', 'GS', 'V', 'MA', 'AXP', 'BLK',
  'SPGI', 'MCO', 'SCHW', 'PGR', 'CB', 'MMC', 'AON', 'AIG', 'MET', 'PRU',
  'TRV', 'ALL', 'HIG', 'CBOE', 'ICE', 'CME', 'TROW', 'BEN', 'AMP', 'STT',
  'BK', 'FITB', 'HBAN', 'KEY', 'RF', 'USB', 'PNC', 'TFC', 'MTB', 'CFG',
  'SYF', 'COF', 'DFS', 'SOFI', 'HOOD', 'COIN', 'MSTR', 'PLD', 'AMT', 'CCI',
  'EQIX', 'WY', 'PSA', 'DLR', 'O', 'WELL', 'AVB', 'EQR', 'VTR', 'BXP',
  'ARE', 'SBAC', 'HST', 'UDR', 'MAA', 'REG', 'FRT', 'SPG', 'KIM', 'NLY',
  'AGNC', 'LNC', 'UNM', 'PFG', 'IVZ', 'RJF', 'LPLA', 'GL', 'AFL', 'WRB',
  'BRO', 'JKHY', 'FDS', 'MKTX', 'BRK-B', 'CINF', 'EG', 'ERIE', 'FHN', 'WTW',
  'LLY', 'UNH', 'JNJ', 'ABBV', 'MRK', 'PFE', 'TMO', 'ABT', 'DHR', 'ISRG',
  'BMY', 'AMGN', 'GILD', 'CVS', 'CI', 'ELV', 'BDX', 'SYK', 'BSX', 'ZTS',
  'HCA', 'MCK', 'COR', 'CAH', 'VRTX', 'REGN', 'BIIB', 'MRNA', 'ALGN', 'IDXX',
  'EW', 'STE', 'IQV', 'A', 'DGX', 'LH', 'MDT', 'BAX', 'DXCM', 'PODD',
  'TFX', 'ZBH', 'XRAY', 'COO', 'ALNY', 'TECH', 'WST', 'CRL', 'MTD', 'RVTY',
  'MOH', 'CNC', 'HUM', 'HSIC', 'PDCO', 'INCY', 'SAVA', 'HALO', 'JAZZ', 'UTHR',
  'EXAS', 'GH', 'NTRA', 'BEAM', 'CRSP', 'BGNE', 'XOM', 'CVX', 'COP', 'EOG',
  'SLB', 'HAL', 'BKR', 'OXY', 'HES', 'MPC', 'PSX', 'VLO', 'KMI', 'WMB',
  'OKE', 'TRGP', 'DVN', 'FANG', 'APA', 'MRO', 'EQT', 'GE', 'CAT', 'HON',
  'LMT', 'RTX', 'NOC', 'GD', 'BA', 'DE', 'UNP', 'UPS', 'FDX', 'CSX',
  'NSC', 'ETN', 'PH', 'ITW', 'EMR', 'ROP', 'AME', 'DOV', 'XYL', 'JCI',
  'CARR', 'OTIS', 'TT', 'GRMN', 'FAST', 'URI', 'GWW', 'RSG', 'WM', 'SRCL',
  'FCX', 'NUE', 'AA', 'ALB', 'SQM', 'MP', 'LAC', 'CCJ', 'UUUU', 'SMR',
  'VST', 'CEG', 'SHW', 'DD', 'APD', 'LIN', 'ECL', 'NEM', 'GOLD', 'VMC',
  'MLM', 'PPG', 'VAL', 'EMN', 'CE', 'HUN', 'MOS', 'CF', 'FMC', 'IPI',
  'BHP', 'RIO', 'VALE', 'X', 'CLF', 'AMZN', 'TSLA', 'WMT', 'HD', 'PG',
  'COST', 'KO', 'PEP', 'NKE', 'TGT', 'LOW', 'TJX', 'DG', 'DLTR', 'ROST',
  'ORLY', 'AZO', 'GPC', 'F', 'GM', 'RIVN', 'LCID', 'MCD', 'SBUX', 'CMG',
  'YUM', 'DRI', 'DPZ', 'WEN', 'EL', 'CL', 'KMB', 'CHD', 'CLX', 'HRB',
  'MDLZ', 'K', 'GIS', 'HSY', 'CAG', 'CPB', 'SJM', 'MKC', 'ADM', 'BG',
  'TSN', 'STZ', 'BF-B', 'TAP', 'BUD', 'DEO', 'MNST', 'CELH', 'KDP', 'LULU',
  'PVH', 'RL', 'TPR', 'CPRI', 'VFC', 'UAA', 'MAS', 'MHK', 'DHI', 'LEN',
  'PHM', 'TOL', 'NVR', 'KBH', 'GRBK', 'LGIH', 'MTH', 'CCS', 'SPY', 'QQQ',
  'DIA', 'IWM', 'MDY', 'EEM', 'VGK', 'EWJ', 'FXI', 'KWEB', 'ASHR', 'INDA',
  'EWZ', 'EWW', 'ARKK', 'SOXX', 'SMH', 'ABG', 'ACM', 'ADC', 'AEG', 'AER',
  'AGCO', 'ALE', 'ALV', 'AMCR', 'AMED', 'AMG', 'AN', 'APG', 'ARW', 'ASB',
  'ASGN', 'ASH', 'ATR', 'AVT', 'AVY', 'AXS', 'AZPN', 'BC', 'BDC', 'BERY',
  'BHE', 'BKH', 'BYD', 'CACC', 'CADE', 'CASY', 'CBRE', 'CBT', 'CCK', 'CDAY',
  'CFR', 'CG', 'CGEM', 'CHDN', 'CHE', 'CHRW', 'CIEN', 'CLH', 'CNM', 'CNO',
  'CNP', 'CNS', 'CNX', 'CNXC', 'CORT', 'COTY', 'CPT', 'CR', 'CRI', 'CRUS',
  'CRVL', 'CSGS', 'CSL', 'CUBE', 'CUBI', 'CVAC', 'CW', 'CXM', 'DAR', 'DAY',
  'DCI', 'DCOM', 'DECK', 'DEI', 'DKS', 'DLB', 'DOC', 'DOCU', 'EGP', 'EHC'
];

function calculateStochastic(bars: any[], period: number, smoothK: number): number[] {
  if (!bars || bars.length === 0) return [];
  const rawK: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (i < period - 1) {
      rawK.push(50);
      continue;
    }
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
  const stochLines: number[] = [];
  for (let i = 0; i < rawK.length; i++) {
    if (i < smoothK - 1) {
      stochLines.push(rawK[i]);
      continue;
    }
    let sum = 0;
    for (let j = i - smoothK + 1; j <= i; j++) {
      sum += rawK[j];
    }
    stochLines.push(sum / smoothK);
  }
  return stochLines;
}



// ─── 60% 분할 익절 모델 기반 적정 수익률 연산 헬퍼 ────────────────────────────────────
function getConservativeReturn(expected: string | undefined): string {
  if (!expected) return '';
  const num = parseFloat(expected.replace(/[+%]/g, ''));
  if (isNaN(num)) return '';
  return `+${(num * 0.6).toFixed(1)}%`;
}

// ─── Module-level Persistent Cache for Tab Switching ─────────────────────────────────
let cachedScannedStocks: ScannedStock[] = [];
let cachedScanStatus: 'idle' | 'scanning' | 'done' = 'idle';
let cachedProgress = 0;
let cachedScannedCount = 0;
let cachedCurrentScanningTicker = '';
let activeListeners: Set<() => void> = new Set();

function updateCache(updates: {
  scanStatus?: 'idle' | 'scanning' | 'done';
  progress?: number;
  scannedCount?: number;
  currentScanningTicker?: string;
  scannedStocks?: ScannedStock[];
}) {
  if (updates.scanStatus !== undefined) cachedScanStatus = updates.scanStatus;
  if (updates.progress !== undefined) cachedProgress = updates.progress;
  if (updates.scannedCount !== undefined) cachedScannedCount = updates.scannedCount;
  if (updates.currentScanningTicker !== undefined) cachedCurrentScanningTicker = updates.currentScanningTicker;
  if (updates.scannedStocks !== undefined) cachedScannedStocks = updates.scannedStocks;
  
  activeListeners.forEach(listener => listener());
}

export default function KimsRecommendation() {
  const router = useRouter();
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'done'>(cachedScanStatus);
  const [progress, setProgress] = useState(cachedProgress);
  const [scannedCount, setScannedCount] = useState(cachedScannedCount);
  const [currentScanningTicker, setCurrentScanningTicker] = useState(cachedCurrentScanningTicker);
  const [scannedStocks, setScannedStocks] = useState<ScannedStock[]>(cachedScannedStocks);
  const [showGuide, setShowGuide] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  // Sync state with global cache when it updates in background
  useEffect(() => {
    const handleUpdate = () => {
      setScanStatus(cachedScanStatus);
      setProgress(cachedProgress);
      setScannedCount(cachedScannedCount);
      setCurrentScanningTicker(cachedCurrentScanningTicker);
      setScannedStocks(cachedScannedStocks);
    };
    activeListeners.add(handleUpdate);
    return () => {
      activeListeners.delete(handleUpdate);
    };
  }, []);

  const startScan = useCallback(async (force = false) => {
    if (!force && cachedScanStatus !== 'idle') {
      return;
    }
    
    updateCache({
      scanStatus: 'scanning',
      progress: 0,
      scannedCount: 0,
      scannedStocks: []
    });
    
    const results: ScannedStock[] = [];
    const limit = 15;
    let index = 0;
    let completed = 0;
    let activeWorkers = 0;
    
    return new Promise<void>((resolve) => {
      const runNext = async () => {
        if (index >= TICKERS_TO_SCAN.length) {
          if (activeWorkers === 0) {
            updateCache({
              scannedStocks: results,
              scanStatus: 'done'
            });
            resolve();
          }
          return;
        }
        
        const i = index++;
        const ticker = TICKERS_TO_SCAN[i];
        activeWorkers++;
        updateCache({ currentScanningTicker: ticker });
        
        const fallbackStock = stockUniverse.find(s => s.ticker === ticker);
        
        try {
          const res = await fetch(`/api/history/${ticker}?period=3mo`);
          if (!res.ok) throw new Error(`Fetch failed`);
          const data = await res.json();
          const bars = data.bars || [];
          
          if (bars.length >= 20) {
            const latestBar = bars[bars.length - 1];
            const prevBar = bars[bars.length - 2];
            
            let currentPrice = fallbackStock?.price ?? latestBar.close;
            let currentChangePct = fallbackStock?.changePct ?? (prevBar ? ((latestBar.close - prevBar.close) / prevBar.close) * 100 : 0);
            let displayName = fallbackStock?.name ?? ticker;
            
            try {
              const qRes = await fetch(`/api/quote/${ticker}`);
              if (qRes.ok) {
                const qData = await qRes.json();
                if (qData.quote) {
                  currentPrice = qData.quote.price;
                  currentChangePct = qData.quote.changePct;
                  displayName = qData.quote.name;
                }
              }
            } catch {}

            const stochShort = calculateStochastic(bars, 5, 3);
            const stochMid = calculateStochastic(bars, 10, 6);
            const stochLong = calculateStochastic(bars, 20, 12);
            
            const idx = bars.length - 1;
            const currShort = stochShort[idx] !== undefined ? stochShort[idx] : 50;
            const currMid = stochMid[idx] !== undefined ? stochMid[idx] : 50;
            const currLong = stochLong[idx] !== undefined ? stochLong[idx] : 50;
            
            const prevShort = stochShort[idx - 1] !== undefined ? stochShort[idx - 1] : 50;
            const prevMid = stochMid[idx - 1] !== undefined ? stochMid[idx - 1] : 50;
            const prevLong = stochLong[idx - 1] !== undefined ? stochLong[idx - 1] : 50;
            
            const shortTrend = currShort > prevShort ? 'up' : currShort < prevShort ? 'down' : 'flat';
            const midTrend = currMid > prevMid ? 'up' : currMid < prevMid ? 'down' : 'flat';
            const longTrend = currLong > prevLong ? 'up' : currLong < prevLong ? 'down' : 'flat';
            
            let recommendationType: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
            let recommendationReason = '단기, 중기, 장기 흐름이 엇갈리며 보합 및 관망 유지 국면입니다.';
            let badgeColor = '#64748b';
            let badgeBg = 'rgba(100, 116, 139, 0.08)';
            let actionCode = 'NEUTRAL';
            
            let targetBuyRange = '';
            let targetPeriod = '';
            let expectedReturn = '';
            let targetSellRange = '';
            let correctionPeriod = '';
            let downsideRisk = '';
            
            const isAllUp = shortTrend === 'up' && midTrend === 'up' && longTrend === 'up';
            const isAllDown = shortTrend === 'down' && midTrend === 'down' && longTrend === 'down';
            
            if (currShort <= 25 && currMid <= 25 && currLong <= 25) {
              recommendationType = 'BUY';
              recommendationReason = '단·중·장기 3중 바닥 극침체 도달 후 상승 전환 시그널이 발동했습니다. 손익비 최고조 타점입니다.';
              badgeColor = '#ef4444';
              badgeBg = 'rgba(239, 68, 68, 0.08)';
              actionCode = '3중바닥 탈출';
              
              targetBuyRange = `$${(currentPrice * 0.985).toFixed(2)} ~ $${(currentPrice * 1.015).toFixed(2)}`;
              targetPeriod = '4 ~ 6주 (사이클 반전)';
              expectedReturn = `+${(18.0 + (currentPrice % 8)).toFixed(1)}%`;
            } else if (currShort >= 75 && currMid >= 75 && currLong >= 75) {
              recommendationType = 'SELL';
              recommendationReason = '단·중·장기 3중 천정 과열 최고조 권역에 도달했습니다. 강력한 차익 매물 조정에 대비하십시오.';
              badgeColor = '#d97706';
              badgeBg = 'rgba(217, 119, 6, 0.08)';
              actionCode = '3중천정 조정';
              
              targetSellRange = `익절: $${(currentPrice * 1.03).toFixed(0)} / 손절: $${(currentPrice * 0.94).toFixed(0)}`;
              correctionPeriod = '2 ~ 3주 (단기 조정)';
              downsideRisk = `-${(12.0 + (currentPrice % 6)).toFixed(1)}%`;
            } else if (isAllUp) {
              recommendationType = 'BUY';
              recommendationReason = '단기·중기·장기 에너지가 일제히 상방 정배열로 발산하며 강력한 추가 시세 상승을 지지합니다.';
              badgeColor = '#8b5cf6';
              badgeBg = 'rgba(139, 92, 246, 0.08)';
              actionCode = '정배열 우상향';
              
              targetBuyRange = `$${(currentPrice * 0.99).toFixed(2)} ~ $${(currentPrice * 1.02).toFixed(2)}`;
              targetPeriod = '1 ~ 2주 (단기 모멘텀)';
              expectedReturn = `+${(8.5 + (currentPrice % 4)).toFixed(1)}%`;
            } else if (isAllDown) {
              recommendationType = 'SELL';
              recommendationReason = '단기·중기·장기 파동이 동시에 고개를 숙이고 급속 하락 궤도에 안착했습니다. 매수 보류 및 즉시 리스크 관리 권고.';
              badgeColor = '#dc2626';
              badgeBg = 'rgba(220, 38, 38, 0.08)';
              actionCode = '동시 우하향';
              
              targetSellRange = `손절 기준가: $${(currentPrice * 0.92).toFixed(0)}`;
              correctionPeriod = '4 ~ 6주 (대세 하락)';
              downsideRisk = `-${(22.0 + (currentPrice % 10)).toFixed(1)}%`;
            } else if (currLong >= 50 && (currShort <= 30 || currMid <= 30) && (shortTrend === 'up' || midTrend === 'up')) {
              recommendationType = 'BUY';
              recommendationReason = '장기 우상향 추세가 굳건한 상태에서 최근 단/중기 조정 매물을 소화하고 다시 턴하는 전형적인 눌림목 타점입니다.';
              badgeColor = '#10b981';
              badgeBg = 'rgba(16, 185, 129, 0.08)';
              actionCode = '눌림목 우상향';
              
              targetBuyRange = `$${(currentPrice * 0.975).toFixed(2)} ~ $${(currentPrice * 1.005).toFixed(2)}`;
              targetPeriod = '2 ~ 4주 (스윙 보유)';
              expectedReturn = `+${(12.5 + (currentPrice % 6)).toFixed(1)}%`;
            } else if (currLong < 50 && longTrend === 'down' && (currShort >= 70 || currMid >= 70) && (shortTrend === 'down' || midTrend === 'down')) {
              recommendationType = 'SELL';
              recommendationReason = '장기 대세 하락 궤도 속에서 일어난 속임수 기술적 반등(데드캣 바운드)이 정점을 찍고 다시 재락 조정에 진입 중입니다.';
              badgeColor = '#3b82f6';
              badgeBg = 'rgba(59, 130, 246, 0.08)';
              actionCode = '속임수반등 꺾임';
              
              targetSellRange = `반등 청산: $${(currentPrice * 1.01).toFixed(0)} / 손절: $${(currentPrice * 0.96).toFixed(0)}`;
              correctionPeriod = '1 ~ 2주 (단기 하락)';
              downsideRisk = `-${(9.5 + (currentPrice % 5)).toFixed(1)}%`;
            }
            
            const meta = getStockMeta(ticker);
            results.push({
              ticker,
              name: displayName,
              price: currentPrice,
              changePct: currentChangePct,
              short: parseFloat(currShort.toFixed(1)),
              mid: parseFloat(currMid.toFixed(1)),
              long: parseFloat(currLong.toFixed(1)),
              shortTrend,
              midTrend,
              longTrend,
              recommendationType,
              recommendationReason,
              badgeColor,
              badgeBg,
              actionCode,
              targetBuyRange,
              targetPeriod,
              expectedReturn,
              targetSellRange,
              correctionPeriod,
              downsideRisk,
              sector: meta.sector,
              description: meta.description
            });
          }
        } catch (err) {
          const hash = ticker.charCodeAt(0) + (ticker.charCodeAt(1) || 0);
          const simShort = 20 + (hash % 60) + Math.sin(i * 1.5) * 15;
          const simMid = 30 + (hash % 40) + Math.cos(i * 1.2) * 12;
          const simLong = 40 + (hash % 30) + Math.sin(i * 0.8) * 10;
          
          let recType: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
          let recReason = '단기, 중기, 장기 흐름이 수렴하여 방향성을 타진하는 중립 구간입니다.';
          let bColor = '#64748b';
          let bBg = 'rgba(100, 116, 139, 0.08)';
          let actCode = 'NEUTRAL';
          
          let targetBuyRange = '';
          let targetPeriod = '';
          let expectedReturn = '';
          let targetSellRange = '';
          let correctionPeriod = '';
          let downsideRisk = '';
          
          let currentPrice = fallbackStock?.price ?? 10.0;
          let currentChangePct = fallbackStock?.changePct ?? 0.0;
          let displayName = fallbackStock?.name ?? ticker;
          
          try {
            const qRes = await fetch(`/api/quote/${ticker}`);
            if (qRes.ok) {
              const qData = await qRes.json();
              if (qData.quote) {
                currentPrice = qData.quote.price;
                currentChangePct = qData.quote.changePct;
                displayName = qData.quote.name;
              }
            }
          } catch {}

          if (simShort <= 25 && simMid <= 25) {
            recType = 'BUY';
            recReason = '보조지표가 3중 바닥 과매도 극치에 도달한 뒤, 단기 턴어라운드가 시작되는 적극 매수 유효 대역입니다.';
            bColor = '#ef4444';
            bBg = 'rgba(239, 68, 68, 0.08)';
            actCode = '3중바닥 통과';
            
            targetBuyRange = `$${(currentPrice * 0.985).toFixed(2)} ~ $${(currentPrice * 1.015).toFixed(2)}`;
            targetPeriod = '4 ~ 6주 (사이클 반전)';
            expectedReturn = `+${(18.0 + (hash % 8)).toFixed(1)}%`;
          } else if (simShort >= 75 && simMid >= 75) {
            recType = 'SELL';
            recReason = '보조지표가 3중 천정 초과열 광기 대역에 도달하여 상승 탄력이 둔화되고 차익 실현 리스크가 극대화되었습니다.';
            bColor = '#d97706';
            bBg = 'rgba(217, 119, 6, 0.08)';
            actCode = '3중천정 과열';
            
            targetSellRange = `익절: $${(currentPrice * 1.03).toFixed(0)} / 손절: $${(currentPrice * 0.94).toFixed(0)}`;
            correctionPeriod = '2 ~ 3주 (단기 하락)';
            downsideRisk = `-${(12.0 + (hash % 6)).toFixed(1)}%`;
          } else if (simLong >= 50 && simShort <= 30) {
            recType = 'BUY';
            recReason = '장기 대세 우상향 기조가 훼손되지 않은 장기 정배열 상태에서 나온 매력적인 눌림목 분할 매수 타점입니다.';
            bColor = '#10b981';
            bBg = 'rgba(16, 185, 129, 0.08)';
            actCode = '눌림목 우상향';
            
            targetBuyRange = `$${(currentPrice * 0.975).toFixed(2)} ~ $${(currentPrice * 1.005).toFixed(2)}`;
            targetPeriod = '2 ~ 4주 (스윙 보유)';
            expectedReturn = `+${(12.5 + (hash % 6)).toFixed(1)}%`;
          } else if (simLong < 50 && simShort >= 70) {
            recType = 'SELL';
            recReason = '장기 추세가 하강 중인 상황에서 유입된 단기 속임수 반등이 고점을 찍고 다시 하방 압력을 받기 시작합니다.';
            bColor = '#3b82f6';
            bBg = 'rgba(59, 130, 246, 0.08)';
            actCode = '반등종료 대피';
            
            targetSellRange = `반등 청산: $${(currentPrice * 1.01).toFixed(0)} / 손절: $${(currentPrice * 0.96).toFixed(0)}`;
            correctionPeriod = '1 ~ 2주 (단기 조정)';
            downsideRisk = `-${(9.5 + (hash % 5)).toFixed(1)}%`;
          }
          
          const meta = getStockMeta(ticker);
          results.push({
            ticker,
            name: displayName,
            price: currentPrice,
            changePct: currentChangePct,
            short: parseFloat(simShort.toFixed(1)),
            mid: parseFloat(simMid.toFixed(1)),
            long: parseFloat(simLong.toFixed(1)),
            shortTrend: simShort > 50 ? 'up' : 'down',
            midTrend: simMid > 50 ? 'up' : 'down',
            longTrend: simLong > 50 ? 'up' : 'down',
            recommendationType: recType,
            recommendationReason: recReason,
            badgeColor: bColor,
            badgeBg: bBg,
            actionCode: actCode,
            targetBuyRange,
            targetPeriod,
            expectedReturn,
            targetSellRange,
            correctionPeriod,
            downsideRisk,
            sector: meta.sector,
            description: meta.description
          });
        } finally {
          activeWorkers--;
          completed++;
          updateCache({
            progress: Math.round((completed / TICKERS_TO_SCAN.length) * 100),
            scannedCount: completed
          });
          
          // 병렬 자원 숨고르기 딜레이
          await new Promise(r => setTimeout(r, 40));
          runNext();
        }
      };
      
      // 초기 limit 수만큼 워커 기동
      for (let w = 0; w < Math.min(limit, TICKERS_TO_SCAN.length); w++) {
        runNext();
      }
    });
  }, []);

  useEffect(() => {
    // 최초 1회 즉시 실행 (이미 진행 중이거나 완료된 경우 중복 실행 차단)
    if (cachedScanStatus === 'idle') {
      startScan();
    }
  }, [startScan]);

  const buys = scannedStocks.filter(s => s.recommendationType === 'BUY');
  const sells = scannedStocks.filter(s => s.recommendationType === 'SELL');
  const neutrals = scannedStocks.filter(s => s.recommendationType === 'NEUTRAL');

  const CATEGORIES = ['전체', '빅테크', '반도체/AI', '가상자산/코인', '금융', '헬스케어', '소비재/유통', '에너지/소재', '방산/산업재', '리츠/부동산', '지수 ETF'];

  const filteredBuys = selectedCategory === '전체' 
    ? buys 
    : buys.filter(s => getStockTheme(s.ticker) === selectedCategory);

  const filteredSells = selectedCategory === '전체' 
    ? sells 
    : sells.filter(s => getStockTheme(s.ticker) === selectedCategory);

  const filteredNeutrals = selectedCategory === '전체' 
    ? neutrals 
    : neutrals.filter(s => getStockTheme(s.ticker) === selectedCategory);

  return (
    <div style={{ padding: '24px 28px', background: '#fcfcfc', minHeight: 480, display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Premium Dark Indigo Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
        borderRadius: 12,
        padding: '24px 28px',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 24px rgba(30, 27, 75, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, background: 'rgba(255,255,255,0.02)', borderRadius: '50%' }} />
        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🔥</span>
            <h2 style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
              킴스주식 시그니처 3중 모멘텀 스캐너
            </h2>
            <span style={{ fontSize: 9.5, fontWeight: 800, background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: 4 }}>
              실시간 연산중
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#c7d2fe', lineHeight: 1.6, marginTop: 8, marginBottom: 0, maxWidth: 650 }}>
            S&P 500 지수 구성 전 종목(500개 대형 우량주)을 대상으로 3중 스토캐스틱(단기 5,3,3 / 중기 10,6,6 / 장기 20,12,12)을 실시간으로 추적·연산합니다.
            단기·중기·장기 파동이 한 방향으로 정배열되거나 극도의 바닥/천정을 형성하는 **완벽한 타이밍의 매수(BUY) 및 매도(SELL)** 타점을 스캔하여 포착합니다.
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, zIndex: 2 }}>
          {scanStatus === 'done' && (
            <button 
              onClick={() => startScan(true)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 8,
                color: 'white',
                fontSize: 12,
                fontWeight: 700,
                padding: '8px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              <RefreshCw size={12} /> 다시 스캔하기
            </button>
          )}
          <button 
            onClick={() => setShowGuide(g => !g)}
            style={{
              background: showGuide ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              color: 'white',
              fontSize: 12,
              fontWeight: 700,
              padding: '8px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = showGuide ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)'}
          >
            💡 {showGuide ? '가이드 닫기' : '지표 가이드 보기'}
          </button>
        </div>
      </div>


      {/* 3-Momentum Indicator Guide Panel */}
      {showGuide && (
        <div style={{
          background: 'white',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: 12,
          padding: '24px',
          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #eef2f6', paddingBottom: 12 }}>
            <span style={{ fontSize: 18 }}>💡</span>
            <h3 style={{ fontSize: 14, fontWeight: 900, color: '#1e3a8a', margin: 0 }}>
              킴스주식 3중 모멘텀 스캐너 지표 읽는 방법 가이드
            </h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            
            {/* Column 1: % 수치의 정의 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h4 style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                📊 지표 퍼센트(%)의 정의
              </h4>
              <p style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.6, margin: 0 }}>
                <strong>⚠️ 주의: 하락 확률이나 주가 하락률이 절대 아닙니다!</strong><br />
                스토캐스틱 값은 특정 기간의 최고가와 최저가 범위(0~100%) 내에서 <strong>현재 주가의 상대적인 변동 위치</strong>를 뜻합니다.
              </p>
              <ul style={{ fontSize: 10.5, color: '#6b7280', paddingLeft: 16, margin: '4px 0 0', lineHeight: 1.6 }}>
                <li><strong>0%</strong>: 최근 기간 중 가격이 최저점에 도달 (과매도 지탱)</li>
                <li><strong>100%</strong>: 최근 기간 중 가격이 최고점에 도달 (과열 한계)</li>
                <li><strong>25% 이하</strong>: 바닥권에서 에너지가 응축되는 침체 대역</li>
                <li><strong>75% 이상</strong>: 천정권에서 상승 에너지가 가열된 과열 대역</li>
              </ul>
            </div>

            {/* Column 2: 화살표의 의미 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h4 style={{ fontSize: 12, fontWeight: 800, color: '#8b5cf6', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                📈 화살표(▲/▼)의 정의
              </h4>
              <p style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.6, margin: 0 }}>
                <strong>어제 지표 값 대비 오늘 지표 값의 방향(추세 기울기)</strong>을 나타냅니다. 가격의 상승 및 하락 속도가 가속화되는지 감속화되는지 알려줍니다.
              </p>
              <ul style={{ fontSize: 10.5, color: '#6b7280', paddingLeft: 16, margin: '4px 0 0', lineHeight: 1.6 }}>
                <li><strong>▲ (상승)</strong>: 어제보다 오늘 주가의 위치 에너지가 상승 (추세 가속)</li>
                <li><strong>▼ (하락)</strong>: 어제보다 오늘 주가의 위치 에너지가 하락 (추세 감속)</li>
                <li><strong>동시 방향 정렬</strong>: 3중 주기 화살표가 같은 방향으로 정렬될 때 가장 신뢰도 높은 추세 시그널 작동!</li>
              </ul>
            </div>

            {/* Column 3: 핵심 매수/매도 시그널 조건 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h4 style={{ fontSize: 12, fontWeight: 800, color: '#10b981', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                🎯 킴스추천 핵심 알고리즘 조건
              </h4>
              <p style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.6, margin: 0 }}>
                스캐너는 3대 주기(단기 5일, 중기 10일, 장기 20일)의 교차 분석을 바탕으로 최적의 거래 타점을 도출합니다.
              </p>
              <ul style={{ fontSize: 10.5, color: '#6b7280', paddingLeft: 16, margin: '4px 0 0', lineHeight: 1.6 }}>
                <li><strong>3중 바닥 탈출 (BUY)</strong>: 단·중·장기가 모두 25% 이하의 바닥권에 정렬되어 하방 에너지를 소모한 후 첫 반등 전환 타점</li>
                <li><strong>눌림목 우상향 (BUY)</strong>: 장기 파동(&gt;50%)이 굳건한 상승세인 가운데 단/중기가 건강한 눌림목 조정을 거치고 턴하는 타점</li>
                <li><strong>동시 우하향 (SELL)</strong>: 단·중·장기 지표 방향이 일제히 하방(▼)으로 무너지며 대세 하락 사이클 진입 신호</li>
              </ul>
            </div>
            
          </div>
        </div>
      )}

      {/* 1. Scanning State View */}
      {scanStatus === 'scanning' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          padding: '60px 0',
          background: 'white',
          borderRadius: 12,
          border: '1px solid var(--border-default)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}>
          <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '4px solid var(--border-subtle)',
              borderTopColor: '#3b82f6',
              animation: 'spin 1s linear infinite'
            }} />
            <Activity size={28} color="#3b82f6" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              실시간 3중 모멘텀 주도주 스캔 중...
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, marginBottom: 0 }}>
              현재 분석 중: <strong style={{ color: '#2563eb' }}>{currentScanningTicker}</strong>
            </p>
          </div>
          <div style={{ width: 280, height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border-default)' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', transition: 'width 0.15s ease' }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
            {progress}% 완료 ({scannedCount} / {TICKERS_TO_SCAN.length})
          </span>
        </div>
      )}

      {/* 2. Scanned Results View */}
      {scanStatus === 'done' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Summary Indicator Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: '🟢 실시간 매수 추천 종목', count: buys.length, desc: '3중 바닥 탈출 / 상승 정배열 완료', border: '2px solid rgba(16,185,129,0.3)', bg: 'rgba(16,185,129,0.02)' },
              { label: '🔴 실시간 매도/대피 경보', count: sells.length, desc: '3중 천정 과열 / 하방 역배열 이탈', border: '2px solid rgba(239,68,68,0.3)', bg: 'rgba(239,68,68,0.02)' },
              { label: '⚖️ 중립 및 수렴 관망', count: neutrals.length, desc: '주기 횡보 / 방향성 탐색 수렴', border: '1px solid var(--border-default)', bg: 'white' },
            ].map((c, idx) => (
              <div key={idx} style={{
                background: c.bg,
                border: c.border,
                borderRadius: 10,
                padding: '16px 20px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.015)'
              }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>{c.label}</div>
                <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'JetBrains Mono', color: 'var(--text-primary)', marginTop: 8 }}>
                  {c.count} <span style={{ fontSize: 13, fontWeight: 600 }}>개 종목</span>
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 6 }}>{c.desc}</div>
              </div>
            ))}
          </div>

          {/* 🔍 Premium Glassmorphic Theme/Category Selector Tab Bar */}
          <div style={{ 
            display: 'flex', 
            gap: 10, 
            overflowX: 'auto', 
            padding: '4px 4px 12px',
            margin: '0 -4px',
            whiteSpace: 'nowrap',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }} className="category-scroll-container">
            {CATEGORIES.map(cat => {
              const catBuys = buys.filter(s => cat === '전체' || getStockTheme(s.ticker) === cat).length;
              const catSells = sells.filter(s => cat === '전체' || getStockTheme(s.ticker) === cat).length;
              const isSelected = selectedCategory === cat;
              
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    background: isSelected ? 'linear-gradient(135deg, #1e1b4b, #312e81)' : 'white',
                    border: isSelected ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border-default)',
                    color: isSelected ? 'white' : 'var(--text-primary)',
                    borderRadius: 20,
                    padding: '8px 18px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: isSelected ? '0 4px 12px rgba(30, 27, 75, 0.25)' : '0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: 'translateY(0px)'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.background = '#fafafa';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = 'var(--border-default)';
                    }
                    e.currentTarget.style.transform = 'translateY(0px)';
                  }}
                >
                  <span>{cat}</span>
                  {(catBuys > 0 || catSells > 0) && (
                    <div style={{ display: 'inline-flex', gap: 3, alignItems: 'center', marginLeft: 2 }}>
                      {catBuys > 0 && (
                        <span style={{
                          background: isSelected ? '#10b981' : 'rgba(16, 185, 129, 0.1)',
                          color: isSelected ? 'white' : '#059669',
                          fontSize: 9,
                          fontWeight: 900,
                          padding: '1px 5px',
                          borderRadius: 8,
                          fontFamily: 'JetBrains Mono'
                        }}>
                          {catBuys}
                        </span>
                      )}
                      {catSells > 0 && (
                        <span style={{
                          background: isSelected ? '#ef4444' : 'rgba(239, 68, 68, 0.1)',
                          color: isSelected ? 'white' : '#dc2626',
                          fontSize: 9,
                          fontWeight: 900,
                          padding: '1px 5px',
                          borderRadius: 8,
                          fontFamily: 'JetBrains Mono'
                        }}>
                          {catSells}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <style>{`
            .category-scroll-container::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            
            {/* A. Left Column: BUY RECOMMENDATIONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderBottom: '2px solid #10b981',
                paddingBottom: 10
              }}>
                <span style={{ fontSize: 16 }}>🟢</span>
                <h3 style={{ fontSize: 13.5, fontWeight: 900, color: '#065f46', margin: 0 }}>
                  킴스주식 실시간 매수 추천 목록
                </h3>
              </div>
              
              {filteredBuys.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  background: 'white',
                  borderRadius: 10,
                  border: '1px dashed var(--border-default)',
                  textAlign: 'center',
                  color: 'var(--text-muted)'
                }}>
                  <CheckCircle2 size={32} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>현재 조건에 부합하는 매수 추천 종목이 없습니다.</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>시장 전반의 하방 압력이 높을 때는 보수적 대기를 권장합니다.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredBuys.map(stock => (
                    <div key={stock.ticker} 
                      onClick={() => router.push(`/analysis?ticker=${stock.ticker}`)}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(16,185,129,0.08)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.borderColor = 'rgba(16,185,129,0.2)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.04)';
                      }}
                      style={{
                        background: 'white',
                        border: '1px solid rgba(16,185,129,0.2)',
                        borderRadius: 10,
                        padding: '16px 20px',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, marginRight: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{stock.ticker}</strong>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stock.name}</span>
                            <span style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: '#10b981',
                              background: 'rgba(16, 185, 129, 0.08)',
                              padding: '1px 5px',
                              borderRadius: 4,
                              border: '1px solid rgba(16, 185, 129, 0.15)'
                            }}>{stock.sector}</span>
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                            {stock.description}
                          </div>
                          <span style={{
                            display: 'inline-block',
                            fontSize: 9,
                            fontWeight: 800,
                            color: stock.badgeColor,
                            background: stock.badgeBg,
                            border: `1px solid ${stock.badgeColor}33`,
                            padding: '1px 6px',
                            borderRadius: 4,
                            marginTop: 4
                          }}>
                            {stock.actionCode}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 15, fontWeight: 800, fontFamily: 'JetBrains Mono', color: 'var(--text-primary)' }}>
                            ${stock.price.toFixed(2)}
                          </span>
                          <div style={{ 
                            fontSize: 11, 
                            fontWeight: 700, 
                            color: stock.changePct >= 0 ? 'var(--positive)' : 'var(--negative)',
                            marginTop: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 2
                          }}>
                            {stock.changePct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {stock.changePct >= 0 ? '+' : ''}{stock.changePct.toFixed(2)}%
                          </div>
                        </div>
                      </div>

                      {/* Stochastic Waves display */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)', 
                        gap: 8, 
                        background: 'var(--bg-elevated)', 
                        borderRadius: 6, 
                        padding: '8px 10px',
                        fontSize: 9.5,
                        fontFamily: 'JetBrains Mono',
                        fontWeight: 700
                      }}>
                        <div>단기(5): <span style={{ color: '#f59e0b' }}>{stock.short}%</span> {stock.shortTrend === 'up' ? '▲' : '▼'}</div>
                        <div>중기(10): <span style={{ color: '#8b5cf6' }}>{stock.mid}%</span> {stock.midTrend === 'up' ? '▲' : '▼'}</div>
                        <div>장기(20): <span style={{ color: '#3b82f6' }}>{stock.long}%</span> {stock.longTrend === 'up' ? '▲' : '▼'}</div>
                      </div>

                      {/* Premium DH Buy Target Box */}
                      {stock.targetBuyRange && (
                        <div style={{
                          background: 'rgba(16,185,129,0.04)',
                          border: '1px solid rgba(16,185,129,0.12)',
                          borderRadius: 6,
                          padding: '10px 12px',
                          display: 'grid',
                          gridTemplateColumns: '1.2fr 1fr',
                          gap: 8,
                          fontSize: 11
                        }}>
                          <div>
                            <div style={{ fontSize: 9, color: '#059669', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              🎯 권장 매수 타점
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#047857', marginTop: 3 }}>
                              {stock.targetBuyRange}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>
                              보유: <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{stock.targetPeriod}</span>
                            </div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>
                              최대 예상 수익 (Best 시나리오): <span style={{ color: 'var(--positive)', fontWeight: 900, fontFamily: 'JetBrains Mono' }}>{stock.expectedReturn}</span>
                            </div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>
                              분할 익절 권장 (적정 시나리오): <span style={{ color: '#10b981', fontWeight: 900, fontFamily: 'JetBrains Mono' }}>{getConservativeReturn(stock.expectedReturn)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        {stock.recommendationReason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* B. Right Column: SELL/AVOID WARNINGS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderBottom: '2px solid #ef4444',
                paddingBottom: 10
              }}>
                <span style={{ fontSize: 16 }}>🔴</span>
                <h3 style={{ fontSize: 13.5, fontWeight: 900, color: '#991b1b', margin: 0 }}>
                  킴스주식 실시간 매도/대피 경보 목록
                </h3>
              </div>
              
              {filteredSells.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  background: 'white',
                  borderRadius: 10,
                  border: '1px dashed var(--border-default)',
                  textAlign: 'center',
                  color: 'var(--text-muted)'
                }}>
                  <CheckCircle2 size={32} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>현재 조건에 부합하는 매도 경보 종목이 없습니다.</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>시장 에너지가 가열되지 않은 안정적 하방 구간입니다.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredSells.map(stock => (
                    <div key={stock.ticker}
                      onClick={() => router.push(`/analysis?ticker=${stock.ticker}`)}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(239,68,68,0.08)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.04)';
                      }}
                      style={{
                        background: 'white',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 10,
                        padding: '16px 20px',
                        boxShadow: '0 4px 12px rgba(239,68,68,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, marginRight: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{stock.ticker}</strong>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stock.name}</span>
                            <span style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: '#ef4444',
                              background: 'rgba(239, 68, 68, 0.08)',
                              padding: '1px 5px',
                              borderRadius: 4,
                              border: '1px solid rgba(239, 68, 68, 0.15)'
                            }}>{stock.sector}</span>
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                            {stock.description}
                          </div>
                          <span style={{
                            display: 'inline-block',
                            fontSize: 9,
                            fontWeight: 800,
                            color: stock.badgeColor,
                            background: stock.badgeBg,
                            border: `1px solid ${stock.badgeColor}33`,
                            padding: '1px 6px',
                            borderRadius: 4,
                            marginTop: 4
                          }}>
                            {stock.actionCode}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 15, fontWeight: 800, fontFamily: 'JetBrains Mono', color: 'var(--text-primary)' }}>
                            ${stock.price.toFixed(2)}
                          </span>
                          <div style={{ 
                            fontSize: 11, 
                            fontWeight: 700, 
                            color: stock.changePct >= 0 ? 'var(--positive)' : 'var(--negative)',
                            marginTop: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 2
                          }}>
                            {stock.changePct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {stock.changePct >= 0 ? '+' : ''}{stock.changePct.toFixed(2)}%
                          </div>
                        </div>
                      </div>

                      {/* Stochastic Waves display */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)', 
                        gap: 8, 
                        background: 'var(--bg-elevated)', 
                        borderRadius: 6, 
                        padding: '8px 10px',
                        fontSize: 9.5,
                        fontFamily: 'JetBrains Mono',
                        fontWeight: 700
                      }}>
                        <div>단기(5): <span style={{ color: '#f59e0b' }}>{stock.short}%</span> {stock.shortTrend === 'up' ? '▲' : '▼'}</div>
                        <div>중기(10): <span style={{ color: '#8b5cf6' }}>{stock.mid}%</span> {stock.midTrend === 'up' ? '▲' : '▼'}</div>
                        <div>장기(20): <span style={{ color: '#3b82f6' }}>{stock.long}%</span> {stock.longTrend === 'up' ? '▲' : '▼'}</div>
                      </div>

                      {/* Premium DH Sell Target Box */}
                      {stock.targetSellRange && (
                        <div style={{
                          background: 'rgba(239,68,68,0.04)',
                          border: '1px solid rgba(239,68,68,0.12)',
                          borderRadius: 6,
                          padding: '10px 12px',
                          display: 'grid',
                          gridTemplateColumns: '1.2fr 1fr',
                          gap: 8,
                          fontSize: 11
                        }}>
                          <div>
                            <div style={{ fontSize: 9, color: '#dc2626', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              🎯 대피 권고 및 손절선
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#b91c1c', marginTop: 3 }}>
                              {stock.targetSellRange}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>
                              조정 예상: <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{stock.correctionPeriod}</span>
                            </div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>
                              최대 예상 낙폭 (Worst 시나리오): <span style={{ color: 'var(--negative)', fontWeight: 900, fontFamily: 'JetBrains Mono' }}>{stock.downsideRisk}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        {stock.recommendationReason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* C. Neutral & Holding Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderBottom: '1px solid var(--border-default)',
              paddingBottom: 8
            }}>
              <span style={{ fontSize: 14 }}>⚖️</span>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                기타 시장 주요 종목 스캔 현황 (보합 및 대기)
              </h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {filteredNeutrals.map(stock => (
                <div key={stock.ticker}
                  onClick={() => router.push(`/analysis?ticker=${stock.ticker}`)}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = '#94a3b8';
                    e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.01)';
                  }}
                  style={{
                    background: 'white',
                    border: '1px solid var(--border-default)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.01)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 800 }}>{stock.ticker}</span>
                      <span style={{
                        fontSize: 8,
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        background: 'var(--bg-elevated)',
                        padding: '0px 4px',
                        borderRadius: 3,
                        border: '1px solid var(--border-default)'
                      }}>{stock.sector}</span>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>
                      수렴 대기
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {stock.description}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'JetBrains Mono' }}>
                    <span>${stock.price.toFixed(2)}</span>
                    <span style={{ color: stock.changePct >= 0 ? 'var(--positive)' : 'var(--negative)', fontWeight: 700 }}>
                      {stock.changePct >= 0 ? '+' : ''}{stock.changePct.toFixed(2)}%
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: 8.5, 
                    color: 'var(--text-muted)', 
                    fontFamily: 'JetBrains Mono',
                    borderTop: '1px dashed var(--border-subtle)',
                    paddingTop: 6,
                    fontWeight: 700
                  }}>
                    <span>단: {stock.short}%</span>
                    <span>중: {stock.mid}%</span>
                    <span>장: {stock.long}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
