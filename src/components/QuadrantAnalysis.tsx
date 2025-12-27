'use client';

import { useState } from 'react';

const models = [
  { id: "claude", name: "Claude", color: "#F59E0B", accuracy: 61.3, bank: 59.6, road: 66.7, reward: 0.578, time: 33.6, perfect: 52, zero: 32, L5: 66.7, L6: 56.7, partial: 2.7 },
  { id: "qwen3", name: "Qwen3", color: "#8B5CF6", accuracy: 46.7, bank: 40.4, road: 66.7, reward: 0.473, time: 22.8, perfect: 28, zero: 40, L5: 57.1, L6: 33.3, partial: 10.7 },
  { id: "mistral-l", name: "Mistral-L", color: "#EF4444", accuracy: 42.7, bank: 42.1, road: 44.4, reward: 0.424, time: 29.0, perfect: 20, zero: 32, L5: 47.6, L6: 40.0, partial: 2.7 },
  { id: "llama4", name: "Llama-4", color: "#06B6D4", accuracy: 36.0, bank: 38.6, road: 27.8, reward: 0.375, time: 20.7, perfect: 12, zero: 40, L5: 47.6, L6: 33.3, partial: 8.0 },
  { id: "mistral-s", name: "Mistral-S", color: "#F87171", accuracy: 34.7, bank: 36.8, road: 27.8, reward: 0.343, time: 27.7, perfect: 20, zero: 52, L5: 14.3, L6: 56.7, partial: 2.7 },
  { id: "gemini-pro", name: "Gemini-Pro", color: "#3B82F6", accuracy: 28.0, bank: 17.5, road: 61.1, reward: 0.294, time: 92.4, perfect: 20, zero: 64, L5: 38.1, L6: 0.0, partial: 18.7 },
  { id: "deepseek", name: "DeepSeek", color: "#10B981", accuracy: 12.0, bank: 12.3, road: 11.1, reward: 0.107, time: 65.7, perfect: 0, zero: 68, L5: 0.0, L6: 20.0, partial: 0 },
  { id: "intellect", name: "Intellect", color: "#EC4899", accuracy: 10.7, bank: 8.8, road: 16.7, reward: 0.101, time: 177.4, perfect: 0, zero: 80, L5: 4.8, L6: 13.3, partial: 2.7 },
  { id: "gemini-flash", name: "Gemini-Flash", color: "#60A5FA", accuracy: 5.3, bank: 1.8, road: 16.7, reward: 0.056, time: 43.7, perfect: 0, zero: 88, L5: 0.0, L6: 3.3, partial: 1.3 },
];

interface QuadrantChartProps {
  data: typeof models;
  xKey: keyof typeof models[0];
  yKey: keyof typeof models[0];
  xLabel: string;
  yLabel: string;
  xMid: number;
  yMid: number;
  xDomain?: [number, number];
  yDomain?: [number, number];
  invertX?: boolean;
  q1Label: string;
  q2Label: string;
  q3Label: string;
  q4Label: string;
  q1Color: string;
  q2Color: string;
  q3Color: string;
  q4Color: string;
  title: string;
}

