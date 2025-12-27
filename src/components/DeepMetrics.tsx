'use client';

import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ComposedChart, ReferenceLine, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// Complete model data with all metrics
const rawData = [
  { model: "claude-opus-4.5", name: "Claude Opus 4.5", provider: "Anthropic", color: "#D97706",
    bank: 59.6, road: 66.7, total: 61.3, reward: 0.578, rewardBank: 0.562, rewardRoad: 0.626, time: 33.6,
    correct: 46, partial: 2, wrong: 27, total_n: 75, perfect: 13, zero: 8,
    L4: 50.0, L5: 66.7, L6: 56.7, efficiency: 0.026 },
  { model: "qwen3-max", name: "Qwen3 Max", provider: "Qwen", color: "#7C3AED",
    bank: 40.4, road: 66.7, total: 46.7, reward: 0.473, rewardBank: 0.424, rewardRoad: 0.628, time: 22.8,
    correct: 35, partial: 8, wrong: 32, total_n: 75, perfect: 7, zero: 10,
    L4: 16.7, L5: 57.1, L6: 33.3, efficiency: 0.030 },
  { model: "mistral-large", name: "Mistral Large", provider: "Mistral", color: "#DC2626",
    bank: 42.1, road: 44.4, total: 42.7, reward: 0.424, rewardBank: 0.422, rewardRoad: 0.428, time: 29.0,
    correct: 32, partial: 2, wrong: 41, total_n: 75, perfect: 5, zero: 8,
    L4: 33.3, L5: 47.6, L6: 40.0, efficiency: 0.032 },
  { model: "llama-4-maverick", name: "Llama 4 Maverick", provider: "Meta", color: "#0891B2",
    bank: 38.6, road: 27.8, total: 36.0, reward: 0.375, rewardBank: 0.410, rewardRoad: 0.265, time: 20.7,
    correct: 27, partial: 6, wrong: 42, total_n: 75, perfect: 3, zero: 10,
    L4: 33.3, L5: 47.6, L6: 33.3, efficiency: 0.029 },
  { model: "mistral-small", name: "Mistral Small", provider: "Mistral", color: "#F87171",
    bank: 36.8, road: 27.8, total: 34.7, reward: 0.343, rewardBank: 0.367, rewardRoad: 0.267, time: 27.7,
    correct: 26, partial: 2, wrong: 47, total_n: 75, perfect: 5, zero: 13,
    L4: 16.7, L5: 14.3, L6: 56.7, efficiency: 0.024 },
  { model: "gemini-3-pro", name: "Gemini 3 Pro", provider: "Google", color: "#2563EB",
    bank: 17.5, road: 61.1, total: 28.0, reward: 0.294, rewardBank: 0.209, rewardRoad: 0.563, time: 92.4,
    correct: 21, partial: 14, wrong: 40, total_n: 75, perfect: 5, zero: 16,
    L4: 33.3, L5: 38.1, L6: 0.0, efficiency: 0.010 },
  { model: "deepseek-v3.2", name: "DeepSeek v3.2", provider: "DeepSeek", color: "#059669",
    bank: 12.3, road: 11.1, total: 12.0, reward: 0.107, rewardBank: 0.110, rewardRoad: 0.099, time: 65.7,
    correct: 9, partial: 0, wrong: 66, total_n: 75, perfect: 0, zero: 17,
    L4: 16.7, L5: 0.0, L6: 20.0, efficiency: 0.002 },
  { model: "intellect-3", name: "Intellect 3", provider: "Prime", color: "#DB2777",
    bank: 8.8, road: 16.7, total: 10.7, reward: 0.101, rewardBank: 0.084, rewardRoad: 0.155, time: 177.4,
    correct: 8, partial: 2, wrong: 65, total_n: 75, perfect: 0, zero: 20,
    L4: 0.0, L5: 4.8, L6: 13.3, efficiency: 0.004 },
  { model: "gemini-3-flash", name: "Gemini 3 Flash", provider: "Google", color: "#60A5FA",
    bank: 1.8, road: 16.7, total: 5.3, reward: 0.056, rewardBank: 0.023, rewardRoad: 0.158, time: 43.7,
    correct: 4, partial: 1, wrong: 70, total_n: 75, perfect: 0, zero: 22,
    L4: 0.0, L5: 0.0, L6: 3.3, efficiency: 0.004 },
];

