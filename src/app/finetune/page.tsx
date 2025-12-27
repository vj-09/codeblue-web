'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Database, ArrowLeft, TrendingUp, ArrowUpRight, ArrowDownRight, Minus, Zap, Clock, Target, DollarSign } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// Fine-tuning results data
const finetuneData = {
  model: 'Qwen2.5-Coder-7B',
  baselineVersion: 'Base',
  finetunedVersion: 'CodeBlue-FT',
  trainingDetails: {
    dataset: 'CodeBlue Analytics Tasks',
    examples: 2847,
    epochs: 3,
    learningRate: '2e-5',
    batchSize: 8,
    trainingTime: '4.2 hours',
    gpu: 'A100 80GB',
  },
  metrics: {
    baseline: {
      correctness: 0.42,
      efficiency: 0.65,
      tokenCost: 0.78,
      totalReward: 0.52,
      avgTurns: 5.2,
      successRate: 0.38,
    },
    finetuned: {
      correctness: 0.71,
      efficiency: 0.82,
      tokenCost: 0.85,
      totalReward: 0.76,
      avgTurns: 3.1,
      successRate: 0.67,
    },
  },
  byCategory: [
    { category: 'L1-L2 (Easy)', baseline: 0.65, finetuned: 0.92, improvement: 41.5 },
    { category: 'L3 (Easy+)', baseline: 0.52, finetuned: 0.85, improvement: 63.5 },
    { category: 'L4 (Medium)', baseline: 0.38, finetuned: 0.72, improvement: 89.5 },
    { category: 'L5 (Medium+)', baseline: 0.28, finetuned: 0.58, improvement: 107.1 },
    { category: 'L6 (Hard)', baseline: 0.18, finetuned: 0.45, improvement: 150.0 },
  ],
  trainingCurve: [
    { epoch: 0, loss: 2.4, valLoss: 2.5, reward: 0.52 },
    { epoch: 0.5, loss: 1.8, valLoss: 1.9, reward: 0.58 },
    { epoch: 1, loss: 1.2, valLoss: 1.4, reward: 0.65 },
    { epoch: 1.5, loss: 0.9, valLoss: 1.1, reward: 0.69 },
    { epoch: 2, loss: 0.6, valLoss: 0.9, reward: 0.72 },
    { epoch: 2.5, loss: 0.4, valLoss: 0.8, reward: 0.74 },
    { epoch: 3, loss: 0.3, valLoss: 0.75, reward: 0.76 },
  ],
};

function MetricCard({ label, baseline, finetuned, format = 'percent', icon: Icon }: {
  label: string;
  baseline: number;
  finetuned: number;
  format?: 'percent' | 'number' | 'turns';
  icon: React.ElementType;
}) {
  const improvement = ((finetuned - baseline) / baseline) * 100;
  const isPositive = format === 'turns' ? improvement < 0 : improvement > 0;
  const displayImprovement = format === 'turns' ? Math.abs(improvement) : improvement;

  const formatValue = (val: number) => {
    if (format === 'percent') return `${(val * 100).toFixed(1)}%`;
    if (format === 'turns') return val.toFixed(1);
    return val.toFixed(2);
  };

  return (
    <div className="p-4 rounded-xl theme-card border light-shadow">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 theme-text-muted" />
        <span className="text-sm theme-text-secondary">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs theme-text-muted mb-1">Baseline</p>
          <p className="text-lg font-mono theme-text-secondary">{formatValue(baseline)}</p>
        </div>
        <div className="text-center px-3">
          <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {displayImprovement.toFixed(1)}%
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs theme-text-muted mb-1">Fine-tuned</p>
          <p className="text-lg font-mono text-emerald-500">{formatValue(finetuned)}</p>
        </div>
      </div>
    </div>
  );
}

