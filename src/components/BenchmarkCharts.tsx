'use client';

import React, { useState, useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  BarChart, Bar, Cell, LineChart, Line,
  ReferenceLine, ReferenceArea, Label
} from 'recharts';
import { ChevronDown, Database, ExternalLink, Github, TrendingUp, Grid3X3, BarChart3, Target, Layers } from 'lucide-react';

// Enhanced benchmark data with cost and more metrics
const benchmarkData = [
  { id: 1, model: "GPT-4o", org: "OpenAI", size: "UNK", cost: 2.50, stateless: 78.4, stateful: 72.1, singleCsv: 82.3, multiCsv: 68.5, oneshot: 71.2, agentic: 79.8, aggregation: 81.2, joins: 74.5, timeseries: 76.8, nulls: 69.3, ambiguous: 72.1, adversarial: 58.4, overall: 75.4, color: "#10B981" },
  { id: 2, model: "Claude 3.5 Sonnet", org: "Anthropic", size: "UNK", cost: 3.00, stateless: 76.8, stateful: 74.3, singleCsv: 80.1, multiCsv: 71.0, oneshot: 73.5, agentic: 77.6, aggregation: 79.8, joins: 76.2, timeseries: 74.5, nulls: 72.8, ambiguous: 75.3, adversarial: 61.2, overall: 75.6, color: "#8B5CF6" },
  { id: 3, model: "Gemini 2.0 Pro", org: "Google", size: "UNK", cost: 1.25, stateless: 74.2, stateful: 70.8, singleCsv: 78.9, multiCsv: 66.1, oneshot: 69.8, agentic: 75.2, aggregation: 77.4, joins: 71.8, timeseries: 73.2, nulls: 67.5, ambiguous: 69.8, adversarial: 55.3, overall: 72.5, color: "#3B82F6" },
  { id: 4, model: "DeepSeek-R1", org: "DeepSeek", size: "671B", cost: 0.55, stateless: 72.1, stateful: 75.6, singleCsv: 74.3, multiCsv: 73.4, oneshot: 68.9, agentic: 78.8, aggregation: 75.6, joins: 77.3, timeseries: 71.4, nulls: 74.2, ambiguous: 73.8, adversarial: 62.5, overall: 73.9, color: "#F59E0B" },
  { id: 5, model: "Qwen2.5-72B", org: "Alibaba", size: "72B", cost: 0.40, stateless: 69.5, stateful: 67.2, singleCsv: 72.8, multiCsv: 63.9, oneshot: 66.4, agentic: 70.3, aggregation: 71.8, joins: 68.4, timeseries: 67.9, nulls: 64.2, ambiguous: 66.5, adversarial: 52.8, overall: 68.4, color: "#EC4899" },
  { id: 6, model: "Llama-3.3-70B", org: "Meta", size: "70B", cost: 0.35, stateless: 65.8, stateful: 62.4, singleCsv: 69.2, multiCsv: 59.0, oneshot: 61.7, agentic: 66.5, aggregation: 68.3, joins: 63.7, timeseries: 64.1, nulls: 60.8, ambiguous: 62.4, adversarial: 48.9, overall: 64.1, color: "#06B6D4" },
  { id: 7, model: "Mistral Large 2", org: "Mistral", size: "123B", cost: 0.80, stateless: 67.3, stateful: 64.9, singleCsv: 70.5, multiCsv: 61.7, oneshot: 63.8, agentic: 68.4, aggregation: 69.7, joins: 65.8, timeseries: 66.2, nulls: 62.9, ambiguous: 64.7, adversarial: 51.3, overall: 66.1, color: "#EF4444" },
  { id: 8, model: "Arctic-SQL-32B", org: "Snowflake", size: "32B", cost: 0.25, stateless: 71.8, stateful: 68.2, singleCsv: 75.4, multiCsv: 64.6, oneshot: 67.3, agentic: 72.7, aggregation: 74.2, joins: 70.5, timeseries: 69.8, nulls: 66.4, ambiguous: 68.9, adversarial: 54.7, overall: 70.0, color: "#14B8A6" },
  { id: 9, model: "CodeS-15B", org: "RUC", size: "15B", cost: 0.08, stateless: 58.5, stateful: 54.2, singleCsv: 62.1, multiCsv: 50.6, oneshot: 55.8, agentic: 56.9, aggregation: 60.4, joins: 55.2, timeseries: 56.8, nulls: 52.1, ambiguous: 54.3, adversarial: 42.6, overall: 56.4, color: "#A855F7" },
  { id: 10, model: "XiYan-SQL-32B", org: "Alibaba Cloud", size: "32B", cost: 0.30, stateless: 69.0, stateful: 67.0, singleCsv: 72.3, multiCsv: 63.7, oneshot: 65.2, agentic: 70.8, aggregation: 71.5, joins: 68.8, timeseries: 67.4, nulls: 65.3, ambiguous: 66.9, adversarial: 53.1, overall: 68.0, color: "#F97316" },
];

