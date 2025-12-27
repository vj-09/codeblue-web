'use client';

import { useState, useMemo } from 'react';
import { Grid3X3, Filter } from 'lucide-react';
import final25DataRaw from '@/data/final25-data.json';

interface ModelData {
  model: string;
  provider: string;
  name: string;
  displayName: string;
  color: string;
  complete: boolean;
  rollouts: Array<{
    task_id: string;
    dataset: string;
    score_correctness: number;
    reward: number;
  }>;
}

interface TaskData {
  id: string;
  dataset: string;
  level: string;
  template: string;
  goal: string;
}

interface Final25Data {
  models: ModelData[];
  tasks: TaskData[];
}

const final25Data = final25DataRaw as Final25Data;

type FilterLevel = 'all' | 'L4' | 'L5' | 'L6';
type FilterDataset = 'all' | 'bank' | 'road';

export default function TaskHeatmap() {
  const [levelFilter, setLevelFilter] = useState<FilterLevel>('all');
  const [datasetFilter, setDatasetFilter] = useState<FilterDataset>('all');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return final25Data.tasks.filter(task => {
      if (levelFilter !== 'all' && task.level !== levelFilter) return false;
      if (datasetFilter !== 'all' && task.dataset !== datasetFilter) return false;
      return true;
    });
  }, [levelFilter, datasetFilter]);

  // Only show complete models
  const completeModels = useMemo(() => {
    return final25Data.models.filter(m => m.complete);
  }, []);

  // Compute per-task-per-model performance
  const heatmapData = useMemo(() => {
    const data: Record<string, Record<string, { correct: number; partial: number; wrong: number; total: number }>> = {};

    for (const task of filteredTasks) {
      data[task.id] = {};
      for (const model of completeModels) {
        const rollouts = model.rollouts.filter(r => r.task_id === task.id);
        const correct = rollouts.filter(r => r.score_correctness >= 0.8).length;
        const partial = rollouts.filter(r => r.score_correctness >= 0.2 && r.score_correctness < 0.8).length;
        const wrong = rollouts.filter(r => r.score_correctness < 0.2).length;
        data[task.id][model.model] = { correct, partial, wrong, total: rollouts.length };
      }
    }

    return data;
  }, [filteredTasks, completeModels]);

  // Compute task difficulty (% of models that got it right)
  const taskDifficulty = useMemo(() => {
    const difficulty: Record<string, number> = {};
    for (const task of filteredTasks) {
      let totalCorrect = 0;
      let totalAttempts = 0;
      for (const model of completeModels) {
        const perf = heatmapData[task.id]?.[model.model];
        if (perf) {
          totalCorrect += perf.correct;
          totalAttempts += perf.total;
        }
      }
      difficulty[task.id] = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
    }
    return difficulty;
  }, [filteredTasks, completeModels, heatmapData]);

  // Sort tasks by difficulty (hardest first)
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => taskDifficulty[a.id] - taskDifficulty[b.id]);
  }, [filteredTasks, taskDifficulty]);

  const getCellColor = (perf: { correct: number; partial: number; total: number } | undefined) => {
    if (!perf || perf.total === 0) return 'bg-gray-800';
    const correctRate = perf.correct / perf.total;
    const partialRate = perf.partial / perf.total;

    if (correctRate >= 0.67) return 'bg-emerald-500/70';
    if (correctRate >= 0.33) return 'bg-emerald-500/40';
    if (partialRate >= 0.33) return 'bg-orange-500/50';
    if (correctRate > 0 || partialRate > 0) return 'bg-orange-500/30';
    return 'bg-red-500/40';
  };

  const selectedTaskData = selectedTask ? final25Data.tasks.find(t => t.id === selectedTask) : null;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Level:</span>
          {(['all', 'L4', 'L5', 'L6'] as FilterLevel[]).map(level => (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={`px-3 py-1 rounded text-sm ${
                levelFilter === level ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-white'
              }`}
            >
              {level === 'all' ? 'All' : level}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Dataset:</span>
          {(['all', 'bank', 'road'] as FilterDataset[]).map(ds => (
            <button
              key={ds}
              onClick={() => setDatasetFilter(ds)}
              className={`px-3 py-1 rounded text-sm ${
                datasetFilter === ds ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-white'
              }`}
            >
              {ds === 'all' ? 'All' : ds.charAt(0).toUpperCase() + ds.slice(1)}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500 ml-auto">
          {filteredTasks.length} tasks x {completeModels.length} models
        </span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>Legend:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-emerald-500/70" />
          <span>67-100%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-emerald-500/40" />
          <span>33-66%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-orange-500/50" />
          <span>Partial</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-500/40" />
          <span>0%</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header row */}
          <div className="flex">
            <div className="w-32 flex-shrink-0 p-2 text-xs text-gray-500 font-medium">Task</div>
            <div className="w-16 flex-shrink-0 p-2 text-xs text-gray-500 font-medium text-center">Diff%</div>
            {completeModels.map(model => (
              <div
                key={model.model}
                className="w-20 flex-shrink-0 p-2 text-xs text-center"
                style={{ color: model.color }}
              >
                <div className="truncate" title={model.displayName}>
                  {model.name.split('-').slice(0, 2).join('-')}
                </div>
              </div>
            ))}
          </div>

          {/* Data rows */}
          {sortedTasks.map(task => (
            <div
              key={task.id}
              className={`flex border-t border-white/5 hover:bg-white/5 cursor-pointer ${
                selectedTask === task.id ? 'bg-emerald-500/10' : ''
              }`}
              onClick={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
            >
              <div className="w-32 flex-shrink-0 p-2 text-xs">
                <div className="font-mono text-white truncate" title={task.id}>{task.id}</div>
                <div className="text-gray-500">{task.level} / {task.template.slice(0, 10)}</div>
              </div>
              <div className="w-16 flex-shrink-0 p-2 text-xs text-center">
                <div className={`font-mono ${
                  taskDifficulty[task.id] < 20 ? 'text-red-400' :
                  taskDifficulty[task.id] < 50 ? 'text-orange-400' :
                  'text-emerald-400'
                }`}>
                  {taskDifficulty[task.id].toFixed(0)}%
                </div>
              </div>
              {completeModels.map(model => {
                const perf = heatmapData[task.id]?.[model.model];
                return (
                  <div
                    key={model.model}
                    className="w-20 flex-shrink-0 p-1"
                  >
                    <div
                      className={`h-8 rounded flex items-center justify-center text-xs font-mono ${getCellColor(perf)}`}
                      title={`${model.displayName}: ${perf?.correct || 0}/${perf?.total || 0} correct`}
                    >
                      {perf ? `${perf.correct}/${perf.total}` : '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Task Details */}
      {selectedTaskData && (
        <div className="p-4 rounded-xl bg-black/30 border border-emerald-500/30">
          <h4 className="text-sm font-medium text-emerald-400 mb-2">{selectedTaskData.id}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
            <div>
              <div className="text-gray-500">Dataset</div>
              <div className="text-white">{selectedTaskData.dataset}</div>
            </div>
            <div>
              <div className="text-gray-500">Level</div>
              <div className="text-white">{selectedTaskData.level}</div>
            </div>
            <div>
              <div className="text-gray-500">Template</div>
              <div className="text-white">{selectedTaskData.template}</div>
            </div>
            <div>
              <div className="text-gray-500">Avg Success</div>
              <div className="text-white">{taskDifficulty[selectedTaskData.id].toFixed(1)}%</div>
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-sm mb-1">Question</div>
            <div className="text-white text-sm bg-black/30 rounded p-3 font-mono">
              {selectedTaskData.goal}
            </div>
          </div>
        </div>
      )}

      {/* Hardest Tasks */}
      <div className="p-4 rounded-xl bg-black/30 border border-white/10">
        <h4 className="text-sm font-medium text-red-400 mb-3">Hardest Tasks (0% success)</h4>
        <div className="flex flex-wrap gap-2">
          {sortedTasks
            .filter(t => taskDifficulty[t.id] === 0)
            .map(task => (
              <button
                key={task.id}
                onClick={() => setSelectedTask(task.id)}
                className="px-3 py-1 rounded-lg text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:border-red-500/40"
              >
                {task.id}
              </button>
            ))}
          {sortedTasks.filter(t => taskDifficulty[t.id] === 0).length === 0 && (
            <span className="text-gray-500 text-sm">No tasks with 0% success rate</span>
          )}
        </div>
      </div>
    </div>
  );
}
