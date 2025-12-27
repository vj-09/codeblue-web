'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Layers } from 'lucide-react';
import final25DataRaw from '@/data/final25-data.json';

interface TemplateStats {
  template: string;
  tasks: number;
  correct: number;
  total: number;
  pct: number;
}

interface TaskData {
  id: string;
  dataset: string;
  level: string;
  template: string;
  goal: string;
}

interface Final25Data {
  templateStats: TemplateStats[];
  tasks: TaskData[];
}

const final25Data = final25DataRaw as Final25Data;

// Template descriptions
const templateDescriptions: Record<string, string> = {
  'percentile_cohort': 'Filter by percentile ranges (e.g., top 90% AND bottom 10%)',
  'chain_conversion': 'Find extrema then compute metric on that subset',
  'multi_condition_filter': 'Filter by multiple conditions with quartile ranges',
  'nested_extrema': 'Find group by one metric, compute another metric within',
  'segment_volatility': 'Compute std/mean ratio across segments',
  'top_n_in_segment': 'Find segments above threshold in a metric',
  'ranked_anomaly': 'Rank groups and find anomalies in bottom/top N',
  'segment_improvement_potential': 'Calculate potential gain from improving segments',
  'quartile_conversion': 'Bin into quartiles and compute metric in one bin',
  'metric_breakdown': 'Group by category and show count/mean breakdown',
  'count_segment_total': 'Count and sum by category',
  'continuous_segment_breakdown': 'Average of continuous metric by category',
  'continuous_quartile_analysis': 'Quartile binning with continuous target',
  'continuous_comparison': 'Compare metric between two category values',
};

// Difficulty colors
const getDifficultyColor = (pct: number) => {
  if (pct >= 50) return '#10B981'; // emerald
  if (pct >= 30) return '#F59E0B'; // amber
  if (pct >= 15) return '#F97316'; // orange
  return '#EF4444'; // red
};

export default function TemplateAnalysis() {
  const chartData = useMemo(() => {
    return final25Data.templateStats.map(t => ({
      ...t,
      name: t.template.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      shortName: t.template.length > 15 ? t.template.slice(0, 15) + '...' : t.template,
    }));
  }, []);

  // Group tasks by template
  const tasksByTemplate = useMemo(() => {
    const groups: Record<string, TaskData[]> = {};
    for (const task of final25Data.tasks) {
      if (!groups[task.template]) groups[task.template] = [];
      groups[task.template].push(task);
    }
    return groups;
  }, []);

  // Compute level distribution per template
  const levelDistribution = useMemo(() => {
    const dist: Record<string, Record<string, number>> = {};
    for (const [template, tasks] of Object.entries(tasksByTemplate)) {
      dist[template] = {};
      for (const task of tasks) {
        dist[template][task.level] = (dist[template][task.level] || 0) + 1;
      }
    }
    return dist;
  }, [tasksByTemplate]);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-black/30 border border-white/10">
          <div className="text-2xl font-bold text-emerald-400">{chartData.length}</div>
          <div className="text-sm text-gray-500">Task Templates</div>
        </div>
        <div className="p-4 rounded-xl bg-black/30 border border-white/10">
          <div className="text-2xl font-bold text-red-400">
            {chartData.filter(t => t.pct < 20).length}
          </div>
          <div className="text-sm text-gray-500">Hard Templates (&lt;20%)</div>
        </div>
        <div className="p-4 rounded-xl bg-black/30 border border-white/10">
          <div className="text-2xl font-bold text-yellow-400">
            {chartData.filter(t => t.pct >= 20 && t.pct < 50).length}
          </div>
          <div className="text-sm text-gray-500">Medium Templates</div>
        </div>
        <div className="p-4 rounded-xl bg-black/30 border border-white/10">
          <div className="text-2xl font-bold text-green-400">
            {chartData.filter(t => t.pct >= 50).length}
          </div>
          <div className="text-sm text-gray-500">Easy Templates (&gt;50%)</div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="p-4 rounded-xl bg-black/30 border border-white/10">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Accuracy by Template Type</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                stroke="#6B7280"
              />
              <YAxis
                dataKey="template"
                type="category"
                width={110}
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                tickFormatter={(v: string) => v.replace(/_/g, ' ').slice(0, 18)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                }}
formatter={(value) => {
                  if (typeof value === 'number') {
                    return [`${value.toFixed(1)}%`, 'Accuracy'];
                  }
                  return [String(value), 'Accuracy'];
                }}
                labelFormatter={(label: string) => label.replace(/_/g, ' ')}
              />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getDifficultyColor(entry.pct)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Template Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {chartData.map(template => (
          <div
            key={template.template}
            className="p-4 rounded-xl bg-black/30 border border-white/10 hover:border-white/20 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="text-white font-medium">{template.name}</h4>
                <div className="text-xs text-gray-500 mt-1">
                  {template.tasks} tasks ({template.correct}/{template.total} attempts correct)
                </div>
              </div>
              <div
                className="px-3 py-1 rounded-lg text-sm font-mono"
                style={{
                  backgroundColor: `${getDifficultyColor(template.pct)}20`,
                  color: getDifficultyColor(template.pct)
                }}
              >
                {template.pct.toFixed(1)}%
              </div>
            </div>

            <p className="text-sm text-gray-400 mb-3">
              {templateDescriptions[template.template] || 'Complex analytical reasoning task'}
            </p>

            {/* Level Distribution */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Levels:</span>
              {['L4', 'L5', 'L6'].map(level => {
                const count = levelDistribution[template.template]?.[level] || 0;
                if (count === 0) return null;
                return (
                  <span
                    key={level}
                    className={`px-2 py-0.5 rounded text-xs ${
                      level === 'L6' ? 'bg-red-500/20 text-red-400' :
                      level === 'L5' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {level}: {count}
                  </span>
                );
              })}
            </div>

            {/* Sample Tasks */}
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="text-xs text-gray-500 mb-2">Sample Tasks:</div>
              <div className="flex flex-wrap gap-1">
                {tasksByTemplate[template.template]?.slice(0, 3).map(task => (
                  <span
                    key={task.id}
                    className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-400 font-mono"
                  >
                    {task.id}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
        <h4 className="text-sm font-medium text-purple-400 mb-3">Key Insights</h4>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-red-400">1.</span>
            <span>
              <strong className="text-red-400">percentile_cohort</strong> tasks are hardest ({chartData.find(t => t.template === 'percentile_cohort')?.pct.toFixed(1)}% accuracy) -
              models struggle with compound percentile conditions
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-400">2.</span>
            <span>
              <strong className="text-orange-400">segment_volatility</strong> and <strong className="text-orange-400">ranked_anomaly</strong> require multi-step reasoning
              that challenges most models
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400">3.</span>
            <span>
              <strong className="text-emerald-400">metric_breakdown</strong> and <strong className="text-emerald-400">count_segment_total</strong> are
              simpler aggregation tasks with higher success rates
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
