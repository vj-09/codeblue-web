'use client';

import { useState, useMemo } from 'react';
import { FlaskConical, Sliders, TrendingUp, DollarSign, Clock, Check, X, BarChart3 } from 'lucide-react';
import benchmarkDataRaw from '@/data/benchmark-data.json';

interface Example {
  example_id: number;
  task: string;
  reward: number;
  answer: string;
  info: { expected: number; level: string; task_id: string } | null;
  score_correctness: number;
  score_efficiency: number;
  generation_ms: number;
}

interface ModelData {
  model: string;
  provider: string;
  name: string;
  examples: Example[];
}

interface BenchmarkData {
  models: ModelData[];
}

const benchmarkData = benchmarkDataRaw as BenchmarkData;

const providerColors: Record<string, string> = {
  'qwen': '#10B981',
  'anthropic': '#8B5CF6',
  'google': '#3B82F6',
  'openai': '#F59E0B',
  'deepseek': '#EC4899',
  'ensemble': '#14B8A6',
};

// Simulated cost data ($/M tokens)
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

const levelLabels: Record<string, string> = {
  'L1': 'Simple queries',
  'L2': 'Basic aggregations',
  'L3': 'Multi-step reasoning',
  'L4': 'Complex filters',
  'L5': 'Joins & analysis',
  'L6': 'Expert challenges',
};

interface ABTestSimulatorProps {
  onClose?: () => void;
}

