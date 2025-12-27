'use client';

import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ComposedChart, ReferenceLine, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, LabelList
} from 'recharts';

// Complete model data with all metrics including COST
const rawData = [
  { model: "claude-opus-4.5", name: "Claude Opus 4.5", shortName: "Claude", provider: "Anthropic", color: "#D97706",
    total: 61.3, reward: 0.578, time: 33.6, cost: 0.89,
    correct: 46, partial: 2, wrong: 27, total_n: 75, perfect: 13, zero: 8,
    L5: 66.7, L6: 56.7 },
  { model: "qwen3-max", name: "Qwen3 Max", shortName: "Qwen3", provider: "Qwen", color: "#7C3AED",
    total: 46.7, reward: 0.473, time: 22.8, cost: 0.12,
    correct: 35, partial: 8, wrong: 32, total_n: 75, perfect: 7, zero: 10,
    L5: 57.1, L6: 33.3 },
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
  costPer100: m.cost * 100,
  accuracyPerDollar: m.total / m.cost,
  consistencyScore: (m.perfect / 25) * 100,
  failureRate: (m.zero / 25) * 100,
  accuracyWithPartial: ((m.correct + m.partial) / m.total_n * 100),
  partialBoost: ((m.correct + m.partial) / m.total_n * 100) - m.total,
}));

// Averages for reference lines
const avgAccuracy = rawData.reduce((a, m) => a + m.total, 0) / rawData.length;
const avgCost = rawData.reduce((a, m) => a + m.cost, 0) / rawData.length;
const avgTime = rawData.reduce((a, m) => a + m.time, 0) / rawData.length;

// Custom scatter label
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomScatterLabel = (props: any) => {
  const { x, y, value } = props;
  if (typeof x !== 'number' || typeof y !== 'number') return null;
  return (
    <text x={x} y={y - 12} fill="#fff" fontSize={9} textAnchor="middle" fontWeight="bold">
      {value}
    </text>
  );
};

