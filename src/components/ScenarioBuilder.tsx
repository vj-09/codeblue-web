'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { X, ChevronRight, ChevronLeft, Sparkles, DollarSign, Target, Zap, Database, Check } from 'lucide-react';
import benchmarkDataRaw from '@/data/benchmark-data.json';

interface ModelData {
  model: string;
  provider: string;
  name: string;
  totalRuns: number;
  avgReward: number;
  bestReward: number;
  modes: Record<string, { reward: number; metrics: Record<string, number>; runs: number }>;
  metrics: Record<string, number>;
}

const benchmarkData = benchmarkDataRaw as { models: ModelData[] };

// Simulated cost tiers
const modelCostTier: Record<string, 'low' | 'mid' | 'high'> = {
  'qwen/qwen3-235b-a22b-thinking-2507': 'mid',
  'qwen/qwen3-max': 'low',
  'anthropic/claude-opus-4.5': 'high',
  'google/gemini-3-pro-preview': 'mid',
  'google/gemini-3-flash-preview': 'low',
  'openai/gpt-5.2': 'high',
  'openai/gpt-5.1-codex-mini': 'mid',
  'deepseek/deepseek-v3.2-speciale': 'low',
  'ensemble': 'mid',
};

const providerColors: Record<string, string> = {
  'qwen': '#10B981',
  'anthropic': '#8B5CF6',
  'google': '#3B82F6',
  'openai': '#F59E0B',
  'deepseek': '#EC4899',
  'ensemble': '#14B8A6',
};

interface ScenarioBuilderProps {
  isOpen: boolean;
  onClose: () => void;
}

type BudgetOption = 'low' | 'mid' | 'high';
type ComplexityOption = 'easy' | 'medium' | 'hard';
type CsvOption = 'single' | 'multi';

