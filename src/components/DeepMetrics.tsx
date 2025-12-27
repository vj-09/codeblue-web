'use client';

import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ReferenceLine, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, LabelList, ZAxis, ReferenceArea, PieChart, Pie
} from 'recharts';

// Complete model data with all metrics including COST
const rawData = [
  { model: "claude-opus-4.5", name: "Claude Opus 4.5", shortName: "Claude", provider: "Anthropic", color: "#D97706",
    total: 61.3, reward: 0.578, time: 33.6, cost: 0.89,
    correct: 46, partial: 2, wrong: 27, total_n: 75, perfect: 13, zero: 8,
    L5: 66.7, L6: 56.7, isLeader: true },
  { model: "qwen3-max", name: "Qwen3 Max", shortName: "Qwen3", provider: "Qwen", color: "#7C3AED",
    total: 46.7, reward: 0.473, time: 22.8, cost: 0.12,
    correct: 35, partial: 8, wrong: 32, total_n: 75, perfect: 7, zero: 10,
    L5: 57.1, L6: 33.3, isBestValue: true },
  { model: "mistral-large", name: "Mistral Large", shortName: "Mistral-L", provider: "Mistral", color: "#DC2626",
    total: 42.7, reward: 0.424, time: 29.0, cost: 0.18,
    correct: 32, partial: 2, wrong: 41, total_n: 75, perfect: 5, zero: 8,
    L5: 47.6, L6: 40.0 },
  { model: "llama-4-maverick", name: "Llama 4 Maverick", shortName: "Llama-4", provider: "Meta", color: "#0891B2",
    total: 36.0, reward: 0.375, time: 20.7, cost: 0.08,
    correct: 27, partial: 6, wrong: 42, total_n: 75, perfect: 3, zero: 10,
    L5: 47.6, L6: 33.3 },
  { model: "mistral-small", name: "Mistral Small", shortName: "Mistral-S", provider: "Mistral", color: "#F87171",
    total: 34.7, reward: 0.343, time: 27.7, cost: 0.05,
    correct: 26, partial: 2, wrong: 47, total_n: 75, perfect: 5, zero: 13,
    L5: 14.3, L6: 56.7 },
  { model: "gemini-3-pro", name: "Gemini 3 Pro", shortName: "Gemini-P", provider: "Google", color: "#2563EB",
    total: 28.0, reward: 0.294, time: 92.4, cost: 0.35,
    correct: 21, partial: 14, wrong: 40, total_n: 75, perfect: 5, zero: 16,
    L5: 38.1, L6: 0.0 },
  { model: "deepseek-v3.2", name: "DeepSeek v3.2", shortName: "DeepSeek", provider: "DeepSeek", color: "#059669",
    total: 12.0, reward: 0.107, time: 65.7, cost: 0.02,
    correct: 9, partial: 0, wrong: 66, total_n: 75, perfect: 0, zero: 17,
    L5: 0.0, L6: 20.0 },
  { model: "intellect-3", name: "Intellect 3", shortName: "Intellect", provider: "Prime", color: "#DB2777",
    total: 10.7, reward: 0.101, time: 177.4, cost: 0.15,
    correct: 8, partial: 2, wrong: 65, total_n: 75, perfect: 0, zero: 20,
    L5: 4.8, L6: 13.3 },
  { model: "gemini-3-flash", name: "Gemini 3 Flash", shortName: "Gemini-F", provider: "Google", color: "#60A5FA",
    total: 5.3, reward: 0.056, time: 43.7, cost: 0.01,
    correct: 4, partial: 1, wrong: 70, total_n: 75, perfect: 0, zero: 22,
    L5: 0.0, L6: 3.3 },
];

// Enriched data with derived metrics
const enrichedModels = rawData.map(m => ({
  ...m,
  costPerCorrect: m.correct > 0 ? (m.cost * 75) / m.correct : 999,
  speedScore: Math.max(0, 100 - m.time / 2),
  consistencyScore: (m.perfect / 13) * 100, // normalized to Claude's 13
  consistencyColor: m.perfect >= 10 ? '#22C55E' : m.perfect >= 5 ? '#F59E0B' : '#EF4444',
  speedTier: m.time < 30 ? 'fast' : m.time < 60 ? 'medium' : 'slow',
  costTier: m.cost < 0.10 ? 'cheap' : m.cost < 0.30 ? 'mid' : 'expensive',
  accTier: m.total > 40 ? 'high' : m.total > 20 ? 'mid' : 'low',
  successRate: (m.correct / 75) * 100,
  failureRate: (m.wrong / 75) * 100,
}));

