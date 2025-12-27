'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Database, ArrowLeft, Upload, Play, MessageSquare, Code, CheckCircle, ChevronRight, FileSpreadsheet, Sparkles } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';

// Pre-computed demo examples
const demoExamples = [
  {
    id: 'sales',
    title: 'Sales Analysis',
    description: 'Quarterly revenue breakdown by region',
    csvPreview: `region,quarter,revenue,units
North,Q1,245000,1200
North,Q2,312000,1540
North,Q3,287000,1390
South,Q1,198000,980
South,Q2,234000,1150
...`,
    query: "What's the total revenue for the North region, and which quarter performed best?",
    conversation: [
      {
        role: 'assistant',
        type: 'thinking',
        content: "I'll analyze the sales data to find North region's total revenue and best quarter.",
      },
      {
        role: 'assistant',
        type: 'code',
        content: "north_data = df[df['region'] == 'North']\ntotal_revenue = north_data['revenue'].sum()\nbest_quarter = north_data.loc[north_data['revenue'].idxmax(), 'quarter']\nprint(f'Total: ${total_revenue:,}, Best: {best_quarter}')",
      },
      {
        role: 'system',
        type: 'result',
        content: 'Total: $844,000, Best: Q2',
      },
      {
        role: 'assistant',
        type: 'answer',
        content: "The North region generated $844,000 in total revenue. Q2 was the best performing quarter with $312,000 in revenue.",
      },
    ],
    finalAnswer: '$844,000 total, Q2 best ($312k)',
  },
  {
    id: 'customers',
    title: 'Customer Segmentation',
    description: 'Subscription rates by demographics',
    csvPreview: `age,job,balance,subscribed
34,management,2500,yes
28,technician,1200,no
45,admin,4500,yes
52,retired,8900,yes
...`,
    query: "What's the subscription rate for customers with balance in the top 25%?",
    conversation: [
      {
        role: 'assistant',
        type: 'thinking',
        content: "I need to find the top 25% by balance and calculate their subscription rate.",
      },
      {
        role: 'assistant',
        type: 'code',
        content: "q75 = df['balance'].quantile(0.75)\ntop_25 = df[df['balance'] >= q75]\nsub_rate = (top_25['subscribed'] == 'yes').mean() * 100\nprint(f'{sub_rate:.2f}%')",
      },
      {
        role: 'system',
        type: 'result',
        content: '18.45%',
      },
      {
        role: 'assistant',
        type: 'answer',
        content: "The subscription rate for customers with balance in the top 25% (Q4) is 18.45%.",
      },
    ],
    finalAnswer: '18.45%',
  },
  {
    id: 'inventory',
    title: 'Inventory Optimization',
    description: 'Stock levels and reorder analysis',
    csvPreview: `product,category,stock,reorder_point,daily_sales
Widget A,Electronics,450,100,25
Widget B,Electronics,85,100,30
Gadget X,Home,200,50,15
Gadget Y,Home,45,50,20
...`,
    query: "Which products are below reorder point and what's the average days until stockout?",
    conversation: [
      {
        role: 'assistant',
        type: 'thinking',
        content: "I'll identify products below reorder point and calculate days until stockout.",
      },
      {
        role: 'assistant',
        type: 'code',
        content: "below_reorder = df[df['stock'] < df['reorder_point']]\nbelow_reorder['days_to_stockout'] = below_reorder['stock'] / below_reorder['daily_sales']\nproducts = below_reorder['product'].tolist()\navg_days = below_reorder['days_to_stockout'].mean()\nprint(f'Products: {products}, Avg days: {avg_days:.1f}')",
      },
      {
        role: 'system',
        type: 'result',
        content: "Products: ['Widget B', 'Gadget Y'], Avg days: 2.5",
      },
      {
        role: 'assistant',
        type: 'answer',
        content: "Widget B and Gadget Y are below their reorder points. On average, these products have 2.5 days until stockout at current sales rates.",
      },
    ],
    finalAnswer: '2 products, 2.5 days avg to stockout',
  },
];

