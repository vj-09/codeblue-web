import Link from "next/link";
import { Database, TrendingUp, Upload, ArrowRight, Github, BarChart3, Zap, Brain } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100">
      {/* Grid background */}
      <div className="fixed inset-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.5) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />

      {/* Header */}
      <header className="relative border-b border-emerald-500/20 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  <span className="text-emerald-400">Code</span>
                  <span className="text-white">Blue</span>
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/benchmark" className="text-sm text-gray-400 hover:text-white transition-colors">
                Benchmark
              </Link>
              <Link href="/finetune" className="text-sm text-gray-400 hover:text-white transition-colors">
                Fine-tune
              </Link>
              <Link href="/demo" className="text-sm text-gray-400 hover:text-white transition-colors">
                Demo
              </Link>

              <a href="https://github.com/vj-09/codeblue-env" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm hover:bg-emerald-500/20 transition-colors">
                <Github className="w-4 h-4" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm mb-8">
          <Zap className="w-4 h-4" />
          Open-source benchmark for analytics agents
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
          <span className="text-white">Evaluate. </span>
          <span className="text-emerald-400">Improve. </span>
          <span className="text-white">Deploy.</span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          CodeBlue is a comprehensive benchmark for evaluating LLM agents on data analytics tasks.
          Multi-turn conversations, complex joins, and adversarial challenges.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/benchmark" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors">
            View Leaderboard
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="https://github.com/vj-09/codeblue-env" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-semibold hover:bg-white/10 transition-colors">
            <Github className="w-4 h-4" />
            Star on GitHub
          </a>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
          {[
            { value: "25", label: "Hard Tasks" },
            { value: "675", label: "Eval Runs" },
            { value: "9", label: "Models Tested" },
            { value: "2", label: "Datasets" },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-xl bg-black/20 border border-white/10">
              <p className="text-2xl font-bold text-emerald-400 font-mono">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Three Products */}
      <section className="relative max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-white mb-4">Three Core Products</h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          From benchmarking to deployment, CodeBlue covers the full lifecycle of analytics agents.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Product 1: Benchmark */}
          <Link href="/benchmark" className="group p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Agentic Benchmark</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Comprehensive leaderboard comparing models on analytics tasks. Cost vs performance,
              quadrant analysis, and category breakdowns.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium group-hover:gap-3 transition-all">
              View Leaderboard <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Product 2: Fine-tuning */}
          <Link href="/finetune" className="group p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 hover:border-blue-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Fine-tuning Gains</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              See how our environment improves open-source models. Before/after comparisons
              with percentage improvements and training details.
            </p>
            <div className="flex items-center gap-2 text-blue-400 text-sm font-medium group-hover:gap-3 transition-all">
              View Results <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Product 3: Demo */}
          <Link href="/demo" className="group p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 hover:border-purple-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">CSV Analytics</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Upload your CSV and get instant analytics. Powered by our fine-tuned model.
              See natural language queries turn into insights.
            </p>
            <div className="flex items-center gap-2 text-purple-400 text-sm font-medium group-hover:gap-3 transition-all">
              Try Demo <ArrowRight className="w-4 h-4" />
            </div>
          </Link>


        </div>
      </section>

      {/* How It Works */}
      <section className="relative max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-white mb-12">How CodeBlue Works</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Multi-Turn Conversations", desc: "Agents explore data iteratively, saving notes and building context across turns." },
            { step: "02", title: "Weighted Scoring (80-10-10)", desc: "80% correctness, 10% efficiency, 10% token cost. Partial credit for close answers." },
            { step: "03", title: "Adversarial Testing", desc: "Prompt injections, ambiguous queries, and edge cases that catch failures others miss." },
          ].map((item, i) => (
            <div key={i} className="relative">
              <div className="text-6xl font-bold text-emerald-500/20 absolute -top-4 -left-2">{item.step}</div>
              <div className="relative pt-8">
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative max-w-7xl mx-auto px-6 py-16">
        <div className="p-8 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 text-center">
          <Brain className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Ready to evaluate your model?</h2>
          <p className="text-gray-400 mb-6">Submit your model to the leaderboard or run evaluations locally.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="https://github.com/vj-09/codeblue-env" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>CodeBlue © 2025 • Open-source benchmark for analytics agents</p>
            <div className="flex items-center gap-4">
              <a href="https://github.com/vj-09/codeblue-env" className="hover:text-emerald-400 transition-colors">GitHub</a>
              <Link href="/benchmark" className="hover:text-emerald-400 transition-colors">Leaderboard</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
