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
  consistencyScore: (m.perfect / 13) * 100,
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
    <text x={x} y={y - 10} fill="#fff" fontSize={8} textAnchor="middle" fontWeight="600">
      {value}
    </text>
  );
};

// Get quadrant zone for a model
const getQuadrantZone = (cost: number, acc: number) => {
  if (cost < COST_THRESHOLD && acc >= ACC_THRESHOLD) return { zone: 'VALUE', color: '#22C55E' };
  if (cost >= COST_THRESHOLD && acc >= ACC_THRESHOLD) return { zone: 'PREMIUM', color: '#D97706' };
  if (cost < COST_THRESHOLD && acc < ACC_THRESHOLD) return { zone: 'BUDGET', color: '#6B7280' };
  return { zone: 'AVOID', color: '#EF4444' };
};

type AxisKey = 'cost' | 'total' | 'time' | 'correct' | 'L5' | 'L6' | 'perfect';
type SizeKey = 'speedScore' | 'correct' | 'perfect' | 'costPerCorrect';

const axisOptions: { value: AxisKey; label: string; shortLabel: string }[] = [
  { value: 'cost', label: 'Cost ($)', shortLabel: 'Cost' },
  { value: 'total', label: 'Accuracy (%)', shortLabel: 'Acc' },
  { value: 'time', label: 'Time (s)', shortLabel: 'Time' },
  { value: 'correct', label: 'Correct (#)', shortLabel: 'Correct' },
  { value: 'L5', label: 'L5 Hard (%)', shortLabel: 'L5' },
  { value: 'L6', label: 'L6 Harder (%)', shortLabel: 'L6' },
  { value: 'perfect', label: 'Perfect Tasks', shortLabel: 'Perfect' },
];