const QuadrantChart = ({
  data,
  xKey,
  yKey,
  xLabel,
  yLabel,
  xMid,
  yMid,
  xDomain = [0, 100],
  yDomain = [0, 100],
  invertX = false,
  q1Label,
  q2Label,
  q3Label,
  q4Label,
  q1Color,
  q2Color,
  q3Color,
  q4Color,
  title,
}: QuadrantChartProps) => {
  const width = 500;
  const height = 400;
  const padding = { top: 40, right: 30, bottom: 50, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const scaleX = (val: number) => {
    const ratio = (val - xDomain[0]) / (xDomain[1] - xDomain[0]);
    return padding.left + (invertX ? (1 - ratio) : ratio) * chartW;
  };

  const scaleY = (val: number) => {
    const ratio = (val - yDomain[0]) / (yDomain[1] - yDomain[0]);
    return padding.top + (1 - ratio) * chartH;
  };

  const xMidPx = scaleX(xMid);
  const yMidPx = scaleY(yMid);

  return (
    <svg width={width} height={height} className="bg-gray-900 rounded-lg">
      {/* Quadrant backgrounds */}
      <rect
        x={invertX ? padding.left : xMidPx}
        y={padding.top}
        width={invertX ? xMidPx - padding.left : chartW - (xMidPx - padding.left)}
        height={yMidPx - padding.top}
        fill={q1Color}
        opacity={0.2}
      />
      <rect
        x={invertX ? xMidPx : padding.left}
        y={padding.top}
        width={invertX ? chartW - (xMidPx - padding.left) : xMidPx - padding.left}
        height={yMidPx - padding.top}
        fill={q2Color}
        opacity={0.2}
      />
      <rect
        x={invertX ? xMidPx : padding.left}
        y={yMidPx}
        width={invertX ? chartW - (xMidPx - padding.left) : xMidPx - padding.left}
        height={chartH - (yMidPx - padding.top)}
        fill={q3Color}
        opacity={0.2}
      />
      <rect
        x={invertX ? padding.left : xMidPx}
        y={yMidPx}
        width={invertX ? xMidPx - padding.left : chartW - (xMidPx - padding.left)}
        height={chartH - (yMidPx - padding.top)}
        fill={q4Color}
        opacity={0.2}
      />

      {/* Quadrant labels */}
      <text x={invertX ? padding.left + 10 : width - padding.right - 10} y={padding.top + 20}
        fill={q1Color} fontSize="10" fontWeight="bold" textAnchor={invertX ? "start" : "end"}>{q1Label}</text>
      <text x={invertX ? width - padding.right - 10 : padding.left + 10} y={padding.top + 20}
        fill={q2Color} fontSize="10" fontWeight="bold" textAnchor={invertX ? "end" : "start"}>{q2Label}</text>
      <text x={invertX ? width - padding.right - 10 : padding.left + 10} y={height - padding.bottom - 10}
        fill={q3Color} fontSize="10" fontWeight="bold" textAnchor={invertX ? "end" : "start"}>{q3Label}</text>
      <text x={invertX ? padding.left + 10 : width - padding.right - 10} y={height - padding.bottom - 10}
        fill={q4Color} fontSize="10" fontWeight="bold" textAnchor={invertX ? "start" : "end"}>{q4Label}</text>

      {/* Axes */}
      <line x1={padding.left} y1={yMidPx} x2={width - padding.right} y2={yMidPx} stroke="#6B7280" strokeWidth="2" strokeDasharray="4" />
      <line x1={xMidPx} y1={padding.top} x2={xMidPx} y2={height - padding.bottom} stroke="#6B7280" strokeWidth="2" strokeDasharray="4" />

      {/* Border */}
      <rect x={padding.left} y={padding.top} width={chartW} height={chartH} fill="none" stroke="#374151" strokeWidth="1" />

      {/* X axis labels */}
      <text x={padding.left} y={height - 15} fill="#9CA3AF" fontSize="10" textAnchor="start">{invertX ? xDomain[1] : xDomain[0]}</text>
      <text x={width - padding.right} y={height - 15} fill="#9CA3AF" fontSize="10" textAnchor="end">{invertX ? xDomain[0] : xDomain[1]}</text>
      <text x={width / 2} y={height - 5} fill="#9CA3AF" fontSize="11" textAnchor="middle">{xLabel}</text>

      {/* Y axis labels */}
      <text x={15} y={padding.top + 5} fill="#9CA3AF" fontSize="10" textAnchor="start">{yDomain[1]}</text>
      <text x={15} y={height - padding.bottom} fill="#9CA3AF" fontSize="10" textAnchor="start">{yDomain[0]}</text>
      <text x={15} y={height / 2} fill="#9CA3AF" fontSize="11" textAnchor="start" transform={`rotate(-90, 15, ${height / 2})`}>{yLabel}</text>

      {/* Title */}
      <text x={width / 2} y={20} fill="#F3F4F6" fontSize="14" fontWeight="bold" textAnchor="middle">{title}</text>

      {/* Data points */}
      {data.map((d, i) => {
        const xVal = d[xKey] as number;
        const yVal = d[yKey] as number;
        const x = scaleX(xVal);
        const y = scaleY(yVal);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={8} fill={d.color} stroke="#fff" strokeWidth="2" />
            <text x={x} y={y - 12} fill="#fff" fontSize="9" textAnchor="middle" fontWeight="bold">{d.name}</text>
          </g>
        );
      })}
    </svg>
  );
};

