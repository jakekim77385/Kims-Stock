'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  RefreshCw, CloudSun, Sun, Cloud, CloudRain, CloudLightning, 
  ArrowUpRight, ArrowDownRight, Compass, Info, CheckCircle2,
  Coins, Sparkles, Landmark, Cpu, Atom, Flame, Zap, Bot, Rocket, 
  Terminal, Dna, ShoppingBag, ShoppingCart, Home, Factory, Layers, Heart,
  Bitcoin
} from 'lucide-react';
import { useQuotes } from '@/lib/hooks';

// ─── 사용자 지정 20개 섹터 순서 및 매핑 메타데이터 ───────────────────────────────
const BENCHMARK = '^GSPC';
const SECTOR_TICKERS = [
  'GLD',  // 1. 금
  'SLV',  // 2. 은
  'XLF',  // 3. 금융
  'MGK',  // 4. 빅테크
  'COIN', // 5. 코인관련
  'QTUM', // 6. 양자
  'SOXX', // 7. 반도체
  'XLE',  // 8. 에너지
  'NLR',  // 9. 원자력
  'BOTZ', // 10. AI
  'ARKX', // 11. 우주
  'XLK',  // 12. 기술주
  'IBB',  // 13. 바이오
  
  // 전통 GICS 섹터 (14-20위)
  'XLY',  // 14. 임의소비재
  'XLP',  // 15. 필수소비재
  'XLU',  // 16. 유틸리티
  'XLRE', // 17. 부동산
  'XLI',  // 18. 산업재
  'XLB',  // 19. 소재
  'XLV'   // 20. 헬스케어
];

const ALL_TICKERS = [...SECTOR_TICKERS, BENCHMARK];

const SECTOR_METADATA: Record<string, { nameKo: string; desc: string; category: string; cycle: string; cycleLabel: string }> = {
  'GLD':  { nameKo: '금 (Gold)', desc: '런던 금 현물 금고 실물 보관형', category: '미래/전통', cycle: 'recession', cycleLabel: '지정학적 리스크, 통화 가치 하락 및 안전자산 헤지' },
  'SLV':  { nameKo: '은 (Silver)', desc: '런던 은 현물 실물 보관형', category: '미래/전통', cycle: 'late', cycleLabel: '산업용 원자재 수요 및 화폐 인프라 대체 자산' },
  'XLF':  { nameKo: '금융', desc: '은행, 보험, 투자 금융', category: '미래/전통', cycle: 'early', cycleLabel: '금리 환경 및 경제 회복 모멘텀' },
  'MGK':  { nameKo: '빅테크', desc: '초대형 메가 성장주 (MAGS)', category: '미래/전통', cycle: 'mid', cycleLabel: 'AI 비즈니스 장악 및 높은 현금 창출력' },
  'COIN': { nameKo: '코인관련', desc: '가상자산 거래소 및 가상화폐 핀테크', category: '미래/전통', cycle: 'early', cycleLabel: '글로벌 유동성 팽창 및 대체 자산 선호' },
  'QTUM': { nameKo: '양자 컴퓨팅', desc: '양자컴퓨터, 나노 신소재', category: '미래/전통', cycle: 'mid', cycleLabel: '하드웨어 혁신 및 장기 미래 컴퓨팅 기술' },
  'SOXX': { nameKo: '반도체', desc: '글로벌 주요 반도체 제조업', category: '미래/전통', cycle: 'mid', cycleLabel: '디지털 혁신 및 AI 가속기 시장 핵심 자산' },
  'XLE':  { nameKo: '에너지', desc: '전통 석유, 가스 생산 및 탐사', category: '미래/전통', cycle: 'late', cycleLabel: '원자재 인플레 헤지 및 지정학적 불안 수혜' },
  'NLR':  { nameKo: '원자력', desc: '우라늄 마이닝, 원자력 발전', category: '미래/전통', cycle: 'late', cycleLabel: '무탄소 기저 부하 에너지 대안 및 청정에너지 전환' },
  'BOTZ': { nameKo: 'AI & 로보틱스', desc: '생성형 AI, 지능형 자동화 로봇', category: '미래/전통', cycle: 'mid', cycleLabel: '지능형 자동화 혁명 및 산업 생산성 도약' },
  'ARKX': { nameKo: '우주 항공', desc: '우주 탐사, 위성 통신, 발사체', category: '미래/전통', cycle: 'mid', cycleLabel: '우주 인터넷 인프라 및 민간 항공 우주 성장성' },
  'XLK':  { nameKo: '기술주', desc: '소프트웨어, IT 인프라, 하드웨어', category: '미래/전통', cycle: 'mid', cycleLabel: '기술 혁신 사이클 및 장기 성장 모멘텀' },
  'IBB':  { nameKo: '바이오테크', desc: '유전자 편집, 바이오 의약품', category: '미래/전통', cycle: 'recession', cycleLabel: '제약 바이오 장기 헬스케어 및 신약 파이프라인' },
  
  // 전통 섹터
  'XLY':  { nameKo: '임의소비재', desc: '자동차, 레저, 온/오프라인 유통', category: '전통 GICS', cycle: 'early', cycleLabel: '경기 회복기 소비자 소비 성향 지배' },
  'XLP':  { nameKo: '필수소비재', desc: '식음료, 위생용품 (경기 방어)', category: '전통 GICS', cycle: 'recession', cycleLabel: '경기 불안시 안정적인 현금 흐름 및 방어' },
  'XLU':  { nameKo: '유틸리티', desc: '전력, 공공 수도, 가스 인프라', category: '전통 GICS', cycle: 'recession', cycleLabel: '금리 하락기 높은 배당 매력 및 강력한 방어력' },
  'XLRE': { nameKo: '부동산', desc: '오피스, 물류창고, 주거용 리츠', category: '전통 GICS', cycle: 'recession', cycleLabel: '금리 하락 사이클 및 배당 수익 극대화' },
  'XLI':  { nameKo: '산업재', desc: '중장비, 방산, 해운, 기계 제조업', category: '전통 GICS', cycle: 'early', cycleLabel: '대규모 인프라 부양책 및 재제조화 수혜' },
  'XLB':  { nameKo: '소재', desc: '화학, 금속, 임업 자재 (원자재)', category: '전통 GICS', cycle: 'late', cycleLabel: '인프라 원자재 수요 및 경기 후반 강세 국면' },
  'XLV':  { nameKo: '헬스케어', desc: '대형 제약사, 의료보험, 진단 의료기기', category: '전통 GICS', cycle: 'recession', cycleLabel: '인구 고령화 수혜 및 탄탄한 이익 체력' }
};