export default function FinetunePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'training'>('overview');

  const radarData = [
    { metric: 'Correctness', baseline: finetuneData.metrics.baseline.correctness * 100, finetuned: finetuneData.metrics.finetuned.correctness * 100 },
    { metric: 'Efficiency', baseline: finetuneData.metrics.baseline.efficiency * 100, finetuned: finetuneData.metrics.finetuned.efficiency * 100 },
    { metric: 'Token Cost', baseline: finetuneData.metrics.baseline.tokenCost * 100, finetuned: finetuneData.metrics.finetuned.tokenCost * 100 },
    { metric: 'Success Rate', baseline: finetuneData.metrics.baseline.successRate * 100, finetuned: finetuneData.metrics.finetuned.successRate * 100 },
  ];

  const overallImprovement = ((finetuneData.metrics.finetuned.totalReward - finetuneData.metrics.baseline.totalReward) / finetuneData.metrics.baseline.totalReward) * 100;

  return (
    <div className="theme-page">
      {/* Grid background */}
      <div className="fixed inset-0 theme-grid-bg" style={{
        backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />

      {/* Header */}
      <header className="relative border-b theme-header border-blue-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight">
                    <span className="text-emerald-500">Code</span>
                    <span className="theme-text-primary">Blue</span>
                  </h1>
                </div>
              </Link>
              <span className="theme-text-muted">|</span>
              <span className="text-blue-500 font-medium">Fine-tuning Gains</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 text-sm theme-text-secondary hover:text-blue-500 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-500 text-sm mb-4">
            <TrendingUp className="w-4 h-4" />
            Environment-Driven Improvement
          </div>
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-emerald-500">+{overallImprovement.toFixed(0)}%</span>
            <span className="theme-text-primary"> Performance Gain</span>
          </h1>
          <p className="theme-text-secondary max-w-2xl mx-auto">
            See how fine-tuning <span className="theme-text-primary font-medium">{finetuneData.model}</span> on CodeBlue&apos;s analytics tasks
            dramatically improves performance across all difficulty levels.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Correctness"
            baseline={finetuneData.metrics.baseline.correctness}
            finetuned={finetuneData.metrics.finetuned.correctness}
            icon={Target}
          />
          <MetricCard
            label="Efficiency"
            baseline={finetuneData.metrics.baseline.efficiency}
            finetuned={finetuneData.metrics.finetuned.efficiency}
            icon={Zap}
          />
          <MetricCard
            label="Avg Turns"
            baseline={finetuneData.metrics.baseline.avgTurns}
            finetuned={finetuneData.metrics.finetuned.avgTurns}
            format="turns"
            icon={Clock}
          />
          <MetricCard
            label="Success Rate"
            baseline={finetuneData.metrics.baseline.successRate}
            finetuned={finetuneData.metrics.finetuned.successRate}
            icon={DollarSign}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['overview', 'categories', 'training'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
                  : 'theme-text-secondary hover:text-blue-500 hover:bg-blue-500/5'
              }`}
            >
              {tab === 'overview' ? 'Overview' : tab === 'categories' ? 'By Category' : 'Training Curve'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 p-6 rounded-2xl theme-card border light-shadow">
            {activeTab === 'overview' && (
              <>
                <h3 className="text-lg font-bold theme-text-primary mb-4">Performance Comparison</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 10 }} />
                      <Radar name="Baseline" dataKey="baseline" stroke="#EF4444" fill="#EF4444" fillOpacity={0.2} strokeWidth={2} />
                      <Radar name="Fine-tuned" dataKey="finetuned" stroke="#10B981" fill="#10B981" fillOpacity={0.3} strokeWidth={2} />
                      <Legend />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                        labelStyle={{ color: '#F3F4F6' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {activeTab === 'categories' && (
              <>
                <h3 className="text-lg font-bold theme-text-primary mb-4">Improvement by Difficulty Level</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={finetuneData.byCategory} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" domain={[0, 1]} tick={{ fill: '#9CA3AF' }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                      <YAxis dataKey="category" type="category" tick={{ fill: '#9CA3AF', fontSize: 11 }} width={100} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                        formatter={(value) => `${((value as number) * 100).toFixed(1)}%`}
                      />
                      <Legend />
                      <Bar dataKey="baseline" name="Baseline" fill="#EF4444" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="finetuned" name="Fine-tuned" fill="#10B981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {activeTab === 'training' && (
              <>
                <h3 className="text-lg font-bold theme-text-primary mb-4">Training Progress</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={finetuneData.trainingCurve}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="epoch" tick={{ fill: '#9CA3AF' }} label={{ value: 'Epoch', position: 'bottom', fill: '#9CA3AF' }} />
                      <YAxis yAxisId="loss" orientation="left" tick={{ fill: '#9CA3AF' }} domain={[0, 3]} />
                      <YAxis yAxisId="reward" orientation="right" tick={{ fill: '#9CA3AF' }} domain={[0.5, 0.8]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Line yAxisId="loss" type="monotone" dataKey="loss" name="Train Loss" stroke="#EF4444" strokeWidth={2} dot={false} />
                      <Line yAxisId="loss" type="monotone" dataKey="valLoss" name="Val Loss" stroke="#F97316" strokeWidth={2} dot={false} />
                      <Line yAxisId="reward" type="monotone" dataKey="reward" name="Reward" stroke="#10B981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Model Info */}
            <div className="p-6 rounded-2xl theme-card border light-shadow">
              <h3 className="text-lg font-bold theme-text-primary mb-4">Model Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="theme-text-secondary">Base Model</span>
                  <span className="theme-text-primary font-mono text-sm">{finetuneData.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="theme-text-secondary">Parameters</span>
                  <span className="theme-text-primary font-mono text-sm">7B</span>
                </div>
                <div className="flex justify-between">
                  <span className="theme-text-secondary">Architecture</span>
                  <span className="theme-text-primary font-mono text-sm">Transformer</span>
                </div>
              </div>
            </div>

            {/* Training Config */}
            <div className="p-6 rounded-2xl theme-card border light-shadow">
              <h3 className="text-lg font-bold theme-text-primary mb-4">Training Config</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="theme-text-secondary">Dataset</span>
                  <span className="theme-text-primary">{finetuneData.trainingDetails.examples.toLocaleString()} examples</span>
                </div>
                <div className="flex justify-between">
                  <span className="theme-text-secondary">Epochs</span>
                  <span className="theme-text-primary">{finetuneData.trainingDetails.epochs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="theme-text-secondary">Learning Rate</span>
                  <span className="theme-text-primary font-mono">{finetuneData.trainingDetails.learningRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="theme-text-secondary">Batch Size</span>
                  <span className="theme-text-primary">{finetuneData.trainingDetails.batchSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="theme-text-secondary">Training Time</span>
                  <span className="theme-text-primary">{finetuneData.trainingDetails.trainingTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="theme-text-secondary">Hardware</span>
                  <span className="theme-text-primary">{finetuneData.trainingDetails.gpu}</span>
                </div>
              </div>
            </div>

            {/* Biggest Gains */}
            <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 light-shadow">
              <h3 className="text-lg font-bold theme-text-primary mb-4">Biggest Gains</h3>
              <div className="space-y-3">
                {finetuneData.byCategory
                  .sort((a, b) => b.improvement - a.improvement)
                  .slice(0, 3)
                  .map((cat, i) => (
                    <div key={cat.category} className="flex items-center justify-between">
                      <span className="theme-text-secondary text-sm">{cat.category}</span>
                      <span className="text-emerald-500 font-bold">+{cat.improvement.toFixed(0)}%</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-500/30 text-center light-shadow">
          <h2 className="text-2xl font-bold theme-text-primary mb-2">Want these gains for your model?</h2>
          <p className="theme-text-secondary mb-6">
            Our environment and dataset are open-source. Fine-tune your own model on CodeBlue tasks.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://github.com/vj-09/codeblue-env"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
            >
              View Training Guide
              <ArrowUpRight className="w-4 h-4" />
            </a>
            <Link
              href="/benchmark"
              className="flex items-center gap-2 px-6 py-3 rounded-xl theme-card border theme-text-secondary font-semibold hover:border-blue-500/50 transition-colors"
            >
              See Leaderboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