export default function ABTestSimulator({ onClose }: ABTestSimulatorProps) {
  const [modelA, setModelA] = useState<string | null>(null);
  const [modelB, setModelB] = useState<string | null>(null);
  const [monthlyQueries, setMonthlyQueries] = useState(10000);
  const [avgTokens, setAvgTokens] = useState(500);
  const [distribution, setDistribution] = useState({
    L1: 20,
    L2: 20,
    L3: 20,
    L4: 15,
    L5: 15,
    L6: 10,
  });

  // Calculate model statistics by level
  const modelStats = useMemo(() => {
    const stats: Record<string, {
      name: string;
      provider: string;
      levels: Record<string, { success: number; total: number; avgTime: number }>;
      overallSuccess: number;
      avgTime: number;
    }> = {};

    benchmarkData.models.forEach(model => {
      stats[model.model] = {
        name: model.name,
        provider: model.provider,
        levels: {},
        overallSuccess: 0,
        avgTime: 0
      };

      let totalSuccess = 0;
      let totalCount = 0;
      let totalTime = 0;

      model.examples.forEach(ex => {
        if (!ex.info) return;
        const level = ex.info.level;

        if (!stats[model.model].levels[level]) {
          stats[model.model].levels[level] = { success: 0, total: 0, avgTime: 0 };
        }

        stats[model.model].levels[level].total++;
        stats[model.model].levels[level].avgTime += ex.generation_ms;

        if (ex.score_correctness > 0.5) {
          stats[model.model].levels[level].success++;
          totalSuccess++;
        }

        totalCount++;
        totalTime += ex.generation_ms;
      });

      // Calculate averages
      Object.values(stats[model.model].levels).forEach(levelStats => {
        if (levelStats.total > 0) {
          levelStats.avgTime = levelStats.avgTime / levelStats.total;
        }
      });

      stats[model.model].overallSuccess = totalCount > 0 ? (totalSuccess / totalCount) * 100 : 0;
      stats[model.model].avgTime = totalCount > 0 ? totalTime / totalCount : 0;
    });

    return stats;
  }, []);

  // Calculate projected outcomes for a model
  const calculateProjection = (modelId: string | null) => {
    if (!modelId || !modelStats[modelId]) {
      return { successRate: 0, cost: 0, avgLatency: 0 };
    }

    const stats = modelStats[modelId];
    let weightedSuccess = 0;
    let weightedTime = 0;
    let totalWeight = 0;

    Object.entries(distribution).forEach(([level, weight]) => {
      if (weight > 0 && stats.levels[level]) {
        const levelStats = stats.levels[level];
        const successRate = levelStats.total > 0
          ? (levelStats.success / levelStats.total) * 100
          : 50; // Default assumption

        weightedSuccess += successRate * weight;
        weightedTime += levelStats.avgTime * weight;
        totalWeight += weight;
      }
    });

    const successRate = totalWeight > 0 ? weightedSuccess / totalWeight : 0;
    const avgLatency = totalWeight > 0 ? weightedTime / totalWeight : 0;
    const costPerMillion = modelCosts[modelId] || 1.0;
    const monthlyCost = (monthlyQueries * avgTokens * costPerMillion) / 1000000;

    return { successRate, cost: monthlyCost, avgLatency };
  };

  const projectionA = calculateProjection(modelA);
  const projectionB = calculateProjection(modelB);

  // Normalize distribution to 100%
  const normalizeDistribution = () => {
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    if (total === 0) return;

    const normalized: Record<string, number> = {};
    Object.entries(distribution).forEach(([level, value]) => {
      normalized[level] = Math.round((value / total) * 100);
    });
    setDistribution(normalized as typeof distribution);
  };

  const selectModel = (side: 'A' | 'B', modelId: string) => {
    if (side === 'A') {
      setModelA(modelId === modelA ? null : modelId);
    } else {
      setModelB(modelId === modelB ? null : modelId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Model A */}
        <div className="bg-black/20 rounded-xl p-4 border border-blue-500/30">
          <h3 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center text-xs font-bold">A</div>
            Model A
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {benchmarkData.models.map((model) => (
              <button
                key={model.model}
                onClick={() => selectModel('A', model.model)}
                disabled={model.model === modelB}
                className={`w-full p-2 rounded-lg text-left text-sm transition-all ${
                  modelA === model.model
                    ? 'bg-blue-500/20 border border-blue-500/50 text-white'
                    : model.model === modelB
                    ? 'opacity-30 cursor-not-allowed bg-gray-800/50 text-gray-500'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: providerColors[model.provider] }}
                  />
                  {model.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Model B */}
        <div className="bg-black/20 rounded-xl p-4 border border-orange-500/30">
          <h3 className="text-sm font-medium text-orange-400 mb-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-orange-500/20 flex items-center justify-center text-xs font-bold">B</div>
            Model B
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {benchmarkData.models.map((model) => (
              <button
                key={model.model}
                onClick={() => selectModel('B', model.model)}
                disabled={model.model === modelA}
                className={`w-full p-2 rounded-lg text-left text-sm transition-all ${
                  modelB === model.model
                    ? 'bg-orange-500/20 border border-orange-500/50 text-white'
                    : model.model === modelA
                    ? 'opacity-30 cursor-not-allowed bg-gray-800/50 text-gray-500'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: providerColors[model.provider] }}
                  />
                  {model.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Workload Configuration */}
      <div className="bg-black/20 rounded-xl p-4 border border-white/10">
        <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          Workload Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Volume settings */}
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-2">
                Monthly Queries: <span className="text-emerald-400 font-mono">{monthlyQueries.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min="1000"
                max="1000000"
                step="1000"
                value={monthlyQueries}
                onChange={(e) => setMonthlyQueries(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-2">
                Avg Tokens/Query: <span className="text-emerald-400 font-mono">{avgTokens}</span>
              </label>
              <input
                type="range"
                min="100"
                max="5000"
                step="100"
                value={avgTokens}
                onChange={(e) => setAvgTokens(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>

          {/* Difficulty distribution */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-400">Task Difficulty Distribution</label>
              <button
                onClick={normalizeDistribution}
                className="text-xs text-emerald-400 hover:text-emerald-300"
              >
                Normalize to 100%
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(distribution).map(([level, value]) => (
                <div key={level} className="flex items-center gap-2">
                  <span className="w-8 text-xs font-mono text-gray-400">{level}</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => setDistribution(prev => ({
                      ...prev,
                      [level]: parseInt(e.target.value)
                    }))}
                    className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="w-10 text-xs font-mono text-right text-emerald-400">{value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Comparison */}
      {modelA && modelB && (
        <div className="bg-black/20 rounded-xl p-4 border border-emerald-500/30">
          <h3 className="text-sm font-medium text-emerald-400 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Projected Outcomes
          </h3>

          <div className="grid grid-cols-3 gap-4">
            {/* Success Rate */}
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-2 flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Success Rate
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className={`p-3 rounded-lg ${projectionA.successRate >= projectionB.successRate ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-gray-800/50'}`}>
                  <div className="text-xs text-blue-400 mb-1">Model A</div>
                  <div className="text-xl font-bold text-white">{projectionA.successRate.toFixed(1)}%</div>
                </div>
                <div className={`p-3 rounded-lg ${projectionB.successRate >= projectionA.successRate ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-gray-800/50'}`}>
                  <div className="text-xs text-orange-400 mb-1">Model B</div>
                  <div className="text-xl font-bold text-white">{projectionB.successRate.toFixed(1)}%</div>
                </div>
              </div>
            </div>

            {/* Cost */}
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-2 flex items-center justify-center gap-1">
                <DollarSign className="w-3 h-3" />
                Monthly Cost
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className={`p-3 rounded-lg ${projectionA.cost <= projectionB.cost ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-gray-800/50'}`}>
                  <div className="text-xs text-blue-400 mb-1">Model A</div>
                  <div className="text-xl font-bold text-white">${projectionA.cost.toFixed(2)}</div>
                </div>
                <div className={`p-3 rounded-lg ${projectionB.cost <= projectionA.cost ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-gray-800/50'}`}>
                  <div className="text-xs text-orange-400 mb-1">Model B</div>
                  <div className="text-xl font-bold text-white">${projectionB.cost.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Latency */}
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-2 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                Avg Latency
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className={`p-3 rounded-lg ${projectionA.avgLatency <= projectionB.avgLatency ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-gray-800/50'}`}>
                  <div className="text-xs text-blue-400 mb-1">Model A</div>
                  <div className="text-xl font-bold text-white">{(projectionA.avgLatency / 1000).toFixed(1)}s</div>
                </div>
                <div className={`p-3 rounded-lg ${projectionB.avgLatency <= projectionA.avgLatency ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-gray-800/50'}`}>
                  <div className="text-xs text-orange-400 mb-1">Model B</div>
                  <div className="text-xl font-bold text-white">{(projectionB.avgLatency / 1000).toFixed(1)}s</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
            <div className="text-sm text-white">
              <strong className="text-emerald-400">Recommendation:</strong>{' '}
              {(() => {
                const aScore = (projectionA.successRate * 2) - (projectionA.cost * 0.5) - (projectionA.avgLatency / 10000);
                const bScore = (projectionB.successRate * 2) - (projectionB.cost * 0.5) - (projectionB.avgLatency / 10000);
                const winner = aScore >= bScore ? modelStats[modelA!] : modelStats[modelB!];
                const reason = aScore >= bScore
                  ? projectionA.successRate > projectionB.successRate
                    ? 'higher accuracy'
                    : projectionA.cost < projectionB.cost
                    ? 'lower cost'
                    : 'better overall value'
                  : projectionB.successRate > projectionA.successRate
                    ? 'higher accuracy'
                    : projectionB.cost < projectionA.cost
                    ? 'lower cost'
                    : 'better overall value';

                return (
                  <>
                    <span style={{ color: providerColors[winner.provider] }}>{winner.name}</span>
                    {' '}for {reason} given your workload.
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!modelA || !modelB) && (
        <div className="text-center py-12 text-gray-500">
          <FlaskConical className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Select two models to compare</p>
          <p className="text-sm mt-2">See projected performance for your specific workload</p>
        </div>
      )}
    </div>
  );
}