interface HoldingItem {
  ticker: string;
  name: string;
  weight: string;
  desc: string;
}

const SECTOR_HOLDINGS: Record<string, HoldingItem[]> = {
  'GLD': [
    { ticker: 'NEM', name: 'Newmont Corporation', weight: '대표 광산', desc: '세계 최대 금 채굴 기업, 금 가격에 강하게 수반' },
    { ticker: 'GOLD', name: 'Barrick Gold', weight: '대표 광산', desc: '글로벌 금 광산 업계 2위, 안정적인 원가 통제력' },
    { ticker: 'FNV', name: 'Franco-Nevada', weight: '로열티', desc: '광산 지분 투자 및 매출의 일정 비율을 금으로 받는 스트리밍사' },
    { ticker: 'AEM', name: 'Agnico Eagle Mines', weight: '대표 광산', desc: '캐나다 및 핀란드 위주의 안정적인 금 시추 기업' }
  ],
  'SLV': [
    { ticker: 'PAAS', name: 'Pan American Silver', weight: '대표 광산', desc: '글로벌 대표 은 시추 기업, 금/아연 복합 채굴' },
    { ticker: 'HL', name: 'Hecla Mining', weight: '대표 광산', desc: '미국 내 최대 은 생산 업체, 저비용 생산 구조 확보' },
    { ticker: 'WPM', name: 'Wheaton Precious Metals', weight: '스트리밍', desc: '은 및 귀금속 생산 스트리밍 분야 세계 1위 기업' },
    { ticker: 'FSM', name: 'Fortuna Silver Mines', weight: '대표 광산', desc: '남미 및 서아프리카 중심의 은/금 생산 성장형 광산사' }
  ],
  'XLF': [
    { ticker: 'BRK-B', name: 'Berkshire Hathaway', weight: '13.2%', desc: '워런 버핏의 지주사, 보험 및 전방위 자회사 보유' },
    { ticker: 'JPM', name: 'JPMorgan Chase', weight: '9.4%', desc: '미국 최대 상업/투자 은행, 연준 파트너 격 금융사' },
    { ticker: 'V', name: 'Visa Inc.', weight: '8.2%', desc: '세계 최대 결제 네트워크, 높은 영업이익률의 핀테크 독점' },
    { ticker: 'MA', name: 'Mastercard', weight: '6.8%', desc: '비자와 양대 산맥을 이루는 글로벌 금융 결제 시스템' },
    { ticker: 'BAC', name: 'Bank of America', weight: '5.5%', desc: '자산 기준 미국 2대 대형 상업 은행' }
  ],
  'MGK': [
    { ticker: 'MSFT', name: 'Microsoft Corp.', weight: '12.8%', desc: '오피스 독점, Azure 클라우드 및 OpenAI AI 엔진 선두' },
    { ticker: 'AAPL', name: 'Apple Inc.', weight: '11.5%', desc: '아이폰 생태계 독점, 서비스 부문 고마진 성장세 지속' },
    { ticker: 'NVDA', name: 'NVIDIA Corp.', weight: '9.8%', desc: 'AI 가속기(GPU) 시장 점유율 90% 이상의 공급 독점기업' },
    { ticker: 'AMZN', name: 'Amazon.com Inc.', weight: '6.5%', desc: '글로벌 e커머스 1위 및 AWS 클라우드 인프라 대장' },
    { ticker: 'META', name: 'Meta Platforms', weight: '4.8%', desc: '페이스북, 인스타그램 및 생성형 AI 거대 사용자망 구축' }
  ],
  'COIN': [
    { ticker: 'COIN', name: '코인베이스 (Coinbase Global)', weight: '거래소', desc: '미국 최대의 제도권 가상자산 거래 및 위탁 수탁(Custodian) 플랫폼' },
    { ticker: 'CRCL', name: '써클 (Circle Internet Group)', weight: '스테이블', desc: '글로벌 2대 달러화 스테이블코인 USDC 발행사이자 블록체인 결제 인프라 거인' },
    { ticker: 'MSTR', name: '마이크로스트래티지 (MicroStrategy)', weight: '비트코인', desc: '단일 법인 기준 비트코인 실물 최다 보유사 (BTC 장기 레버리지 프록시)' },
    { ticker: 'IREN', name: '아이렌 (IREN Inc.)', weight: 'AI 데이터센터', desc: '100% 재생 에너지 기반의 차세대 고효율 친환경 비트코인 채굴 및 AI 데이터센터 혁신 기업' },
    { ticker: 'BMNR', name: '비트마인 이머션 (BitMine Immersion Technologies)', weight: '액침 냉각', desc: '차세대 액침 냉각(Immersion Cooling) 솔루션을 도입한 저전력 고효율 비트코인 채굴 인프라 운영 및 호스팅 서비스 대표 기업' }
  ],
  'QTUM': [
    { ticker: 'IONQ', name: '아이온큐 (IonQ Inc.)', weight: '이온 트랩', desc: '이온 트랩 방식 양자컴퓨터 선두주자, 업계 내 유일한 대형 현금 유동성 확보사' },
    { ticker: 'RGTI', name: '리게티 컴퓨팅 (Rigetti Computing)', weight: '초전도체', desc: '초전도 큐비트 방식의 양자 프로세서 및 칩 독자 설계/제조 1위사' },
    { ticker: 'QUBT', name: '퀀텀 컴퓨팅 (Quantum Computing)', weight: '광학 연산', desc: '상온 작동 나노 포토닉스 양자 프로세서 및 양자 소프트웨어 융합 개발사' },
    { ticker: 'LAES', name: '실SQ (Laser Photonics)', weight: '광 레이저', desc: '양자 제어용 초정밀 레이저 시추 및 특수 광학 세정 솔루션 제공사' },
    { ticker: 'QBTS', name: '디 웨이브 퀀텀 (D-Wave Quantum)', weight: '양자 어닐링', desc: '세계 최초로 상업용 양자 어닐링 컴퓨터를 상용 납품/판매한 리더 기업' },
    { ticker: 'ARQQ', name: '아킷 퀀텀 (Arqit Quantum)', weight: '양자 암호', desc: '양자 컴퓨터 시대의 해킹을 방어하는 대칭 키 클라우드 보안 소프트웨어 선두주자' }
  ],
  'SOXX': [
    { ticker: 'MRVL', name: '마벨 테크놀로지 (Marvell Technology)', weight: 'ASIC/통신', desc: '고성능 맞춤형 주문형 반도체(ASIC) 및 광통신 DSP 최강자, AI 데이터센터 고속 연결 네트워크 핵심 수혜주' },
    { ticker: 'AMD', name: 'AMD (Advanced Micro Devices)', weight: 'CPU/GPU', desc: '고성능 x86 CPU 독과점 및 AI 가속기(MI300) 시장에서 엔비디아에 대적하는 독보적 대안 팹리스 설계사' },
    { ticker: 'TSM', name: 'TSMC (Taiwan Semiconductor)', weight: '파운드리', desc: '세계 최대 반도체 위탁생산(파운드리) 1위이자 첨단 미세 공정 패키징 독점 생산 능력을 가진 글로벌 반도체 생산의 척도' },
    { ticker: 'AVGO', name: '브로드컴 (Broadcom Inc.)', weight: '네트워크/통신', desc: '글로벌 통신 칩셋 리더 및 구글/메타 맞춤형 AI 가속기 공동 설계 1위, 최상급 고속 이더넷 스위치 칩 최강자' },
    { ticker: 'SMCI', name: '슈퍼 마이크로 컴퓨터 (Super Micro Computer)', weight: 'AI 서버', desc: '고성능 AI 가속기 장착 랙(Rack) 및 첨단 액체 냉각(Liquid Cooling) 솔루션 공급을 주도하는 AI 인프라 핵심 기업' },
    { ticker: 'MU', name: '마이크론 테크놀로지 (Micron Technology)', weight: 'DRAM/HBM', desc: 'AI 연산 속도를 결정짓는 차세대 고대역폭 메모리(HBM3E) 및 초성능 서버용 DRAM 공급을 리드하는 3대 메모리 거인' },
    { ticker: 'INTC', name: '인텔 (Intel Corp.)', weight: 'IDM/파운드리', desc: '전통의 PC/서버용 x86 CPU 최강자이자 미국 정부 반도체법 최대 지원 수혜를 입은 종합 반도체 제조 및 파운드리 재건 스타트업' }
  ],
  'XLE': [
    { ticker: 'XOM', name: 'ExxonMobil Corp.', weight: '22.8%', desc: '미국 최대 종합 석유/가스 기업, 시추 및 화학 고른 포트폴리오' },
    { ticker: 'CVX', name: 'Chevron Corp.', weight: '18.4%', desc: '미국 2대 석유 메이저, 천연가스 및 LNG 생산 강세' },
    { ticker: 'COP', name: 'ConocoPhillips', weight: '8.2%', desc: '셰일오일 시추 전문 업스트림 분야 최대 독립 에너지사' },
    { ticker: 'SLB', name: 'Schlumberger', weight: '5.5%', desc: '세계 최대 유전 서비스 및 정밀 시추 시뮬레이션 솔루션 기업' }
  ],
  'NLR': [
    { ticker: 'CEG', name: 'Constellation Energy', weight: '12.4%', desc: '미국 최대의 원자력 발전 운영사, 테크 데이터센터에 전력 다이렉트 공급' },
    { ticker: 'CCJ', name: 'Cameco Corp.', weight: '9.8%', desc: '캐나다의 세계 최대 우라늄 광산 시추 및 가공 전문 기업' },
    { ticker: 'SMR', name: 'NuScale Power', weight: '대표 혁신', desc: '소형 모듈 원자로(SMR) 설계 분야 미국 최초 규제 승인 획득사' },
    { ticker: 'OKLO', name: 'Oklo Inc.', weight: '대표 혁신', desc: '샘 올트먼이 이사회 의장으로 있는 소형 고속 핵분열 발전소 혁신 스타트업' }
  ],
  'BOTZ': [
    { ticker: 'NVDA', name: 'NVIDIA Corp.', weight: '연산 두뇌', desc: 'AI 모델 트레이닝, 물리 로봇 자율주행 및 시뮬레이션의 근간인 GPU 연산 독점' },
    { ticker: 'ISRG', name: 'Intuitive Surgical', weight: '의료 로봇', desc: '정밀 수술용 다빈치(DaVinci) 로봇 제조 및 소모품 수수료 독점 모델 구축' },
    { ticker: 'SYM', name: 'Symbotic Inc.', weight: '물류 자동화', desc: 'AI 기반 초대형 스마트 물류창고 자율주행 로봇 시스템 공급 (월마트 파트너)' },
    { ticker: 'ANSS', name: 'Ansys Inc.', weight: '시뮬레이션', desc: '자율주행 및 물리 로봇 설계 가상 테스트를 위한 공학 시뮬레이션 소프트웨어 대장' }
  ],
  'ARKX': [
    { ticker: 'RKLB', name: '로켓 랩 (Rocket Lab USA)', weight: '발사체/위성', desc: '소형 발사체 시장 독점 및 위성/우주 서비스 사업 다각화로 스페이스X에 이은 대표적 독자 민간 우주 산업 대장주' },
    { ticker: 'LUNR', name: '인튜이티브 머신스 (Intuitive Machines)', weight: '달 인프라', desc: 'NASA CLPS 핵심 파트너이자 최초의 민간 달 착륙선 발사 성공, 월면 데이터 및 기지 통신 인프라 독점 구축사' },
    { ticker: 'SIDU', name: '사이더스 스페이스 (Sidus Space)', weight: '소형 위성', desc: 'Space-as-a-Service 기반 초소형 인공위성 제조 및 다중 센서 지구 관측 데이터 AI 분석 서비스 전문 기업' }
  ],
  'XLK': [
    { ticker: 'MSFT', name: 'Microsoft Corp.', weight: '22.4%', desc: '소프트웨어 및 클라우드 AI 서비스 주도' },
    { ticker: 'AAPL', name: 'Apple Inc.', weight: '18.8%', desc: '디바이스 생태계 및 IT 소비 하드웨어 선도' },
    { ticker: 'NVDA', name: 'NVIDIA Corp.', weight: '15.4%', desc: 'AI 가속 하드웨어 연산 칩 표준 수립' },
    { ticker: 'AVGO', name: 'Broadcom Inc.', weight: '5.8%', desc: '네트워크 칩 및 시스템 인프라 소프트웨어 강자' }
  ],
  'IBB': [
    { ticker: 'REGN', name: 'Regeneron Pharma', weight: '8.2%', desc: '황반변성 치료제 아일리아 개발 및 안과/면역계 바이오텍' },
    { ticker: 'VRTX', name: 'Vertex Pharma', weight: '7.8%', desc: '낭성섬유증 치료제의 독점적 강자 및 유전자 가위 승인사' },
    { ticker: 'AMGN', name: 'Amgen Inc.', weight: '6.8%', desc: '글로벌 대형 바이오 의약품의 개척자, 면역 항암 신약 보유' },
    { ticker: 'GILD', name: 'Gilead Sciences', weight: '5.5%', desc: '에이즈 치료제 독점 및 타미플루 개발, 종양 세포 치료 강자' }
  ],
  'XLY': [
    { ticker: 'AMZN', name: 'Amazon.com Inc.', weight: '22.8%', desc: '글로벌 e커머스 1위 및 물류/배송 인프라 지배자' },
    { ticker: 'TSLA', name: 'Tesla Inc.', weight: '14.2%', desc: '자율주행 및 전기차 리더, 장기 로보택시 및 로봇 혁신 기대주' },
    { ticker: 'HD', name: 'Home Depot Inc.', weight: '8.4%', desc: '미국 최대 주택 건축 자재 소매점, 미국 경기 소비의 척도' },
    { ticker: 'MCD', name: 'McDonald\'s Corp.', weight: '5.2%', desc: '글로벌 프랜차이즈 식음료 1위 및 고정 부동산 금융 지배자' }
  ],
  'XLP': [
    { ticker: 'PG', name: 'Procter & Gamble', weight: '14.8%', desc: '미국 가계 생활용품 1위 브랜드, 강력한 가격 결정력으로 인플레 헤지' },
    { ticker: 'KO', name: 'Coca-Cola Co.', weight: '9.8%', desc: '탄산음료 지배자, 안정적 마진 및 높은 현금 배당력 보유' },
    { ticker: 'PEP', name: 'PepsiCo Inc.', weight: '8.2%', desc: '스낵(레이즈 등) 및 음료 포트폴리오를 보유한 식음료 대형사' },
    { ticker: 'COST', name: 'Costco Wholesale', weight: '6.8%', desc: '구독형 회원제 창고형 할인점, 높은 충성도 및 고성장 유통망' }
  ],
  'XLU': [
    { ticker: 'NEE', name: 'NextEra Energy', weight: '14.2%', desc: '미국 최대 신재생 발전사, 플로리다 기반 송배전 인프라 보유' },
    { ticker: 'SO', name: 'Southern Co.', weight: '8.8%', desc: '미국 조지아/앨라배마 전력 공급 대형사, 신규 원전 가동 개시' },
    { ticker: 'DUK', name: 'Duke Energy', weight: '8.2%', desc: '안정적인 전력/가스 분산 공급으로 견조한 배당 흐름 제공' },
    { ticker: 'AEP', name: 'American Electric Power', weight: '5.5%', desc: '11개 주에 걸친 미국 최대 송전 그리드망 운영사' }
  ],
  'XLRE': [
    { ticker: 'PLD', name: 'Prologis Inc.', weight: '12.4%', desc: '전 세계 아마존 등 e커머스 물류창고를 독점 보유한 글로벌 1위 물류 리츠' },
    { ticker: 'AMT', name: 'American Tower', weight: '9.8%', desc: '통신 기지국 타워 임대 리츠, 5G/AI 통신 데이터 전송의 척도' },
    { ticker: 'EQIX', name: 'Equinix Inc.', weight: '8.2%', desc: 'AI 데이터센터 부동산 전문 임대 리츠, 글로벌 코로케이션 최강자' },
    { ticker: 'CCI', name: 'Crown Castle', weight: '5.5%', desc: '미국 내 통신 기지국 및 소형 기지국망(Small Cell) 타워 임대' }
  ],
  'XLI': [
    { ticker: 'CAT', name: 'Caterpillar Inc.', weight: '6.8%', desc: '글로벌 1위 건설 및 광산 중장비 제조사, 인프라 투자 대장' },
    { ticker: 'GE', name: 'General Electric', weight: '5.8%', desc: '항공기 가스터빈 설계 및 가스터빈 에너지 분사 솔루션 1위' },
    { ticker: 'UNP', name: 'Union Pacific Corp.', weight: '4.8%', desc: '미국 서부 지역 철도 유통망 독점 운영사, 경기 물동량 지배' },
    { ticker: 'HON', name: 'Honeywell Int\'l', weight: '4.5%', desc: '항공 우주 하드웨어 및 빌딩 자동화 기계 대형 제조사' }
  ],
  'XLB': [
    { ticker: 'LIN', name: 'Linde Plc', weight: '18.4%', desc: '세계 최대 고부가 가치 산업용 가스(산소, 질소, 수소) 생산사' },
    { ticker: 'APD', name: 'Air Products', weight: '8.2%', desc: '글로벌 수소 프로젝트 리더 및 고순도 화학 산업용 가스 공급사' },
    { ticker: 'SHW', name: 'Sherwin-Williams', weight: '7.8%', desc: '미국 최대 주택/건축용 페인트 도료 브랜드 운영 및 납품사' },
    { ticker: 'FCX', name: 'Freeport-McMoRan', weight: '5.5%', desc: '세계 최대 구리 광산 시추사, 전력 인프라 확장용 구리 수혜 대장' }
  ],
  'XLV': [
    { ticker: 'LLY', name: 'Eli Lilly & Co.', weight: '10.8%', desc: '비만 치료제(젭바운드) 및 당뇨 치료제 독점으로 시가총액 헬스케어 1위' },
    { ticker: 'UNH', name: 'UnitedHealth Group', weight: '9.2%', desc: '미국 최대 사설 의료보험 서비스 및 옵텀(Optum) 진료 관리 플랫폼' },
    { ticker: 'JNJ', name: 'Johnson & Johnson', weight: '8.2%', desc: '제약 및 정밀 수술 의료기기 제조, 매우 견조한 트리플 A 배당 기업' },
    { ticker: 'MRK', name: 'Merck & Co.', weight: '6.8%', desc: '세계 최고 매출의 면역 항암제 키트루다(Keytruda) 판권 보유 제약사' }
  ]
};

