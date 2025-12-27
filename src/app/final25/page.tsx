'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { Trophy, Grid3X3, Layers, Sparkles, ArrowLeft, Database } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import Final25Leaderboard from '@/components/Final25Leaderboard';
import TaskHeatmap from '@/components/TaskHeatmap';
import TemplateAnalysis from '@/components/TemplateAnalysis';
import AnomalyInsights from '@/components/AnomalyInsights';

const tabs = [
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'tasks', label: 'Task Heatmap', icon: Grid3X3 },
  { id: 'templates', label: 'Templates', icon: Layers },
  { id: 'anomalies', label: 'Anomalies', icon: Sparkles },
];

function LoadingState() {
  return (
    <div className="theme-page flex items-center justify-center">
      <div className="text-emerald-500 text-lg">Loading benchmark...</div>
    </div>
  );
}

export default function Final25Page() {
  const [activeTab, setActiveTab] = useState('leaderboard');

  return (
    <div className="theme-page">
      {/* Grid background */}
      <div className="fixed inset-0 theme-grid-bg" style={{
        backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.5) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />

      {/* Header */}
      <header className="relative border-b theme-header">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold tracking-tight">
                  <span className="text-emerald-500">Code</span>
                  <span className="theme-text-primary">Blue</span>
                </h1>
              </Link>
              <span className="theme-text-muted">|</span>
              <span className="text-emerald-500 font-medium">Final 25 Benchmark</span>
              <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-500">v2.0</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs theme-text-muted">
                25 tasks | 14 models | 3 rollouts
              </span>
              <div className="flex items-center gap-3">
                <Link href="/benchmark" className="flex items-center gap-2 text-sm theme-text-secondary hover:text-emerald-500 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Main Benchmark
                </Link>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold theme-text-primary mb-2">Hard Analytical Reasoning Tasks</h2>
          <p className="theme-text-secondary">
            25 challenging L4-L6 tasks requiring multi-step data analysis. 19 bank (subscription rate) + 6 road (accident risk).
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                  : 'theme-text-secondary hover:text-emerald-500 hover:bg-emerald-500/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <Suspense fallback={<LoadingState />}>
          {activeTab === 'leaderboard' && <Final25Leaderboard />}
          {activeTab === 'tasks' && <TaskHeatmap />}
          {activeTab === 'templates' && <TemplateAnalysis />}
          {activeTab === 'anomalies' && <AnomalyInsights />}
        </Suspense>
      </main>
    </div>
  );
}
