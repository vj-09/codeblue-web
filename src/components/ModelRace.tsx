'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Trophy, Clock, Check, X, Zap } from 'lucide-react';
import benchmarkDataRaw from '@/data/benchmark-data.json';

interface Example {
  example_id: number;
  task: string;
  reward: number;
  answer: string;
  info: { expected: number; level: string; task_id: string } | null;
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

interface RacerState {
  model: ModelData;
  example: Example;
  progress: number;
  finished: boolean;
  finishTime: number;
  rank: number;
  displayedText: string;
  currentTurn: number;
}

export default function ModelRace() {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [selectedRollout, setSelectedRollout] = useState(0);
  const [isRacing, setIsRacing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [racers, setRacers] = useState<RacerState[]>([]);
  const [raceFinished, setRaceFinished] = useState(false);
  const [speed, setSpeed] = useState(1);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  // Find common tasks between selected models
  const commonTasks = useMemo(() => {
    if (selectedModels.length < 2) return [];

    const models = selectedModels
      .map(id => benchmarkData.models.find(m => m.model === id))
      .filter(Boolean) as ModelData[];

    const taskSets = models.map(m =>
      new Set(m.examples.filter(e => e.info).map(e => e.info!.task_id))
    );

    const common = [...taskSets[0]].filter(task =>
      taskSets.every(set => set.has(task))
    );

    return common.map(taskId => {
      const example = models[0].examples.find(e => e.info?.task_id === taskId);
      return {
        taskId,
        level: example?.info?.level || 'Unknown'
      };
    });
  }, [selectedModels]);

  // Toggle model selection
  const toggleModel = (modelId: string) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(m => m !== modelId);
      }
      if (prev.length >= 4) return prev;
      return [...prev, modelId];
    });
    setSelectedTask(null);
    setSelectedRollout(0);
    resetRace();
  };

  // Reset race state
  const resetRace = () => {
    setIsRacing(false);
    setIsPaused(false);
    setElapsedTime(0);
    setRacers([]);
    setRaceFinished(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  // Start the race
  const startRace = () => {
    if (!selectedTask || selectedModels.length < 2) return;

    const models = selectedModels
      .map(id => benchmarkData.models.find(m => m.model === id))
      .filter(Boolean) as ModelData[];

    const initialRacers: RacerState[] = models.map(model => {
      // Get all examples for this task, pick the selected rollout
      const taskExamples = model.examples.filter(e => e.info?.task_id === selectedTask);
      const example = taskExamples[selectedRollout] || taskExamples[0];
      return {
        model,
        example,
        progress: 0,
        finished: false,
        finishTime: 0,
        rank: 0,
        displayedText: '',
        currentTurn: 0
      };
    });

    setRacers(initialRacers);
    setIsRacing(true);
    setIsPaused(false);
    setElapsedTime(0);
    setRaceFinished(false);
  };

  // Animation loop
  useEffect(() => {
    if (!isRacing || isPaused || raceFinished) return;

    const maxTime = Math.max(...racers.map(r => r.example.generation_ms));
    const tickInterval = 50; // 50ms ticks
    const timePerTick = tickInterval * speed; // Real time per tick

    intervalRef.current = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + timePerTick;

        setRacers(currentRacers => {
          let finishedCount = 0;
          let rank = currentRacers.filter(r => r.finished).length;

          const updated = currentRacers.map(racer => {
            if (racer.finished) {
              finishedCount++;
              return racer;
            }

            const targetTime = racer.example.generation_ms;
            const progress = Math.min(100, (newTime / targetTime) * 100);

            // Calculate which turn to show
            const totalTurns = racer.example.completion.length;
            const currentTurn = Math.floor((progress / 100) * totalTurns);

            // Get displayed text
            const turns = racer.example.completion.slice(0, currentTurn + 1);
            const fullText = turns.map(t => t.content).join('\n\n');
            const charProgress = (progress / 100) * fullText.length;
            const displayedText = fullText.slice(0, Math.floor(charProgress));

            const finished = progress >= 100;
            if (finished && !racer.finished) {
              rank++;
              return {
                ...racer,
                progress: 100,
                finished: true,
                finishTime: newTime,
                rank,
                displayedText: fullText,
                currentTurn: totalTurns
              };
            }

            return {
              ...racer,
              progress,
              displayedText,
              currentTurn
            };
          });

          // Check if all finished
          if (updated.every(r => r.finished)) {
            setRaceFinished(true);
            if (intervalRef.current) clearInterval(intervalRef.current);
          }

          return updated;
        });

        return newTime;
      });
    }, tickInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRacing, isPaused, raceFinished, speed]);

  // Format time display
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${seconds}.${tenths}s`;
  };

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <div className="bg-black/20 rounded-xl p-4 border border-white/10">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Select 2-4 models to race:</h3>
        <div className="flex flex-wrap gap-2">
          {benchmarkData.models.map((model) => (
            <button
              key={model.model}
              onClick={() => toggleModel(model.model)}
              disabled={isRacing}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedModels.includes(model.model)
                  ? 'text-white border-2'
                  : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-500'
              } ${isRacing ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={selectedModels.includes(model.model) ? {
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

      {/* Task Selection */}
      {selectedModels.length >= 2 && (
        <div className="bg-black/20 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">
              Select a task ({commonTasks.length} tasks × 3 rollouts):
            </h3>
            {selectedTask && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Rollout:</span>
                {[0, 1, 2].map(r => (
                  <button
                    key={r}
                    onClick={() => { setSelectedRollout(r); resetRace(); }}
                    disabled={isRacing}
                    className={`px-2 py-1 rounded text-xs ${
                      selectedRollout === r
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    } ${isRacing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Run {r + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {commonTasks.map((task) => (
              <button
                key={task.taskId}
                onClick={() => { setSelectedTask(task.taskId); setSelectedRollout(0); resetRace(); }}
                disabled={isRacing}
                className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-all ${
                  selectedTask === task.taskId
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-500'
                } ${isRacing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {task.taskId} <span className="text-gray-500">({task.level})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Race Controls */}
      {selectedTask && (
        <div className="bg-black/20 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!isRacing ? (
                <button
                  onClick={startRace}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Start Race
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={resetRace}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                </>
              )}

              {/* Speed control */}
              <div className="flex items-center gap-2 ml-4">
                <span className="text-sm text-gray-400">Speed:</span>
                {[1, 2, 5, 10].map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-2 py-1 rounded text-xs ${
                      speed === s
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2 text-lg font-mono">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-emerald-400">{formatTime(elapsedTime)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Race Track */}
      {racers.length > 0 && (
        <div className="space-y-4">
          {racers
            .sort((a, b) => {
              if (a.finished && b.finished) return a.rank - b.rank;
              if (a.finished) return -1;
              if (b.finished) return 1;
              return b.progress - a.progress;
            })
            .map((racer, idx) => (
              <div
                key={racer.model.model}
                className={`rounded-xl border overflow-hidden transition-all ${
                  racer.finished
                    ? racer.rank === 1
                      ? 'border-yellow-500/50 bg-yellow-500/10'
                      : 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-white/10 bg-black/20'
                }`}
              >
                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-white/10">
                  <div className="flex items-center gap-3">
                    {racer.finished && (
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        racer.rank === 1
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : racer.rank === 2
                          ? 'bg-gray-400/20 text-gray-300'
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {racer.rank === 1 ? <Trophy className="w-4 h-4" /> : `#${racer.rank}`}
                      </div>
                    )}
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: providerColors[racer.model.provider] }}
                    />
                    <span className="font-medium text-white">
                      {racer.model.name.split('-').slice(0, 2).join('-')}
                    </span>
                    {racer.finished && (
                      <span className={racer.example.score_correctness > 0.5 ? 'text-emerald-400' : 'text-red-400'}>
                        {racer.example.score_correctness > 0.5 ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {racer.finished && (
                      <span className="text-sm font-mono text-emerald-400">
                        {formatTime(racer.finishTime)}
                      </span>
                    )}
                    <span className="text-sm text-gray-400">
                      {racer.progress.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-gray-800">
                  <div
                    className="h-full transition-all duration-100"
                    style={{
                      width: `${racer.progress}%`,
                      backgroundColor: providerColors[racer.model.provider]
                    }}
                  />
                </div>

                {/* Content Preview */}
                <div className="p-4 max-h-48 overflow-y-auto">
                  <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap">
                    {racer.displayedText || (
                      <span className="text-gray-500 italic">Waiting to start...</span>
                    )}
                    {!racer.finished && racer.displayedText && (
                      <span className="animate-pulse text-emerald-400">|</span>
                    )}
                  </pre>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Race Results */}
      {raceFinished && (
        <div className="p-6 rounded-xl bg-gradient-to-r from-yellow-500/20 to-emerald-500/20 border border-yellow-500/30">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Race Complete!
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {racers
              .sort((a, b) => a.rank - b.rank)
              .map((racer) => (
                <div
                  key={racer.model.model}
                  className={`p-4 rounded-lg ${
                    racer.rank === 1
                      ? 'bg-yellow-500/20 border border-yellow-500/30'
                      : 'bg-black/30 border border-white/10'
                  }`}
                >
                  <div className="text-2xl font-bold mb-1"
                    style={{ color: racer.rank === 1 ? '#EAB308' : '#9CA3AF' }}
                  >
                    #{racer.rank}
                  </div>
                  <div className="text-white font-medium text-sm">
                    {racer.model.name.split('-').slice(0, 2).join('-')}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatTime(racer.finishTime)}
                  </div>
                  <div className={`text-xs mt-1 ${
                    racer.example.score_correctness > 0.5 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {racer.example.score_correctness > 0.5 ? 'Correct' : 'Wrong'}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedModels.length < 2 && (
        <div className="text-center py-16 text-gray-500">
          <Zap className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Select at least 2 models to start racing</p>
          <p className="text-sm mt-2">Watch them compete side-by-side on the same task!</p>
        </div>
      )}
    </div>
  );
}
