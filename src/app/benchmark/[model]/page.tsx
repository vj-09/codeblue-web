'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Trophy,
  Clock,
  Target,
  Zap,
  FileText,
  Code,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Play,
  BarChart3,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import benchmarkData from '@/data/benchmark-data.json';

interface Example {
  example_id: number;
  task: string;
  reward: number;
  answer: string;
  info: {
    expected: number;
    level: string;
    task_id: string;
    tolerance: number;
  };
  prompt: Array<{ content: string; role: string }>;
  completion: Array<{ content: string; role: string }>;
  score_correctness: number;
  score_efficiency: number;
  generation_ms: number;
}

interface ModelData {
  model: string;
  provider: string;
  name: string;
  totalRuns: number;
  avgReward: number;
  bestReward: number;
  rank?: number;
  color?: string;
  modes: Record<string, { reward: number; metrics: Record<string, number>; runs: number }>;
  metrics: Record<string, number>;
  examples: Example[];
}

const providerColors: Record<string, string> = {
  qwen: '#10B981',
  anthropic: '#8B5CF6',
  google: '#3B82F6',
  openai: '#F59E0B',
  deepseek: '#EC4899',
  mistralai: '#F97316',
  'meta-llama': '#06B6D4',
  'x-ai': '#EF4444',
  'prime-intellect': '#A855F7',
  ensemble: '#14B8A6',
};

const modeLabels: Record<string, string> = {
  bank: 'Bank Tasks (19)',
  road: 'Road Tasks (6)',
};

