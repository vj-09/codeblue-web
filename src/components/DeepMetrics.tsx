'use client';

import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ComposedChart, ReferenceLine, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, ReferenceArea
} from 'recharts';

// Complete model data with all metrics
const rawData = [
  { model: "claude-opus-4.5", name: "Claude Opus 4.5", shortName: "Claude", provider: "Anthropic", color: "#D97706",
    total: 61.3, reward: 0.578, time: 33.6,
    correct: 46, partial: 2, wrong: 27, total_n: 75, perfect: 13, zero: 8,
    L5: 66.7, L6: 56.7, efficiency: 0.026 },
  { model: "qwen3-max", name: "Qwen3 Max", shortName: "Qwen3", provider: "Qwen", color: "#7C3AED",
    total: 46.7, reward: 0.473, time: 22.8,
    correct: 35, partial: 8, wrong: 32, total_n: 75, perfect: 7, zero: 10,
    L5: 57.1, L6: 33.3, efficiency: 0.030 },
  { model: "mistral-large", name: "Mistral Large", shortName: "Mistral-L", provider: "Mistral", color: "#DC2626",
    total: 42.7, reward: 0.424, time: 29.0,
    correct: 32, partial: 2, wrong: 41, total_n: 75, perfect: 5, zero: 8,
    L5: 47.6, L6: 40.0, efficiency: 0.032 },
  { model: "llama-4-maverick", name: "Llama 4 Maverick", shortName: "Llama-4", provider: "Meta", color: "#0891B2",
    total: 36.0, reward: 0.375, time: 20.7,
    correct: 27, partial: 6, wrong: 42, total_n: 75, perfect: 3, zero: 10,
    L5: 47.6, L6: 33.3, efficiency: 0.029 },
  { model: "mistral-small", name: "Mistral Small", shortName: "Mistral-S", provider: "Mistral", color: "#F87171",
    total: 34.7, reward: 0.343, time: 27.7,
    correct: 26, partial: 2, wrong: 47, total_n: 75, perfect: 5, zero: 13,
    L5: 14.3, L6: 56.7, efficiency: 0.024 },
  { model: "gemini-3-pro", name: "Gemini 3 Pro", shortName: "Gemini-P", provider: "Google", color: "#2563EB",
    total: 28.0, reward: 0.294, time: 92.4,
    correct: 21, partial: 14, wrong: 40, total_n: 75, perfect: 5, zero: 16,
    L5: 38.1, L6: 0.0, efficiency: 0.010 },
  { model: "deepseek-v3.2", name: "DeepSeek v3.2", shortName: "DeepSeek", provider: "DeepSeek", color: "#059669",
    total: 12.0, reward: 0.107, time: 65.7,
    correct: 9, partial: 0, wrong: 66, total_n: 75, perfect: 0, zero: 17,
    L5: 0.0, L6: 20.0, efficiency: 0.002 },
  { model: "intellect-3", name: "Intellect 3", shortName: "Intellect", provider: "Prime", color: "#DB2777",
    total: 10.7, reward: 0.101, time: 177.4,
    correct: 8, partial: 2, wrong: 65, total_n: 75, perfect: 0, zero: 20,
    L5: 4.8, L6: 13.3, efficiency: 0.004 },
  { model: "gemini-3-flash", name: "Gemini 3 Flash", shortName: "Gemini-F", provider: "Google", color: "#60A5FA",
    total: 5.3, reward: 0.056, time: 43.7,
    correct: 4, partial: 1, wrong: 70, total_n: 75, perfect: 0, zero: 22,
    L5: 0.0, L6: 3.3, efficiency: 0.004 },
];

// Enriched data with derived metrics
const enrichedModels = rawData.map(m => ({
  ...m,
  speedScore: Math.max(0, 100 - m.time),
  consistencyScore: (m.perfect / 25) * 100,
  partialRate: (m.partial / 75) * 100,
  failureRate: (m.zero / 25) * 100,
  rewardPct: m.reward * 100,
  accuracyWithPartial: ((m.correct + m.partial) / m.total_n * 100),
  partialBoost: ((m.correct + m.partial) / m.total_n * 100) - m.total,
}));

// Averages for reference lines
const avgAccuracy = rawData.reduce((a, m) => a + m.total, 0) / rawData.length;
const avgTime = rawData.reduce((a, m) => a + m.time, 0) / rawData.length;
const avgConsistency = enrichedModels.reduce((a, m) => a + m.consistencyScore, 0) / rawData.length;
const avgL5 = rawData.reduce((a, m) => a + m.L5, 0) / rawData.length;
const avgL6 = rawData.reduce((a, m) => a + m.L6, 0) / rawData.length;

