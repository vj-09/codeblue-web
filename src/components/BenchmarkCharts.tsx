'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, Legend, Cell, LineChart, Line, ReferenceLine
} from 'recharts';
import { Trophy, TrendingUp, Zap, BarChart3, Target, Database, ArrowLeft, Play, ChevronDown, ChevronUp, Grid3X3, Layers, DollarSign, ArrowRight, Swords, ChevronLeft, ChevronRight, Filter, X, Share2, Sparkles } from 'lucide-react';
import benchmarkDataRaw from '@/data/benchmark-data.json';
import ScenarioBuilder from './ScenarioBuilder';
import FailureInsights from './FailureInsights';
import ModelRace from './ModelRace';
import ABTestSimulator from './ABTestSimulator';

// Types
interface ModelData {
  model: string;
  provider: string;
  name: string;
  totalRuns: number;
  avgReward: number;
  bestReward: number;
  modes: Record<string, {
    reward: number;
    metrics: Record<string, number>;
    runs: number;
  }>;
  metrics: Record<string, number>;
  examples: Array<{
    example_id: number;
    task: string;
    reward: number;
    answer: string;
    info: { expected: number; level: string; task_id: string; tolerance?: number };
    prompt: Array<{ content: string; role: string }>;
    completion: Array<{ content: string; role: string }>;
    score_correctness: number;
    score_efficiency: number;
    generation_ms?: number;
  }>;
  rank?: number;
  color?: string;
}

interface BenchmarkData {
  generated: string;
  totalRuns: number;
  models: ModelData[];
}

const benchmarkData = benchmarkDataRaw as BenchmarkData;

// Provider colors
const providerColors: Record<string, string> = {
  'qwen': '#10B981',
  'anthropic': '#8B5CF6',
  'google': '#3B82F6',
  'openai': '#F59E0B',
  'deepseek': '#EC4899',
  'mistralai': '#F97316',
  'meta-llama': '#06B6D4',
  'x-ai': '#EF4444',
  'prime-intellect': '#A855F7',
  'ensemble': '#14B8A6',
};

// Tab definitions - consolidated from 8 to 4
const tabs = [
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'arena', label: 'Arena', icon: Swords },
  { id: 'race', label: 'Race', icon: Zap },
  { id: 'examples', label: 'Trajectories', icon: Play },
];

// Mode options - now bank vs road
const modeOptions = [
  { value: 'bank', label: 'Bank (19 tasks)' },
  { value: 'road', label: 'Road (6 tasks)' },
];

// Axis options for quadrant
const axisOptions = [
  { value: 'score_correctness', label: 'Correctness' },
  { value: 'score_efficiency', label: 'Efficiency' },
  { value: 'score_notes_usage', label: 'Notes Usage' },
  { value: 'score_code_quality', label: 'Code Quality' },
  { value: 'avgReward', label: 'Avg Reward' },
  { value: 'totalRuns', label: 'Total Runs' },
];

// Simulated cost data (would come from actual pricing)
const modelCosts: Record<string, number> = {
  'anthropic/claude-opus-4.5': 15.0,
  'google/gemini-3-pro-preview': 3.5,
  'google/gemini-3-flash-preview': 0.35,
  'openai/gpt-5.2': 10.0,
  'openai/gpt-5.1-codex-mini': 2.0,
  'qwen/qwen3-235b-a22b-thinking-2507': 1.5,
  'qwen/qwen3-max': 1.0,
  'deepseek/deepseek-v3.2-speciale': 0.5,
  'ensemble': 2.0,
};