const humanBaseline = { model: "Human Expert", stateless: 94.2, stateful: 91.8, singleCsv: 96.1, multiCsv: 89.7, oneshot: 92.5, agentic: 93.5, aggregation: 95.8, joins: 93.2, timeseries: 91.5, nulls: 88.4, ambiguous: 86.7, adversarial: 82.3, overall: 92.9 };

const taskCategories = [
  { id: 'aggregation', name: 'Aggregation', description: 'SUM, AVG, COUNT, GROUP BY', count: 245 },
  { id: 'joins', name: 'Multi-table JOINs', description: 'Complex JOIN operations', count: 189 },
  { id: 'timeseries', name: 'Time Series', description: 'Date parsing, trends', count: 156 },
  { id: 'nulls', name: 'Null Handling', description: 'Missing values, edge cases', count: 134 },
  { id: 'ambiguous', name: 'Ambiguous Queries', description: 'Underspecified NL', count: 112 },
  { id: 'adversarial', name: 'Adversarial', description: 'Injection, destructive ops', count: 78 },
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: typeof benchmarkData[0] }>;
}

// Custom tooltip for scatter chart
const CustomScatterTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900/95 border border-emerald-500/30 rounded-lg p-3 shadow-xl backdrop-blur-sm">
        <p className="font-semibold text-white mb-1">{data.model}</p>
        <p className="text-sm text-gray-400">{data.org}</p>
        <div className="mt-2 space-y-1 text-sm">
          <p className="text-emerald-400">Score: <span className="font-mono">{data.overall.toFixed(1)}%</span></p>
          <p className="text-yellow-400">Cost: <span className="font-mono">${data.cost.toFixed(2)}/task</span></p>
          <p className="text-gray-400">Efficiency: <span className="font-mono text-white">{(data.overall / data.cost).toFixed(1)}</span></p>
        </div>
      </div>
    );
  }
  return null;
};

// Custom tooltip for quadrant chart
const QuadrantTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { model: string; x?: number; y?: number } }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900/95 border border-emerald-500/30 rounded-lg p-3 shadow-xl backdrop-blur-sm">
        <p className="font-semibold text-white mb-1">{data.model}</p>
        <div className="mt-2 space-y-1 text-sm">
          <p className="text-cyan-400">X-Axis: <span className="font-mono">{data.x?.toFixed(1)}%</span></p>
          <p className="text-pink-400">Y-Axis: <span className="font-mono">{data.y?.toFixed(1)}%</span></p>
        </div>
      </div>
    );
  }
  return null;
};