export default function ScenarioBuilder({ isOpen, onClose }: ScenarioBuilderProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [budget, setBudget] = useState<BudgetOption | null>(null);
  const [accuracyWeight, setAccuracyWeight] = useState(50); // 0 = speed, 100 = accuracy
  const [complexity, setComplexity] = useState<ComplexityOption | null>(null);
  const [csvType, setCsvType] = useState<CsvOption | null>(null);

  const totalSteps = 4;

  // Calculate recommendations
  const recommendations = useMemo(() => {
    if (step < totalSteps + 1) return [];

    return benchmarkData.models.map(model => {
      let score = 0;
      let reasons: string[] = [];

      // Budget match (25 points)
      const costTier = modelCostTier[model.model] || 'mid';
      if (budget === costTier) {
        score += 25;
        reasons.push('Matches your budget');
      } else if (
        (budget === 'mid' && costTier !== 'high') ||
        (budget === 'high')
      ) {
        score += 15;
      }

      // Accuracy vs Speed (25 points)
      const correctness = (model.metrics.score_correctness || 0) * 100;
      const efficiency = (model.metrics.score_efficiency || 0) * 100;

      if (accuracyWeight > 60) {
        // Prioritize accuracy
        score += Math.min(25, correctness / 4);
        if (correctness > 50) reasons.push('High accuracy');
      } else if (accuracyWeight < 40) {
        // Prioritize speed
        score += Math.min(25, efficiency / 4);
        if (efficiency > 70) reasons.push('Fast execution');
      } else {
        // Balanced
        score += Math.min(25, (correctness + efficiency) / 8);
        reasons.push('Balanced performance');
      }

      // Complexity match (25 points) - check mode performance
      const statelessMode = model.modes['stateless_singleCsv'];
      const statefulMode = model.modes['stateful_multiCsv'];

      if (complexity === 'easy' && statelessMode) {
        score += 25;
        reasons.push('Good for simple tasks');
      } else if (complexity === 'hard' && statefulMode) {
        const statefulReward = statefulMode.reward || 0;
        score += Math.min(25, statefulReward * 8);
        if (statefulReward > 2.5) reasons.push('Handles complex tasks');
      } else if (complexity === 'medium') {
        score += 20;
      }

      // CSV type match (25 points)
      if (csvType === 'single') {
        const singleModes = Object.entries(model.modes).filter(([k]) => k.includes('singleCsv'));
        if (singleModes.length > 0) {
          const avgReward = singleModes.reduce((sum, [, v]) => sum + (v.reward || 0), 0) / singleModes.length;
          score += Math.min(25, avgReward * 8);
        }
      } else if (csvType === 'multi') {
        const multiModes = Object.entries(model.modes).filter(([k]) => k.includes('multiCsv'));
        if (multiModes.length > 0) {
          const avgReward = multiModes.reduce((sum, [, v]) => sum + (v.reward || 0), 0) / multiModes.length;
          score += Math.min(25, avgReward * 8);
          if (avgReward > 2.5) reasons.push('Multi-CSV capable');
        }
      }

      return {
        model,
        score: Math.round(score),
        reasons: reasons.slice(0, 3),
      };
    }).sort((a, b) => b.score - a.score);
  }, [step, budget, accuracyWeight, complexity, csvType]);

  const reset = () => {
    setStep(1);
    setBudget(null);
    setAccuracyWeight(50);
    setComplexity(null);
    setCsvType(null);
  };

  const goToModel = (modelId: string) => {
    onClose();
    router.push(`/benchmark/${encodeURIComponent(modelId)}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">Find Your Model</span>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        {step <= totalSteps && (
          <div className="px-6 pt-4">
            <div className="flex gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-full ${
                    i < step ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-slate-400 mt-2">Step {step} of {totalSteps}</div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Budget */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                What's your budget?
              </h3>
              <div className="space-y-2">
                {[
                  { value: 'low', label: 'Budget Friendly', desc: '< $1 per million tokens' },
                  { value: 'mid', label: 'Balanced', desc: '$1-5 per million tokens' },
                  { value: 'high', label: 'Premium', desc: '> $5 per million tokens' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setBudget(opt.value as BudgetOption)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      budget === opt.value
                        ? 'bg-emerald-500/20 border-2 border-emerald-500'
                        : 'bg-slate-700/50 border border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="font-medium text-white">{opt.label}</div>
                    <div className="text-sm text-slate-400">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Accuracy vs Speed */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Speed vs Accuracy?
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-amber-400 flex items-center gap-1">
                    <Zap className="w-4 h-4" /> Faster
                  </span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    More Accurate <Target className="w-4 h-4" />
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={accuracyWeight}
                  onChange={(e) => setAccuracyWeight(parseInt(e.target.value, 10))}
                  className="w-full h-3 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-center text-slate-400">
                  {accuracyWeight < 40 ? 'Prioritizing speed' :
                   accuracyWeight > 60 ? 'Prioritizing accuracy' :
                   'Balanced approach'}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Complexity */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                Task Complexity?
              </h3>
              <div className="space-y-2">
                {[
                  { value: 'easy', label: 'Simple Queries', desc: 'Basic aggregations, single-step analysis' },
                  { value: 'medium', label: 'Moderate', desc: 'Multi-step reasoning, some joins' },
                  { value: 'hard', label: 'Complex Tasks', desc: 'Multi-table joins, stateful analysis' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setComplexity(opt.value as ComplexityOption)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      complexity === opt.value
                        ? 'bg-emerald-500/20 border-2 border-emerald-500'
                        : 'bg-slate-700/50 border border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="font-medium text-white">{opt.label}</div>
                    <div className="text-sm text-slate-400">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: CSV Type */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                Data Structure?
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'single', label: 'Single CSV', desc: 'One file at a time' },
                  { value: 'multi', label: 'Multiple CSVs', desc: 'Related tables, joins' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setCsvType(opt.value as CsvOption)}
                    className={`p-4 rounded-xl text-center transition-all ${
                      csvType === opt.value
                        ? 'bg-emerald-500/20 border-2 border-emerald-500'
                        : 'bg-slate-700/50 border border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="font-medium text-white">{opt.label}</div>
                    <div className="text-xs text-slate-400 mt-1">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {step === totalSteps + 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white text-center mb-6">
                Your Top Recommendations
              </h3>
              <div className="space-y-3">
                {recommendations.slice(0, 3).map((rec, idx) => (
                  <button
                    key={rec.model.model}
                    onClick={() => goToModel(rec.model.model)}
                    className="w-full p-4 rounded-xl bg-slate-700/50 border border-slate-600 hover:border-emerald-500/50 text-left transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                          idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                          'bg-orange-500/20 text-orange-400'
                        }`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: providerColors[rec.model.provider] }}
                            />
                            <span className="font-medium text-white group-hover:text-emerald-400 transition-colors">
                              {rec.model.name}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {rec.reasons.join(' • ')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-400">{rec.score}%</div>
                        <div className="text-xs text-slate-500">match</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={reset}
                className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Start Over
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        {step <= totalSteps && (
          <div className="px-6 pb-6 flex justify-between">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="flex items-center gap-1 px-4 py-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !budget) ||
                (step === 3 && !complexity) ||
                (step === 4 && !csvType)
              }
              className="flex items-center gap-1 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors"
            >
              {step === totalSteps ? 'See Results' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