export default function QuadrantAnalysis() {
  const [activeQuadrant, setActiveQuadrant] = useState('speed-accuracy');

  const quadrants = [
    { id: 'speed-accuracy', label: 'Speed × Accuracy' },
    { id: 'bank-road', label: 'Bank × Road' },
    { id: 'consistency-accuracy', label: 'Consistency × Accuracy' },
    { id: 'reward-time', label: 'Reward × Time' },
    { id: 'l5-l6', label: 'L5 × L6 Difficulty' },
    { id: 'partial-accuracy', label: 'Partial × Accuracy' },
  ];

  return (
    <div className="space-y-4">
      {/* Quadrant selector */}
      <div className="flex flex-wrap gap-2">
        {quadrants.map(q => (
          <button
            key={q.id}
            onClick={() => setActiveQuadrant(q.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeQuadrant === q.id
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-black/30 text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Quadrant Charts */}
      <div className="flex justify-center">
        {activeQuadrant === 'speed-accuracy' && (
          <div>
            <QuadrantChart
              data={models}
              xKey="time"
              yKey="accuracy"
              xLabel="← Faster | Generation Time (s) | Slower →"
              yLabel="Accuracy %"
              xMid={60}
              yMid={30}
              xDomain={[0, 200]}
              yDomain={[0, 70]}
              invertX={true}
              q1Label="ELITE"
              q2Label="THOROUGH"
              q3Label="QUICK"
              q4Label="STRUGGLING"
              q1Color="#22C55E"
              q2Color="#3B82F6"
              q3Color="#EAB308"
              q4Color="#EF4444"
              title="Speed vs Accuracy"
            />
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs max-w-lg mx-auto">
              <div className="bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                <span className="text-emerald-400 font-bold">ELITE:</span>
                <span className="text-gray-300"> Claude, Qwen3, Mistral-L, Llama-4</span>
                <p className="text-gray-500 mt-1">Fast + Accurate</p>
              </div>
              <div className="bg-red-500/10 p-2 rounded border border-red-500/20">
                <span className="text-red-400 font-bold">STRUGGLING:</span>
                <span className="text-gray-300"> Intellect, DeepSeek, Gemini-Pro</span>
                <p className="text-gray-500 mt-1">Slow + Inaccurate</p>
              </div>
            </div>
          </div>
        )}

        {activeQuadrant === 'bank-road' && (
          <div>
            <QuadrantChart
              data={models}
              xKey="bank"
              yKey="road"
              xLabel="Bank Accuracy %"
              yLabel="Road Accuracy %"
              xMid={30}
              yMid={35}
              xDomain={[0, 70]}
              yDomain={[0, 70]}
              q1Label="ALL-ROUNDER"
              q2Label="ROAD SPECIALIST"
              q3Label="WEAK"
              q4Label="BANK SPECIALIST"
              q1Color="#22C55E"
              q2Color="#3B82F6"
              q3Color="#EF4444"
              q4Color="#EAB308"
              title="Bank vs Road Performance"
            />
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs max-w-lg mx-auto">
              <div className="bg-blue-500/10 p-2 rounded border border-blue-500/20">
                <span className="text-blue-400 font-bold">ROAD SPECIALIST:</span>
                <span className="text-gray-300"> Gemini-Pro (+43.6%!)</span>
                <p className="text-gray-500 mt-1">17.5% bank but 61.1% road</p>
              </div>
              <div className="bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                <span className="text-yellow-400 font-bold">BANK SPECIALIST:</span>
                <span className="text-gray-300"> Llama-4, Mistral-S</span>
                <p className="text-gray-500 mt-1">Better at structured data</p>
              </div>
            </div>
          </div>
        )}

        {activeQuadrant === 'consistency-accuracy' && (
          <div>
            <QuadrantChart
              data={models}
              xKey="perfect"
              yKey="accuracy"
              xLabel="Perfect Task Rate (3/3) %"
              yLabel="Overall Accuracy %"
              xMid={25}
              yMid={30}
              xDomain={[0, 60]}
              yDomain={[0, 70]}
              q1Label="RELIABLE"
              q2Label="LUCKY"
              q3Label="UNPREDICTABLE"
              q4Label="CONSISTENT"
              q1Color="#22C55E"
              q2Color="#8B5CF6"
              q3Color="#EF4444"
              q4Color="#EAB308"
              title="Consistency vs Accuracy"
            />
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs max-w-lg mx-auto">
              <div className="bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                <span className="text-emerald-400 font-bold">RELIABLE:</span>
                <span className="text-gray-300"> Claude (52% perfect, 61% acc)</span>
                <p className="text-gray-500 mt-1">Consistently correct</p>
              </div>
              <div className="bg-purple-500/10 p-2 rounded border border-purple-500/20">
                <span className="text-purple-400 font-bold">LUCKY:</span>
                <span className="text-gray-300"> Qwen3 (28% perfect, 47% acc)</span>
                <p className="text-gray-500 mt-1">High acc but inconsistent</p>
              </div>
            </div>
          </div>
        )}

        {activeQuadrant === 'reward-time' && (
          <div>
            <QuadrantChart
              data={models}
              xKey="time"
              yKey="reward"
              xLabel="← Faster | Generation Time (s) | Slower →"
              yLabel="Reward Score"
              xMid={60}
              yMid={0.3}
              xDomain={[0, 200]}
              yDomain={[0, 0.7]}
              invertX={true}
              q1Label="BEST VALUE"
              q2Label="PREMIUM"
              q3Label="BUDGET"
              q4Label="POOR VALUE"
              q1Color="#22C55E"
              q2Color="#3B82F6"
              q3Color="#EAB308"
              q4Color="#EF4444"
              title="Reward vs Time (Value)"
            />
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs max-w-lg mx-auto">
              <div className="bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                <span className="text-emerald-400 font-bold">BEST VALUE:</span>
                <span className="text-gray-300"> Claude, Qwen3, Mistral-L</span>
                <p className="text-gray-500 mt-1">High reward, reasonable time</p>
              </div>
              <div className="bg-red-500/10 p-2 rounded border border-red-500/20">
                <span className="text-red-400 font-bold">POOR VALUE:</span>
                <span className="text-gray-300"> Intellect (177s, 0.10)</span>
                <p className="text-gray-500 mt-1">Long wait, low return</p>
              </div>
            </div>
          </div>
        )}

        {activeQuadrant === 'l5-l6' && (
          <div>
            <QuadrantChart
              data={models}
              xKey="L5"
              yKey="L6"
              xLabel="L5 (Medium) %"
              yLabel="L6 (Hard) %"
              xMid={35}
              yMid={30}
              xDomain={[0, 80]}
              yDomain={[0, 70]}
              q1Label="SCALES WELL"
              q2Label="HARD SPECIALIST"
              q3Label="WEAK"
              q4Label="DROPS ON HARD"
              q1Color="#22C55E"
              q2Color="#8B5CF6"
              q3Color="#EF4444"
              q4Color="#F97316"
              title="Difficulty Scaling (L5 vs L6)"
            />
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs max-w-lg mx-auto">
              <div className="bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                <span className="text-emerald-400 font-bold">SCALES WELL:</span>
                <span className="text-gray-300"> Claude (67%→57%)</span>
                <p className="text-gray-500 mt-1">Maintains on hard tasks</p>
              </div>
              <div className="bg-orange-500/10 p-2 rounded border border-orange-500/20">
                <span className="text-orange-400 font-bold">CRASHES:</span>
                <span className="text-gray-300"> Gemini-Pro (38%→0%!)</span>
                <p className="text-gray-500 mt-1">Fails completely on L6</p>
              </div>
            </div>
            <div className="mt-2 p-2 bg-purple-500/10 rounded border border-purple-500/20 text-xs max-w-lg mx-auto">
              <span className="text-purple-400 font-bold">ANOMALY:</span>
              <span className="text-gray-300"> Mistral-S: L5=14% but L6=57%!</span>
              <p className="text-gray-500 mt-1">Better at HARD than medium — task-type affinity</p>
            </div>
          </div>
        )}

        {activeQuadrant === 'partial-accuracy' && (
          <div>
            <QuadrantChart
              data={models}
              xKey="partial"
              yKey="accuracy"
              xLabel="Partial Score Rate %"
              yLabel="Official Accuracy %"
              xMid={8}
              yMid={30}
              xDomain={[0, 25]}
              yDomain={[0, 70]}
              q1Label="PRECISE"
              q2Label="PENALIZED"
              q3Label="WRONG"
              q4Label="ALMOST"
              q1Color="#22C55E"
              q2Color="#3B82F6"
              q3Color="#EF4444"
              q4Color="#EAB308"
              title="Partial Scores Impact"
            />
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs max-w-lg mx-auto">
              <div className="bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                <span className="text-emerald-400 font-bold">PRECISE:</span>
                <span className="text-gray-300"> Claude (2.7% partial)</span>
                <p className="text-gray-500 mt-1">When correct, it's exact</p>
              </div>
              <div className="bg-blue-500/10 p-2 rounded border border-blue-500/20">
                <span className="text-blue-400 font-bold">PENALIZED:</span>
                <span className="text-gray-300"> Gemini-Pro (18.7%!)</span>
                <p className="text-gray-500 mt-1">Would be 47% if partials counted</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-3 rounded-xl bg-black/30 border border-white/10">
        <h3 className="text-xs font-medium text-gray-400 mb-2">Model Legend</h3>
        <div className="flex flex-wrap gap-3">
          {models.map(m => (
            <div key={m.id} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
              <span className="text-xs text-gray-400">{m.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