function ConversationMessage({ message }: { message: { role: string; type: string; content: string } }) {
  if (message.type === 'thinking') {
    return (
      <div className="flex gap-3 py-3">
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-purple-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-purple-400 mb-1">Thinking...</p>
          <p className="text-sm text-gray-300 italic">{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.type === 'code') {
    return (
      <div className="flex gap-3 py-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <Code className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-blue-400 mb-1">Running Python...</p>
          <pre className="text-sm text-gray-300 bg-black/50 p-3 rounded-lg overflow-x-auto font-mono">
            {message.content}
          </pre>
        </div>
      </div>
    );
  }

  if (message.type === 'result') {
    return (
      <div className="flex gap-3 py-3">
        <div className="w-8 h-8 rounded-lg bg-gray-500/20 flex items-center justify-center flex-shrink-0">
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-400 mb-1">Result</p>
          <code className="text-sm text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">{message.content}</code>
        </div>
      </div>
    );
  }

  if (message.type === 'answer') {
    return (
      <div className="flex gap-3 py-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-emerald-400 mb-1">Final Answer</p>
          <p className="text-sm text-white">{message.content}</p>
        </div>
      </div>
    );
  }

  return null;
}

export default function DemoPage() {
  const [selectedExample, setSelectedExample] = useState(demoExamples[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visibleMessages, setVisibleMessages] = useState(0);

  const playDemo = () => {
    setIsPlaying(true);
    setVisibleMessages(0);

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleMessages(i);
      if (i >= selectedExample.conversation.length) {
        clearInterval(interval);
        setIsPlaying(false);
      }
    }, 1500);
  };

  const selectExample = (example: typeof demoExamples[0]) => {
    setSelectedExample(example);
    setVisibleMessages(0);
    setIsPlaying(false);
  };

  return (
    <div className="theme-page">
      {/* Grid background */}
      <div className="fixed inset-0 theme-grid-bg" style={{
        backgroundImage: `linear-gradient(rgba(168, 85, 247, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.5) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />

      {/* Header */}
      <header className="relative border-b theme-header border-purple-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight">
                    <span className="text-emerald-500">Code</span>
                    <span className="theme-text-primary">Blue</span>
                  </h1>
                </div>
              </Link>
              <span className="theme-text-muted">|</span>
              <span className="text-purple-500 font-medium">CSV Analytics Demo</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 text-sm theme-text-secondary hover:text-purple-500 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-500 text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            Interactive Demo
          </div>
          <h1 className="text-4xl font-bold mb-4">
            <span className="theme-text-primary">Natural Language </span>
            <span className="text-purple-500">CSV Analytics</span>
          </h1>
          <p className="theme-text-secondary max-w-2xl mx-auto">
            See how our fine-tuned model analyzes data through multi-turn conversations.
            Select an example and watch the agent work through the problem.
          </p>
        </div>

        {/* Example Selector */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {demoExamples.map((example) => (
            <button
              key={example.id}
              onClick={() => selectExample(example)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all flex-shrink-0 ${
                selectedExample.id === example.id
                  ? 'bg-purple-500/20 border-purple-500/40 theme-text-primary'
                  : 'theme-card border theme-text-secondary hover:border-purple-500/30'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5" />
              <div className="text-left">
                <p className="font-medium text-sm">{example.title}</p>
                <p className="text-xs opacity-60">{example.description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Data Preview */}
          <div className="space-y-6">
            {/* CSV Preview */}
            <div className="p-6 rounded-2xl theme-card border light-shadow">
              <div className="flex items-center gap-2 mb-4">
                <FileSpreadsheet className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-bold theme-text-primary">Data Preview</h3>
              </div>
              <pre className="text-sm theme-text-secondary bg-black/20 dark:bg-black/50 p-4 rounded-lg overflow-x-auto font-mono">
                {selectedExample.csvPreview}
              </pre>
            </div>

            {/* Query */}
            <div className="p-6 rounded-2xl theme-card border light-shadow">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-bold theme-text-primary">Query</h3>
              </div>
              <p className="theme-text-secondary bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                &ldquo;{selectedExample.query}&rdquo;
              </p>

              <button
                onClick={playDemo}
                disabled={isPlaying}
                className={`mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors ${
                  isPlaying
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
              >
                <Play className="w-4 h-4" />
                {isPlaying ? 'Running...' : 'Run Analysis'}
              </button>
            </div>
          </div>

          {/* Right: Conversation */}
          <div className="p-6 rounded-2xl theme-card border light-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-bold theme-text-primary">Agent Response</h3>
              </div>
              {visibleMessages === selectedExample.conversation.length && (
                <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Complete</span>
              )}
            </div>

            <div className="min-h-[400px] space-y-2">
              {visibleMessages === 0 ? (
                <div className="flex items-center justify-center h-[400px] theme-text-muted">
                  <div className="text-center">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Click &ldquo;Run Analysis&rdquo; to see the agent work</p>
                  </div>
                </div>
              ) : (
                selectedExample.conversation.slice(0, visibleMessages).map((msg, i) => (
                  <ConversationMessage key={i} message={msg} />
                ))
              )}

              {isPlaying && (
                <div className="flex items-center gap-2 text-purple-500 text-sm animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  Processing...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 light-shadow">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-5 h-5 text-purple-500" />
                <span className="text-purple-500 font-medium">Coming Soon</span>
              </div>
              <h2 className="text-2xl font-bold theme-text-primary mb-2">Upload Your Own CSV</h2>
              <p className="theme-text-secondary">
                Live inference is coming soon. Upload your data and get instant analytics powered by our fine-tuned model.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/finetune"
                className="flex items-center gap-2 px-6 py-3 rounded-xl theme-card border theme-text-secondary font-semibold hover:border-purple-500/50 transition-colors"
              >
                View Fine-tuning Results
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