export default function DeepMetrics() {
  const [activeTab, setActiveTab] = useState('overview');

  // Cost efficiency data
  const costData = useMemo(() => enrichedModels.map(d => ({
    name: d.shortName,
    cost: d.cost,
    accuracy: d.total,
    value: d.accuracyPerDollar,
  })).sort((a, b) => b.value - a.value), []);

  // Rollout breakdown data
  const rolloutData = useMemo(() => rawData.map(d => ({
    name: d.shortName,
    Correct: d.correct,
    Partial: d.partial,
    Wrong: d.wrong,
  })), []);

  // Consistency data
  const consistencyData = useMemo(() => rawData.map(d => ({
    name: d.shortName,
    'Perfect (3/3)': d.perfect,
    'Zero (0/3)': d.zero,
    'Mixed': 25 - d.perfect - d.zero,
  })), []);

  // Radar data for top 4 models
  const radarData = useMemo(() => [
    { metric: 'Accuracy', Claude: 61.3, Qwen3: 46.7, Mistral: 42.7, Llama: 36.0 },
    { metric: 'Value', Claude: 69, Qwen3: 100, Mistral: 79, Llama: 100 },
    { metric: 'Speed', Claude: 66, Qwen3: 77, Mistral: 71, Llama: 79 },
    { metric: 'Consistency', Claude: 52, Qwen3: 28, Mistral: 20, Llama: 12 },
    { metric: 'L6 Hard', Claude: 57, Qwen3: 33, Mistral: 40, Llama: 33 },
  ], []);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'cost', label: 'Cost Analysis' },
    { id: 'quadrants', label: 'Quadrants' },
    { id: 'reliability', label: 'Reliability' },
    { id: 'details', label: 'Details' },
  ];

  return (
    <div className="space-y-6">
      {/* Key Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
        <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30">
          <div className="text-2xl font-bold text-orange-400">61.3%</div>
          <div className="text-xs text-gray-400 mt-1">Best Accuracy</div>
          <div className="text-xs text-orange-300/70">Claude Opus 4.5</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30">
          <div className="text-2xl font-bold text-emerald-400">$0.01</div>
          <div className="text-xs text-gray-400 mt-1">Cheapest</div>
          <div className="text-xs text-emerald-300/70">Gemini Flash</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30">
          <div className="text-2xl font-bold text-purple-400">389%/$</div>
          <div className="text-xs text-gray-400 mt-1">Best Value</div>
          <div className="text-xs text-purple-300/70">Qwen3 Max</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30">
          <div className="text-2xl font-bold text-cyan-400">20.7s</div>
          <div className="text-xs text-gray-400 mt-1">Fastest</div>
          <div className="text-xs text-cyan-300/70">Llama 4</div>
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
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-black/30 text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Cost vs Accuracy - THE KEY CHART */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-white mb-1">Cost vs Accuracy</h3>
            <p className="text-xs text-gray-500 mb-4">The fundamental trade-off: How much accuracy per dollar?</p>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 30, right: 30, bottom: 50, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    type="number"
                    dataKey="cost"
                    name="Cost"
                    unit="$"
                    domain={[0, 1]}
                    stroke="#9CA3AF"
                    fontSize={11}
                    tickFormatter={(v) => `$${v.toFixed(2)}`}
                  />
                  <YAxis
                    type="number"
                    dataKey="total"
                    name="Accuracy"
                    unit="%"
                    domain={[0, 70]}
                    stroke="#9CA3AF"
                    fontSize={11}
                  />
                  <ReferenceLine x={avgCost} stroke="#6B7280" strokeDasharray="5 5" label={{ value: 'Avg Cost', position: 'top', fill: '#6B7280', fontSize: 10 }} />
                  <ReferenceLine y={avgAccuracy} stroke="#6B7280" strokeDasharray="5 5" label={{ value: 'Avg Acc', position: 'right', fill: '#6B7280', fontSize: 10 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-gray-800 p-3 rounded-lg border border-gray-600 text-xs shadow-xl">
                            <p className="font-bold text-white">{d.name}</p>
                            <p className="text-emerald-400">Cost: ${d.cost.toFixed(2)}/task</p>
                            <p className="text-blue-400">Accuracy: {d.total}%</p>
                            <p className="text-purple-400">Value: {d.accuracyPerDollar.toFixed(0)}%/$</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter data={enrichedModels} fill="#8B5CF6">
                    {enrichedModels.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="#fff" strokeWidth={2} />
                    ))}
                    <LabelList dataKey="shortName" content={CustomScatterLabel} />
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-emerald-400 font-bold">Best Overall</div>
                <div className="text-white">Claude: 61% @ $0.89</div>
                <div className="text-gray-400">Highest accuracy</div>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="text-purple-400 font-bold">Best Value</div>
                <div className="text-white">Qwen3: 47% @ $0.12</div>
                <div className="text-gray-400">389% per dollar</div>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="text-red-400 font-bold">Worst Value</div>
                <div className="text-white">Claude: 69% per dollar</div>
                <div className="text-gray-400">Most expensive</div>
              </div>
            </div>
          </div>

          {/* Accuracy + Cost Bar Chart */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-white mb-3">Accuracy vs Cost per Task</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={enrichedModels} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" fontSize={10} />
                  <YAxis type="category" dataKey="shortName" width={70} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="total" name="Accuracy %" fill="#3B82F6" />
                  <Bar dataKey="costPer100" name="Cost (¢/task)" fill="#F59E0B" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* COST ANALYSIS TAB */}
      {activeTab === 'cost' && (
        <div className="space-y-4">
          {/* Value Ranking */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-white mb-1">Accuracy per Dollar (Value Ranking)</h3>
            <p className="text-xs text-gray-500 mb-4">Higher = better value for money</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" fontSize={10} />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', fontSize: 11 }}
                    formatter={(value) => [`${typeof value === 'number' ? value.toFixed(0) : value}%/$`, 'Value']}
                  />
                  <Bar dataKey="value" fill="#8B5CF6">
                    {costData.map((entry, index) => (
                      <Cell key={index} fill={index === 0 ? '#22C55E' : index < 3 ? '#3B82F6' : '#6B7280'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cost Table */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-white mb-3">Cost Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-white/10">
                    <th className="text-left py-2 px-2">Model</th>
                    <th className="text-center py-2 px-2 text-emerald-400">$/Task</th>
                    <th className="text-center py-2 px-2 text-blue-400">Accuracy</th>
                    <th className="text-center py-2 px-2 text-purple-400">%/$</th>
                    <th className="text-center py-2 px-2">$/75 runs</th>
                    <th className="text-center py-2 px-2">Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedModels.map((d, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-2 px-2 font-medium text-white">{d.shortName}</td>
                      <td className="text-center py-2 px-2 text-emerald-400 font-mono">${d.cost.toFixed(2)}</td>
                      <td className="text-center py-2 px-2 text-blue-400 font-mono">{d.total}%</td>
                      <td className="text-center py-2 px-2 text-purple-400 font-mono">{d.accuracyPerDollar.toFixed(0)}</td>
                      <td className="text-center py-2 px-2 font-mono text-gray-400">${(d.cost * 75).toFixed(2)}</td>
                      <td className="text-center py-2 px-2">
                        {d.accuracyPerDollar > 300 ? <span className="text-emerald-400">Great</span> :
                         d.accuracyPerDollar > 100 ? <span className="text-blue-400">Good</span> :
                         <span className="text-yellow-400">Pricey</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* QUADRANTS TAB */}
      {activeTab === 'quadrants' && (
        <div className="space-y-4">
          {/* Cost vs Accuracy Quadrant */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-white mb-1">Cost × Accuracy Quadrant</h3>
            <div className="grid grid-cols-4 gap-2 mb-4 text-xs">
              <div className="p-2 rounded text-center bg-emerald-500/20 border border-emerald-500/30">
                <div className="text-emerald-400 font-bold">Premium</div>
                <div className="text-gray-400">High Cost, High Acc</div>
              </div>
              <div className="p-2 rounded text-center bg-purple-500/20 border border-purple-500/30">
                <div className="text-purple-400 font-bold">Value</div>
                <div className="text-gray-400">Low Cost, High Acc</div>
              </div>
              <div className="p-2 rounded text-center bg-yellow-500/20 border border-yellow-500/30">
                <div className="text-yellow-400 font-bold">Budget</div>
                <div className="text-gray-400">Low Cost, Low Acc</div>
              </div>
              <div className="p-2 rounded text-center bg-red-500/20 border border-red-500/30">
                <div className="text-red-400 font-bold">Avoid</div>
                <div className="text-gray-400">High Cost, Low Acc</div>
              </div>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 30, right: 30, bottom: 50, left: 60 }}>
                  {/* Background quadrants - FIXED positioning */}
                  <defs>
                    <linearGradient id="premiumGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#D97706" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#D97706" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="valueGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#22C55E" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#22C55E" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="budgetGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#EAB308" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#EAB308" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="avoidGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    type="number"
                    dataKey="cost"
                    name="Cost"
                    domain={[0, 1]}
                    stroke="#9CA3AF"
                    fontSize={11}
                    tickFormatter={(v) => `$${v.toFixed(2)}`}
                    label={{ value: '← Cheaper | Cost per Task | Expensive →', position: 'bottom', fill: '#6B7280', fontSize: 10, dy: 15 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="total"
                    name="Accuracy"
                    domain={[0, 70]}
                    stroke="#9CA3AF"
                    fontSize={11}
                    label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 10, dx: -10 }}
                  />
                  <ReferenceLine x={avgCost} stroke="#fff" strokeWidth={2} strokeDasharray="8 4" />
                  <ReferenceLine y={avgAccuracy} stroke="#fff" strokeWidth={2} strokeDasharray="8 4" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-gray-900 p-3 rounded-lg border border-gray-600 text-xs shadow-xl">
                            <p className="font-bold text-white text-sm">{d.name}</p>
                            <p className="text-gray-400">{d.provider}</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-emerald-400">Cost: ${d.cost.toFixed(2)}/task</p>
                              <p className="text-blue-400">Accuracy: {d.total}%</p>
                              <p className="text-purple-400">Value: {d.accuracyPerDollar.toFixed(0)}%/$</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter data={enrichedModels}>
                    {enrichedModels.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="#fff" strokeWidth={2} r={12} />
                    ))}
                    <LabelList dataKey="shortName" content={CustomScatterLabel} />
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {enrichedModels.map(m => (
                <div key={m.model} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-black/30">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="text-gray-300">{m.shortName}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Speed vs Accuracy Quadrant */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-white mb-4">Speed × Accuracy Quadrant</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 30, right: 30, bottom: 50, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    type="number"
                    dataKey="time"
                    name="Time"
                    domain={[0, 200]}
                    stroke="#9CA3AF"
                    fontSize={11}
                    label={{ value: '← Faster | Generation Time (s) | Slower →', position: 'bottom', fill: '#6B7280', fontSize: 10, dy: 15 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="total"
                    name="Accuracy"
                    domain={[0, 70]}
                    stroke="#9CA3AF"
                    fontSize={11}
                    label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 10, dx: -10 }}
                  />
                  <ReferenceLine x={avgTime} stroke="#fff" strokeWidth={2} strokeDasharray="8 4" />
                  <ReferenceLine y={avgAccuracy} stroke="#fff" strokeWidth={2} strokeDasharray="8 4" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-gray-900 p-3 rounded-lg border border-gray-600 text-xs shadow-xl">
                            <p className="font-bold text-white text-sm">{d.name}</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-cyan-400">Time: {d.time.toFixed(1)}s</p>
                              <p className="text-blue-400">Accuracy: {d.total}%</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter data={enrichedModels}>
                    {enrichedModels.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="#fff" strokeWidth={2} r={12} />
                    ))}
                    <LabelList dataKey="shortName" content={CustomScatterLabel} />
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar Comparison */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-white mb-4">Multi-Dimensional Comparison (Top 4)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 9 }} />
                    <Radar name="Claude" dataKey="Claude" stroke="#D97706" fill="#D97706" fillOpacity={0.3} strokeWidth={2} />
                    <Radar name="Qwen3" dataKey="Qwen3" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.3} strokeWidth={2} />
                    <Radar name="Mistral" dataKey="Mistral" stroke="#DC2626" fill="#DC2626" fillOpacity={0.3} strokeWidth={2} />
                    <Radar name="Llama" dataKey="Llama" stroke="#0891B2" fill="#0891B2" fillOpacity={0.3} strokeWidth={2} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="text-orange-400 font-bold">Claude Opus 4.5</div>
                  <div className="text-gray-300">Best accuracy but expensive</div>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="text-purple-400 font-bold">Qwen3 Max</div>
                  <div className="text-gray-300">Best value: good accuracy, low cost</div>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="text-red-400 font-bold">Mistral Large</div>
                  <div className="text-gray-300">Balanced mid-tier option</div>
                </div>
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <div className="text-cyan-400 font-bold">Llama 4</div>
                  <div className="text-gray-300">Fastest and cheapest tier</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RELIABILITY TAB */}
      {activeTab === 'reliability' && (
        <div className="space-y-4">
          {/* Rollouts Stacked Bar */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-white mb-4">Rollout Outcomes (75 per model)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rolloutData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" domain={[0, 75]} stroke="#9CA3AF" fontSize={10} />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Correct" stackId="a" fill="#22C55E" />
                  <Bar dataKey="Partial" stackId="a" fill="#EAB308" />
                  <Bar dataKey="Wrong" stackId="a" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Consistency Stacked Bar */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-white mb-4">Task Consistency (25 tasks × 3 runs)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consistencyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" domain={[0, 25]} stroke="#9CA3AF" fontSize={10} />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Perfect (3/3)" stackId="a" fill="#22C55E" />
                  <Bar dataKey="Mixed" stackId="a" fill="#6366F1" />
                  <Bar dataKey="Zero (0/3)" stackId="a" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Partial Impact Table */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-white mb-3">Partial Score Impact</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-white/10">
                    <th className="text-left py-2 px-2">Model</th>
                    <th className="text-center py-2 px-2">Partials</th>
                    <th className="text-center py-2 px-2">Current</th>
                    <th className="text-center py-2 px-2">If Counted</th>
                    <th className="text-center py-2 px-2 text-yellow-400">Boost</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedModels.filter(d => d.partial > 0).map((d, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-2 px-2 text-white">{d.shortName}</td>
                      <td className="text-center py-2 px-2 text-yellow-400 font-mono">{d.partial}</td>
                      <td className="text-center py-2 px-2 font-mono text-gray-300">{d.total}%</td>
                      <td className="text-center py-2 px-2 font-mono text-emerald-400">{d.accuracyWithPartial.toFixed(1)}%</td>
                      <td className="text-center py-2 px-2 font-mono text-yellow-400">+{d.partialBoost.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS TAB */}
      {activeTab === 'details' && (
        <div className="p-4 rounded-xl bg-black/30 border border-white/10">
          <h3 className="text-sm font-medium text-white mb-3">Complete Metrics</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-white/10">
                  <th className="text-left py-2 px-1">Model</th>
                  <th className="text-center py-2 px-1 text-blue-400">Acc%</th>
                  <th className="text-center py-2 px-1 text-emerald-400">$/Task</th>
                  <th className="text-center py-2 px-1 text-purple-400">%/$</th>
                  <th className="text-center py-2 px-1">Time</th>
                  <th className="text-center py-2 px-1 text-emerald-400">✓</th>
                  <th className="text-center py-2 px-1 text-yellow-400">½</th>
                  <th className="text-center py-2 px-1 text-red-400">✗</th>
                  <th className="text-center py-2 px-1">L5</th>
                  <th className="text-center py-2 px-1">L6</th>
                  <th className="text-center py-2 px-1">3/3</th>
                  <th className="text-center py-2 px-1">0/3</th>
                </tr>
              </thead>
              <tbody>
                {rawData.map((d, i) => (
                  <tr key={i} className={`border-b border-white/5 ${i === 0 ? 'bg-orange-500/10' : ''}`}>
                    <td className="py-2 px-1 font-medium text-white">{d.shortName}</td>
                    <td className="text-center py-2 px-1 font-bold text-blue-400">{d.total}</td>
                    <td className="text-center py-2 px-1 text-emerald-400">${d.cost.toFixed(2)}</td>
                    <td className="text-center py-2 px-1 text-purple-400">{(d.total / d.cost).toFixed(0)}</td>
                    <td className="text-center py-2 px-1 text-gray-400">{d.time.toFixed(0)}s</td>
                    <td className="text-center py-2 px-1 text-emerald-400">{d.correct}</td>
                    <td className="text-center py-2 px-1 text-yellow-400">{d.partial}</td>
                    <td className="text-center py-2 px-1 text-red-400">{d.wrong}</td>
                    <td className="text-center py-2 px-1 text-yellow-300">{d.L5}</td>
                    <td className="text-center py-2 px-1 text-red-300">{d.L6}</td>
                    <td className="text-center py-2 px-1 text-emerald-400">{d.perfect}</td>
                    <td className="text-center py-2 px-1 text-red-400">{d.zero}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-center text-gray-500 text-xs">
        CodeBlue Final 25 • 9 Models • 75 rollouts each • Cost estimates based on API pricing
      </div>
    </div>
  );
}