export default function BenchmarkCharts() {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [selectedMode, setSelectedMode] = useState('stateless_singleCsv');
  const [selectedModels, setSelectedModels] = useState<string[]>(
    benchmarkData.models.slice(0, 5).map(m => m.model)
  );
  const [selectedExample, setSelectedExample] = useState<ModelData['examples'][0] | null>(null);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score_correctness' | 'score_efficiency' | 'avgReward'>('score_correctness');
  const [quadrantX, setQuadrantX] = useState('score_efficiency');
  const [quadrantY, setQuadrantY] = useState('score_correctness');

  // Arena state
  const [arenaModels, setArenaModels] = useState<string[]>([]);
  const [arenaTaskIndex, setArenaTaskIndex] = useState(0);
  const [arenaRollout, setArenaRollout] = useState(0);

  // Filter state
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [minCorrectness, setMinCorrectness] = useState(0);
  const [minRuns, setMinRuns] = useState(0);
  const [showScenarioBuilder, setShowScenarioBuilder] = useState(false);
  const [arenaMode, setArenaMode] = useState<'compare' | 'abtest'>('compare');

  // Get unique providers
  const providers = useMemo(() => {
    return [...new Set(benchmarkData.models.map(m => m.provider))];
  }, []);

  // Initialize from URL params
  useEffect(() => {
    const providerParam = searchParams.get('providers');
    const correctnessParam = searchParams.get('correctness');
    const runsParam = searchParams.get('minRuns');
    const tabParam = searchParams.get('tab');

    if (providerParam) setSelectedProviders(providerParam.split(','));
    if (correctnessParam) setMinCorrectness(parseInt(correctnessParam, 10));
    if (runsParam) setMinRuns(parseInt(runsParam, 10));
    if (tabParam && tabs.some(t => t.id === tabParam)) setActiveTab(tabParam);
  }, [searchParams]);

  // Update URL when filters change
  const updateURL = (newProviders: string[], newCorrectness: number, newRuns: number) => {
    const params = new URLSearchParams();
    if (newProviders.length > 0) params.set('providers', newProviders.join(','));
    if (newCorrectness > 0) params.set('correctness', newCorrectness.toString());
    if (newRuns > 0) params.set('minRuns', newRuns.toString());
    if (activeTab !== 'leaderboard') params.set('tab', activeTab);

    const queryString = params.toString();
    router.push(queryString ? `?${queryString}` : '/benchmark', { scroll: false });
  };

  const toggleProvider = (provider: string) => {
    const newProviders = selectedProviders.includes(provider)
      ? selectedProviders.filter(p => p !== provider)
      : [...selectedProviders, provider];
    setSelectedProviders(newProviders);
    updateURL(newProviders, minCorrectness, minRuns);
  };

  const clearFilters = () => {
    setSelectedProviders([]);
    setMinCorrectness(0);
    setMinRuns(0);
    router.push('/benchmark', { scroll: false });
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  // Filter models based on selections
  const filteredModels = useMemo(() => {
    return benchmarkData.models.filter(m => {
      if (selectedProviders.length > 0 && !selectedProviders.includes(m.provider)) return false;
      if (minCorrectness > 0 && (m.metrics.score_correctness || 0) * 100 < minCorrectness) return false;
      if (minRuns > 0 && m.totalRuns < minRuns) return false;
      return true;
    });
  }, [selectedProviders, minCorrectness, minRuns]);

  const hasActiveFilters = selectedProviders.length > 0 || minCorrectness > 0 || minRuns > 0;

  // Sorted models (using filtered)
  const sortedModels = useMemo(() => {
    return [...filteredModels].sort((a, b) => {
      if (sortBy === 'score_correctness') {
        return (b.metrics.score_correctness || 0) - (a.metrics.score_correctness || 0);
      }
      if (sortBy === 'score_efficiency') {
        return (b.metrics.score_efficiency || 0) - (a.metrics.score_efficiency || 0);
      }
      if (sortBy === 'avgReward') {
        return b.avgReward - a.avgReward;
      }
      return 0;
    });
  }, [sortBy, filteredModels]);

  // Quadrant data
  const quadrantData = useMemo(() => {
    return benchmarkData.models.map(m => {
      const getVal = (key: string) => {
        if (key === 'avgReward') return m.avgReward;
        if (key === 'bestReward') return m.bestReward;
        if (key === 'totalRuns') return m.totalRuns;
        return m.metrics[key] || 0;
      };
      return {
        ...m,
        x: getVal(quadrantX),
        y: getVal(quadrantY),
        z: 300,
      };
    });
  }, [quadrantX, quadrantY]);

  // Cost efficiency data
  const costData = useMemo(() => {
    return benchmarkData.models.map(m => ({
      ...m,
      cost: modelCosts[m.model] || 1.0,
      performance: m.avgReward,
      efficiency: m.avgReward / (modelCosts[m.model] || 1.0),
    })).sort((a, b) => b.efficiency - a.efficiency);
  }, []);

  // Mode comparison data
  const modeComparisonData = useMemo(() => {
    return benchmarkData.models
      .filter(m => m.modes[selectedMode])
      .map(m => ({
        name: m.name.split('-').slice(0, 2).join('-'),
        fullName: m.model,
        reward: m.modes[selectedMode]?.reward || 0,
        correctness: (m.modes[selectedMode]?.metrics.score_correctness || 0) * 100,
        efficiency: (m.modes[selectedMode]?.metrics.score_efficiency || 0) * 100,
        runs: m.modes[selectedMode]?.runs || 0,
        color: providerColors[m.provider] || '#6B7280',
      }))
      .sort((a, b) => b.reward - a.reward);
  }, [selectedMode]);

  // Radar data
  const radarData = useMemo(() => {
    const metrics = ['score_correctness', 'score_efficiency', 'score_notes_usage', 'score_code_quality'];
    const metricLabels: Record<string, string> = {
      score_correctness: 'Correctness',
      score_efficiency: 'Efficiency',
      score_notes_usage: 'Notes Usage',
      score_code_quality: 'Code Quality',
    };

    return metrics.map(metric => {
      const point: Record<string, string | number> = { metric: metricLabels[metric] || metric };
      selectedModels.forEach(modelId => {
        const model = benchmarkData.models.find(m => m.model === modelId);
        if (model) {
          point[model.name] = (model.metrics[metric] || 0) * 100;
        }
      });
      return point;
    });
  }, [selectedModels]);

  // Ranking flow data
  const rankingData = useMemo(() => {
    const modes = Object.keys(modeOptions.reduce((acc, m) => ({ ...acc, [m.value]: true }), {}));
    return modeOptions.map(mode => {
      const modeModels = benchmarkData.models
        .filter(m => m.modes[mode.value])
        .sort((a, b) => (b.modes[mode.value]?.reward || 0) - (a.modes[mode.value]?.reward || 0));

      const point: Record<string, string | number> = { mode: mode.label.split(' ')[0] };
      modeModels.forEach((m, idx) => {
        point[m.name] = idx + 1;
      });
      return point;
    });
  }, []);

  const toggleModelSelection = (modelId: string) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(m => m !== modelId);
      }
      if (prev.length >= 5) return prev;
      return [...prev, modelId];
    });
  };

  // Arena data - find common tasks between selected models
  const arenaData = useMemo(() => {
    if (arenaModels.length < 2) return { tasks: [], modelData: [] };

    const models = arenaModels.map(id => benchmarkData.models.find(m => m.model === id)).filter(Boolean) as ModelData[];

    // Find tasks that exist in all selected models
    const taskSets = models.map(m => new Set(m.examples.filter(e => e.info).map(e => e.info.task_id)));
    const commonTasks = [...taskSets[0]].filter(task =>
      taskSets.every(set => set.has(task))
    );

    return {
      tasks: commonTasks,
      modelData: models,
    };
  }, [arenaModels]);

  const toggleArenaModel = (modelId: string) => {
    setArenaModels(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(m => m !== modelId);
      }
      if (prev.length >= 4) return prev;
      return [...prev, modelId];
    });
    setArenaTaskIndex(0);
    setArenaRollout(0);
  };

  // Calculate quadrant averages
  const xAvg = useMemo(() => quadrantData.reduce((sum, d) => sum + d.x, 0) / quadrantData.length, [quadrantData]);
  const yAvg = useMemo(() => quadrantData.reduce((sum, d) => sum + d.y, 0) / quadrantData.length, [quadrantData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100">
      {/* Grid background */}
      <div className="fixed inset-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.5) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />

      {/* Header */}
      <header className="relative border-b border-emerald-500/20 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold tracking-tight">
                  <span className="text-emerald-400">Code</span>
                  <span className="text-white">Blue</span>
                </h1>
              </Link>
              <span className="text-gray-600">|</span>
              <span className="text-emerald-400 font-medium">Benchmark</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">
                {benchmarkData.totalRuns} runs | {benchmarkData.models.length} models
              </span>
              <Link href="/final25" className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                Final 25
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Panel */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                hasActiveFilters
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-black/30 text-gray-400 border border-white/10 hover:border-white/20'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="bg-emerald-500 text-black text-xs px-1.5 py-0.5 rounded-full">
                  {selectedProviders.length + (minCorrectness > 0 ? 1 : 0) + (minRuns > 0 ? 1 : 0)}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowScenarioBuilder(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Help Me Choose
            </button>

            {hasActiveFilters && (
              <>
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
                <button
                  onClick={copyShareLink}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-400 hover:text-emerald-400"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </>
            )}

            <span className="text-sm text-gray-500 ml-auto">
              {filteredModels.length} of {benchmarkData.models.length} models
            </span>
          </div>

          {filtersOpen && (
            <div className="mt-4 p-4 bg-black/30 rounded-xl border border-white/10 space-y-4">
              {/* Provider Filter */}
              <div>
                <div className="text-sm text-gray-400 mb-2">Provider</div>
                <div className="flex flex-wrap gap-2">
                  {providers.map(provider => (
                    <button
                      key={provider}
                      onClick={() => toggleProvider(provider)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedProviders.includes(provider)
                          ? 'border-2'
                          : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-500'
                      }`}
                      style={selectedProviders.includes(provider) ? {
                        backgroundColor: `${providerColors[provider]}20`,
                        borderColor: providerColors[provider],
                        color: providerColors[provider]
                      } : {}}
                    >
                      {provider}
                    </button>
                  ))}
                </div>
              </div>

              {/* Correctness Filter */}
              <div>
                <div className="text-sm text-gray-400 mb-2">
                  Min Correctness: {minCorrectness}%
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={minCorrectness}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setMinCorrectness(val);
                    updateURL(selectedProviders, val, minRuns);
                  }}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Min Runs Filter */}
              <div>
                <div className="text-sm text-gray-400 mb-2">Min Runs</div>
                <div className="flex gap-2">
                  {[0, 5, 10, 20].map(val => (
                    <button
                      key={val}
                      onClick={() => {
                        setMinRuns(val);
                        updateURL(selectedProviders, minCorrectness, val);
                      }}
                      className={`px-3 py-1.5 rounded text-sm ${
                        minRuns === val
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {val === 0 ? 'Any' : `${val}+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Presets */}
              <div className="pt-2 border-t border-white/10">
                <div className="text-sm text-gray-400 mb-2">Quick Presets</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedProviders(['qwen', 'deepseek']);
                      setMinCorrectness(0);
                      setMinRuns(0);
                      updateURL(['qwen', 'deepseek'], 0, 0);
                    }}
                    className="px-3 py-1.5 rounded text-sm bg-gray-800 text-gray-400 hover:text-white"
                  >
                    Budget Models
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProviders(['anthropic', 'openai']);
                      setMinCorrectness(0);
                      setMinRuns(0);
                      updateURL(['anthropic', 'openai'], 0, 0);
                    }}
                    className="px-3 py-1.5 rounded text-sm bg-gray-800 text-gray-400 hover:text-white"
                  >
                    Premium Models
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProviders([]);
                      setMinCorrectness(50);
                      setMinRuns(0);
                      updateURL([], 50, 0);
                    }}
                    className="px-3 py-1.5 rounded text-sm bg-gray-800 text-gray-400 hover:text-white"
                  >
                    High Accuracy
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProviders([]);
                      setMinCorrectness(0);
                      setMinRuns(10);
                      updateURL([], 0, 10);
                    }}
                    className="px-3 py-1.5 rounded text-sm bg-gray-800 text-gray-400 hover:text-white"
                  >
                    Well Tested
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            {/* Failure Insights Section */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Insights
              </h2>
              <FailureInsights />
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">Sort by:</span>
              {(['score_correctness', 'score_efficiency', 'avgReward'] as const).map(key => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`px-3 py-1 rounded text-sm ${
                    sortBy === key ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  {key === 'score_correctness' ? 'Accuracy' : key === 'score_efficiency' ? 'Efficiency' : 'Reward'}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {sortedModels.map((model, idx) => (
                <div
                  key={model.model}
                  className="p-4 rounded-xl bg-black/30 border border-white/10 hover:border-emerald-500/30 transition-all"
                >
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedModel(expandedModel === model.model ? null : model.model)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        idx === 1 ? 'bg-gray-400/20 text-gray-300' :
                        idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-gray-700/50 text-gray-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{model.name}</span>
                          <span
                            className="px-2 py-0.5 rounded text-xs"
                            style={{ backgroundColor: `${providerColors[model.provider]}20`, color: providerColors[model.provider] }}
                          >
                            {model.provider}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">{model.totalRuns} runs</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-lg font-bold text-emerald-400">{((model.metrics.score_correctness || 0) * 100).toFixed(1)}%</div>
                        <div className="text-xs text-gray-500">accuracy</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-mono text-gray-300">{model.avgReward.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">avg reward</div>
                      </div>
                      {expandedModel === model.model ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                    </div>
                  </div>

                  {expandedModel === model.model && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {['score_correctness', 'score_efficiency', 'score_notes_usage', 'score_code_quality'].map(metric => (
                          <div key={metric} className="p-3 rounded-lg bg-black/30">
                            <div className="text-xs text-gray-500 mb-1">{metric.replace('score_', '').replace(/_/g, ' ')}</div>
                            <div className="text-lg font-mono text-white">
                              {((model.metrics[metric] || 0) * 100).toFixed(1)}%
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="text-sm text-gray-400 mb-2">Performance by Mode:</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(model.modes).map(([mode, data]) => (
                          <div key={mode} className="p-2 rounded bg-black/20 text-xs">
                            <div className="text-gray-500">{mode.replace(/_/g, ' ')}</div>
                            <div className="text-emerald-400 font-mono">{data.reward.toFixed(2)}</div>
                            <div className="text-gray-600">{data.runs} runs</div>
                          </div>
                        ))}
                      </div>

                      {model.examples.length > 0 && (
                        <div className="mt-4">
                          <div className="text-sm text-gray-400 mb-2">Sample Trajectories:</div>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {model.examples.slice(0, 5).map((ex, i) => (
                              <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); setSelectedExample(ex); setActiveTab('examples'); }}
                                className={`flex-shrink-0 p-2 rounded-lg border text-xs text-left ${
                                  ex.score_correctness > 0.5 ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-red-500/30 bg-red-500/10'
                                }`}
                              >
                                <div className="text-white font-mono">{ex.info.task_id}</div>
                                <div className="text-gray-500">{ex.info.level}</div>
                                <div className={ex.score_correctness > 0.5 ? 'text-emerald-400' : 'text-red-400'}>
                                  {ex.reward.toFixed(1)} reward
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <Link
                        href={`/benchmark/${encodeURIComponent(model.model)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm transition-colors"
                      >
                        View Full Details
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Arena Tab - Head-to-Head Comparison */}
        {activeTab === 'arena' && (
          <div className="space-y-6">
            {/* Arena Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setArenaMode('compare')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  arenaMode === 'compare'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Swords className="w-4 h-4" />
                Task Comparison
              </button>
              <button
                onClick={() => setArenaMode('abtest')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  arenaMode === 'abtest'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                A/B Test Simulator
              </button>
            </div>

            {/* A/B Test Simulator */}
            {arenaMode === 'abtest' && <ABTestSimulator />}

            {/* Task Comparison Mode */}
            {arenaMode === 'compare' && (
              <>
            {/* Model Selection */}
            <div className="bg-black/20 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Select 2-4 models to compare:</h3>
              <div className="flex flex-wrap gap-2">
                {benchmarkData.models.map((model) => (
                  <button
                    key={model.model}
                    onClick={() => toggleArenaModel(model.model)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      arenaModels.includes(model.model)
                        ? 'text-white border-2'
                        : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-500'
                    }`}
                    style={arenaModels.includes(model.model) ? {
                      backgroundColor: `${providerColors[model.provider]}20`,
                      borderColor: providerColors[model.provider],
                      color: providerColors[model.provider]
                    } : {}}
                  >
                    {model.name.split('-').slice(0, 2).join('-')}
                  </button>
                ))}
              </div>
            </div>

            {arenaModels.length < 2 ? (
              <div className="text-center py-20 text-gray-500">
                <Swords className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select at least 2 models to start the arena comparison</p>
              </div>
            ) : arenaData.tasks.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No common tasks found between selected models</p>
                <p className="text-sm mt-2">Try selecting different models</p>
              </div>
            ) : (
              <>
                {/* Task Navigation */}
                <div className="flex items-center justify-between bg-black/20 rounded-xl p-4 border border-white/10">
                  <button
                    onClick={() => { setArenaTaskIndex(Math.max(0, arenaTaskIndex - 1)); setArenaRollout(0); }}
                    disabled={arenaTaskIndex === 0}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="text-center">
                    <div className="text-lg font-mono text-white">{arenaData.tasks[arenaTaskIndex]}</div>
                    <div className="text-sm text-gray-500">Task {arenaTaskIndex + 1} of {arenaData.tasks.length}</div>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      {[0, 1, 2].map(r => (
                        <button
                          key={r}
                          onClick={() => setArenaRollout(r)}
                          className={`px-3 py-1 rounded text-xs ${
                            arenaRollout === r ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          Run {r + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => { setArenaTaskIndex(Math.min(arenaData.tasks.length - 1, arenaTaskIndex + 1)); setArenaRollout(0); }}
                    disabled={arenaTaskIndex === arenaData.tasks.length - 1}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Side-by-side Comparison */}
                <div className={`grid gap-4 ${arenaData.modelData.length === 2 ? 'grid-cols-2' : arenaData.modelData.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                  {arenaData.modelData.map((model) => {
                    // Get all examples for this task, then pick the rollout
                    const taskExamples = model.examples.filter(e => e.info?.task_id === arenaData.tasks[arenaTaskIndex]);
                    const example = taskExamples[arenaRollout] || taskExamples[0];
                    if (!example) return null;

                    return (
                      <div
                        key={model.model}
                        className="bg-black/20 rounded-xl border border-white/10 overflow-hidden"
                      >
                        {/* Model Header */}
                        <div
                          className="p-4 border-b border-white/10"
                          style={{ backgroundColor: `${providerColors[model.provider]}10` }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: providerColors[model.provider] }}
                            />
                            <span className="font-medium text-white">{model.name.split('-').slice(0, 2).join('-')}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className={example.score_correctness > 0.5 ? 'text-emerald-400' : 'text-red-400'}>
                              {example.score_correctness > 0.5 ? '✓ Correct' : '✗ Wrong'}
                            </span>
                            <span className="text-gray-400">Reward: {example.reward.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="p-4 grid grid-cols-2 gap-2 text-sm border-b border-white/10">
                          <div className="bg-black/30 rounded p-2">
                            <div className="text-gray-500 text-xs">Correctness</div>
                            <div className="text-white font-mono">{(example.score_correctness * 100).toFixed(0)}%</div>
                          </div>
                          <div className="bg-black/30 rounded p-2">
                            <div className="text-gray-500 text-xs">Efficiency</div>
                            <div className="text-white font-mono">{(example.score_efficiency * 100).toFixed(0)}%</div>
                          </div>
                          <div className="bg-black/30 rounded p-2">
                            <div className="text-gray-500 text-xs">Time</div>
                            <div className="text-white font-mono">{((example.generation_ms || 0) / 1000).toFixed(1)}s</div>
                          </div>
                          <div className="bg-black/30 rounded p-2">
                            <div className="text-gray-500 text-xs">Answer</div>
                            <div className="text-white font-mono truncate">{example.answer}</div>
                          </div>
                        </div>

                        {/* Full Trace */}
                        <div className="p-4 max-h-96 overflow-y-auto">
                          <div className="text-xs text-gray-500 mb-2">Full Trace ({example.completion.length} turns):</div>
                          {example.completion.map((msg, idx) => (
                            <div key={idx} className={`text-xs p-2 rounded mb-2 ${
                              msg.role === 'assistant' ? 'bg-emerald-500/10 border-l-2 border-emerald-500' : 'bg-blue-500/10 border-l-2 border-blue-500'
                            }`}>
                              <div className="text-xs text-gray-500 mb-1">Turn {Math.floor(idx/2) + 1} - {msg.role}</div>
                              <pre className="whitespace-pre-wrap font-mono text-gray-300 overflow-hidden">
                                {msg.content.length > 500 ? msg.content.slice(0, 500) + '...' : msg.content}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Task Details */}
                <div className="bg-black/20 rounded-xl p-4 border border-white/10 space-y-4">
                  {(() => {
                    const taskExamples = arenaData.modelData[0]?.examples.filter(e => e.info?.task_id === arenaData.tasks[arenaTaskIndex]);
                    const example = taskExamples?.[arenaRollout] || taskExamples?.[0];
                    const systemPrompt = example?.prompt.find(p => p.role === 'system')?.content;
                    const userPrompt = example?.prompt.find(p => p.role === 'user')?.content;
                    return (
                      <>
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Question:</h4>
                          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                            <pre className="text-sm text-emerald-300 whitespace-pre-wrap font-mono">
                              {userPrompt || 'No question available'}
                            </pre>
                          </div>
                        </div>
                        <details className="group">
                          <summary className="text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-400">
                            System Prompt (click to expand)
                          </summary>
                          <div className="mt-2 bg-black/30 rounded-lg p-4 max-h-64 overflow-y-auto">
                            <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono">
                              {systemPrompt || 'No system prompt'}
                            </pre>
                          </div>
                        </details>
                      </>
                    );
                  })()}
                </div>
              </>
            )}
              </>
            )}
          </div>
        )}

        {/* Race Tab */}
        {activeTab === 'race' && <ModelRace />}

        {/* Trajectory Viewer Tab */}
        {activeTab === 'examples' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-black/30 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Select Example</h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {benchmarkData.models.flatMap(model =>
                  model.examples.filter(ex => ex.info).map((ex, i) => (
                    <button
                      key={`${model.model}-${i}`}
                      onClick={() => setSelectedExample(ex)}
                      className={`w-full p-3 rounded-lg text-left text-sm transition-all ${
                        selectedExample === ex
                          ? 'bg-emerald-500/20 border border-emerald-500/30'
                          : 'bg-black/20 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-mono">{ex.info.task_id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          ex.score_correctness > 0.5 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {ex.reward.toFixed(1)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">{model.name} - {ex.info.level}</div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-2 p-6 rounded-2xl bg-black/30 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Trajectory Replay</h3>
              {selectedExample && selectedExample.info ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-black/30 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-emerald-400 font-mono">{selectedExample.info.task_id}</span>
                      <span className="text-gray-500">{selectedExample.info.level}</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Expected: <span className="text-white font-mono">{selectedExample.info.expected}</span>
                      {' | '}
                      Got: <span className={`font-mono ${selectedExample.score_correctness > 0.5 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {selectedExample.answer}
                      </span>
                    </div>
                  </div>

                  {selectedExample.prompt.map((msg, i) => (
                    <div key={i} className={`p-4 rounded-lg ${
                      msg.role === 'system' ? 'bg-blue-500/10 border border-blue-500/20' :
                      msg.role === 'user' ? 'bg-purple-500/10 border border-purple-500/20' :
                      'bg-gray-500/10 border border-gray-500/20'
                    }`}>
                      <div className="text-xs text-gray-500 mb-2 uppercase">{msg.role}</div>
                      <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                        {msg.content.slice(0, 500)}{msg.content.length > 500 ? '...' : ''}
                      </pre>
                    </div>
                  ))}

                  {selectedExample.completion.map((msg, i) => (
                    <div key={i} className={`p-4 rounded-lg ${
                      msg.role === 'assistant' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-gray-500/10 border border-gray-500/20'
                    }`}>
                      <div className="text-xs text-gray-500 mb-2 uppercase">{msg.role} - Turn {Math.floor(i/2) + 1}</div>
                      <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">{msg.content}</pre>
                    </div>
                  ))}

                  <div className="flex gap-4 pt-4 border-t border-white/10">
                    <div className="p-3 rounded-lg bg-black/30">
                      <div className="text-xs text-gray-500">Correctness</div>
                      <div className="text-lg font-mono text-emerald-400">{(selectedExample.score_correctness * 100).toFixed(0)}%</div>
                    </div>
                    <div className="p-3 rounded-lg bg-black/30">
                      <div className="text-xs text-gray-500">Efficiency</div>
                      <div className="text-lg font-mono text-blue-400">{(selectedExample.score_efficiency * 100).toFixed(0)}%</div>
                    </div>
                    <div className="p-3 rounded-lg bg-black/30">
                      <div className="text-xs text-gray-500">Time</div>
                      <div className="text-lg font-mono text-purple-400">{((selectedExample.generation_ms || 0) / 1000).toFixed(1)}s</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-gray-500">
                  Select an example to view its trajectory
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Scenario Builder Modal */}
      <ScenarioBuilder
        isOpen={showScenarioBuilder}
        onClose={() => setShowScenarioBuilder(false)}
      />
    </div>
  );
}
