'use client';
import dynamic from 'next/dynamic';
const DhAnalysis = dynamic(() => import('@/components/DhAnalysis'), { ssr: false });

export default function DhAnalysisPage() {
  return <DhAnalysis />;
}