// ─── 대표 ETF 아이콘 매핑 ──────────────────────────────────────────────────────
const SECTOR_ICONS: Record<string, React.ComponentType<any>> = {
  'GLD':  Coins,
  'SLV':  Sparkles,
  'XLF':  Landmark,
  'MGK':  Cpu,
  'COIN': Bitcoin,
  'QTUM': Atom,
  'SOXX': Cpu,
  'XLE':  Flame,
  'NLR':  Zap,
  'BOTZ': Bot,
  'ARKX': Rocket,
  'XLK':  Terminal,
  'IBB':  Dna,
  'XLY':  ShoppingBag,
  'XLP':  ShoppingCart,
  'XLU':  Zap,
  'XLRE': Home,
  'XLI':  Factory,
  'XLB':  Layers,
  'XLV':  Heart
};

// ─── 날씨 테마 스키마 ────────────────────────────────────────────────────────
interface WeatherSchema {
  emoji: string;
  label: string;
  bg: string;
  border: string;
  color: string;
  accent: string;
  text: string;
}

const WEATHER_SCHEMAS: Record<string, WeatherSchema> = {
  sunny: {
    emoji: '☀️',
    label: '쾌청 (강한 상승)',
    bg: 'linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)',
    border: '#fed7aa',
    color: '#ea580c',
    accent: '#f97316',
    text: '강한 자금 유동성 유입 중. 강력한 상승 모멘텀 유지.',
  },
  cloudySun: {
    emoji: '⛅',
    label: '구름조금 (완만 상승)',
    bg: 'linear-gradient(135deg, #f0fdf4 0%, #f7fee7 100%)',
    border: '#d9f99d',
    color: '#16a34a',
    accent: '#22c55e',
    text: '완만한 상승 기류 형성. 안정적인 고른 매수세 유입.',
  },
  cloudy: {
    emoji: '☁️',
    label: '흐림 (보합/횡보)',
    bg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    border: '#e2e8f0',
    color: '#475569',
    accent: '#64748b',
    text: '방향성 대기 구간. 차익 매물 소화 및 힘겨루기 진행.',
  },
  rainy: {
    emoji: '🌧️',
    label: '비 (단기 조정)',
    bg: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
    border: '#bfdbfe',
    color: '#2563eb',
    accent: '#3b82f6',
    text: '완만한 하방 압력 감지. 일시적 소나기 구름 유입 주의.',
  },
  stormy: {
    emoji: '⛈️',
    label: '뇌우 (폭락/과매도)',
    bg: 'linear-gradient(135deg, #fff5f5 0%, #fff0f0 100%)',
    border: '#fecaca',
    color: '#dc2626',
    accent: '#ef4444',
    text: '강한 저기압 돌풍 구간. 과매도 심화 단계, 저가 기회 탐색.',
  },
};