export default function AnalyticsBenchmarkCharts() {
  const [activeTab, setActiveTab] = useState('overview');
  const [quadrantX, setQuadrantX] = useState('stateless');
  const [quadrantY, setQuadrantY] = useState('agentic');
  const [selectedModels, setSelectedModels] = useState(['GPT-4o', 'Claude 3.5 Sonnet', 'DeepSeek-R1']);
  const [showHuman, setShowHuman] = useState(true);

  // Prepare scatter data (Cost vs Performance)
  const scatterData = benchmarkData.map(d => ({
    ...d,
    x: d.cost,
    y: d.overall,
    z: 400
  }));

  // Prepare quadrant data
  const quadrantData = useMemo(() => {
    return benchmarkData.map(d => ({
      ...d,
      x: d[quadrantX as keyof typeof d] as number,
      y: d[quadrantY as keyof typeof d] as number,
    }));
  }, [quadrantX, quadrantY]);

  // Calculate quadrant medians
  const medianX = useMemo(() => {
    const values = benchmarkData.map(d => d[quadrantX as keyof typeof d] as number).sort((a, b) => a - b);
    return values[Math.floor(values.length / 2)];
  }, [quadrantX]);

  const medianY = useMemo(() => {
    const values = benchmarkData.map(d => d[quadrantY as keyof typeof d] as number).sort((a, b) => a - b);
    return values[Math.floor(values.length / 2)];
  }, [quadrantY]);

  // Prepare radar data
  const radarData = taskCategories.map(cat => {
    const point: Record<string, string | number> = { category: cat.name };
    selectedModels.forEach(modelName => {
      const model = benchmarkData.find(d => d.model === modelName);
      if (model) {
        point[modelName] = model[cat.id as keyof typeof model] as number;
      }
    });
    if (showHuman) {
      point['Human Expert'] = humanBaseline[cat.id as keyof typeof humanBaseline] as number;
    }
    return point;
  });

  // Prepare category bar data
  const categoryBarData = taskCategories.map(cat => {
    const avgScore = benchmarkData.reduce((sum, d) => sum + (d[cat.id as keyof typeof d] as number), 0) / benchmarkData.length;
    return {
      name: cat.name,
      avg: avgScore,
      max: Math.max(...benchmarkData.map(d => d[cat.id as keyof typeof d] as number)),
      min: Math.min(...benchmarkData.map(d => d[cat.id as keyof typeof d] as number)),
      human: humanBaseline[cat.id as keyof typeof humanBaseline] as number,
      gap: (humanBaseline[cat.id as keyof typeof humanBaseline] as number) - avgScore
    };
  });

  // Prepare bump chart data (rankings across categories)
  const bumpData = taskCategories.map(cat => {
    const sorted = [...benchmarkData].sort((a, b) => (b[cat.id as keyof typeof b] as number) - (a[cat.id as keyof typeof a] as number));
    const point: Record<string, string | number> = { category: cat.name };
    sorted.forEach((model, idx) => {
      point[model.model] = idx + 1;
    });
    return point;
  });

  const axisOptions = [
    { value: 'stateless', label: 'Stateless' },
    { value: 'stateful', label: 'Stateful' },
    { value: 'singleCsv', label: 'Single CSV' },
    { value: 'multiCsv', label: 'Multi-CSV' },
    { value: 'oneshot', label: 'Oneshot' },
    { value: 'agentic', label: 'Agentic' },
    { value: 'aggregation', label: 'Aggregation' },
    { value: 'joins', label: 'JOINs' },
    { value: 'adversarial', label: 'Adversarial' },
  ];

  const FilterDropdown = ({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; label: string }) => (
    <div className="relative">
      <label className="block text-xs font-mono uppercase tracking-wider text-emerald-400/70 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-black/40 border border-emerald-500/30 rounded-lg py-2 px-3 pr-8 text-emerald-100 font-mono text-sm focus:outline-none focus:border-emerald-400 transition-all cursor-pointer"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-gray-900">{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 bottom-2.5 w-4 h-4 text-emerald-500/50 pointer-events-none" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100">
      {/* Grid background */}
      <div className="fixed inset-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.5) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />

      {/* Header */}
      <header className="relative border-b border-emerald-500/20 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  <span className="text-emerald-400">Analytics</span>
                  <span className="text-white">Bench</span>
                </h1>
                <p className="text-xs text-gray-500 font-mono">v1.0 • 2,847 tasks • 95 databases</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href="#" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm hover:bg-emerald-500/20 transition-colors">
                <Github className="w-4 h-4" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
              <a href="#" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm hover:bg-white/10 transition-colors">
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Paper</span>
              </a>
            </div>
          </div>

          {/* Chart Navigation */}
          <nav className="flex gap-1 mt-5 overflow-x-auto pb-1">
            {[
              { id: 'overview', label: 'Cost vs Performance', icon: TrendingUp },
              { id: 'quadrant', label: 'Four Quadrants', icon: Grid3X3 },
              { id: 'radar', label: 'Radar Compare', icon: Target },
              { id: 'categories', label: 'Category Gap', icon: BarChart3 },
              { id: 'rankings', label: 'Rank Flow', icon: Layers },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-6">

        {/* Cost vs Performance Scatter (ARC-AGI Style) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Cost vs Performance</h2>
                <p className="text-gray-400 text-sm mt-1">True intelligence isn&apos;t just solving problems—it&apos;s solving them efficiently</p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <p>Bubble size = model size</p>
                <p>Higher &amp; left = better efficiency</p>
              </div>
            </div>

            <div className="rounded-2xl bg-black/30 border border-emerald-500/20 p-6">
              <ResponsiveContainer width="100%" height={500}>
                <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Cost"
                    domain={[0, 'auto']}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickFormatter={(v) => `${v}`}
                  >
                    <Label value="Cost per Task ($)" position="bottom" offset={40} fill="#6b7280" />
                  </XAxis>
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Score"
                    domain={[50, 100]}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickFormatter={(v) => `${v}%`}
                  >
                    <Label value="Accuracy (%)" angle={-90} position="left" offset={40} fill="#6b7280" />
                  </YAxis>
                  <ZAxis type="number" dataKey="z" range={[200, 600]} />
                  <Tooltip content={<CustomScatterTooltip />} />

                  {/* Efficiency zones */}
                  <ReferenceArea x1={0} x2={1} y1={70} y2={100} fill="#10b981" fillOpacity={0.05} />
                  <ReferenceLine y={humanBaseline.overall} stroke="#fbbf24" strokeDasharray="5 5" label={{ value: 'Human', fill: '#fbbf24', fontSize: 11 }} />

                  <Scatter data={scatterData} fill="#10b981">
                    {scatterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} stroke={entry.color} strokeWidth={2} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/10">
                {benchmarkData.map(d => (
                  <div key={d.id} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-gray-400">{d.model}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Efficiency Leaders */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Best Overall', model: benchmarkData.reduce((a, b) => a.overall > b.overall ? a : b) },
                { label: 'Best Efficiency', model: benchmarkData.reduce((a, b) => (a.overall/a.cost) > (b.overall/b.cost) ? a : b) },
                { label: 'Best Budget', model: benchmarkData.filter(d => d.cost < 0.5).reduce((a, b) => a.overall > b.overall ? a : b) },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
                  <p className="text-xs text-emerald-400/70 uppercase tracking-wider">{item.label}</p>
                  <p className="text-lg font-bold text-white mt-1">{item.model.model}</p>
                  <p className="text-sm text-gray-400">{item.model.overall.toFixed(1)}% @ ${item.model.cost.toFixed(2)}/task</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Four Quadrant Analysis */}
        {activeTab === 'quadrant' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Four Quadrant Analysis</h2>
                <p className="text-gray-400 text-sm mt-1">Compare any two dimensions to find model strengths</p>
              </div>
              <div className="flex gap-3">
                <FilterDropdown value={quadrantX} onChange={setQuadrantX} options={axisOptions} label="X-Axis" />
                <FilterDropdown value={quadrantY} onChange={setQuadrantY} options={axisOptions} label="Y-Axis" />
              </div>
            </div>

            <div className="rounded-2xl bg-black/30 border border-emerald-500/20 p-6">
              <ResponsiveContainer width="100%" height={550}>
                <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />

                  {/* Quadrant backgrounds */}
                  <ReferenceArea x1={medianX} x2={100} y1={medianY} y2={100} fill="#10b981" fillOpacity={0.08} label={{ value: '★ LEADERS', fill: '#10b981', fontSize: 11 }} />
                  <ReferenceArea x1={0} x2={medianX} y1={medianY} y2={100} fill="#3b82f6" fillOpacity={0.08} label={{ value: 'Y Specialists', fill: '#3b82f6', fontSize: 11 }} />
                  <ReferenceArea x1={medianX} x2={100} y1={0} y2={medianY} fill="#f59e0b" fillOpacity={0.08} label={{ value: 'X Specialists', fill: '#f59e0b', fontSize: 11 }} />
                  <ReferenceArea x1={0} x2={medianX} y1={0} y2={medianY} fill="#ef4444" fillOpacity={0.05} label={{ value: 'Laggards', fill: '#ef4444', fontSize: 11 }} />

                  {/* Median lines */}
                  <ReferenceLine x={medianX} stroke="#4b5563" strokeDasharray="4 4" />
                  <ReferenceLine y={medianY} stroke="#4b5563" strokeDasharray="4 4" />

                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={[50, 100]}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickFormatter={(v) => `${v}%`}
                  >
                    <Label value={axisOptions.find(o => o.value === quadrantX)?.label} position="bottom" offset={40} fill="#6b7280" />
                  </XAxis>
                  <YAxis
                    type="number"
                    dataKey="y"
                    domain={[50, 100]}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickFormatter={(v) => `${v}%`}
                  >
                    <Label value={axisOptions.find(o => o.value === quadrantY)?.label} angle={-90} position="left" offset={40} fill="#6b7280" />
                  </YAxis>
                  <ZAxis range={[300, 300]} />
                  <Tooltip content={<QuadrantTooltip />} />

                  <Scatter data={quadrantData}>
                    {quadrantData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>

              {/* Model Labels */}
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/10">
                {benchmarkData.map(d => (
                  <div key={d.id} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-gray-400">{d.model}</span>
                    <span className="text-gray-600">({(d[quadrantX as keyof typeof d] as number).toFixed(0)}, {(d[quadrantY as keyof typeof d] as number).toFixed(0)})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quadrant Insights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Leaders', desc: 'High on both axes', color: 'emerald', count: quadrantData.filter(d => d.x >= medianX && d.y >= medianY).length },
                { label: `${axisOptions.find(o => o.value === quadrantY)?.label} Focus`, desc: 'Strong Y, weak X', color: 'blue', count: quadrantData.filter(d => d.x < medianX && d.y >= medianY).length },
                { label: `${axisOptions.find(o => o.value === quadrantX)?.label} Focus`, desc: 'Strong X, weak Y', color: 'yellow', count: quadrantData.filter(d => d.x >= medianX && d.y < medianY).length },
                { label: 'Laggards', desc: 'Low on both axes', color: 'red', count: quadrantData.filter(d => d.x < medianX && d.y < medianY).length },
              ].map((q, i) => (
                <div key={i} className={`p-3 rounded-lg border`} style={{ backgroundColor: `rgba(${q.color === 'emerald' ? '16,185,129' : q.color === 'blue' ? '59,130,246' : q.color === 'yellow' ? '245,158,11' : '239,68,68'}, 0.1)`, borderColor: `rgba(${q.color === 'emerald' ? '16,185,129' : q.color === 'blue' ? '59,130,246' : q.color === 'yellow' ? '245,158,11' : '239,68,68'}, 0.3)` }}>
                  <p className="text-xs text-gray-400">{q.label}</p>
                  <p className="text-2xl font-bold text-white font-mono">{q.count}</p>
                  <p className="text-xs text-gray-500">{q.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Radar Chart Comparison */}
        {activeTab === 'radar' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Multi-Dimensional Comparison</h2>
                <p className="text-gray-400 text-sm mt-1">Compare models across all task categories</p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showHuman}
                    onChange={(e) => setShowHuman(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500"
                  />
                  Show Human Baseline
                </label>
              </div>
            </div>

            {/* Model selector */}
            <div className="flex flex-wrap gap-2">
              {benchmarkData.map(d => (
                <button
                  key={d.id}
                  onClick={() => {
                    if (selectedModels.includes(d.model)) {
                      setSelectedModels(selectedModels.filter(m => m !== d.model));
                    } else if (selectedModels.length < 5) {
                      setSelectedModels([...selectedModels, d.model]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedModels.includes(d.model)
                      ? 'bg-white/10 border-2 text-white'
                      : 'bg-black/20 border border-white/10 text-gray-400 hover:text-white'
                  }`}
                  style={{ borderColor: selectedModels.includes(d.model) ? d.color : undefined }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.model}
                </button>
              ))}
            </div>

            <div className="rounded-2xl bg-black/30 border border-emerald-500/20 p-6">
              <ResponsiveContainer width="100%" height={500}>
                <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="category" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />

                  {showHuman && (
                    <Radar
                      name="Human Expert"
                      dataKey="Human Expert"
                      stroke="#fbbf24"
                      fill="#fbbf24"
                      fillOpacity={0.1}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  )}

                  {selectedModels.map(modelName => {
                    const model = benchmarkData.find(d => d.model === modelName);
                    return (
                      <Radar
                        key={modelName}
                        name={modelName}
                        dataKey={modelName}
                        stroke={model?.color}
                        fill={model?.color}
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    );
                  })}

                  <Legend wrapperStyle={{ paddingTop: 20 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Selected model stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedModels.map(modelName => {
                const model = benchmarkData.find(d => d.model === modelName);
                if (!model) return null;
                const strongestCat = taskCategories.reduce((a, b) => (model[a.id as keyof typeof model] as number) > (model[b.id as keyof typeof model] as number) ? a : b);
                const weakestCat = taskCategories.reduce((a, b) => (model[a.id as keyof typeof model] as number) < (model[b.id as keyof typeof model] as number) ? a : b);
                return (
                  <div key={modelName} className="p-4 rounded-xl bg-black/20 border border-white/10" style={{ borderLeftColor: model.color, borderLeftWidth: 3 }}>
                    <p className="font-semibold text-white">{model.model}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{model.org}</p>
                    <div className="mt-3 space-y-1 text-xs">
                      <p className="text-emerald-400">Strongest: {strongestCat.name} ({(model[strongestCat.id as keyof typeof model] as number).toFixed(1)}%)</p>
                      <p className="text-red-400">Weakest: {weakestCat.name} ({(model[weakestCat.id as keyof typeof model] as number).toFixed(1)}%)</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Gap Analysis */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Human-AI Gap by Category</h2>
              <p className="text-gray-400 text-sm mt-1">Where do models struggle most compared to humans?</p>
            </div>

            <div className="rounded-2xl bg-black/30 border border-emerald-500/20 p-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={categoryBarData} layout="vertical" margin={{ top: 20, right: 30, bottom: 20, left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} width={90} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="avg" name="Model Average" fill="#10b981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="human" name="Human Expert" fill="#fbbf24" radius={[0, 4, 4, 0]} fillOpacity={0.5} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gap Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {categoryBarData.sort((a, b) => b.gap - a.gap).map((cat, i) => (
                <div key={cat.name} className={`p-3 rounded-xl border ${i === 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-black/20 border-white/10'}`}>
                  <p className="text-xs text-gray-400 truncate">{cat.name}</p>
                  <p className={`text-xl font-bold font-mono mt-1 ${i === 0 ? 'text-red-400' : 'text-white'}`}>
                    -{cat.gap.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">gap to human</p>
                </div>
              ))}
            </div>

            {/* Insights */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-red-400" />
                Key Insight: Adversarial Tasks
              </h3>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                The largest human-AI gap ({categoryBarData.find(c => c.name === 'Adversarial')?.gap.toFixed(1)}%) is in <strong className="text-white">Adversarial tasks</strong>—prompt injections,
                destructive operations, and edge cases. This is your benchmark&apos;s <strong className="text-emerald-400">unique value proposition</strong>: catching failures others miss.
              </p>
            </div>
          </div>
        )}

        {/* Rank Flow / Bump Chart */}
        {activeTab === 'rankings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Ranking Flow Across Categories</h2>
              <p className="text-gray-400 text-sm mt-1">How model rankings shift across different task types</p>
            </div>

            <div className="rounded-2xl bg-black/30 border border-emerald-500/20 p-6">
              <ResponsiveContainer width="100%" height={450}>
                <LineChart data={bumpData} margin={{ top: 20, right: 30, bottom: 60, left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis
                    dataKey="category"
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    reversed
                    domain={[1, 10]}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickFormatter={(v) => `#${v}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value, name) => [`Rank #${value}`, name]}
                  />

                  {benchmarkData.slice(0, 6).map(model => (
                    <Line
                      key={model.model}
                      type="monotone"
                      dataKey={model.model}
                      stroke={model.color}
                      strokeWidth={2}
                      dot={{ fill: model.color, strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/10">
                {benchmarkData.slice(0, 6).map(d => (
                  <div key={d.id} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-gray-300">{d.model}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Consistency Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                <h3 className="font-semibold text-white mb-3">Most Consistent</h3>
                <div className="space-y-2">
                  {benchmarkData
                    .map(d => ({
                      ...d,
                      variance: Math.sqrt(taskCategories.reduce((sum, cat) => sum + Math.pow((d[cat.id as keyof typeof d] as number) - d.overall, 2), 0) / taskCategories.length)
                    }))
                    .sort((a, b) => a.variance - b.variance)
                    .slice(0, 3)
                    .map((d) => (
                      <div key={d.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-sm text-gray-300">{d.model}</span>
                        </div>
                        <span className="text-xs text-emerald-400 font-mono">σ = {d.variance.toFixed(2)}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
              <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                <h3 className="font-semibold text-white mb-3">Most Variable</h3>
                <div className="space-y-2">
                  {benchmarkData
                    .map(d => ({
                      ...d,
                      variance: Math.sqrt(taskCategories.reduce((sum, cat) => sum + Math.pow((d[cat.id as keyof typeof d] as number) - d.overall, 2), 0) / taskCategories.length)
                    }))
                    .sort((a, b) => b.variance - a.variance)
                    .slice(0, 3)
                    .map((d) => (
                      <div key={d.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-sm text-gray-300">{d.model}</span>
                        </div>
                        <span className="text-xs text-orange-400 font-mono">σ = {d.variance.toFixed(2)}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/5 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>AnalyticsBench © 2025 • Open benchmark for analytics agents</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-emerald-400 transition-colors">Submit Model</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">API</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">Discord</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