// Thresholds for quadrants
const COST_THRESHOLD = 0.20;
const ACC_THRESHOLD = 35;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomScatterLabel = (props: any) => {
  const { x, y, value } = props;
  if (typeof x !== 'number' || typeof y !== 'number') return null;
  return (
    <text x={x} y={y - 14} fill="#fff" fontSize={10} textAnchor="middle" fontWeight="600">
      {value}
    </text>
  );
};

// Get quadrant zone for a model
const getQuadrantZone = (cost: number, acc: number) => {
  if (cost < COST_THRESHOLD && acc >= ACC_THRESHOLD) return { zone: 'VALUE PICK', color: '#22C55E' };
  if (cost >= COST_THRESHOLD && acc >= ACC_THRESHOLD) return { zone: 'PREMIUM', color: '#D97706' };
  if (cost < COST_THRESHOLD && acc < ACC_THRESHOLD) return { zone: 'BUDGET', color: '#6B7280' };
  return { zone: 'AVOID', color: '#EF4444' };
};

type AxisKey = 'cost' | 'total' | 'time' | 'correct' | 'L5' | 'L6' | 'perfect';
type SizeKey = 'speedScore' | 'correct' | 'perfect' | 'costPerCorrect';

const axisOptions: { value: AxisKey; label: string }[] = [
  { value: 'cost', label: 'Cost ($)' },
  { value: 'total', label: 'Accuracy (%)' },
  { value: 'time', label: 'Time (s)' },
  { value: 'correct', label: 'Correct (#)' },
  { value: 'L5', label: 'L5 Hard (%)' },
  { value: 'L6', label: 'L6 Harder (%)' },
  { value: 'perfect', label: 'Perfect Tasks' },
];

const sizeOptions: { value: SizeKey; label: string }[] = [
  { value: 'speedScore', label: 'Speed' },
  { value: 'correct', label: 'Correct Answers' },
  { value: 'perfect', label: 'Perfect Tasks' },
  { value: 'costPerCorrect', label: 'Value (inverted)' },
];

