import { Suspense } from 'react';
import BenchmarkCharts from '@/components/BenchmarkCharts';

function BenchmarkLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
      <div className="text-emerald-400 text-lg">Loading benchmark...</div>
    </div>
  );
}

export default function BenchmarkPage() {
  return (
    <Suspense fallback={<BenchmarkLoading />}>
      <BenchmarkCharts />
    </Suspense>
  );
}