// Enriched data with derived metrics
const enrichedModels = rawData.map(m => ({
  ...m,
  speedScore: Math.max(0, 100 - m.time),
  consistencyScore: (m.perfect / 25) * 100,
  partialRate: (m.partial / 75) * 100,
  failureRate: (m.zero / 25) * 100,
  difficultyDrop: m.L4 - m.L6,
  bankSpecialist: m.bank - m.road,
  roadSpecialist: m.road - m.bank,
  rewardPerSecond: m.reward / m.time * 100,
  qualityScore: m.reward * 100,
}));

// Averages for reference lines
const avgAccuracy = rawData.reduce((a, m) => a + m.total, 0) / rawData.length;
const avgTime = rawData.reduce((a, m) => a + m.time, 0) / rawData.length;
const avgBank = rawData.reduce((a, m) => a + m.bank, 0) / rawData.length;
const avgRoad = rawData.reduce((a, m) => a + m.road, 0) / rawData.length;
const avgConsistency = enrichedModels.reduce((a, m) => a + m.consistencyScore, 0) / rawData.length;

// Custom tooltip component
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof enrichedModels[0]; name: string; value: number; color?: string }> }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-xs">
        <p className="font-bold text-white mb-1">{d.name}</p>
        <p className="text-gray-400">{d.provider}</p>
        <div className="mt-2 space-y-1">
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color || '#fff' }}>
              {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
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

  // Reward breakdown data
  const rewardData = useMemo(() => rawData.map(d => ({
    model: d.model.split('-').slice(-2).join('-'),
    fullModel: d.model,
    'Bank Reward': d.rewardBank,
    'Road Reward': d.rewardRoad,
    'Combined': d.reward,
    provider: d.provider,
  })), []);

  // Rollout breakdown data
  const rolloutData = useMemo(() => rawData.map(d => ({
    model: d.model.split('-').slice(-2).join('-'),
    Correct: d.correct,
    Partial: d.partial,
    Wrong: d.wrong,
    correctPct: (d.correct / d.total_n * 100).toFixed(1),
    partialPct: (d.partial / d.total_n * 100).toFixed(1),
    wrongPct: (d.wrong / d.total_n * 100).toFixed(1),
  })), []);

  // Partial impact data
  const partialImpact = useMemo(() => rawData.map(d => ({
    model: d.model.replace(/-/g, ' '),
    correct: d.correct,
    partial: d.partial,
    wrong: d.wrong,
    accuracy_with_partial: ((d.correct + d.partial) / d.total_n * 100).toFixed(1),
    accuracy_current: d.total,
    partial_boost: ((d.correct + d.partial) / d.total_n * 100 - d.total).toFixed(1),
  })), []);

  // Consistency data
  const consistencyData = useMemo(() => rawData.map(d => ({
    model: d.model.split('-').slice(-2).join('-'),
    'Perfect (3/3)': d.perfect,
    'Zero (0/3)': d.zero,
    'Mixed': 25 - d.perfect - d.zero,
    perfectRate: (d.perfect / 25 * 100).toFixed(0),
    zeroRate: (d.zero / 25 * 100).toFixed(0),
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
    { id: 'bubbles', label: 'Bubble Charts' },
    { id: 'radar', label: 'Radar' },
    { id: 'rollouts', label: 'Rollouts' },
    { id: 'partials', label: 'Partials' },
    { id: 'consistency', label: 'Consistency' },
    { id: 'details', label: 'Details' },
  ];

  return (
    <div className="space-y-6">
      {/* Key Stats Row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center">
        <div className="p-3 rounded-xl bg-black/30 border border-white/10">
          <div className="text-lg font-bold text-orange-400">0.578</div>
          <div className="text-xs text-gray-500">Best Reward</div>
        </div>
        <div className="p-3 rounded-xl bg-black/30 border border-white/10">
          <div className="text-lg font-bold text-emerald-400">46/75</div>
          <div className="text-xs text-gray-500">Most Correct</div>
        </div>
        <div className="p-3 rounded-xl bg-black/30 border border-white/10">
          <div className="text-lg font-bold text-yellow-400">14</div>
          <div className="text-xs text-gray-500">Max Partials</div>
        </div>
        <div className="p-3 rounded-xl bg-black/30 border border-white/10">
          <div className="text-lg font-bold text-purple-400">52%</div>
          <div className="text-xs text-gray-500">Best 3/3 Rate</div>
        </div>
        <div className="p-3 rounded-xl bg-black/30 border border-white/10">
          <div className="text-lg font-bold text-cyan-400">20.7s</div>
          <div className="text-xs text-gray-500">Fastest</div>
        </div>
        <div className="p-3 rounded-xl bg-black/30 border border-white/10">
          <div className="text-lg font-bold text-red-400">22/25</div>
          <div className="text-xs text-gray-500">Most 0/3 Tasks</div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rewards Chart */}
            <div className="p-4 rounded-xl bg-black/30 border border-white/10">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Reward by Dataset</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rewardData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" domain={[0, 0.7]} stroke="#9CA3AF" fontSize={10} />
                    <YAxis type="category" dataKey="model" width={80} tick={{ fill: '#9CA3AF', fontSize: 9 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="Bank Reward" fill="#3B82F6" />
                    <Bar dataKey="Road Reward" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Speed vs Accuracy Quick View */}
            <div className="p-4 rounded-xl bg-black/30 border border-white/10">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Speed vs Accuracy</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" dataKey="time" name="Time" unit="s" domain={[0, 200]} stroke="#9CA3AF" fontSize={10} />
                    <YAxis type="number" dataKey="total" name="Accuracy" unit="%" domain={[0, 70]} stroke="#9CA3AF" fontSize={10} />
                    <ReferenceLine x={avgTime} stroke="#6B7280" strokeDasharray="5 5" />
                    <ReferenceLine y={avgAccuracy} stroke="#6B7280" strokeDasharray="5 5" />
                    <Tooltip content={<CustomTooltip />} />
                    <Scatter data={enrichedModels} fill="#8B5CF6">
                      {enrichedModels.map((entry, index) => (
                        <Cell key={index} fill={entry.color} r={Math.max(8, entry.reward * 20)} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Trade-off Analysis */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Trade-off Analysis: What Do You Optimize For?</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={enrichedModels.slice(0, 7)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" fontSize={10} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#9CA3AF', fontSize: 9 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="total" name="Accuracy %" fill="#3B82F6" />
                  <Bar dataKey="speedScore" name="Speed Score" fill="#10B981" />
                  <Bar dataKey="qualityScore" name="Reward×100" fill="#F59E0B" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="text-blue-400 font-medium">Optimize: Accuracy</div>
                <div className="text-gray-300">Winner: Claude (61.3%)</div>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-emerald-400 font-medium">Optimize: Speed</div>
                <div className="text-gray-300">Winner: Llama-4 (20.7s)</div>
              </div>
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="text-orange-400 font-medium">Optimize: Value</div>
                <div className="text-gray-300">Winner: Claude (0.578)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUADRANTS TAB */}
      {activeTab === 'quadrants' && (
        <div className="space-y-4">
          {/* Speed vs Accuracy Quadrant */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Speed vs Accuracy Quadrant</h3>
            <p className="text-xs text-gray-500 mb-3">X: Generation Time (lower=faster) | Y: Accuracy % | Size: Reward</p>

            <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
              <div className="bg-emerald-500/10 p-2 rounded text-center border border-emerald-500/20">
                <div className="text-emerald-400 font-medium">Q1: Elite</div>
                <div className="text-gray-400">Fast + Accurate</div>
              </div>
              <div className="bg-blue-500/10 p-2 rounded text-center border border-blue-500/20">
                <div className="text-blue-400 font-medium">Q2: Thorough</div>
                <div className="text-gray-400">Slow + Accurate</div>
              </div>
              <div className="bg-yellow-500/10 p-2 rounded text-center border border-yellow-500/20">
                <div className="text-yellow-400 font-medium">Q3: Quick</div>
                <div className="text-gray-400">Fast + Inaccurate</div>
              </div>
              <div className="bg-red-500/10 p-2 rounded text-center border border-red-500/20">
                <div className="text-red-400 font-medium">Q4: Struggling</div>
                <div className="text-gray-400">Slow + Inaccurate</div>
              </div>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" dataKey="time" name="Time" unit="s" domain={[0, 200]} stroke="#9CA3AF" fontSize={10}
                    label={{ value: '← Faster | Generation Time (s) | Slower →', position: 'bottom', fill: '#6B7280', fontSize: 10 }} />
                  <YAxis type="number" dataKey="total" name="Accuracy" unit="%" domain={[0, 70]} stroke="#9CA3AF" fontSize={10}
                    label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 10 }} />
                  <ReferenceLine x={avgTime} stroke="#6B7280" strokeDasharray="5 5" />
                  <ReferenceLine y={avgAccuracy} stroke="#6B7280" strokeDasharray="5 5" />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter data={enrichedModels} fill="#8B5CF6">
                    {enrichedModels.map((entry, index) => (
                      <Cell key={index} fill={entry.color} r={Math.max(8, entry.reward * 25)} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                <span className="text-emerald-400">●</span> Claude: Elite (33.6s, 61.3%)
              </div>
              <div className="bg-purple-500/10 p-2 rounded border border-purple-500/20">
                <span className="text-purple-400">●</span> Qwen3: Near-elite (22.8s, 46.7%)
              </div>
              <div className="bg-pink-500/10 p-2 rounded border border-pink-500/20">
                <span className="text-pink-400">●</span> Intellect: Struggling (177s, 10.7%)
              </div>
            </div>
          </div>

          {/* Bank vs Road Quadrant */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Bank vs Road Performance</h3>
            <p className="text-xs text-gray-500 mb-3">X: Bank Accuracy % | Y: Road Accuracy % | Diagonal = Equal performance</p>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" dataKey="bank" name="Bank" unit="%" domain={[0, 70]} stroke="#9CA3AF" fontSize={10}
                    label={{ value: 'Bank Accuracy %', position: 'bottom', fill: '#6B7280', fontSize: 10 }} />
                  <YAxis type="number" dataKey="road" name="Road" unit="%" domain={[0, 70]} stroke="#9CA3AF" fontSize={10}
                    label={{ value: 'Road Accuracy %', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 10 }} />
                  <ReferenceLine x={avgBank} stroke="#6B7280" strokeDasharray="5 5" />
                  <ReferenceLine y={avgRoad} stroke="#6B7280" strokeDasharray="5 5" />
                  <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 70, y: 70 }]} stroke="#4B5563" strokeDasharray="3 3" />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter data={enrichedModels} fill="#8B5CF6">
                    {enrichedModels.map((entry, index) => (
                      <Cell key={index} fill={entry.color} r={Math.max(6, entry.total / 5)} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-blue-500/10 p-2 rounded border border-blue-500/20">
                <span className="font-medium text-blue-400">Road Specialists:</span>
                <span className="text-gray-300"> Gemini-3-Pro (+43.6%), Qwen3 (+26.3%)</span>
              </div>
              <div className="bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                <span className="font-medium text-yellow-400">Bank Specialists:</span>
                <span className="text-gray-300"> Llama-4 (+10.8%), Mistral-Small (+9%)</span>
              </div>
            </div>
          </div>

          {/* Consistency vs Accuracy Quadrant */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Consistency vs Accuracy</h3>
            <p className="text-xs text-gray-500 mb-3">X: Perfect Task Rate (3/3) | Y: Accuracy % | Size: Inverse of failure rate</p>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" dataKey="consistencyScore" name="Consistency" unit="%" domain={[0, 60]} stroke="#9CA3AF" fontSize={10}
                    label={{ value: 'Perfect Task Rate (3/3 correct) %', position: 'bottom', fill: '#6B7280', fontSize: 10 }} />
                  <YAxis type="number" dataKey="total" name="Accuracy" unit="%" domain={[0, 70]} stroke="#9CA3AF" fontSize={10}
                    label={{ value: 'Overall Accuracy %', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 10 }} />
                  <ReferenceLine x={avgConsistency} stroke="#6B7280" strokeDasharray="5 5" />
                  <ReferenceLine y={avgAccuracy} stroke="#6B7280" strokeDasharray="5 5" />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter data={enrichedModels} fill="#8B5CF6">
                    {enrichedModels.map((entry, index) => (
                      <Cell key={index} fill={entry.color} r={Math.max(6, 20 - entry.failureRate / 5)} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 p-2 bg-emerald-500/10 rounded border border-emerald-500/20 text-xs">
              <p className="text-gray-300">
                <span className="text-emerald-400 font-medium">Claude</span> is the most reliable: 52% perfect task rate with 61.3% accuracy.
                <span className="text-blue-400 font-medium"> Gemini-3-Pro</span> shows inconsistency: only 20% perfect despite 28% overall.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BUBBLE CHARTS TAB */}
      {activeTab === 'bubbles' && (
        <div className="space-y-4">
          {/* Accuracy/Time/Reward Bubble */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-1">3D Bubble: Accuracy × Time × Reward</h3>
            <p className="text-xs text-gray-500 mb-3">X: Time (s) | Y: Accuracy % | Bubble Size: Reward Score</p>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" dataKey="time" name="Time" unit="s" domain={[0, 200]} stroke="#9CA3AF" fontSize={10}
                    label={{ value: 'Generation Time (seconds)', position: 'bottom', fill: '#6B7280', fontSize: 10, dy: 10 }} />
                  <YAxis type="number" dataKey="total" name="Accuracy" unit="%" domain={[0, 70]} stroke="#9CA3AF" fontSize={10}
                    label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter data={enrichedModels} fill="#8B5CF6">
                    {enrichedModels.map((entry, index) => (
                      <Cell key={index} fill={entry.color} fillOpacity={0.7} stroke={entry.color} strokeWidth={2} r={entry.reward * 30} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 flex justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500 opacity-70" />
                <span className="text-gray-400">Small = Low Reward</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-orange-500 opacity-70" />
                <span className="text-gray-400">Large = High Reward</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                <div className="text-emerald-400 font-medium">Best Value</div>
                <div className="text-gray-300">Claude: Biggest bubble, good position</div>
              </div>
              <div className="bg-purple-500/10 p-2 rounded border border-purple-500/20">
                <div className="text-purple-400 font-medium">Efficient</div>
                <div className="text-gray-300">Qwen3: Good size, fastest cluster</div>
              </div>
              <div className="bg-red-500/10 p-2 rounded border border-red-500/20">
                <div className="text-red-400 font-medium">Poor Value</div>
                <div className="text-gray-300">Intellect: Tiny bubble, slow</div>
              </div>
            </div>
          </div>

          {/* Difficulty Scaling Bubble */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Difficulty Scaling: L5 vs L6 Performance</h3>
            <p className="text-xs text-gray-500 mb-3">X: L5 (Medium) Accuracy | Y: L6 (Hard) Accuracy | Size: Overall Accuracy | Diagonal = Equal</p>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" dataKey="L5" name="L5 (Medium)" unit="%" domain={[0, 100]} stroke="#9CA3AF" fontSize={10}
                    label={{ value: 'L5 (Medium Difficulty) Accuracy %', position: 'bottom', fill: '#6B7280', fontSize: 10, dy: 10 }} />
                  <YAxis type="number" dataKey="L6" name="L6 (Hard)" unit="%" domain={[0, 100]} stroke="#9CA3AF" fontSize={10}
                    label={{ value: 'L6 (Hard) Accuracy %', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 10 }} />
                  <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} stroke="#4B5563" strokeDasharray="3 3" />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter data={enrichedModels} fill="#8B5CF6">
                    {enrichedModels.map((entry, index) => (
                      <Cell key={index} fill={entry.color} fillOpacity={0.7} stroke={entry.color} strokeWidth={2} r={Math.max(6, entry.total / 4)} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                <div className="text-emerald-400 font-medium">Scales Well (near diagonal)</div>
                <div className="text-gray-300">Claude: L5=66.7% → L6=56.7% (-10%)</div>
                <div className="text-gray-300">Mistral-Large: L5=47.6% → L6=40% (-7.6%)</div>
              </div>
              <div className="bg-red-500/10 p-2 rounded border border-red-500/20">
                <div className="text-red-400 font-medium">Drops Significantly</div>
                <div className="text-gray-300">Gemini-3-Pro: L5=38.1% → L6=0% (-38%!)</div>
                <div className="text-gray-300">Qwen3: L5=57.1% → L6=33.3% (-24%)</div>
              </div>
            </div>

            <div className="mt-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/20 text-xs">
              <p className="text-yellow-400 font-medium">Anomaly: Mistral-Small</p>
              <p className="text-gray-300">L5=14.3% but L6=56.7% — better at hard tasks than medium! May indicate task-type affinity rather than difficulty scaling.</p>
            </div>
          </div>
        </div>
      )}

      {/* RADAR TAB */}
      {activeTab === 'radar' && (
        <div className="p-4 rounded-xl bg-black/30 border border-white/10">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Multi-Dimensional Radar Comparison</h3>
          <p className="text-xs text-gray-500 mb-3">6 dimensions normalized to 0-100 scale (Top 4 models)</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 8 }} />
                  <Radar name="Claude" dataKey="Claude" stroke="#D97706" fill="#D97706" fillOpacity={0.3} />
                  <Radar name="Qwen3" dataKey="Qwen3" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.3} />
                  <Radar name="Mistral" dataKey="Mistral" stroke="#DC2626" fill="#DC2626" fillOpacity={0.3} />
                  <Radar name="Llama" dataKey="Llama" stroke="#0891B2" fill="#0891B2" fillOpacity={0.3} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="text-orange-400 font-medium">Claude Opus 4.5</div>
                <div className="text-gray-300">Largest area — best overall profile</div>
                <div className="text-gray-400 mt-1">Leads: Accuracy, Reward, Consistency, L6</div>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="text-purple-400 font-medium">Qwen3 Max</div>
                <div className="text-gray-300">Strong speed, decent accuracy</div>
                <div className="text-gray-400 mt-1">Best at: Speed (77.2)</div>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="text-red-400 font-medium">Mistral Large</div>
                <div className="text-gray-300">Balanced but not leading</div>
                <div className="text-gray-400 mt-1">Consistent mid-tier performance</div>
              </div>
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <div className="text-cyan-400 font-medium">Llama 4</div>
                <div className="text-gray-300">Fastest but smallest area</div>
                <div className="text-gray-400 mt-1">Speed over quality trade-off</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROLLOUTS TAB */}
      {activeTab === 'rollouts' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-3">
              Rollout Outcome Breakdown (75 total per model)
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rolloutData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" domain={[0, 75]} stroke="#9CA3AF" fontSize={10} />
                  <YAxis type="category" dataKey="model" width={100} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Correct" stackId="a" fill="#22C55E" />
                  <Bar dataKey="Partial" stackId="a" fill="#EAB308" />
                  <Bar dataKey="Wrong" stackId="a" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Rollout Counts Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-white/10">
                    <th className="text-left py-2 px-2">Model</th>
                    <th className="text-center py-2 px-2 text-emerald-400">Correct</th>
                    <th className="text-center py-2 px-2 text-yellow-400">Partial</th>
                    <th className="text-center py-2 px-2 text-red-400">Wrong</th>
                    <th className="text-center py-2 px-2">Total</th>
                    <th className="text-center py-2 px-2 text-blue-400">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {rawData.map((d, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-2 px-2 font-medium text-white">{d.model}</td>
                      <td className="text-center py-2 px-2 text-emerald-400 font-mono">{d.correct}</td>
                      <td className="text-center py-2 px-2 text-yellow-400 font-mono">{d.partial}</td>
                      <td className="text-center py-2 px-2 text-red-400 font-mono">{d.wrong}</td>
                      <td className="text-center py-2 px-2 font-mono text-gray-400">{d.total_n}</td>
                      <td className="text-center py-2 px-2 text-blue-400 font-bold">{d.total}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PARTIALS TAB */}
      {activeTab === 'partials' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Partial Scoring Impact</h3>
            <p className="text-xs text-gray-500 mb-3">
              How much would accuracy change if partials (score 0.2) counted as correct?
            </p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={partialImpact} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" domain={[0, 75]} stroke="#9CA3AF" fontSize={10} />
                  <YAxis type="category" dataKey="model" width={110} tick={{ fill: '#9CA3AF', fontSize: 9 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="correct" name="Correct (0.8+)" fill="#22C55E" stackId="a" />
                  <Bar dataKey="partial" name="Partial (0.2)" fill="#EAB308" stackId="a" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Partial Score Analysis</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-white/10">
                    <th className="text-left py-2 px-2">Model</th>
                    <th className="text-center py-2 px-2">Partials</th>
                    <th className="text-center py-2 px-2">Current Acc</th>
                    <th className="text-center py-2 px-2">If Partials=Correct</th>
                    <th className="text-center py-2 px-2 text-yellow-400">Boost</th>
                  </tr>
                </thead>
                <tbody>
                  {partialImpact.map((d, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-2 px-2 text-white">{d.model}</td>
                      <td className="text-center py-2 px-2 text-yellow-400 font-mono">{d.partial}</td>
                      <td className="text-center py-2 px-2 font-mono text-gray-300">{d.accuracy_current}%</td>
                      <td className="text-center py-2 px-2 font-mono text-emerald-400">{d.accuracy_with_partial}%</td>
                      <td className="text-center py-2 px-2 font-mono text-yellow-400">+{d.partial_boost}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
              <p className="text-xs text-yellow-400 font-medium mb-1">Key Insight: Partial Scores</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• <span className="text-yellow-400">gemini-3-pro</span> has most partials (14) → would gain +18.7% if counted</li>
                <li>• <span className="text-emerald-400">claude-opus-4.5</span> has only 2 partials → minimal impact (+2.7%)</li>
                <li>• Partial score = 0.2 means answer was close but not exact (100x scale error)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CONSISTENCY TAB */}
      {activeTab === 'consistency' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-1">
              Task Consistency (25 tasks × 3 rollouts each)
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Perfect = 3/3 correct on task, Zero = 0/3 correct, Mixed = 1-2/3
            </p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consistencyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" domain={[0, 25]} stroke="#9CA3AF" fontSize={10} />
                  <YAxis type="category" dataKey="model" width={100} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Perfect (3/3)" stackId="a" fill="#22C55E" />
                  <Bar dataKey="Mixed" stackId="a" fill="#6366F1" />
                  <Bar dataKey="Zero (0/3)" stackId="a" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-black/30 border border-white/10">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Consistency Rates</h3>
              <div className="space-y-2">
                {consistencyData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs w-24 truncate text-gray-300">{d.model}</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${d.perfectRate}%` }} />
                    </div>
                    <span className="text-xs text-emerald-400 w-10">{d.perfectRate}%</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Green bar = % of tasks with 3/3 correct</p>
            </div>

            <div className="p-4 rounded-xl bg-black/30 border border-white/10">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Consistency Stats</h3>
              <div className="space-y-3 text-xs">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-emerald-400 font-medium">Most Consistent</div>
                  <div className="text-gray-300">Claude: 13/25 perfect tasks (52%)</div>
                </div>
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="text-red-400 font-medium">Most Failures</div>
                  <div className="text-gray-300">Gemini-3-Flash: 22/25 zero tasks</div>
                </div>
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="text-purple-400 font-medium">Most Variable</div>
                  <div className="text-gray-300">Llama-4: Only 3 perfect, 10 zero, 12 mixed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS TAB */}
      {activeTab === 'details' && (
        <div className="p-4 rounded-xl bg-black/30 border border-white/10">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Complete Metrics Table</h3>
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
                  <th className="text-center py-2 px-1">Bank%</th>
                  <th className="text-center py-2 px-1">Road%</th>
                  <th className="text-center py-2 px-1">L4</th>
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
                    <td className="py-2 px-1 font-medium text-white truncate max-w-24">{d.model}</td>
                    <td className="text-center py-2 px-1 font-bold text-blue-400">{d.total}</td>
                    <td className="text-center py-2 px-1 text-orange-400">{d.reward.toFixed(3)}</td>
                    <td className="text-center py-2 px-1 text-emerald-400">{d.correct}</td>
                    <td className="text-center py-2 px-1 text-yellow-400">{d.partial}</td>
                    <td className="text-center py-2 px-1 text-red-400">{d.wrong}</td>
                    <td className="text-center py-2 px-1 text-gray-300">{d.bank}</td>
                    <td className="text-center py-2 px-1 text-gray-300">{d.road}</td>
                    <td className="text-center py-2 px-1 text-green-300">{d.L4}</td>
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
            <div>✓ = Correct (score ≥ 0.8)</div>
            <div>½ = Partial (score = 0.2)</div>
            <div>✗ = Wrong (score = 0)</div>
          </div>
        </div>
      )}

      <div className="text-center text-gray-500 text-xs">
        CodeBlue Final 25 • Complete Models Only (9) • 75 rollouts each (25 tasks × 3)
      </div>
    </div>
  );
}