const sizeOptions: { value: SizeKey; label: string; shortLabel: string }[] = [
  { value: 'speedScore', label: 'Speed', shortLabel: 'Speed' },
  { value: 'correct', label: 'Correct Answers', shortLabel: 'Correct' },
  { value: 'perfect', label: 'Perfect Tasks', shortLabel: 'Perfect' },
  { value: 'costPerCorrect', label: 'Value (inverted)', shortLabel: 'Value' },
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
    { metric: 'Consist.', Claude: 100, Qwen3: (qwenData.perfect / claudeData.perfect) * 100, avg: 25 },
    { metric: 'L6', Claude: 100, Qwen3: (qwenData.L6 / claudeData.L6) * 100, avg: 20 },
  ], [claudeData, qwenData]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'explore', label: 'Explore' },
    { id: 'reliability', label: 'Reliability' },
    { id: 'insights', label: 'Insights' },
  ];

  const vizOptions = [
    { id: 1, label: '3D Bubble' },
    { id: 2, label: 'Consistency' },
    { id: 3, label: 'Quadrants' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* HERO: Leader Spotlight - Mobile Optimized */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-900/30 via-black/60 to-purple-900/30 border border-orange-500/20 p-4 sm:p-6">
        <div className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 sm:w-48 h-24 sm:h-48 bg-purple-500/5 rounded-full blur-3xl" />

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Claude - The Leader */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-orange-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider">Performance Leader</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold text-white">Claude Opus 4.5</h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div>
                <div className="text-xl sm:text-3xl font-bold text-orange-400">{claudeData.total}%</div>
                <div className="text-[10px] sm:text-xs text-gray-500">Accuracy</div>
              </div>
              <div>
                <div className="text-xl sm:text-3xl font-bold text-orange-300">{claudeData.perfect}</div>
                <div className="text-[10px] sm:text-xs text-gray-500">Perfect</div>
              </div>
              <div>
                <div className="text-xl sm:text-3xl font-bold text-orange-200">{claudeData.L6}%</div>
                <div className="text-[10px] sm:text-xs text-gray-500">L6 Hard</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30">Most Accurate</span>
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30">Most Consistent</span>
            </div>
          </div>

          {/* Qwen - Best Value */}
          <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/10">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-purple-500" />
              <span className="text-purple-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider">Best Value</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold text-white">Qwen3 Max</h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div>
                <div className="text-xl sm:text-3xl font-bold text-purple-400">{qwenData.total}%</div>
                <div className="text-[10px] sm:text-xs text-gray-500">Accuracy</div>
              </div>
              <div>
                <div className="text-xl sm:text-3xl font-bold text-purple-300">${qwenData.cost}</div>
                <div className="text-[10px] sm:text-xs text-gray-500">Per Task</div>
              </div>
              <div>
                <div className="text-xl sm:text-3xl font-bold text-emerald-400">${qwenData.costPerCorrect.toFixed(2)}</div>
                <div className="text-[10px] sm:text-xs text-gray-500">Per Correct</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30">7x Cheaper</span>
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Best ROI</span>
            </div>
          </div>
        </div>

        {/* Quick comparison bar - Mobile */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-[10px] sm:text-xs text-gray-400">
            <span>Claude: <span className="text-orange-400 font-bold">+14.6%</span> acc</span>
            <span>Qwen: <span className="text-purple-400 font-bold">86%</span> cheaper</span>
            <span className="hidden sm:inline">9 models • 675 rollouts</span>
          </div>
        </div>
      </div>

      {/* Tabs - Scrollable on mobile */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
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
          <div className="p-3 sm:p-4 rounded-xl bg-black/40 border border-white/5">
            <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-1">Claude vs Qwen3</h3>
            <p className="text-[10px] sm:text-xs text-gray-600 mb-3 sm:mb-4">Normalized (100 = best)</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="h-56 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={leaderRadar} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#9CA3AF', fontSize: 9 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 8 }} />
                    <Radar name="Claude" dataKey="Claude" stroke="#D97706" fill="#D97706" fillOpacity={0.3} strokeWidth={2} />
                    <Radar name="Qwen3" dataKey="Qwen3" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.3} strokeWidth={2} />
                    <Legend wrapperStyle={{ fontSize: 9 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <div className="p-2 sm:p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-orange-400 font-medium text-xs sm:text-sm">Claude Opus 4.5</span>
                    <span className="text-[10px] sm:text-xs text-gray-500">Premium</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-1">Best for mission-critical work.</p>
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-400 font-medium text-xs sm:text-sm">Qwen3 Max</span>
                    <span className="text-[10px] sm:text-xs text-gray-500">Value</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-1">76% accuracy at 13% cost.</p>
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-gray-800/50 border border-gray-700/30">
                  <p className="text-[10px] sm:text-xs text-gray-300"><span className="text-orange-400">Claude</span> for L6, <span className="text-purple-400">Qwen3</span> for bulk.</p>
                </div>
              </div>
            </div>
          </div>

          {/* All Models Quick View */}
          <div className="p-3 sm:p-4 rounded-xl bg-black/40 border border-white/5">
            <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-3">All Models</h3>
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrichedModels} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis type="number" domain={[0, 70]} stroke="#6B7280" fontSize={9} />
                  <YAxis type="category" dataKey="shortName" width={55} tick={{ fill: '#9CA3AF', fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', fontSize: 10 }}
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

      {/* EXPLORE TAB */}
      {activeTab === 'explore' && (
        <div className="space-y-3 sm:space-y-4">
          {/* Viz Selector + Filters - Mobile optimized */}
          <div className="flex flex-col gap-3 p-2 sm:p-3 rounded-lg bg-black/30 border border-white/5">
            {/* Viz buttons */}
            <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
              {vizOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setVizOption(opt.id)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                    vizOption === opt.id
                      ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40'
                      : 'bg-black/40 text-gray-500 hover:text-gray-300 border border-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Axis Controls for 3D Bubble - Stacked on mobile */}
            {vizOption === 1 && (
              <div className="grid grid-cols-3 gap-2 text-[10px] sm:text-xs">
                <div>
                  <span className="text-gray-500 block mb-1">X Axis</span>
                  <select
                    value={xAxis}
                    onChange={(e) => setXAxis(e.target.value as AxisKey)}
                    className="w-full bg-black/60 border border-gray-700 rounded px-1.5 sm:px-2 py-1 text-gray-300 text-[10px] sm:text-xs"
                  >
                    {axisOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.shortLabel}</option>)}
                  </select>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Y Axis</span>
                  <select
                    value={yAxis}
                    onChange={(e) => setYAxis(e.target.value as AxisKey)}
                    className="w-full bg-black/60 border border-gray-700 rounded px-1.5 sm:px-2 py-1 text-gray-300 text-[10px] sm:text-xs"
                  >
                    {axisOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.shortLabel}</option>)}
                  </select>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Size</span>
                  <select
                    value={bubbleSize}
                    onChange={(e) => setBubbleSize(e.target.value as SizeKey)}
                    className="w-full bg-black/60 border border-gray-700 rounded px-1.5 sm:px-2 py-1 text-gray-300 text-[10px] sm:text-xs"
                  >
                    {sizeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.shortLabel}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Filter checkbox */}
            <label className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyTop}
                onChange={(e) => setShowOnlyTop(e.target.checked)}
                className="rounded border-gray-600 bg-black/60 w-3 h-3"
              />
              Top performers only (&gt;30%)
            </label>
          </div>

          {/* OPTION 1: 3D Bubble */}
          {vizOption === 1 && (
            <div className="p-3 sm:p-4 rounded-xl bg-black/40 border border-white/5">
              <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-1">3D Bubble Explorer</h3>
              <p className="text-[10px] sm:text-xs text-gray-600 mb-3">
                X: {axisOptions.find(a => a.value === xAxis)?.shortLabel} | Y: {axisOptions.find(a => a.value === yAxis)?.shortLabel} | Size: {sizeOptions.find(s => s.value === bubbleSize)?.shortLabel}
              </p>
              <div className="h-64 sm:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                    <XAxis
                      type="number"
                      dataKey={xAxis}
                      stroke="#6B7280"
                      fontSize={8}
                      tickFormatter={(v) => xAxis === 'cost' ? `$${v.toFixed(1)}` : `${v}`}
                    />
                    <YAxis
                      type="number"
                      dataKey={yAxis}
                      stroke="#6B7280"
                      fontSize={8}
                    />
                    <ZAxis type="number" dataKey={bubbleSize} range={[60, 400]} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-gray-900 p-2 rounded-lg border border-gray-700 text-[10px]">
                              <p className="font-bold text-white">{d.name}</p>
                              <p className="text-blue-400">{axisOptions.find(a => a.value === xAxis)?.shortLabel}: {xAxis === 'cost' ? `$${d[xAxis].toFixed(2)}` : d[xAxis]}</p>
                              <p className="text-emerald-400">{axisOptions.find(a => a.value === yAxis)?.shortLabel}: {d[yAxis]}</p>
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
              {/* Legend - compact on mobile */}
              <div className="mt-2 flex flex-wrap gap-1 justify-center">
                {filteredModels.slice(0, 5).map(m => (
                  <div key={m.model} className="flex items-center gap-1 text-[9px] sm:text-xs px-1.5 py-0.5 rounded bg-black/30">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                    <span className="text-gray-400">{m.shortName}</span>
                  </div>
                ))}
                {filteredModels.length > 5 && <span className="text-gray-500 text-[9px]">+{filteredModels.length - 5}</span>}
              </div>
            </div>
          )}

          {/* OPTION 2: Consistency Map */}
          {vizOption === 2 && (
            <div className="p-3 sm:p-4 rounded-xl bg-black/40 border border-white/5">
              <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-1">Consistency Map</h3>
              <p className="text-[10px] sm:text-xs text-gray-600 mb-3">Size: Correct | Color: Consistency</p>
              <div className="h-64 sm:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                    <XAxis type="number" dataKey="cost" domain={[0, 1]} stroke="#6B7280" fontSize={8} tickFormatter={(v) => `$${v.toFixed(1)}`} />
                    <YAxis type="number" dataKey="total" domain={[0, 70]} stroke="#6B7280" fontSize={8} />
                    <ZAxis type="number" dataKey="correct" range={[60, 400]} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-gray-900 p-2 rounded-lg border border-gray-700 text-[10px]">
                              <p className="font-bold text-white">{d.name}</p>
                              <p className="text-emerald-400">Acc: {d.total}%</p>
                              <p className="text-orange-400">Correct: {d.correct}/75</p>
                              <p style={{ color: d.consistencyColor }}>Perfect: {d.perfect}/25</p>
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
              <div className="mt-2 flex flex-wrap gap-2 sm:gap-4 justify-center text-[9px] sm:text-xs">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Reliable</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Mixed</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Unreliable</div>
              </div>
            </div>
          )}

          {/* OPTION 3: Quadrant Zones */}
          {vizOption === 3 && (
            <div className="p-3 sm:p-4 rounded-xl bg-black/40 border border-white/5">
              <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-1">Quadrant Map</h3>
              <p className="text-[10px] sm:text-xs text-gray-600 mb-3">Cost ${COST_THRESHOLD} | Acc {ACC_THRESHOLD}%</p>
              <div className="h-64 sm:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                    <ReferenceArea x1={0} x2={COST_THRESHOLD} y1={ACC_THRESHOLD} y2={70} fill="#22C55E" fillOpacity={0.08} />
                    <ReferenceArea x1={COST_THRESHOLD} x2={1} y1={ACC_THRESHOLD} y2={70} fill="#D97706" fillOpacity={0.08} />
                    <ReferenceArea x1={0} x2={COST_THRESHOLD} y1={0} y2={ACC_THRESHOLD} fill="#6B7280" fillOpacity={0.08} />
                    <ReferenceArea x1={COST_THRESHOLD} x2={1} y1={0} y2={ACC_THRESHOLD} fill="#EF4444" fillOpacity={0.08} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                    <XAxis type="number" dataKey="cost" domain={[0, 1]} stroke="#6B7280" fontSize={8} tickFormatter={(v) => `$${v.toFixed(1)}`} />
                    <YAxis type="number" dataKey="total" domain={[0, 70]} stroke="#6B7280" fontSize={8} />
                    <ReferenceLine x={COST_THRESHOLD} stroke="#fff" strokeWidth={1} strokeDasharray="4 4" />
                    <ReferenceLine y={ACC_THRESHOLD} stroke="#fff" strokeWidth={1} strokeDasharray="4 4" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          const zone = getQuadrantZone(d.cost, d.total);
                          return (
                            <div className="bg-gray-900 p-2 rounded-lg border border-gray-700 text-[10px]">
                              <p className="font-bold text-white">{d.name}</p>
                              <p style={{ color: zone.color }} className="font-medium">{zone.zone}</p>
                              <p className="text-gray-400">${d.cost.toFixed(2)} | {d.total}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter data={filteredModels}>
                      {filteredModels.map((entry, index) => {
                        const speedColor = entry.speedTier === 'fast' ? '#22C55E' : entry.speedTier === 'medium' ? '#F59E0B' : '#EF4444';
                        return <Cell key={index} fill={speedColor} stroke="#fff" strokeWidth={1} />;
                      })}
                      <LabelList dataKey="shortName" content={CustomScatterLabel} />
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              {/* Quadrant labels - 2x2 grid on mobile */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-[9px] sm:text-xs">
                <div className="p-1.5 sm:p-2 rounded text-center bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-emerald-400 font-bold">VALUE</div>
                  <div className="text-gray-500 hidden sm:block">Cheap + Good</div>
                </div>
                <div className="p-1.5 sm:p-2 rounded text-center bg-orange-500/10 border border-orange-500/20">
                  <div className="text-orange-400 font-bold">PREMIUM</div>
                  <div className="text-gray-500 hidden sm:block">Pricey + Good</div>
                </div>
                <div className="p-1.5 sm:p-2 rounded text-center bg-gray-500/10 border border-gray-500/20">
                  <div className="text-gray-400 font-bold">BUDGET</div>
                  <div className="text-gray-500 hidden sm:block">Cheap + Weak</div>
                </div>
                <div className="p-1.5 sm:p-2 rounded text-center bg-red-500/10 border border-red-500/20">
                  <div className="text-red-400 font-bold">AVOID</div>
                  <div className="text-gray-500 hidden sm:block">Pricey + Weak</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RELIABILITY TAB */}
      {activeTab === 'reliability' && (
        <div className="space-y-3 sm:space-y-4">
          {/* View Selector - Scrollable */}
          <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
            {[
              { id: 'scatter', label: 'Success/Fail' },
              { id: 'breakdown', label: 'Breakdown' },
              { id: 'comparison', label: 'Consistency' },
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setReliabilityView(v.id as typeof reliabilityView)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  reliabilityView === v.id
                    ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40'
                    : 'bg-black/40 text-gray-500 hover:text-gray-300 border border-white/5'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Scatter */}
          {reliabilityView === 'scatter' && (
            <div className="p-3 sm:p-4 rounded-xl bg-black/40 border border-white/5">
              <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-1">Success vs Failure Rate</h3>
              <p className="text-[10px] sm:text-xs text-gray-600 mb-3">Upper-left = best</p>
              <div className="h-64 sm:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                    <XAxis type="number" dataKey="failureRate" domain={[0, 100]} stroke="#6B7280" fontSize={8} />
                    <YAxis type="number" dataKey="successRate" domain={[0, 70]} stroke="#6B7280" fontSize={8} />
                    <ZAxis type="number" dataKey="partial" range={[60, 300]} />
                    <ReferenceLine x={50} stroke="#6B7280" strokeDasharray="4 4" />
                    <ReferenceLine y={30} stroke="#6B7280" strokeDasharray="4 4" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-gray-900 p-2 rounded-lg border border-gray-700 text-[10px]">
                              <p className="font-bold text-white">{d.name}</p>
                              <p className="text-emerald-400">Success: {d.successRate.toFixed(0)}%</p>
                              <p className="text-red-400">Fail: {d.failureRate.toFixed(0)}%</p>
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

          {/* Pie Breakdown - 2 cols on mobile */}
          {reliabilityView === 'breakdown' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              {enrichedModels.slice(0, 6).map(m => (
                <div key={m.model} className="p-2 sm:p-4 rounded-xl bg-black/40 border border-white/5">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: m.color }} />
                    <span className="text-[10px] sm:text-sm font-medium text-white truncate">{m.shortName}</span>
                  </div>
                  <div className="h-20 sm:h-32">
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
                          innerRadius={15}
                          outerRadius={30}
                          strokeWidth={0}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-around text-[9px] sm:text-xs">
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
            <div className="p-3 sm:p-4 rounded-xl bg-black/40 border border-white/5">
              <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-1">Perfect vs Zero Tasks</h3>
              <p className="text-[10px] sm:text-xs text-gray-600 mb-3">Upper-left = most consistent</p>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                    <XAxis type="number" dataKey="zero" domain={[0, 25]} stroke="#6B7280" fontSize={8} />
                    <YAxis type="number" dataKey="perfect" domain={[0, 15]} stroke="#6B7280" fontSize={8} />
                    <ReferenceLine x={10} stroke="#EF4444" strokeDasharray="4 4" strokeOpacity={0.5} />
                    <ReferenceLine y={5} stroke="#22C55E" strokeDasharray="4 4" strokeOpacity={0.5} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-gray-900 p-2 rounded-lg border border-gray-700 text-[10px]">
                              <p className="font-bold text-white">{d.name}</p>
                              <p className="text-emerald-400">Perfect: {d.perfect}</p>
                              <p className="text-red-400">Zero: {d.zero}</p>
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
            </div>
          )}
        </div>
      )}

      {/* INSIGHTS TAB */}
      {activeTab === 'insights' && (
        <div className="space-y-3 sm:space-y-4">
          {/* Key Findings - Stack on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-orange-900/20 to-black/40 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <span className="text-orange-400 text-sm sm:text-lg">★</span>
                <h3 className="text-[11px] sm:text-sm font-medium text-orange-400">Claude Dominates Hard Tasks</h3>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 mb-2">56.7% on L6 tasks vs &lt;40% competitors.</p>
              <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs">
                <span className="text-orange-400 font-bold">56.7%</span>
                <span className="text-gray-500">vs</span>
                <span className="text-purple-400">33%</span>
                <span className="text-red-400">0%</span>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-purple-900/20 to-black/40 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <span className="text-purple-400 text-sm sm:text-lg">$</span>
                <h3 className="text-[11px] sm:text-sm font-medium text-purple-400">Qwen3 is 7x Better Value</h3>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 mb-2">$0.26/correct vs Claude $1.45.</p>
              <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs">
                <span className="text-purple-400 font-bold">$0.26</span>
                <span className="text-gray-500">vs</span>
                <span className="text-orange-400">$1.45</span>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-red-900/20 to-black/40 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <span className="text-red-400 text-sm sm:text-lg">!</span>
                <h3 className="text-[11px] sm:text-sm font-medium text-red-400">Avoid Gemini 3 Pro</h3>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 mb-2">$0.35/task but 0% on L6.</p>
              <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs">
                <span className="text-red-400 font-bold">$1.25</span>
                <span className="text-gray-500">92s</span>
                <span className="text-red-400">0% L6</span>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-emerald-900/20 to-black/40 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <span className="text-emerald-400 text-sm sm:text-lg">✓</span>
                <h3 className="text-[11px] sm:text-sm font-medium text-emerald-400">Consistency Matters</h3>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 mb-2">Claude: 13 perfect vs next best 7.</p>
              <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs">
                <span className="text-emerald-400 font-bold">13</span>
                <span className="text-amber-400">8 zeros</span>
                <span className="text-gray-500">52%</span>
              </div>
            </div>
          </div>

          {/* Recommendation Matrix - Scrollable on mobile */}
          <div className="p-3 sm:p-4 rounded-xl bg-black/40 border border-white/5">
            <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-3 sm:mb-4">Recommendations</h3>
            <div className="overflow-x-auto -mx-3 px-3">
              <table className="w-full text-[10px] sm:text-xs min-w-[400px]">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-800">
                    <th className="text-left py-2 px-2">Use Case</th>
                    <th className="text-center py-2 px-2">Pick</th>
                    <th className="text-center py-2 px-2">Alt</th>
                    <th className="text-left py-2 px-2 hidden sm:table-cell">Why</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-800/50">
                    <td className="py-2 px-2 text-white">Critical</td>
                    <td className="py-2 px-2 text-center"><span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">Claude</span></td>
                    <td className="py-2 px-2 text-center text-gray-500">-</td>
                    <td className="py-2 px-2 text-gray-400 hidden sm:table-cell">Best accuracy</td>
                  </tr>
                  <tr className="border-b border-gray-800/50">
                    <td className="py-2 px-2 text-white">Volume</td>
                    <td className="py-2 px-2 text-center"><span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">Qwen3</span></td>
                    <td className="py-2 px-2 text-center"><span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">Mistral</span></td>
                    <td className="py-2 px-2 text-gray-400 hidden sm:table-cell">Best ROI</td>
                  </tr>
                  <tr className="border-b border-gray-800/50">
                    <td className="py-2 px-2 text-white">Budget</td>
                    <td className="py-2 px-2 text-center"><span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">Llama</span></td>
                    <td className="py-2 px-2 text-center"><span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400">Mistral-S</span></td>
                    <td className="py-2 px-2 text-gray-400 hidden sm:table-cell">$0.08/task</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-gray-600 text-[10px] sm:text-xs py-2">
        CodeBlue • 9 Models • 25 Tasks • 675 Rollouts
      </div>
    </div>
  );
}
