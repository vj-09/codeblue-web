'use client';

import { useState, useMemo } from 'react';
import { Trophy, Database, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import final25DataRaw from '@/data/final25-data.json';

interface ModelData {
  model: string;
  provider: string;
  name: string;
  displayName: string;
  color: string;
  bank: { correct: number; total: number; partial: number; pct: number };
  road: { correct: number; total: number; partial: number; pct: number };
  combined: { correct: number; total: number; partial: number; pct: number };
  avgReward: number;
  hasBank: boolean;
  hasRoad: boolean;
  complete: boolean;
  rollouts: Array<{
    task_id: string;
    dataset: string;
    score_correctness: number;
    score_efficiency: number;
    reward: number;
    answer: unknown;
    expected: unknown;
  }>;
}

interface Final25Data {
  generated: string;
  version: string;
  summary: {
    total_tasks: number;
    bank_tasks: number;
    road_tasks: number;
    models_complete: number;
    models_partial: number;
    templates: number;
    levels: string[];
  };
  models: ModelData[];
  tasks: Array<{
    id: string;
    dataset: string;
    level: string;
    template: string;
    goal: string;
  }>;
  templateStats: Array<{
    template: string;
    tasks: number;
    correct: number;
    total: number;
    pct: number;
  }>;
  anomalies: Array<{
    model: string;
    type: string;
    description: string;
    details: Record<string, unknown>;
  }>;
}

const final25Data = final25DataRaw as Final25Data;

type SortKey = 'combined' | 'bank' | 'road' | 'avgReward';

export default function Final25Leaderboard() {
  const [sortBy, setSortBy] = useState<SortKey>('combined');
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [showIncomplete, setShowIncomplete] = useState(true);

  const sortedModels = useMemo(() => {
    let models = [...final25Data.models];
    if (!showIncomplete) {
      models = models.filter(m => m.complete);
    }

    return models.sort((a, b) => {
      if (sortBy === 'combined') return b.combined.pct - a.combined.pct;
      if (sortBy === 'bank') return b.bank.pct - a.bank.pct;
      if (sortBy === 'road') return b.road.pct - a.road.pct;
      return b.avgReward - a.avgReward;
    });
  }, [sortBy, showIncomplete]);

  const completeModels = sortedModels.filter(m => m.complete);
  const incompleteModels = sortedModels.filter(m => !m.complete);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-black/30 border border-white/10">
          <div className="text-2xl font-bold text-emerald-400">{final25Data.summary.total_tasks}</div>
          <div className="text-sm text-gray-500">Total Tasks</div>
          <div className="text-xs text-gray-600 mt-1">
            {final25Data.summary.bank_tasks} bank + {final25Data.summary.road_tasks} road
          </div>
        </div>
        <div className="p-4 rounded-xl bg-black/30 border border-white/10">
          <div className="text-2xl font-bold text-purple-400">{final25Data.models.length}</div>
          <div className="text-sm text-gray-500">Models Evaluated</div>
          <div className="text-xs text-gray-600 mt-1">
            {final25Data.summary.models_complete} complete
          </div>
        </div>
        <div className="p-4 rounded-xl bg-black/30 border border-white/10">
          <div className="text-2xl font-bold text-blue-400">{final25Data.summary.templates}</div>
          <div className="text-sm text-gray-500">Task Templates</div>
          <div className="text-xs text-gray-600 mt-1">
            L4-L6 difficulty
          </div>
        </div>
        <div className="p-4 rounded-xl bg-black/30 border border-white/10">
          <div className="text-2xl font-bold text-yellow-400">75</div>
          <div className="text-sm text-gray-500">Attempts/Model</div>
          <div className="text-xs text-gray-600 mt-1">
            25 tasks x 3 rollouts
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Sort by:</span>
          {(['combined', 'bank', 'road', 'avgReward'] as SortKey[]).map(key => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-3 py-1 rounded text-sm ${
                sortBy === key ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-white'
              }`}
            >
              {key === 'combined' ? 'Combined' : key === 'bank' ? 'Bank' : key === 'road' ? 'Road' : 'Avg Reward'}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showIncomplete}
            onChange={(e) => setShowIncomplete(e.target.checked)}
            className="rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500"
          />
          Show incomplete models
        </label>
      </div>

      {/* Complete Models */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          Complete Evaluations ({completeModels.length})
        </h3>
        {completeModels.map((model, idx) => (
          <ModelCard
            key={model.model}
            model={model}
            rank={idx + 1}
            expanded={expandedModel === model.model}
            onToggle={() => setExpandedModel(expandedModel === model.model ? null : model.model)}
          />
        ))}
      </div>

      {/* Incomplete Models */}
      {showIncomplete && incompleteModels.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-white/10">
          <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            Partial Evaluations ({incompleteModels.length})
          </h3>
          {incompleteModels.map((model) => (
            <ModelCard
              key={model.model}
              model={model}
              expanded={expandedModel === model.model}
              onToggle={() => setExpandedModel(expandedModel === model.model ? null : model.model)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ModelCard({
  model,
  rank,
  expanded,
  onToggle
}: {
  model: ModelData;
  rank?: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="p-4 rounded-xl bg-black/30 border border-white/10 hover:border-emerald-500/30 transition-all">
      <div className="flex items-center justify-between cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-4">
          {rank && (
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
              rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
              rank === 2 ? 'bg-gray-400/20 text-gray-300' :
              rank === 3 ? 'bg-orange-500/20 text-orange-400' :
              'bg-gray-700/50 text-gray-500'
            }`}>
              {rank}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{model.displayName}</span>
              <span
                className="px-2 py-0.5 rounded text-xs"
                style={{ backgroundColor: `${model.color}20`, color: model.color }}
              >
                {model.provider}
              </span>
              {!model.complete && (
                <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">
                  {model.hasBank && !model.hasRoad ? 'Bank Only' :
                   !model.hasBank && model.hasRoad ? 'Road Only' : 'Incomplete'}
                </span>
              )}
              {model.combined.partial > 0 && (
                <span className="px-2 py-0.5 rounded text-xs bg-orange-500/20 text-orange-400">
                  {model.combined.partial} partial
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {model.combined.correct}/{model.combined.total} correct
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {/* Bank Score */}
          <div className="text-right">
            <div className="text-lg font-bold" style={{ color: model.hasBank ? '#10B981' : '#6B7280' }}>
              {model.hasBank ? `${model.bank.pct}%` : '-'}
            </div>
            <div className="text-xs text-gray-500">bank</div>
          </div>
          {/* Road Score */}
          <div className="text-right">
            <div className="text-lg font-bold" style={{ color: model.hasRoad ? '#3B82F6' : '#6B7280' }}>
              {model.hasRoad ? `${model.road.pct}%` : '-'}
            </div>
            <div className="text-xs text-gray-500">road</div>
          </div>
          {/* Combined Score */}
          {model.complete && (
            <div className="text-right">
              <div className="text-lg font-bold text-purple-400">
                {model.combined.pct}%
              </div>
              <div className="text-xs text-gray-500">combined</div>
            </div>
          )}
          {expanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/10">
          {/* Detailed Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {model.hasBank && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-xs text-emerald-400 mb-1">Bank Performance</div>
                <div className="text-xl font-mono text-white">{model.bank.correct}/{model.bank.total}</div>
                <div className="text-sm text-gray-400">{model.bank.pct}% accuracy</div>
                {model.bank.partial > 0 && (
                  <div className="text-xs text-orange-400 mt-1">{model.bank.partial} partial credits</div>
                )}
              </div>
            )}
            {model.hasRoad && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="text-xs text-blue-400 mb-1">Road Performance</div>
                <div className="text-xl font-mono text-white">{model.road.correct}/{model.road.total}</div>
                <div className="text-sm text-gray-400">{model.road.pct}% accuracy</div>
                {model.road.partial > 0 && (
                  <div className="text-xs text-orange-400 mt-1">{model.road.partial} partial credits</div>
                )}
              </div>
            )}
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="text-xs text-purple-400 mb-1">Average Reward</div>
              <div className="text-xl font-mono text-white">{model.avgReward.toFixed(4)}</div>
              <div className="text-sm text-gray-400">per attempt</div>
            </div>
          </div>

          {/* Sample Rollouts */}
          {model.rollouts.length > 0 && (
            <div>
              <div className="text-sm text-gray-400 mb-2">Sample Rollouts:</div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {model.rollouts.slice(0, 8).map((rollout, i) => (
                  <div
                    key={i}
                    className={`flex-shrink-0 p-2 rounded-lg border text-xs ${
                      rollout.score_correctness >= 0.8
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : rollout.score_correctness >= 0.2
                          ? 'border-orange-500/30 bg-orange-500/10'
                          : 'border-red-500/30 bg-red-500/10'
                    }`}
                  >
                    <div className="text-white font-mono">{rollout.task_id}</div>
                    <div className="text-gray-500">{rollout.dataset}</div>
                    <div className={
                      rollout.score_correctness >= 0.8
                        ? 'text-emerald-400'
                        : rollout.score_correctness >= 0.2
                          ? 'text-orange-400'
                          : 'text-red-400'
                    }>
                      {rollout.reward.toFixed(2)} reward
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
