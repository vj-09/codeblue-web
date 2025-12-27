'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Target, TrendingDown, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
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

const levelColors: Record<string, string> = {
  'L1': '#22C55E',
  'L2': '#84CC16',
  'L3': '#EAB308',
  'L4': '#F97316',
  'L5': '#EF4444',
  'L6': '#DC2626',
};

export default function FailureInsights() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null); // collapsed by default

  // Analyze task difficulty
  const taskAnalysis = useMemo(() => {
    const taskStats: Record<string, {
      success: number;
      fail: number;
      total: number;
      level: string;
      models: { name: string; provider: string; succeeded: boolean }[];
    }> = {};

    benchmarkData.models.forEach(model => {
      model.examples.forEach(ex => {
        if (!ex.info) return;
        const taskId = ex.info.task_id;

        if (!taskStats[taskId]) {
          taskStats[taskId] = {
            success: 0,
            fail: 0,
            total: 0,
            level: ex.info.level,
            models: []
          };
        }

        const succeeded = ex.score_correctness > 0.5;
        taskStats[taskId].total++;
        if (succeeded) {
          taskStats[taskId].success++;
        } else {
          taskStats[taskId].fail++;
        }
        taskStats[taskId].models.push({
          name: model.name,
          provider: model.provider,
          succeeded
        });
      });
    });

    return taskStats;
  }, []);

  // Hardest tasks (lowest success rate)
  const hardestTasks = useMemo(() => {
    return Object.entries(taskAnalysis)
      .map(([taskId, stats]) => ({
        taskId,
        ...stats,
        successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0
      }))
      .filter(t => t.total >= 2) // At least 2 attempts
      .sort((a, b) => a.successRate - b.successRate)
      .slice(0, 10);
  }, [taskAnalysis]);

  // Model weaknesses by task level
  const modelWeaknesses = useMemo(() => {
    const weaknesses: Record<string, {
      model: string;
      provider: string;
      levels: Record<string, { success: number; total: number }>;
      weakestLevel: string;
      weakestRate: number;
    }> = {};

    benchmarkData.models.forEach(model => {
      weaknesses[model.model] = {
        model: model.name,
        provider: model.provider,
        levels: {},
        weakestLevel: '',
        weakestRate: 100
      };

      model.examples.forEach(ex => {
        if (!ex.info) return;
        const level = ex.info.level;

        if (!weaknesses[model.model].levels[level]) {
          weaknesses[model.model].levels[level] = { success: 0, total: 0 };
        }

        weaknesses[model.model].levels[level].total++;
        if (ex.score_correctness > 0.5) {
          weaknesses[model.model].levels[level].success++;
        }
      });

      // Find weakest level
      Object.entries(weaknesses[model.model].levels).forEach(([level, stats]) => {
        if (stats.total >= 2) {
          const rate = (stats.success / stats.total) * 100;
          if (rate < weaknesses[model.model].weakestRate) {
            weaknesses[model.model].weakestRate = rate;
            weaknesses[model.model].weakestLevel = level;
          }
        }
      });
    });

    return Object.values(weaknesses).filter(w => w.weakestLevel !== '');
  }, []);

  // Task level breakdown
  const levelBreakdown = useMemo(() => {
    const levels: Record<string, { success: number; total: number }> = {};

    benchmarkData.models.forEach(model => {
      model.examples.forEach(ex => {
        if (!ex.info) return;
        const level = ex.info.level;

        if (!levels[level]) {
          levels[level] = { success: 0, total: 0 };
        }

        levels[level].total++;
        if (ex.score_correctness > 0.5) {
          levels[level].success++;
        }
      });
    });

    return Object.entries(levels)
      .map(([level, stats]) => ({
        level,
        ...stats,
        successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0
      }))
      .sort((a, b) => {
        const levelOrder = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'];
        return levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level);
      });
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-4">
      {/* Hardest Tasks */}
      <div className="rounded-xl bg-black/30 border border-white/10 overflow-hidden">
        <button
          onClick={() => toggleSection('hardest')}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-white">Hardest Tasks</h3>
              <p className="text-sm text-gray-400">Tasks most models struggle with</p>
            </div>
          </div>
          {expandedSection === 'hardest' ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSection === 'hardest' && (
          <div className="p-4 pt-0 space-y-2">
            {hardestTasks.map((task, idx) => (
              <div
                key={task.taskId}
                className="p-3 rounded-lg bg-black/30 border border-white/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${levelColors[task.level]}20`,
                        color: levelColors[task.level]
                      }}
                    >
                      {task.level}
                    </span>
                    <span className="text-white font-mono text-sm">{task.taskId}</span>
                  </div>
                  <span className={`text-sm font-bold ${
                    task.successRate < 25 ? 'text-red-400' :
                    task.successRate < 50 ? 'text-orange-400' :
                    'text-yellow-400'
                  }`}>
                    {task.successRate.toFixed(0)}% success
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${task.successRate}%`,
                      backgroundColor: task.successRate < 25 ? '#EF4444' :
                        task.successRate < 50 ? '#F97316' : '#EAB308'
                    }}
                  />
                </div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {task.models.map((m, i) => (
                    <span
                      key={i}
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        m.succeeded
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {m.name.split('-').slice(0, 1).join('')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Model Weaknesses */}
      <div className="rounded-xl bg-black/30 border border-white/10 overflow-hidden">
        <button
          onClick={() => toggleSection('weaknesses')}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-white">Model Weaknesses</h3>
              <p className="text-sm text-gray-400">Where each model struggles most</p>
            </div>
          </div>
          {expandedSection === 'weaknesses' ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSection === 'weaknesses' && (
          <div className="p-4 pt-0 space-y-2">
            {modelWeaknesses.map((model) => (
              <div
                key={model.model}
                className="p-3 rounded-lg bg-black/30 border border-white/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: providerColors[model.provider] }}
                    />
                    <span className="text-white font-medium">{model.model}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Weakest:</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${levelColors[model.weakestLevel]}20`,
                        color: levelColors[model.weakestLevel]
                      }}
                    >
                      {model.weakestLevel}
                    </span>
                    <span className="text-orange-400 font-bold text-sm">
                      {model.weakestRate.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {Object.entries(model.levels)
                    .sort((a, b) => {
                      const order = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'];
                      return order.indexOf(a[0]) - order.indexOf(b[0]);
                    })
                    .map(([level, stats]) => {
                      const rate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;
                      return (
                        <div
                          key={level}
                          className="flex-1 text-center p-2 rounded bg-black/30"
                          title={`${level}: ${rate.toFixed(0)}% (${stats.success}/${stats.total})`}
                        >
                          <div className="text-xs text-gray-500">{level}</div>
                          <div className={`text-sm font-mono ${
                            rate >= 70 ? 'text-emerald-400' :
                            rate >= 40 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {stats.total > 0 ? `${rate.toFixed(0)}%` : '-'}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Level Breakdown */}
      <div className="rounded-xl bg-black/30 border border-white/10 overflow-hidden">
        <button
          onClick={() => toggleSection('levels')}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-white">Task Level Breakdown</h3>
              <p className="text-sm text-gray-400">Success rates by difficulty level</p>
            </div>
          </div>
          {expandedSection === 'levels' ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSection === 'levels' && (
          <div className="p-4 pt-0">
            <div className="space-y-3">
              {levelBreakdown.map((level) => (
                <div key={level.level} className="flex items-center gap-3">
                  <span
                    className="w-12 text-center text-xs font-mono px-2 py-1 rounded"
                    style={{
                      backgroundColor: `${levelColors[level.level]}20`,
                      color: levelColors[level.level]
                    }}
                  >
                    {level.level}
                  </span>
                  <div className="flex-1">
                    <div className="w-full h-6 bg-gray-800 rounded-lg overflow-hidden relative">
                      <div
                        className="h-full rounded-lg transition-all"
                        style={{
                          width: `${level.successRate}%`,
                          backgroundColor: levelColors[level.level]
                        }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                        {level.successRate.toFixed(0)}% ({level.success}/{level.total})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-sm text-blue-400">
                <strong>L1-L2:</strong> Simple queries |{' '}
                <strong>L3-L4:</strong> Multi-step reasoning |{' '}
                <strong>L5-L6:</strong> Complex joins & analysis
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