// Custom tooltip
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof enrichedModels[0]; name: string; value: number; color?: string }> }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-xs shadow-xl">
        <p className="font-bold text-white mb-1">{d.name}</p>
        <p className="text-gray-400 mb-2">{d.provider}</p>
        <div className="space-y-1">
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color || '#fff' }}>
              {p.name}: {typeof p.value === 'number' ? (p.value < 1 && p.value > 0 ? p.value.toFixed(3) : p.value.toFixed(1)) : p.value}
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function DeepMetrics() {
  const [activeTab, setActiveTab] = useState('overview');

  // Rollout breakdown data (combined with partials)
  const rolloutData = useMemo(() => rawData.map(d => ({
    name: d.shortName,
    Correct: d.correct,
    Partial: d.partial,
    Wrong: d.wrong,
    accuracy: d.total,
    boost: ((d.correct + d.partial) / d.total_n * 100 - d.total).toFixed(1),
  })), []);

  // Consistency data
  const consistencyData = useMemo(() => rawData.map(d => ({
    name: d.shortName,
    'Perfect (3/3)': d.perfect,
    'Zero (0/3)': d.zero,
    'Mixed': 25 - d.perfect - d.zero,
    perfectRate: (d.perfect / 25 * 100),
  })), []);

  // Radar data for top 4 models
  const radarData = useMemo(() => [
    { metric: 'Accuracy', Claude: 61.3, Qwen3: 46.7, Mistral: 42.7, Llama: 36.0 },
    { metric: 'Speed', Claude: 66.4, Qwen3: 77.2, Mistral: 71.0, Llama: 79.3 },
    { metric: 'Reward', Claude: 57.8, Qwen3: 47.3, Mistral: 42.4, Llama: 37.5 },
    { metric: 'Consistency', Claude: 52.0, Qwen3: 28.0, Mistral: 20.0, Llama: 12.0 },
    { metric: 'L6 Hard', Claude: 56.7, Qwen3: 33.3, Mistral: 40.0, Llama: 33.3 },
    { metric: 'Low Failures', Claude: 68.0, Qwen3: 60.0, Mistral: 68.0, Llama: 60.0 },
  ], []);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'quadrants', label: 'Quadrants' },
    { id: 'difficulty', label: 'Difficulty' },
    { id: 'reliability', label: 'Reliability' },
    { id: 'radar', label: 'Radar' },
    { id: 'details', label: 'Details' },
  ];

  return (
    <div className="space-y-6">
      {/* Key Stats Row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center">
        <div className="p-3 rounded-xl bg-black/30 border border-white/10">
          <div className="text-lg font-bold text-orange-400">61.3%</div>
          <div className="text-xs text-gray-500">Best Accuracy</div>
        </div>
        <div className="p-3 rounded-xl bg-black/30 border border-white/10">
          <div className="text-lg font-bold text-emerald-400">0.578</div>
          <div className="text-xs text-gray-500">Best Reward</div>
        </div>
        <div className="p-3 rounded-xl bg-black/30 border border-white/10">
          <div className="text-lg font-bold text-cyan-400">20.7s</div>
          <div className="text-xs text-gray-500">Fastest</div>
        </div>
        <div className="p-3 rounded-xl bg-black/30 border border-white/10">
          <div className="text-lg font-bold text-purple-400">52%</div>
          <div className="text-xs text-gray-500">Best 3/3 Rate</div>
        </div>
        <div className="p-3 rounded-xl bg-black/30 border border-white/10">
          <div className="text-lg font-bold text-yellow-400">14</div>
          <div className="text-xs text-gray-500">Max Partials</div>
        </div>
        <div className="p-3 rounded-xl bg-black/30 border border-white/10">
          <div className="text-lg font-bold text-red-400">88%</div>
          <div className="text-xs text-gray-500">Worst 0/3 Rate</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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
          {/* Speed vs Accuracy - Main Chart */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Speed vs Accuracy</h3>
            <p className="text-xs text-gray-500 mb-3">Bubble size = Reward score | Dashed lines = averages</p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    type="number"
                    dataKey="time"
                    name="Time"
                    unit="s"
                    domain={[0, 200]}
                    stroke="#9CA3AF"
                    fontSize={10}
                    label={{ value: '← Faster | Generation Time (s) | Slower →', position: 'bottom', fill: '#6B7280', fontSize: 10, dy: 10 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="total"
                    name="Accuracy"
                    unit="%"
                    domain={[0, 70]}
                    stroke="#9CA3AF"
                    fontSize={10}
                    label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 10 }}
                  />
                  <ReferenceLine x={avgTime} stroke="#6B7280" strokeDasharray="5 5" />
                  <ReferenceLine y={avgAccuracy} stroke="#6B7280" strokeDasharray="5 5" />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter data={enrichedModels} fill="#8B5CF6">
                    {enrichedModels.map((entry, index) => (
                      <Cell key={index} fill={entry.color} fillOpacity={0.8} stroke={entry.color} strokeWidth={2} r={Math.max(8, entry.reward * 28)} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              {enrichedModels.slice(0, 6).map(m => (
                <div key={m.model} className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="text-gray-400">{m.shortName}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trade-off Bars */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Trade-off Analysis</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrichedModels.slice(0, 6)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" fontSize={10} domain={[0, 100]} />
                  <YAxis type="category" dataKey="shortName" width={70} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="total" name="Accuracy %" fill="#3B82F6" />
                  <Bar dataKey="speedScore" name="Speed Score" fill="#10B981" />
                  <Bar dataKey="rewardPct" name="Reward %" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* QUADRANTS TAB */}
      {activeTab === 'quadrants' && (
        <div className="space-y-4">
          {/* Speed vs Accuracy Quadrant */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Speed × Accuracy Quadrant</h3>
            <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
              <div className="bg-emerald-500/10 p-2 rounded text-center border border-emerald-500/20">
                <div className="text-emerald-400 font-medium">Elite</div>
                <div className="text-gray-500">Fast + Accurate</div>
              </div>
              <div className="bg-blue-500/10 p-2 rounded text-center border border-blue-500/20">
                <div className="text-blue-400 font-medium">Thorough</div>
                <div className="text-gray-500">Slow + Accurate</div>
              </div>
              <div className="bg-yellow-500/10 p-2 rounded text-center border border-yellow-500/20">
                <div className="text-yellow-400 font-medium">Quick</div>
                <div className="text-gray-500">Fast + Weak</div>
              </div>
              <div className="bg-red-500/10 p-2 rounded text-center border border-red-500/20">
                <div className="text-red-400 font-medium">Struggling</div>
                <div className="text-gray-500">Slow + Weak</div>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
                  {/* Quadrant backgrounds */}
                  <ReferenceArea x1={0} x2={avgTime} y1={avgAccuracy} y2={70} fill="#22C55E" fillOpacity={0.08} />
                  <ReferenceArea x1={avgTime} x2={200} y1={avgAccuracy} y2={70} fill="#3B82F6" fillOpacity={0.08} />
                  <ReferenceArea x1={0} x2={avgTime} y1={0} y2={avgAccuracy} fill="#EAB308" fillOpacity={0.08} />
                  <ReferenceArea x1={avgTime} x2={200} y1={0} y2={avgAccuracy} fill="#EF4444" fillOpacity={0.08} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" dataKey="time" name="Time" unit="s" domain={[0, 200]} stroke="#9CA3AF" fontSize={10}
                    label={{ value: '← Faster | Time (s) | Slower →', position: 'bottom', fill: '#6B7280', fontSize: 10, dy: 10 }} />
                  <YAxis type="number" dataKey="total" name="Accuracy" unit="%" domain={[0, 70]} stroke="#9CA3AF" fontSize={10}
                    label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 10 }} />
                  <ReferenceLine x={avgTime} stroke="#6B7280" strokeWidth={2} strokeDasharray="5 5" />
                  <ReferenceLine y={avgAccuracy} stroke="#6B7280" strokeWidth={2} strokeDasharray="5 5" />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter data={enrichedModels} fill="#8B5CF6">
                    {enrichedModels.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="#fff" strokeWidth={2} r={10} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Consistency vs Accuracy Quadrant */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Consistency × Accuracy Quadrant</h3>
            <p className="text-xs text-gray-500 mb-3">X: Perfect task rate (3/3 correct) | Y: Overall accuracy</p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
                  <ReferenceArea x1={avgConsistency} x2={60} y1={avgAccuracy} y2={70} fill="#22C55E" fillOpacity={0.08} />
                  <ReferenceArea x1={0} x2={avgConsistency} y1={avgAccuracy} y2={70} fill="#8B5CF6" fillOpacity={0.08} />
                  <ReferenceArea x1={0} x2={avgConsistency} y1={0} y2={avgAccuracy} fill="#EF4444" fillOpacity={0.08} />
                  <ReferenceArea x1={avgConsistency} x2={60} y1={0} y2={avgAccuracy} fill="#EAB308" fillOpacity={0.08} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" dataKey="consistencyScore" name="Consistency" unit="%" domain={[0, 60]} stroke="#9CA3AF" fontSize={10}
                    label={{ value: 'Perfect Task Rate (3/3) %', position: 'bottom', fill: '#6B7280', fontSize: 10, dy: 10 }} />
                  <YAxis type="number" dataKey="total" name="Accuracy" unit="%" domain={[0, 70]} stroke="#9CA3AF" fontSize={10}
                    label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 10 }} />
                  <ReferenceLine x={avgConsistency} stroke="#6B7280" strokeWidth={2} strokeDasharray="5 5" />
                  <ReferenceLine y={avgAccuracy} stroke="#6B7280" strokeWidth={2} strokeDasharray="5 5" />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter data={enrichedModels} fill="#8B5CF6">
                    {enrichedModels.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="#fff" strokeWidth={2} r={10} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                <span className="text-emerald-400 font-medium">Reliable:</span>
                <span className="text-gray-300"> Claude (52% perfect, 61% acc)</span>
              </div>
              <div className="bg-purple-500/10 p-2 rounded border border-purple-500/20">
                <span className="text-purple-400 font-medium">Lucky:</span>
                <span className="text-gray-300"> High acc but inconsistent runs</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIFFICULTY TAB */}
      {activeTab === 'difficulty' && (
        <div className="space-y-4">
          {/* L5 vs L6 Scatter */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Difficulty Scaling: L5 vs L6</h3>
            <p className="text-xs text-gray-500 mb-3">Models near diagonal scale well | Below = crashes on hard tasks</p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" dataKey="L5" name="L5" unit="%" domain={[0, 80]} stroke="#9CA3AF" fontSize={10}
                    label={{ value: 'L5 (Medium) Accuracy %', position: 'bottom', fill: '#6B7280', fontSize: 10, dy: 10 }} />
                  <YAxis type="number" dataKey="L6" name="L6" unit="%" domain={[0, 80]} stroke="#9CA3AF" fontSize={10}
                    label={{ value: 'L6 (Hard) Accuracy %', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 10 }} />
                  <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 80, y: 80 }]} stroke="#4B5563" strokeWidth={2} strokeDasharray="8 4" />
                  <ReferenceLine x={avgL5} stroke="#6B7280" strokeDasharray="5 5" />
                  <ReferenceLine y={avgL6} stroke="#6B7280" strokeDasharray="5 5" />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter data={enrichedModels} fill="#8B5CF6">
                    {enrichedModels.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="#fff" strokeWidth={2} r={Math.max(8, entry.total / 5)} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                <div className="text-emerald-400 font-medium">Scales Well</div>
                <div className="text-gray-300">Claude: 67% → 57% (-10%)</div>
                <div className="text-gray-300">Mistral-L: 48% → 40% (-8%)</div>
              </div>
              <div className="bg-red-500/10 p-2 rounded border border-red-500/20">
                <div className="text-red-400 font-medium">Crashes on Hard</div>
                <div className="text-gray-300">Gemini-Pro: 38% → 0% (-38%!)</div>
                <div className="text-gray-300">Qwen3: 57% → 33% (-24%)</div>
              </div>
            </div>
            <div className="mt-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/20 text-xs">
              <span className="text-yellow-400 font-medium">Anomaly:</span>
              <span className="text-gray-300"> Mistral-S: L5=14% but L6=57%! Better at hard than medium.</span>
            </div>
          </div>
        </div>
      )}

      {/* RELIABILITY TAB */}
      {activeTab === 'reliability' && (
        <div className="space-y-4">
          {/* Rollouts Stacked Bar */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Rollout Outcomes (75 per model)</h3>
            <p className="text-xs text-gray-500 mb-3">Correct (≥0.8) | Partial (0.2) | Wrong (0)</p>
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
            <h3 className="text-sm font-medium text-gray-400 mb-1">Task Consistency (25 tasks × 3 runs)</h3>
            <p className="text-xs text-gray-500 mb-3">Perfect = 3/3 | Mixed = 1-2/3 | Zero = 0/3</p>
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

          {/* Partial Impact */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Partial Score Impact</h3>
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
            <div className="mt-3 p-2 bg-yellow-500/10 rounded border border-yellow-500/20 text-xs">
              <span className="text-yellow-400 font-medium">Gemini-Pro</span>
              <span className="text-gray-300"> has 14 partials — would jump from 28% to 47% if counted!</span>
            </div>
          </div>
        </div>
      )}

      {/* RADAR TAB */}
      {activeTab === 'radar' && (
        <div className="p-4 rounded-xl bg-black/30 border border-white/10">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Multi-Dimensional Comparison</h3>
          <p className="text-xs text-gray-500 mb-3">6 dimensions, normalized 0-100 (Top 4 models)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 8 }} />
                  <Radar name="Claude" dataKey="Claude" stroke="#D97706" fill="#D97706" fillOpacity={0.3} strokeWidth={2} />
                  <Radar name="Qwen3" dataKey="Qwen3" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.3} strokeWidth={2} />
                  <Radar name="Mistral" dataKey="Mistral" stroke="#DC2626" fill="#DC2626" fillOpacity={0.3} strokeWidth={2} />
                  <Radar name="Llama" dataKey="Llama" stroke="#0891B2" fill="#0891B2" fillOpacity={0.3} strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="text-orange-400 font-medium">Claude Opus 4.5</div>
                <div className="text-gray-300">Largest area — best overall</div>
                <div className="text-gray-400 mt-1">Leads: Accuracy, Reward, Consistency, L6</div>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="text-purple-400 font-medium">Qwen3 Max</div>
                <div className="text-gray-300">Strong speed, decent accuracy</div>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="text-red-400 font-medium">Mistral Large</div>
                <div className="text-gray-300">Balanced mid-tier</div>
              </div>
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <div className="text-cyan-400 font-medium">Llama 4</div>
                <div className="text-gray-300">Fastest, smallest area</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS TAB */}
      {activeTab === 'details' && (
        <div className="p-4 rounded-xl bg-black/30 border border-white/10">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Complete Metrics</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-white/10">
                  <th className="text-left py-2 px-1">Model</th>
                  <th className="text-center py-2 px-1">Acc%</th>
                  <th className="text-center py-2 px-1">Reward</th>
                  <th className="text-center py-2 px-1 text-emerald-400">✓</th>
                  <th className="text-center py-2 px-1 text-yellow-400">½</th>
                  <th className="text-center py-2 px-1 text-red-400">✗</th>
                  <th className="text-center py-2 px-1">L5</th>
                  <th className="text-center py-2 px-1">L6</th>
                  <th className="text-center py-2 px-1">Time</th>
                  <th className="text-center py-2 px-1">3/3</th>
                  <th className="text-center py-2 px-1">0/3</th>
                </tr>
              </thead>
              <tbody>
                {rawData.map((d, i) => (
                  <tr key={i} className={`border-b border-white/5 ${i === 0 ? 'bg-orange-500/10' : ''}`}>
                    <td className="py-2 px-1 font-medium text-white">{d.shortName}</td>
                    <td className="text-center py-2 px-1 font-bold text-blue-400">{d.total}</td>
                    <td className="text-center py-2 px-1 text-orange-400">{d.reward.toFixed(3)}</td>
                    <td className="text-center py-2 px-1 text-emerald-400">{d.correct}</td>
                    <td className="text-center py-2 px-1 text-yellow-400">{d.partial}</td>
                    <td className="text-center py-2 px-1 text-red-400">{d.wrong}</td>
                    <td className="text-center py-2 px-1 text-yellow-300">{d.L5}</td>
                    <td className="text-center py-2 px-1 text-red-300">{d.L6}</td>
                    <td className="text-center py-2 px-1 text-gray-400">{d.time.toFixed(0)}s</td>
                    <td className="text-center py-2 px-1 text-emerald-400">{d.perfect}</td>
                    <td className="text-center py-2 px-1 text-red-400">{d.zero}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-500">
            <div>✓ = Correct (≥0.8)</div>
            <div>½ = Partial (0.2)</div>
            <div>✗ = Wrong (0)</div>
          </div>
        </div>
      )}

      <div className="text-center text-gray-500 text-xs">
        CodeBlue Final 25 • 9 Models • 75 rollouts each
      </div>
    </div>
  );
}