function getSectorWeather(changePct: number, rangePos: number): keyof typeof WEATHER_SCHEMAS {
  if (changePct < -1.6 || rangePos < 15) return 'stormy';
  if (changePct < -0.4 || rangePos < 35) return 'rainy';
  if (changePct >= 1.0 || (changePct > 0.3 && rangePos > 85)) return 'sunny';
  if (changePct > 0 || rangePos > 50) return 'cloudySun';
  return 'cloudy';
}

export default function SectorWeather() {
  const { data: quotes, loading: quotesLoading, refresh } = useQuotes(ALL_TICKERS, 60_000);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  if (quotesLoading && !quotes) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#bbb', fontSize: 12 }}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block', color: 'var(--accent)' }} />
        개별 종목 연동 20개 대화형 기상 특보 관측 중...
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // S&P 500 벤치마크 데이터 추출
  const spxQuote = quotes?.find(q => q.ticker.toUpperCase() === BENCHMARK);
  const spxChange = spxQuote?.changePct ?? 0;

  // 20개 섹터 가공 및 맵핑
  const sectorDataList = SECTOR_TICKERS.map((ticker) => {
    const q = quotes?.find(item => item.ticker.toUpperCase() === ticker.toUpperCase());
    const meta = SECTOR_METADATA[ticker];
    
    let rangePos = 50;
    if (q && q.high52w - q.low52w > 0) {
      rangePos = Math.max(0, Math.min(100, Math.round(((q.price - q.low52w) / (q.high52w - q.low52w)) * 100)));
    }

    const changePct = q?.changePct ?? 0;
    const weather = getSectorWeather(changePct, rangePos);

    return {
      symbol: ticker,
      name: q?.name ?? ticker,
      nameKo: meta.nameKo,
      desc: meta.desc,
      category: meta.category,
      price: q?.price ?? 0,
      changePct,
      rangePos,
      relToSpx: parseFloat((changePct - spxChange).toFixed(2)),
      weather,
      cycle: meta.cycle,
      cycleLabel: meta.cycleLabel
    };
  });

  // 날씨 통계 집계
  const weatherCounts: Record<string, number> = { sunny: 0, cloudySun: 0, cloudy: 0, rainy: 0, stormy: 0 };
  sectorDataList.forEach(s => {
    weatherCounts[s.weather]++;
  });

  // 주도 사이클 집계 (상위 강세 3개 섹터의 사이클)
  const top3 = [...sectorDataList].sort((a, b) => b.changePct - a.changePct).slice(0, 3);
  const cycleCount = { early: 0, mid: 0, late: 0, recession: 0 };
  top3.forEach(s => { cycleCount[s.cycle as keyof typeof cycleCount]++; });
  const dominantCycle = (Object.entries(cycleCount).sort((a, b) => b[1] - a[1])[0][0]) as keyof typeof cycleCount;

  const cycleSignalMap = {
    early: '경기 회복 국면 — 소비재, 산업재, 금융 강세 지배적',
    mid: '경기 확장 국면 — AI, 반도체, 빅테크 및 양자 기술 주도',
    late: '경기 후반 과열 — 에너지, 원자력 및 원자재 강세, 방어 태세 전환',
    recession: '안전 방어 국면 — 필수소비재, 유틸리티, 금/은 배당 자산 중심',
  };

  return (
    <div>
      {/* ── 헤더 ── */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '12px 20px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' 
      }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            🌤️ 섹터별 일기예보 (Sector Weather Forecast) — 종목 클릭 연동형
          </span>
          <span style={{ fontSize: 10, color: '#999', marginTop: 2, display: 'block' }}>
            기상 보드 카드를 클릭하시면 해당 섹터를 구성하는 **대장 개별 종목 분석 패널**이 즉시 호출됩니다.
          </span>
        </div>
        <button 
          onClick={refresh} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600,
            color: '#6b7280', background: 'white', border: '1px solid #d1d5db', 
            borderRadius: 5, cursor: 'pointer', padding: '5px 10px', fontFamily: 'inherit',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}
        >
          <RefreshCw size={11} /> 기상 갱신
        </button>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── 상단 2열 요약 보드 ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
          
          {/* ① 경기 사이클 관측국 */}
          <div style={{ 
            padding: 16, border: '1px solid var(--border-subtle)', borderRadius: 10, 
            background: 'linear-gradient(135deg, #fbfcfe 0%, #f1f5f9 100%)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--accent)', background: 'var(--accent-glow)', padding: '1px 5px', borderRadius: 3 }}>RADAR WATCH</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>DH 기상 제어 연구센터</span>
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                실시간 주도 기류: <span style={{ color: 'var(--accent)' }}>{cycleSignalMap[dominantCycle].split(' — ')[0]}</span>
              </h2>
              <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.5, margin: '6px 0 0' }}>
                기후 레이더 관측 결과, **{cycleSignalMap[dominantCycle]}** 기조가 최상단에 형성되어 있습니다. 
                금/은 및 18가지 핵심 테마의 개별 구성 종목을 분석해 주도 기류를 낚아채세요.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              {Object.entries(weatherCounts).map(([wId, count]) => {
                const schema = WEATHER_SCHEMAS[wId];
                if (count === 0) return null;
                return (
                  <div key={wId} style={{ 
                    padding: '4px 8px', borderRadius: 6, border: `1px solid ${schema.border}`, 
                    background: 'white', display: 'flex', alignItems: 'center', gap: 4 
                  }}>
                    <span style={{ fontSize: 11 }}>{schema.emoji}</span>
                    <span style={{ fontSize: 9.5, fontWeight: 800, color: schema.color }}>{schema.label.split(' ')[0]} {count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ② 종합 증시 기상도 */}
          <div style={{ 
            padding: 16, border: '1px solid var(--border-subtle)', borderRadius: 10, 
            background: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>전체 20개 커스텀 섹터 일기 종합</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: spxChange >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                  {spxChange >= 0.5 ? '구름 한 점 없는 쾌청 ☀️' : spxChange >= 0 ? '고른 훈풍과 약간 흐림 ⛅' : spxChange >= -1.0 ? '부슬비 내리는 중 🌧️' : '기상 악화 경보 발령 ⛈️'}
                </span>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  S&P 500 기준선: <strong style={{ color: spxChange >= 0 ? 'var(--positive)' : 'var(--negative)' }}>{spxChange >= 0 ? '+' : ''}{spxChange.toFixed(2)}%</strong>
                </span>
              </div>
            </div>
            <div style={{ fontSize: 10.5, color: '#475569', lineHeight: 1.5, marginTop: 8 }}>
              💡 <strong>일기예보 종합 분석:</strong> 카드를 클릭하시면 ETF 안에 포괄되어 있는 **진짜 대장 개별 종목 리스트**를 소환해 실시간 기업 분석으로 바로 이동하실 수 있습니다.
            </div>
          </div>

        </div>

        {/* ── 20개 기상 예보 카드 그리드 ── */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#1e3a8a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Compass size={13} /> DH 추천 13대 핵심 미래 및 GICS 업종 배치 예보 (클릭 시 세부 종목 팝업)
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {sectorDataList.map((s, index) => {
              const schema = WEATHER_SCHEMAS[s.weather];
              const isUp = s.changePct >= 0;
              const isFutureSector = index < 13;
              
              return (
                <div 
                  key={s.symbol} 
                  onClick={() => setSelectedTicker(s.symbol)}
                  style={{ 
                    background: schema.bg, border: `1px solid ${schema.border}`, 
                    borderRadius: 8, padding: '14px 16px', display: 'flex', flexDirection: 'column', 
                    justifyContent: 'space-between', minHeight: 195, transition: 'all 0.2s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    position: 'relative', overflow: 'hidden', cursor: 'pointer'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05)';
                    e.currentTarget.style.borderColor = schema.accent;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)';
                    e.currentTarget.style.borderColor = schema.border;
                  }}
                >
                  {/* 미래 세부 섹터 넘버 배지 */}
                  <div style={{ 
                    position: 'absolute', right: -6, top: -6, width: 26, height: 26, borderRadius: '50%',
                    background: isFutureSector ? 'rgba(30,58,138,0.07)' : 'rgba(0,0,0,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 900, color: isFutureSector ? '#1e3a8a' : '#64748b'
                  }}>
                    {index + 1}
                  </div>

                  <div>
                    {/* 상단 라벨 & 기상 이모지 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {/* 대표 ETF 아이콘 */}
                          {(() => {
                            const IconComp = SECTOR_ICONS[s.symbol] || Compass;
                            return (
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTicker(s.symbol);
                                }}
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: '50%',
                                  background: isFutureSector ? 'rgba(30, 58, 138, 0.08)' : 'rgba(100, 116, 139, 0.08)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: isFutureSector ? '#1e3a8a' : '#475569',
                                  border: `1.5px solid ${isFutureSector ? 'rgba(30, 58, 138, 0.15)' : 'rgba(100, 116, 139, 0.15)'}`,
                                  cursor: 'pointer',
                                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                  position: 'relative'
                                }}
                                title={`대표 ETF (${s.symbol}) 구성 종목 및 개별 주식 보기`}
                                onMouseEnter={e => {
                                  e.currentTarget.style.transform = 'scale(1.2) rotate(8deg)';
                                  e.currentTarget.style.background = isFutureSector ? '#dbeafe' : '#e2e8f0';
                                  e.currentTarget.style.borderColor = isFutureSector ? '#3b82f6' : '#64748b';
                                  e.currentTarget.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.35)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                                  e.currentTarget.style.background = isFutureSector ? 'rgba(30, 58, 138, 0.08)' : 'rgba(100, 116, 139, 0.08)';
                                  e.currentTarget.style.borderColor = isFutureSector ? 'rgba(30, 58, 138, 0.15)' : 'rgba(100, 116, 139, 0.15)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                <IconComp size={11} strokeWidth={2.5} />
                                
                                {/* 알림 펄스 도트 */}
                                <span style={{
                                  position: 'absolute',
                                  top: -1,
                                  right: -1,
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: '#f97316',
                                  border: '1px solid white',
                                  boxShadow: '0 0 4px #f97316'
                                }} />
                              </div>
                            );
                          })()}

                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 9.5, color: '#64748b', fontWeight: 700 }}>{s.symbol}</span>
                            <span style={{ 
                              fontSize: 7.5, fontWeight: 800, 
                              color: isFutureSector ? '#1e3a8a' : '#64748b', 
                              background: isFutureSector ? '#dbeafe' : '#f1f5f9', 
                              padding: '1px 4px', borderRadius: 2 
                            }}>
                              {isFutureSector ? '핵심' : 'GICS'}
                            </span>
                          </div>
                        </div>
                        <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }}>{s.nameKo}</h4>
                      </div>
                      <span style={{ fontSize: 24, marginRight: 16 }} title={schema.label}>{schema.emoji}</span>
                    </div>

                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                      {s.desc}
                    </div>

                    {/* 기상 특보 등급 & 개별 대표주 보기 단추 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      <span style={{ 
                        fontSize: 8.5, fontWeight: 800, color: schema.color, background: 'white', 
                        border: `1.5px solid ${schema.border}`, padding: '2px 5px', borderRadius: 4
                      }}>
                        {schema.label}
                      </span>
                      
                      {(() => {
                        const IconComp = SECTOR_ICONS[s.symbol] || Compass;
                        return (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTicker(s.symbol);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 8.5,
                              fontWeight: 800,
                              color: isFutureSector ? '#1e3a8a' : '#475569',
                              background: isFutureSector ? '#eff6ff' : '#f1f5f9',
                              border: `1px solid ${isFutureSector ? '#bfdbfe' : '#cbd5e1'}`,
                              padding: '2px 6px',
                              borderRadius: 4,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = isFutureSector ? '#dbeafe' : '#e2e8f0';
                              e.currentTarget.style.borderColor = isFutureSector ? '#3b82f6' : '#64748b';
                              e.currentTarget.style.color = isFutureSector ? '#2563eb' : '#0f172a';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = isFutureSector ? '#eff6ff' : '#f1f5f9';
                              e.currentTarget.style.borderColor = isFutureSector ? '#bfdbfe' : '#cbd5e1';
                              e.currentTarget.style.color = isFutureSector ? '#1e3a8a' : '#475569';
                            }}
                          >
                            <IconComp size={9} strokeWidth={2.5} />
                            <span>개별 대표주 ➔</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* 등락률 & 수치 */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '10px 0 6px' }}>
                      <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'JetBrains Mono', color: '#0f172a' }}>
                        {isUp ? '+' : ''}{s.changePct.toFixed(2)}%
                      </span>
                      <span style={{ 
                        fontSize: 9, fontWeight: 600,
                        color: s.relToSpx >= 0 ? 'var(--positive)' : 'var(--negative)',
                        display: 'flex', alignItems: 'center', gap: 1
                      }}>
                        {s.relToSpx >= 0 ? <ArrowUpRight size={8} /> : <ArrowDownRight size={8} />}
                        SPX대비 {s.relToSpx >= 0 ? `+${s.relToSpx}` : s.relToSpx}%
                      </span>
                    </div>

                    {/* 52주 상대적 기압 위치 게이지 */}
                    <div style={{ marginTop: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#64748b', marginBottom: 2 }}>
                        <span>최저 기압</span>
                        <span style={{ fontWeight: 700 }}>52주 위치: {s.rangePos}%</span>
                        <span>최고 기압</span>
                      </div>
                      <div style={{ height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 2, position: 'relative' }}>
                        <div style={{ 
                          position: 'absolute', left: 0, top: 0, height: '100%', 
                          width: `${s.rangePos}%`, background: schema.accent, borderRadius: 2 
                        }} />
                      </div>
                    </div>
                  </div>

                  {/* 기상 해설 코멘트 */}
                  <div style={{ 
                    fontSize: 9.5, color: '#475569', lineHeight: 1.4, borderTop: '1px solid rgba(0,0,0,0.05)', 
                    paddingTop: 8, marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 4 
                  }}>
                    <Compass size={11} style={{ color: schema.color, flexShrink: 0, marginTop: 2 }} />
                    <span>
                      <strong>기상분석:</strong> {schema.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 상세 구성 종목 모달 ── */}
        {selectedTicker && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: 24
          }}
          onClick={() => setSelectedTicker(null)}
          >
            <div style={{
              background: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
              width: '100%', maxWidth: 680, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              position: 'relative', display: 'flex', flexDirection: 'column', gap: 16
            }}
            onClick={(e) => e.stopPropagation()}
            >
              {/* 닫기 버튼 */}
              <button 
                onClick={() => setSelectedTicker(null)}
                style={{
                  position: 'absolute', right: 20, top: 20, border: 'none', background: 'none',
                  fontSize: 16, fontWeight: 700, color: '#94a3b8', cursor: 'pointer'
                }}
              >✕</button>

              {/* 모달 헤더 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {(() => {
                    const IconComp = SECTOR_ICONS[selectedTicker] || Compass;
                    const isFuture = SECTOR_TICKERS.indexOf(selectedTicker) < 13;
                    return (
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: isFuture ? 'rgba(30, 58, 138, 0.08)' : 'rgba(100, 116, 139, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isFuture ? '#1e3a8a' : '#475569',
                        border: `1.5px solid ${isFuture ? 'rgba(30, 58, 138, 0.15)' : 'rgba(100, 116, 139, 0.15)'}`,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}>
                        <IconComp size={18} strokeWidth={2.5} />
                      </div>
                    );
                  })()}
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {SECTOR_METADATA[selectedTicker].nameKo} 개별 대표 종목 리스트
                      <span style={{ fontSize: 14 }} title={WEATHER_SCHEMAS[sectorDataList.find(s => s.symbol === selectedTicker)?.weather ?? 'cloudy'].label}>
                        {WEATHER_SCHEMAS[sectorDataList.find(s => s.symbol === selectedTicker)?.weather ?? 'cloudy'].emoji}
                      </span>
                    </h3>
                    <span style={{ fontSize: 10.5, color: '#64748b', display: 'block', marginTop: 3 }}>
                      대표 추종 ETF: <strong style={{ color: '#334155' }}>{selectedTicker}</strong> · {SECTOR_METADATA[selectedTicker].desc}
                    </span>
                  </div>
                </div>
              </div>

              {/* 구성 종목 리스트 테이블 */}
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700, width: 50 }}>순위</th>
                      <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700 }}>종목명(티커)</th>
                      <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700, width: 90 }}>ETF 내 비중</th>
                      <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700 }}>역할 및 핵심 가치</th>
                      <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 700, width: 70, textAlign: 'center' }}>분석</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(SECTOR_HOLDINGS[selectedTicker] ?? []).map((h, i) => (
                      <tr key={h.ticker} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      >
                        <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono', color: '#64748b', fontWeight: 700 }}>#{i + 1}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700, color: '#1e293b' }}>{h.ticker}</span>
                            <span style={{ fontSize: 9.5, color: '#64748b' }}>{h.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--accent)' }}>{h.weight}</td>
                        <td style={{ padding: '10px 14px', color: '#475569', lineHeight: 1.4 }}>{h.desc}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <Link 
                            href={`/analysis?ticker=${h.ticker}`}
                            onClick={() => setSelectedTicker(null)}
                            style={{
                              display: 'inline-block', padding: '3px 8px', fontSize: 10, fontWeight: 700,
                              background: 'var(--accent-glow)', color: 'var(--accent)', borderRadius: 4,
                              textDecoration: 'none', border: '1px solid var(--border-default)', transition: 'background 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#e0eafe'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-glow)'}
                          >
                            분석 ➔
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 하단 닫기 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button 
                  onClick={() => setSelectedTicker(null)}
                  style={{
                    padding: '6px 16px', fontSize: 11, fontWeight: 700, color: '#475569',
                    background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer'
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 면책 고지 */}
        <div style={{ fontSize: 9, color: '#bbb', borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
          * 본 '섹터별 일기예보'는 DH 투자자가 지정한 13개 미래 지향 트렌드/안전자산 및 GICS 전통 7대 섹터의 일간 등락폭과 52주 주가 채널 내 위치(기압)를 분석하여 주관적으로 시각화한 참고 자료이며 투자 권유가 아닙니다.
        </div>

      </div>
    </div>
  );
}
