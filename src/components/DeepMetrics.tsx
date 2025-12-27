'use client';

import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ComposedChart
} from 'recharts';
import benchmarkDataRaw from '@/data/benchmark-data.json';

// Raw data from Final 25 benchmark
const rawData = [
  { model: "claude-opus-4.5", provider: "Anthropic", bank: 59.6, road: 66.7, total: 61.3, reward: 0.578, rewardBank: 0.562, rewardRoad: 0.626, time: 33.6, correct: 46, partial: 2, wrong: 27, total_n: 75, perfect: 13, zero: 8, L4: 50.0, L5: 66.7, L6: 56.7 },
  { model: "qwen3-max", provider: "Qwen", bank: 40.4, road: 66.7, total: 46.7, reward: 0.473, rewardBank: 0.424, rewardRoad: 0.628, time: 22.8, correct: 35, partial: 8, wrong: 32, total_n: 75, perfect: 7, zero: 10, L4: 16.7, L5: 57.1, L6: 33.3 },
  { model: "mistral-large", provider: "Mistral", bank: 42.1, road: 44.4, total: 42.7, reward: 0.424, rewardBank: 0.422, rewardRoad: 0.428, time: 29.0, correct: 32, partial: 2, wrong: 41, total_n: 75, perfect: 5, zero: 8, L4: 33.3, L5: 47.6, L6: 40.0 },
  { model: "llama-4-maverick", provider: "Meta", bank: 38.6, road: 27.8, total: 36.0, reward: 0.375, rewardBank: 0.410, rewardRoad: 0.265, time: 20.7, correct: 27, partial: 6, wrong: 42, total_n: 75, perfect: 3, zero: 10, L4: 33.3, L5: 47.6, L6: 33.3 },
  { model: "mistral-small", provider: "Mistral", bank: 36.8, road: 27.8, total: 34.7, reward: 0.343, rewardBank: 0.367, rewardRoad: 0.267, time: 27.7, correct: 26, partial: 2, wrong: 47, total_n: 75, perfect: 5, zero: 13, L4: 16.7, L5: 14.3, L6: 56.7 },
  { model: "gemini-3-pro", provider: "Google", bank: 17.5, road: 61.1, total: 28.0, reward: 0.294, rewardBank: 0.209, rewardRoad: 0.563, time: 92.4, correct: 21, partial: 14, wrong: 40, total_n: 75, perfect: 5, zero: 16, L4: 33.3, L5: 38.1, L6: 0.0 },
  { model: "deepseek-v3.2", provider: "DeepSeek", bank: 12.3, road: 11.1, total: 12.0, reward: 0.107, rewardBank: 0.110, rewardRoad: 0.099, time: 65.7, correct: 9, partial: 0, wrong: 66, total_n: 75, perfect: 0, zero: 17, L4: 16.7, L5: 0.0, L6: 20.0 },
  { model: "intellect-3", provider: "Prime", bank: 8.8, road: 16.7, total: 10.7, reward: 0.101, rewardBank: 0.084, rewardRoad: 0.155, time: 177.4, correct: 8, partial: 2, wrong: 65, total_n: 75, perfect: 0, zero: 20, L4: 0.0, L5: 4.8, L6: 13.3 },
  { model: "gemini-3-flash", provider: "Google", bank: 1.8, road: 16.7, total: 5.3, reward: 0.056, rewardBank: 0.023, rewardRoad: 0.158, time: 43.7, correct: 4, partial: 1, wrong: 70, total_n: 75, perfect: 0, zero: 22, L4: 0.0, L5: 0.0, L6: 3.3 },
];

const COLORS: Record<string, string> = {
  'Anthropic': '#D97706',
  'Qwen': '#7C3AED',
  'Google': '#2563EB',
  'Mistral': '#DC2626',
  'Meta': '#0891B2',
  'DeepSeek': '#059669',
  'Prime': '#DB2777',
};

export default function DeepMetrics() {
  const [activeTab, setActiveTab] = useState('rewards');

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

  // Scatter data for correlation
  const scatterData = useMemo(() => rawData.map(d => ({
    ...d,
    name: d.model,
  })), []);

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
        {['rewards', 'rollouts', 'partials', 'consistency', 'details'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-black/30 text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* REWARDS TAB */}
      {activeTab === 'rewards' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Average Reward by Model & Dataset</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rewardData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" domain={[0, 0.7]} stroke="#9CA3AF" fontSize={10} />
                  <YAxis type="category" dataKey="model" width={100} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', fontSize: 11 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Bank Reward" fill="#3B82F6" />
                  <Bar dataKey="Road Reward" fill="#10B981" />
                  <Bar dataKey="Combined" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/30 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Reward vs Accuracy Correlation</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    type="number"
                    dataKey="total"
                    name="Accuracy"
                    unit="%"
                    stroke="#9CA3AF"
                    fontSize={10}
                    domain={[0, 70]}
                  />
                  <YAxis
                    type="number"
                    dataKey="reward"
                    name="Reward"
                    stroke="#9CA3AF"
                    fontSize={10}
                    domain={[0, 0.7]}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', fontSize: 11 }}
                    formatter={(value) => {
                      if (typeof value === 'number') {
                        return value < 1 ? value.toFixed(3) : `${value}%`;
                      }
                      return String(value);
                    }}
                  />
                  <Scatter data={scatterData} fill="#F59E0B">
                    {scatterData.map((entry, i) => (
                      <Cell key={i} fill={COLORS[entry.provider] || '#6B7280'} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Strong correlation: higher accuracy → higher reward (r ≈ 0.98)
            </p>
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
                <li>• Partial score = 0.2 means answer was close but not exact match (100x scale error)</li>
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
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${d.perfectRate}%` }}
                      />
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