export default function ModelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const modelParam = decodeURIComponent(params.model as string);

  const [activeTab, setActiveTab] = useState<'overview' | 'trajectories' | 'analysis'>('overview');
  const [expandedExample, setExpandedExample] = useState<number | null>(null);

  const modelData = useMemo(() => {
    return (benchmarkData.models as ModelData[]).find(
      (m) => m.model === modelParam || m.name === modelParam
    );
  }, [modelParam]);

  if (!modelData) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push('/benchmark')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Benchmark
          </button>
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-white mb-4">Model Not Found</h1>
            <p className="text-slate-400">Could not find data for: {modelParam}</p>
          </div>
        </div>
      </div>
    );
  }

  const color = providerColors[modelData.provider] || '#6B7280';

  // Calculate success rate
  const successfulExamples = modelData.examples.filter((e) => e.score_correctness > 0.5);
  const successRate = modelData.examples.length > 0
    ? (successfulExamples.length / modelData.examples.length) * 100
    : 0;

  // Radar chart data
  const radarData = [
    { metric: 'Correctness', value: (modelData.metrics.score_correctness || 0) * 100, fullMark: 100 },
    { metric: 'Efficiency', value: (modelData.metrics.score_efficiency || 0) * 100, fullMark: 100 },
    { metric: 'Notes Usage', value: (modelData.metrics.score_notes_usage || 0) * 100, fullMark: 100 },
    { metric: 'Code Quality', value: (modelData.metrics.score_code_quality || 0) * 100, fullMark: 100 },
  ];

  // Mode comparison data
  const modeData = Object.entries(modelData.modes).map(([mode, data]) => ({
    mode: modeLabels[mode] || mode,
    reward: data.reward,
    runs: data.runs,
    correctness: (data.metrics.score_correctness || 0) * 100,
    efficiency: (data.metrics.score_efficiency || 0) * 100,
  }));

  // Success/Failure distribution
  const outcomeData = [
    { name: 'Success', value: successfulExamples.length, color: '#10B981' },
    { name: 'Failure', value: modelData.examples.length - successfulExamples.length, color: '#EF4444' },
  ];

  // Average generation time
  const avgGenTime = modelData.examples.length > 0
    ? modelData.examples.reduce((sum, e) => sum + (e.generation_ms || 0), 0) / modelData.examples.length / 1000
    : 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'trajectories', label: 'Trajectories', icon: Play },
    { id: 'analysis', label: 'Deep Analysis', icon: Target },
  ];

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/benchmark')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Benchmark
        </button>

        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-slate-400 text-sm uppercase tracking-wider">
                {modelData.provider}
              </span>
              <span className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-400">
                Rank #{modelData.rank}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{modelData.name}</h1>
            <p className="text-slate-400">{modelData.totalRuns} evaluation runs</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-slate-400">Best Reward</div>
              <div className="text-2xl font-bold text-emerald-400">
                {modelData.bestReward.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Avg Reward</div>
              <div className="text-2xl font-bold text-white">
                {modelData.avgReward.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <Target className="w-4 h-4" />
              Success Rate
            </div>
            <div className="text-2xl font-bold text-white">{successRate.toFixed(1)}%</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <Zap className="w-4 h-4" />
              Efficiency
            </div>
            <div className="text-2xl font-bold text-white">
              {((modelData.metrics.score_efficiency || 0) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <Clock className="w-4 h-4" />
              Avg Gen Time
            </div>
            <div className="text-2xl font-bold text-white">{avgGenTime.toFixed(1)}s</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <FileText className="w-4 h-4" />
              Examples
            </div>
            <div className="text-2xl font-bold text-white">{modelData.examples.length}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-6">
            {/* Metrics Radar */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <Radar
                    name={modelData.name}
                    dataKey="value"
                    stroke={color}
                    fill={color}
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Success/Failure Pie */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Task Outcomes</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={outcomeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {outcomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Mode Comparison */}
            <div className="bg-slate-800 rounded-lg p-6 col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">Performance by Mode</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={modeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" domain={[0, 5]} tick={{ fill: '#94a3b8' }} />
                  <YAxis
                    dataKey="mode"
                    type="category"
                    width={160}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="reward" fill={color} name="Reward" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'trajectories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Example Trajectories ({modelData.examples.length})
              </h3>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-sm text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  {successfulExamples.length} Success
                </span>
                <span className="flex items-center gap-1 text-sm text-red-400">
                  <XCircle className="w-4 h-4" />
                  {modelData.examples.length - successfulExamples.length} Failed
                </span>
              </div>
            </div>

            {modelData.examples.map((example, idx) => (
              <div
                key={example.example_id}
                className="bg-slate-800 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedExample(expandedExample === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-750 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {example.score_correctness > 0.5 ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <div className="text-left">
                      <div className="font-medium text-white">
                        {example.info.task_id} ({example.info.level})
                      </div>
                      <div className="text-sm text-slate-400">
                        Expected: {example.info.expected} | Answered: {example.answer}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm text-slate-400">Reward</div>
                      <div className="font-bold text-white">{example.reward.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-400">Time</div>
                      <div className="font-medium text-white">
                        {(example.generation_ms / 1000).toFixed(1)}s
                      </div>
                    </div>
                    {expandedExample === idx ? (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {expandedExample === idx && (
                  <div className="border-t border-slate-700 p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-slate-900 rounded p-3">
                        <div className="text-sm text-slate-400 mb-1">Correctness</div>
                        <div className="text-xl font-bold text-white">
                          {(example.score_correctness * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="bg-slate-900 rounded p-3">
                        <div className="text-sm text-slate-400 mb-1">Efficiency</div>
                        <div className="text-xl font-bold text-white">
                          {(example.score_efficiency * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    <h4 className="text-sm font-medium text-slate-400 mb-2">Conversation</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {example.prompt.map((msg, msgIdx) => (
                        <div
                          key={`prompt-${msgIdx}`}
                          className={`p-3 rounded ${
                            msg.role === 'system'
                              ? 'bg-slate-900 border-l-2 border-blue-500'
                              : msg.role === 'user'
                              ? 'bg-slate-900 border-l-2 border-amber-500'
                              : 'bg-slate-900 border-l-2 border-emerald-500'
                          }`}
                        >
                          <div className="text-xs uppercase text-slate-500 mb-1">{msg.role}</div>
                          <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                            {msg.content.length > 500
                              ? msg.content.slice(0, 500) + '...'
                              : msg.content}
                          </pre>
                        </div>
                      ))}
                      {example.completion.map((msg, msgIdx) => (
                        <div
                          key={`completion-${msgIdx}`}
                          className={`p-3 rounded ${
                            msg.role === 'assistant'
                              ? 'bg-slate-900 border-l-2 border-emerald-500'
                              : 'bg-slate-900 border-l-2 border-amber-500'
                          }`}
                        >
                          <div className="text-xs uppercase text-slate-500 mb-1">{msg.role}</div>
                          <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                            {msg.content.length > 500
                              ? msg.content.slice(0, 500) + '...'
                              : msg.content}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {/* Mode Detail Table */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Detailed Mode Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Mode</th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">Runs</th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">Reward</th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">Correctness</th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">Efficiency</th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">Notes Usage</th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">Code Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(modelData.modes).map(([mode, data]) => (
                      <tr key={mode} className="border-b border-slate-700/50 hover:bg-slate-750">
                        <td className="py-3 px-4 text-white">{modeLabels[mode] || mode}</td>
                        <td className="py-3 px-4 text-right text-slate-300">{data.runs}</td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-400">
                          {data.reward.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">
                          {((data.metrics.score_correctness || 0) * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">
                          {((data.metrics.score_efficiency || 0) * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">
                          {((data.metrics.score_notes_usage || 0) * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">
                          {((data.metrics.score_code_quality || 0) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Task Level Distribution */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Task Difficulty Analysis</h3>
              <div className="grid grid-cols-3 gap-4">
                {['L4', 'L5', 'L6'].map((level) => {
                  const levelExamples = modelData.examples.filter((e) => e.info.level === level);
                  const levelSuccess = levelExamples.filter((e) => e.score_correctness > 0.5);
                  const levelRate = levelExamples.length > 0
                    ? (levelSuccess.length / levelExamples.length) * 100
                    : 0;
                  return (
                    <div key={level} className="bg-slate-900 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{level}</span>
                        <span className="text-sm text-slate-400">{levelExamples.length} tasks</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${levelRate}%` }}
                        />
                      </div>
                      <div className="text-sm text-slate-400">
                        {levelRate.toFixed(0)}% success ({levelSuccess.length}/{levelExamples.length})
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Insights */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Key Insights</h3>
              <div className="space-y-3">
                {modelData.metrics.score_correctness < 0.5 && (
                  <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <Target className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-amber-400">Low Correctness</div>
                      <div className="text-sm text-slate-400">
                        Model struggles with accuracy ({((modelData.metrics.score_correctness || 0) * 100).toFixed(0)}%). Consider reviewing failure cases.
                      </div>
                    </div>
                  </div>
                )}
                {modelData.metrics.score_efficiency > 0.7 && (
                  <div className="flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <Zap className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-emerald-400">High Efficiency</div>
                      <div className="text-sm text-slate-400">
                        Model solves tasks quickly with minimal turns ({((modelData.metrics.score_efficiency || 0) * 100).toFixed(0)}% efficiency).
                      </div>
                    </div>
                  </div>
                )}
                {Object.keys(modelData.modes).length < 4 && (
                  <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-400">Limited Mode Coverage</div>
                      <div className="text-sm text-slate-400">
                        Only tested in {Object.keys(modelData.modes).length}/4 modes. Run more evals for complete analysis.
                      </div>
                    </div>
                  </div>
                )}
                {avgGenTime > 60 && (
                  <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <Clock className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-red-400">Slow Generation</div>
                      <div className="text-sm text-slate-400">
                        Average generation time is {avgGenTime.toFixed(0)}s. May impact production costs.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
