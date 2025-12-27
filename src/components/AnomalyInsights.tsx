'use client';

import { useMemo } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
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
  complete: boolean;
}

interface Anomaly {
  model: string;
  type: string;
  description: string;
  details: Record<string, unknown>;
}

interface Final25Data {
  models: ModelData[];
  anomalies: Anomaly[];
}

const final25Data = final25DataRaw as Final25Data;

export default function AnomalyInsights() {
  // Compute additional anomalies
  const allAnomalies = useMemo(() => {
    const anomalies: Array<{
      model: string;
      modelData: ModelData | undefined;
      type: string;
      severity: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      insight: string;
    }> = [];

    const completeModels = final25Data.models.filter(m => m.complete);

    for (const model of completeModels) {
      const bankPct = model.bank.pct;
      const roadPct = model.road.pct;
      const gap = Math.abs(bankPct - roadPct);

      // Domain gap
      if (gap > 30) {
        const direction = roadPct > bankPct ? 'road' : 'bank';
        const weaker = roadPct > bankPct ? 'bank' : 'road';
        anomalies.push({
          model: model.model,
          modelData: model,
          type: 'domain_gap',
          severity: gap > 40 ? 'high' : 'medium',
          title: `${model.displayName}: ${gap.toFixed(0)}% Domain Gap`,
          description: `Performs ${gap.toFixed(1)}% better on ${direction} than ${weaker} tasks`,
          insight: direction === 'road'
            ? 'May struggle with the bank dataset\'s percentage format or subscription rate concept'
            : 'May have difficulty with road safety metrics or spatial reasoning',
        });
      }

      // High partial credit
      if (model.combined.partial >= 5) {
        anomalies.push({
          model: model.model,
          modelData: model,
          type: 'partial_credits',
          severity: model.combined.partial >= 10 ? 'high' : 'medium',
          title: `${model.displayName}: ${model.combined.partial} Partial Credits`,
          description: `Got close but made scale errors (100x) or rounding mistakes`,
          insight: 'Consider adding explicit formatting instructions in prompts to reduce 100x scale errors',
        });
      }

      // Very low performance
      if (model.combined.pct < 15) {
        anomalies.push({
          model: model.model,
          modelData: model,
          type: 'low_performance',
          severity: 'high',
          title: `${model.displayName}: ${model.combined.pct}% Overall`,
          description: `Significantly underperforming compared to other models`,
          insight: 'May need task-specific fine-tuning or better system prompts for analytical tasks',
        });
      }

      // Bank-specific patterns
      if (model.bank.partial >= 3 && model.bank.pct < 30) {
        anomalies.push({
          model: model.model,
          modelData: model,
          type: 'bank_struggle',
          severity: 'medium',
          title: `${model.displayName}: Bank Format Issues`,
          description: `Low bank accuracy (${model.bank.pct}%) with ${model.bank.partial} partial credits`,
          insight: 'Likely giving answers as decimals (0.35) instead of percentages (35%)',
        });
      }
    }

    // Add stored anomalies
    for (const anomaly of final25Data.anomalies) {
      const model = final25Data.models.find(m => m.model === anomaly.model);
      if (model && !anomalies.find(a => a.model === anomaly.model && a.type === anomaly.type)) {
        anomalies.push({
          model: anomaly.model,
          modelData: model,
          type: anomaly.type,
          severity: 'medium',
          title: anomaly.description,
          description: anomaly.description,
          insight: 'See detailed analysis for root cause',
        });
      }
    }

    return anomalies;
  }, []);

  // Group by type
  const anomalyGroups = useMemo(() => {
    const groups: Record<string, typeof allAnomalies> = {};
    for (const a of allAnomalies) {
      if (!groups[a.type]) groups[a.type] = [];
      groups[a.type].push(a);
    }
    return groups;
  }, [allAnomalies]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'domain_gap': return TrendingUp;
      case 'partial_credits': return AlertTriangle;
      case 'low_performance': return TrendingDown;
      default: return Sparkles;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'domain_gap': return 'Domain Gaps';
      case 'partial_credits': return 'Scale Errors';
      case 'low_performance': return 'Underperformers';
      case 'bank_struggle': return 'Bank Format Issues';
      default: return type.replace(/_/g, ' ');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-500/30 bg-red-500/10';
      case 'medium': return 'border-orange-500/30 bg-orange-500/10';
      default: return 'border-yellow-500/30 bg-yellow-500/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-black/30 border border-white/10">
          <div className="text-2xl font-bold text-red-400">{allAnomalies.length}</div>
          <div className="text-sm text-gray-500">Total Anomalies</div>
        </div>
        <div className="p-4 rounded-xl bg-black/30 border border-white/10">
          <div className="text-2xl font-bold text-orange-400">
            {allAnomalies.filter(a => a.type === 'domain_gap').length}
          </div>
          <div className="text-sm text-gray-500">Domain Gaps</div>
        </div>
        <div className="p-4 rounded-xl bg-black/30 border border-white/10">
          <div className="text-2xl font-bold text-yellow-400">
            {allAnomalies.filter(a => a.type === 'partial_credits').length}
          </div>
          <div className="text-sm text-gray-500">Scale Errors</div>
        </div>
        <div className="p-4 rounded-xl bg-black/30 border border-white/10">
          <div className="text-2xl font-bold text-purple-400">
            {allAnomalies.filter(a => a.severity === 'high').length}
          </div>
          <div className="text-sm text-gray-500">High Severity</div>
        </div>
      </div>

      {/* Featured Anomaly: Gemini-3-Pro */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-orange-500/20">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-orange-400 mb-2">
              Notable: Gemini-3-Pro Percentage Format Confusion
            </h3>
            <p className="text-gray-300 mb-4">
              Gemini-3-Pro scores <span className="text-emerald-400 font-mono">61.1%</span> on road tasks but only
              <span className="text-red-400 font-mono"> 17.5%</span> on bank tasks - a 43.6% gap.
              It also has <span className="text-yellow-400 font-mono">14 partial credits</span> (the highest of any model).
            </p>
            <div className="p-4 rounded-lg bg-black/30 mb-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Root Cause Analysis:</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>1. Bank tasks ask for &quot;subscription rate&quot; as a percentage (e.g., 35.53%)</li>
                <li>2. Gemini often submits as decimal (0.3553) instead of percentage (35.53)</li>
                <li>3. This triggers 0.20 &quot;partial credit&quot; for being 100x off</li>
                <li>4. Road tasks use different metrics (accident risk) with different scales</li>
              </ul>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 rounded-lg bg-black/30 text-sm">
                <span className="text-gray-500">Bank:</span>
                <span className="text-red-400 font-mono ml-2">10/57 (17.5%)</span>
              </div>
              <div className="px-4 py-2 rounded-lg bg-black/30 text-sm">
                <span className="text-gray-500">Road:</span>
                <span className="text-emerald-400 font-mono ml-2">11/18 (61.1%)</span>
              </div>
              <div className="px-4 py-2 rounded-lg bg-black/30 text-sm">
                <span className="text-gray-500">Partial:</span>
                <span className="text-yellow-400 font-mono ml-2">14</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Anomaly Groups */}
      {Object.entries(anomalyGroups).map(([type, anomalies]) => {
        const Icon = getTypeIcon(type);
        return (
          <div key={type} className="space-y-3">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Icon className="w-4 h-4" />
              {getTypeLabel(type)} ({anomalies.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {anomalies.map((anomaly, idx) => (
                <div
                  key={`${anomaly.model}-${idx}`}
                  className={`p-4 rounded-xl border ${getSeverityColor(anomaly.severity)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {anomaly.modelData && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: anomaly.modelData.color }}
                        />
                      )}
                      <span className="font-medium text-white">{anomaly.title}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      anomaly.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                      anomaly.severity === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {anomaly.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{anomaly.description}</p>
                  <div className="p-2 rounded bg-black/30 text-xs text-gray-300">
                    <span className="text-gray-500">Insight:</span> {anomaly.insight}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Recommendations */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
        <h4 className="text-sm font-medium text-emerald-400 mb-3">Recommendations</h4>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400">1.</span>
            <span>
              Add explicit format instructions: &quot;Return percentage as a number between 0-100, not as a decimal&quot;
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400">2.</span>
            <span>
              Consider domain-specific prompting for models with large bank/road gaps
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400">3.</span>
            <span>
              Models with high partial credits may benefit from chain-of-thought prompting to verify units
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400">4.</span>
            <span>
              For production use, prefer claude-opus-4.5 (61.3%) or qwen3-max (46.7%) for consistent performance
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