export default function DeepMetrics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [vizOption, setVizOption] = useState(1);

  // Filter states
  const [xAxis, setXAxis] = useState<AxisKey>('cost');
  const [yAxis, setYAxis] = useState<AxisKey>('total');
  const [bubbleSize, setBubbleSize] = useState<SizeKey>('speedScore');
  const [showOnlyTop, setShowOnlyTop] = useState(false);
  const [reliabilityView, setReliabilityView] = useState<'scatter' | 'breakdown' | 'comparison'>('scatter');

  const filteredModels = useMemo(() => {
    if (showOnlyTop) {
      return enrichedModels.filter(m => m.total >= 30);
    }
    return enrichedModels;
  }, [showOnlyTop]);

  const claudeData = enrichedModels[0];
  const qwenData = enrichedModels[1];

  // Radar data for leader comparison
  const leaderRadar = useMemo(() => [
    { metric: 'Accuracy', Claude: 100, Qwen3: (qwenData.total / claudeData.total) * 100, avg: 30 },
    { metric: 'Value', Claude: (qwenData.costPerCorrect / claudeData.costPerCorrect) * 100, Qwen3: 100, avg: 50 },
    { metric: 'Speed', Claude: (qwenData.time / claudeData.time) * 100, Qwen3: 100, avg: 60 },
    { metric: 'Consistency', Claude: 100, Qwen3: (qwenData.perfect / claudeData.perfect) * 100, avg: 25 },
    { metric: 'L6 Hard', Claude: 100, Qwen3: (qwenData.L6 / claudeData.L6) * 100, avg: 20 },
  ], [claudeData, qwenData]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'explore', label: 'Explore' },
    { id: 'reliability', label: 'Reliability' },
    { id: 'insights', label: 'Insights' },
  ];

  const vizOptions = [
    { id: 1, label: '3D Bubble' },
    { id: 2, label: 'Consistency Map' },
    { id: 3, label: 'Quadrant Zones' },
  ];

  return (
    <div className="space-y-6">
      {/* HERO: Leader Spotlight */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-900/30 via-black/60 to-purple-900/30 border border-orange-500/20 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />

        <div className="relative grid md:grid-cols-2 gap-6">
          {/* Claude - The Leader */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-orange-400 text-xs font-medium uppercase tracking-wider">Performance Leader</span>
            </div>
            <h2 className="text-3xl font-bold text-white">Claude Opus 4.5</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-3xl font-bold text-orange-400">{claudeData.total}%</div>
                <div className="text-xs text-gray-500">Accuracy</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-300">{claudeData.perfect}</div>
                <div className="text-xs text-gray-500">Perfect Tasks</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-200">{claudeData.L6}%</div>
                <div className="text-xs text-gray-500">L6 Hardest</div>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30">Most Accurate</span>
              <span className="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30">Most Consistent</span>
              <span className="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30">Best on Hard Tasks</span>
            </div>
          </div>

          {/* Qwen - Best Value */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-purple-400 text-xs font-medium uppercase tracking-wider">Best Value</span>
            </div>
            <h2 className="text-3xl font-bold text-white">Qwen3 Max</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-3xl font-bold text-purple-400">{qwenData.total}%</div>
                <div className="text-xs text-gray-500">Accuracy</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-300">${qwenData.cost}</div>
                <div className="text-xs text-gray-500">Per Task</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-400">${qwenData.costPerCorrect.toFixed(2)}</div>
                <div className="text-xs text-gray-500">Per Correct</div>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30">7x Cheaper than Claude</span>
              <span className="px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Best $/Accuracy Ratio</span>
            </div>
          </div>
        </div>

        {/* Quick comparison bar */}
        <div className="mt-6 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Claude leads by <span className="text-orange-400 font-bold">+14.6%</span> accuracy</span>
            <span>Qwen costs <span className="text-purple-400 font-bold">86%</span> less per task</span>
            <span>9 models tested • 675 total rollouts</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-black/40 text-gray-500 hover:text-gray-300 border border-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Leader Comparison Radar */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/5">
            <h3 className="text-sm font-medium text-gray-300 mb-1">Leader Comparison: Claude vs Qwen3</h3>
            <p className="text-xs text-gray-600 mb-4">Normalized scores (100 = best in category)</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={leaderRadar}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 9 }} />
                    <Radar name="Claude Opus 4.5" dataKey="Claude" stroke="#D97706" fill="#D97706" fillOpacity={0.3} strokeWidth={2} />
                    <Radar name="Qwen3 Max" dataKey="Qwen3" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.3} strokeWidth={2} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-orange-400 font-medium">Claude Opus 4.5</span>
                    <span className="text-xs text-gray-500">Premium Choice</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Dominates accuracy, consistency, and hard tasks. Worth the premium for mission-critical work.</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-400 font-medium">Qwen3 Max</span>
                    <span className="text-xs text-gray-500">Value Champion</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">76% of Claude&apos;s accuracy at 13% of the cost. Best ROI for high-volume workloads.</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/30">
                  <div className="text-xs text-gray-500">Recommendation</div>
                  <p className="text-xs text-gray-300 mt-1">Use <span className="text-orange-400">Claude</span> for complex L6 tasks, <span className="text-purple-400">Qwen3</span> for bulk L5 processing.</p>
                </div>
              </div>
            </div>
          </div>

          {/* All Models Quick View */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/5">
            <h3 className="text-sm font-medium text-gray-300 mb-3">All Models at a Glance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrichedModels} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis type="number" domain={[0, 70]} stroke="#6B7280" fontSize={10} />
                  <YAxis type="category" dataKey="shortName" width={70} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', fontSize: 11 }}
                    formatter={(value) => [`${value}%`, 'Accuracy']}
                  />
                  <Bar dataKey="total" fill="#6366F1">
                    {enrichedModels.map((entry, index) => (
                      <Cell key={index} fill={entry.color} fillOpacity={index < 2 ? 1 : 0.6} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* EXPLORE TAB - Interactive Visualizations */}
      {activeTab === 'explore' && (
        <div className="space-y-4">
          {/* Viz Selector + Filters */}
          <div className="flex flex-wrap items-center gap-4 p-3 rounded-lg bg-black/30 border border-white/5">
            <div className="flex gap-2">
              {vizOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setVizOption(opt.id)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                    vizOption === opt.id
                      ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40'
                      : 'bg-black/40 text-gray-500 hover:text-gray-300 border border-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-gray-700" />

            {/* Dynamic Axis Controls for 3D Bubble */}
            {vizOption === 1 && (
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">X:</span>
                  <select
                    value={xAxis}
                    onChange={(e) => setXAxis(e.target.value as AxisKey)}
                    className="bg-black/60 border border-gray-700 rounded px-2 py-1 text-gray-300"
                  >
                    {axisOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Y:</span>
                  <select
                    value={yAxis}
                    onChange={(e) => setYAxis(e.target.value as AxisKey)}
                    className="bg-black/60 border border-gray-700 rounded px-2 py-1 text-gray-300"
                  >
                    {axisOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Size:</span>
                  <select
                    value={bubbleSize}
                    onChange={(e) => setBubbleSize(e.target.value as SizeKey)}
                    className="bg-black/60 border border-gray-700 rounded px-2 py-1 text-gray-300"
                  >
                    {sizeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer ml-auto">
              <input
                type="checkbox"
                checked={showOnlyTop}
                onChange={(e) => setShowOnlyTop(e.target.checked)}
                className="rounded border-gray-600 bg-black/60"
              />
              Show only top performers (&gt;30%)
            </label>
          </div>

          {/* OPTION 1: Dynamic 3D Bubble */}
          {vizOption === 1 && (
            <div className="p-4 rounded-xl bg-black/40 border border-white/5">
              <h3 className="text-sm font-medium text-gray-300 mb-1">3D Bubble Explorer</h3>
              <p className="text-xs text-gray-600 mb-4">
                X: {axisOptions.find(a => a.value === xAxis)?.label} | Y: {axisOptions.find(a => a.value === yAxis)?.label} | Size: {sizeOptions.find(s => s.value === bubbleSize)?.label}
              </p>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 30, right: 40, bottom: 50, left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                    <XAxis
                      type="number"
                      dataKey={xAxis}
                      stroke="#6B7280"
                      fontSize={10}
                      tickFormatter={(v) => xAxis === 'cost' ? `$${v.toFixed(2)}` : `${v}`}
                      label={{ value: axisOptions.find(a => a.value === xAxis)?.label, position: 'bottom', fill: '#6B7280', fontSize: 10, dy: 15 }}
                    />
                    <YAxis
                      type="number"
                      dataKey={yAxis}
                      stroke="#6B7280"
                      fontSize={10}
                      label={{ value: axisOptions.find(a => a.value === yAxis)?.label, angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 10 }}
                    />
                    <ZAxis type="number" dataKey={bubbleSize} range={[100, 800]} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 text-xs">
                              <p className="font-bold text-white">{d.name}</p>
                              <p className="text-blue-400">{axisOptions.find(a => a.value === xAxis)?.label}: {xAxis === 'cost' ? `$${d[xAxis].toFixed(2)}` : d[xAxis]}</p>
                              <p className="text-emerald-400">{axisOptions.find(a => a.value === yAxis)?.label}: {d[yAxis]}{yAxis !== 'correct' && yAxis !== 'perfect' ? '%' : ''}</p>
                              <p className="text-purple-400">{sizeOptions.find(s => s.value === bubbleSize)?.label}: {typeof d[bubbleSize] === 'number' ? d[bubbleSize].toFixed(1) : d[bubbleSize]}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter data={filteredModels}>
                      {filteredModels.map((entry, index) => (
                        <Cell key={index} fill={entry.color} fillOpacity={0.7} stroke={entry.color} strokeWidth={2} />
                      ))}
                      <LabelList dataKey="shortName" content={CustomScatterLabel} />
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 justify-center">
                {filteredModels.map(m => (
                  <div key={m.model} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-black/30">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                    <span className="text-gray-400">{m.shortName}</span>
                    {m.isLeader && <span className="text-orange-400 text-[10px]">★</span>}
                    {m.isBestValue && <span className="text-purple-400 text-[10px]">$</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OPTION 2: Consistency Map (Bubble + Color) */}
          {vizOption === 2 && (
            <div className="p-4 rounded-xl bg-black/40 border border-white/5">
              <h3 className="text-sm font-medium text-gray-300 mb-1">Consistency Map</h3>
              <p className="text-xs text-gray-600 mb-4">X: Cost | Y: Accuracy | Size: Correct Answers | Color: Consistency (green = reliable)</p>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 30, right: 40, bottom: 50, left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                    <XAxis
                      type="number"
                      dataKey="cost"
                      domain={[0, 1]}
                      stroke="#6B7280"
                      fontSize={10}
                      tickFormatter={(v) => `$${v.toFixed(2)}`}
                      label={{ value: 'Cost per Task ($)', position: 'bottom', fill: '#6B7280', fontSize: 10, dy: 15 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="total"
                      domain={[0, 70]}
                      stroke="#6B7280"
                      fontSize={10}
                      label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 10 }}
                    />
                    <ZAxis type="number" dataKey="correct" range={[80, 600]} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 text-xs">
                              <p className="font-bold text-white">{d.name}</p>
                              <p className="text-blue-400">Cost: ${d.cost.toFixed(2)}</p>
                              <p className="text-emerald-400">Accuracy: {d.total}%</p>
                              <p className="text-orange-400">Correct: {d.correct}/75</p>
                              <p style={{ color: d.consistencyColor }}>Perfect Tasks: {d.perfect}/25</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter data={filteredModels}>
                      {filteredModels.map((entry, index) => (
                        <Cell key={index} fill={entry.consistencyColor} fillOpacity={0.6} stroke={entry.consistencyColor} strokeWidth={2} />
                      ))}
                      <LabelList dataKey="shortName" content={CustomScatterLabel} />
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex gap-4 justify-center text-xs">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Reliable (10+ perfect)</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-500" /> Mixed (5-9 perfect)</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /> Unreliable (&lt;5 perfect)</div>
              </div>
            </div>
          )}

          {/* OPTION 3: Quadrant Zones */}
          {vizOption === 3 && (
            <div className="p-4 rounded-xl bg-black/40 border border-white/5">
              <h3 className="text-sm font-medium text-gray-300 mb-1">Quadrant Decision Map</h3>
              <p className="text-xs text-gray-600 mb-4">
                Thresholds: Cost ${COST_THRESHOLD} | Accuracy {ACC_THRESHOLD}% | Dot color = Speed tier
              </p>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 30, right: 40, bottom: 50, left: 60 }}>
                    {/* Quadrant zone backgrounds */}
                    <ReferenceArea x1={0} x2={COST_THRESHOLD} y1={ACC_THRESHOLD} y2={70} fill="#22C55E" fillOpacity={0.08} />
                    <ReferenceArea x1={COST_THRESHOLD} x2={1} y1={ACC_THRESHOLD} y2={70} fill="#D97706" fillOpacity={0.08} />
                    <ReferenceArea x1={0} x2={COST_THRESHOLD} y1={0} y2={ACC_THRESHOLD} fill="#6B7280" fillOpacity={0.08} />
                    <ReferenceArea x1={COST_THRESHOLD} x2={1} y1={0} y2={ACC_THRESHOLD} fill="#EF4444" fillOpacity={0.08} />

                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                    <XAxis
                      type="number"
                      dataKey="cost"
                      domain={[0, 1]}
                      stroke="#6B7280"
                      fontSize={10}
                      tickFormatter={(v) => `$${v.toFixed(2)}`}
                      label={{ value: 'Cost per Task ($)', position: 'bottom', fill: '#6B7280', fontSize: 10, dy: 15 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="total"
                      domain={[0, 70]}
                      stroke="#6B7280"
                      fontSize={10}
                      label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 10 }}
                    />
                    <ReferenceLine x={COST_THRESHOLD} stroke="#fff" strokeWidth={2} strokeDasharray="8 4" />
                    <ReferenceLine y={ACC_THRESHOLD} stroke="#fff" strokeWidth={2} strokeDasharray="8 4" />

                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          const zone = getQuadrantZone(d.cost, d.total);
                          return (
                            <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 text-xs">
                              <p className="font-bold text-white">{d.name}</p>
                              <p style={{ color: zone.color }} className="font-medium">{zone.zone}</p>
                              <p className="text-gray-400 mt-1">Cost: ${d.cost.toFixed(2)} | Acc: {d.total}%</p>
                              <p className="text-gray-400">Speed: {d.time.toFixed(0)}s ({d.speedTier})</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter data={filteredModels}>
                      {filteredModels.map((entry, index) => {
                        const speedColor = entry.speedTier === 'fast' ? '#22C55E' : entry.speedTier === 'medium' ? '#F59E0B' : '#EF4444';
                        return <Cell key={index} fill={speedColor} stroke="#fff" strokeWidth={2} />;
                      })}
                      <LabelList dataKey="shortName" content={CustomScatterLabel} />
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded text-center bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-emerald-400 font-bold">VALUE PICK</div>
                  <div className="text-gray-500">Cheap + Accurate</div>
                  <div className="text-emerald-300 text-[10px] mt-1">Qwen3, Mistral-L</div>
                </div>
                <div className="p-2 rounded text-center bg-orange-500/10 border border-orange-500/20">
                  <div className="text-orange-400 font-bold">PREMIUM</div>
                  <div className="text-gray-500">High Cost, High Acc</div>
                  <div className="text-orange-300 text-[10px] mt-1">Claude Opus</div>
                </div>
                <div className="p-2 rounded text-center bg-gray-500/10 border border-gray-500/20">
                  <div className="text-gray-400 font-bold">BUDGET</div>
                  <div className="text-gray-500">Cheap but Weak</div>
                  <div className="text-gray-300 text-[10px] mt-1">Llama, DeepSeek</div>
                </div>
                <div className="p-2 rounded text-center bg-red-500/10 border border-red-500/20">
                  <div className="text-red-400 font-bold">AVOID</div>
                  <div className="text-gray-500">Pricey + Weak</div>
                  <div className="text-red-300 text-[10px] mt-1">Gemini Pro, Intellect</div>
                </div>
              </div>
              <div className="mt-3 flex justify-center gap-4 text-xs">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Fast (&lt;30s)</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-500" /> Medium (30-60s)</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /> Slow (&gt;60s)</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RELIABILITY TAB - Engaging Format */}
      {activeTab === 'reliability' && (
        <div className="space-y-4">
          {/* View Selector */}
          <div className="flex gap-2">
            {[
              { id: 'scatter', label: 'Success vs Failure' },
              { id: 'breakdown', label: 'Outcome Breakdown' },
              { id: 'comparison', label: 'Consistency Battle' },
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setReliabilityView(v.id as typeof reliabilityView)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  reliabilityView === v.id
                    ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40'
                    : 'bg-black/40 text-gray-500 hover:text-gray-300 border border-white/5'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Success vs Failure Scatter */}
          {reliabilityView === 'scatter' && (
            <div className="p-4 rounded-xl bg-black/40 border border-white/5">
              <h3 className="text-sm font-medium text-gray-300 mb-1">Success Rate vs Failure Rate</h3>
              <p className="text-xs text-gray-600 mb-4">Upper-left = best (high success, low failure). Size = partial answers.</p>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 30, right: 40, bottom: 50, left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                    <XAxis
                      type="number"
                      dataKey="failureRate"
                      domain={[0, 100]}
                      stroke="#6B7280"
                      fontSize={10}
                      label={{ value: 'Failure Rate %', position: 'bottom', fill: '#EF4444', fontSize: 10, dy: 15 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="successRate"
                      domain={[0, 70]}
                      stroke="#6B7280"
                      fontSize={10}
                      label={{ value: 'Success Rate %', angle: -90, position: 'insideLeft', fill: '#22C55E', fontSize: 10 }}
                    />
                    <ZAxis type="number" dataKey="partial" range={[80, 400]} />
                    <ReferenceLine x={50} stroke="#6B7280" strokeDasharray="4 4" />
                    <ReferenceLine y={30} stroke="#6B7280" strokeDasharray="4 4" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 text-xs">
                              <p className="font-bold text-white">{d.name}</p>
                              <p className="text-emerald-400">Success: {d.correct}/75 ({d.successRate.toFixed(1)}%)</p>
                              <p className="text-red-400">Failures: {d.wrong}/75 ({d.failureRate.toFixed(1)}%)</p>
                              <p className="text-amber-400">Partials: {d.partial}/75</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter data={enrichedModels}>
                      {enrichedModels.map((entry, index) => (
                        <Cell key={index} fill={entry.color} fillOpacity={0.7} stroke={entry.color} strokeWidth={2} />
                      ))}
                      <LabelList dataKey="shortName" content={CustomScatterLabel} />
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Outcome Breakdown - Pie Charts */}
          {reliabilityView === 'breakdown' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {enrichedModels.slice(0, 6).map(m => (
                <div key={m.model} className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                    <span className="text-sm font-medium text-white">{m.shortName}</span>
                    {m.isLeader && <span className="text-orange-400 text-xs">★ Leader</span>}
                  </div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Correct', value: m.correct, fill: '#166534' },
                            { name: 'Partial', value: m.partial, fill: '#854D0E' },
                            { name: 'Wrong', value: m.wrong, fill: '#7F1D1D' },
                          ]}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={45}
                          strokeWidth={0}
                        />
                        <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-around text-xs mt-2">
                    <span className="text-emerald-500">{m.correct}</span>
                    <span className="text-amber-500">{m.partial}</span>
                    <span className="text-red-500">{m.wrong}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Consistency Battle */}
          {reliabilityView === 'comparison' && (
            <div className="p-4 rounded-xl bg-black/40 border border-white/5">
              <h3 className="text-sm font-medium text-gray-300 mb-1">Consistency Battle: Perfect vs Zero Tasks</h3>
              <p className="text-xs text-gray-600 mb-4">How many tasks did each model ace (3/3) vs completely fail (0/3)?</p>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 30, right: 40, bottom: 50, left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                    <XAxis
                      type="number"
                      dataKey="zero"
                      domain={[0, 25]}
                      stroke="#6B7280"
                      fontSize={10}
                      label={{ value: 'Zero Tasks (0/3 correct)', position: 'bottom', fill: '#EF4444', fontSize: 10, dy: 15 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="perfect"
                      domain={[0, 15]}
                      stroke="#6B7280"
                      fontSize={10}
                      label={{ value: 'Perfect Tasks (3/3 correct)', angle: -90, position: 'insideLeft', fill: '#22C55E', fontSize: 10 }}
                    />
                    <ReferenceLine x={10} stroke="#EF4444" strokeDasharray="4 4" strokeOpacity={0.5} />
                    <ReferenceLine y={5} stroke="#22C55E" strokeDasharray="4 4" strokeOpacity={0.5} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 text-xs">
                              <p className="font-bold text-white">{d.name}</p>
                              <p className="text-emerald-400">Perfect (3/3): {d.perfect} tasks</p>
                              <p className="text-red-400">Zero (0/3): {d.zero} tasks</p>
                              <p className="text-gray-400">Mixed: {25 - d.perfect - d.zero} tasks</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter data={enrichedModels}>
                      {enrichedModels.map((entry, index) => (
                        <Cell key={index} fill={entry.color} fillOpacity={0.8} stroke={entry.color} strokeWidth={2} />
                      ))}
                      <LabelList dataKey="shortName" content={CustomScatterLabel} />
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-center text-xs text-gray-500">
                Upper-left quadrant = most consistent (many perfect, few zeros). Claude leads with 13 perfect tasks.
              </div>
            </div>
          )}
        </div>
      )}

      {/* INSIGHTS TAB */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          {/* Key Findings */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-orange-900/20 to-black/40 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-orange-400 text-lg">★</span>
                <h3 className="text-sm font-medium text-orange-400">Finding #1: Claude Dominates Hard Tasks</h3>
              </div>
              <p className="text-xs text-gray-400 mb-3">Claude Opus 4.5 achieves 56.7% on L6 (hardest) tasks, while most competitors struggle below 40%.</p>
              <div className="flex items-center gap-4 text-xs">
                <div><span className="text-orange-400 font-bold">56.7%</span> L6</div>
                <div><span className="text-gray-500">vs</span></div>
                <div><span className="text-purple-400">33.3%</span> Qwen3</div>
                <div><span className="text-red-400">0%</span> Gemini Pro</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-900/20 to-black/40 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-purple-400 text-lg">$</span>
                <h3 className="text-sm font-medium text-purple-400">Finding #2: Qwen3 is 7x Better Value</h3>
              </div>
              <p className="text-xs text-gray-400 mb-3">At $0.26/correct vs Claude&apos;s $1.45/correct, Qwen3 Max delivers exceptional ROI for high-volume work.</p>
              <div className="flex items-center gap-4 text-xs">
                <div><span className="text-purple-400 font-bold">$0.26</span>/correct</div>
                <div><span className="text-gray-500">vs</span></div>
                <div><span className="text-orange-400">$1.45</span>/correct</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-red-900/20 to-black/40 border border-red-500/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-red-400 text-lg">!</span>
                <h3 className="text-sm font-medium text-red-400">Finding #3: Avoid Gemini 3 Pro</h3>
              </div>
              <p className="text-xs text-gray-400 mb-3">Despite $0.35/task cost, Gemini 3 Pro scores 0% on L6 tasks and 28% overall - poor value proposition.</p>
              <div className="flex items-center gap-4 text-xs">
                <div><span className="text-red-400 font-bold">$1.25</span>/correct</div>
                <div><span className="text-gray-500">92s avg</span></div>
                <div><span className="text-red-400">0% L6</span></div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-900/20 to-black/40 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-emerald-400 text-lg">✓</span>
                <h3 className="text-sm font-medium text-emerald-400">Finding #4: Consistency Matters</h3>
              </div>
              <p className="text-xs text-gray-400 mb-3">Claude achieves 13 perfect tasks (3/3 correct) vs next best of 7. Reliability is as important as accuracy.</p>
              <div className="flex items-center gap-4 text-xs">
                <div><span className="text-emerald-400 font-bold">13</span> perfect</div>
                <div><span className="text-amber-400">8</span> zeros</div>
                <div><span className="text-gray-500">= 52% consistent</span></div>
              </div>
            </div>
          </div>

          {/* Recommendation Matrix */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/5">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Recommendation Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-800">
                    <th className="text-left py-2 px-3">Use Case</th>
                    <th className="text-center py-2 px-3">Recommended</th>
                    <th className="text-center py-2 px-3">Alternative</th>
                    <th className="text-left py-2 px-3">Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-800/50">
                    <td className="py-3 px-3 text-white">Mission-critical analysis</td>
                    <td className="py-3 px-3 text-center"><span className="px-2 py-1 rounded bg-orange-500/20 text-orange-400">Claude</span></td>
                    <td className="py-3 px-3 text-center"><span className="text-gray-500">-</span></td>
                    <td className="py-3 px-3 text-gray-400">Highest accuracy + consistency</td>
                  </tr>
                  <tr className="border-b border-gray-800/50">
                    <td className="py-3 px-3 text-white">High-volume processing</td>
                    <td className="py-3 px-3 text-center"><span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400">Qwen3</span></td>
                    <td className="py-3 px-3 text-center"><span className="px-2 py-1 rounded bg-red-500/20 text-red-400">Mistral-L</span></td>
                    <td className="py-3 px-3 text-gray-400">Best cost/accuracy ratio</td>
                  </tr>
                  <tr className="border-b border-gray-800/50">
                    <td className="py-3 px-3 text-white">Budget-constrained</td>
                    <td className="py-3 px-3 text-center"><span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-400">Llama-4</span></td>
                    <td className="py-3 px-3 text-center"><span className="px-2 py-1 rounded bg-pink-500/20 text-pink-400">Mistral-S</span></td>
                    <td className="py-3 px-3 text-gray-400">$0.08/task, fastest response</td>
                  </tr>
                  <tr className="border-b border-gray-800/50">
                    <td className="py-3 px-3 text-white">L6 complex reasoning</td>
                    <td className="py-3 px-3 text-center"><span className="px-2 py-1 rounded bg-orange-500/20 text-orange-400">Claude</span></td>
                    <td className="py-3 px-3 text-center"><span className="px-2 py-1 rounded bg-pink-500/20 text-pink-400">Mistral-S</span></td>
                    <td className="py-3 px-3 text-gray-400">Only 2 models &gt;50% on L6</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-gray-600 text-xs">
        CodeBlue Final 25 Benchmark • 9 Models • 25 Tasks • 675 Total Rollouts
      </div>
    </div>
  );
}
