'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    Trophy,
    Swords,
    Bug,
    BrainCircuit,
    Check,
    X,
    ArrowRight,
    RefreshCw,
    Play,
    Zap
} from 'lucide-react';
import benchmarkDataRaw from '@/data/benchmark-data.json';

// --- Types ---
interface Example {
    example_id: number;
    task: string;
    reward: number;
    answer: string;
    info: { expected: number; level: string; task_id: string } | null;
    score_correctness: number;
    score_efficiency: number;
    generation_ms: number;
    prompt: Array<{ role: string; content: string }>;
    completion: Array<{ role: string; content: string }>;
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

// --- Sub-Components ---

function HumanVsMachine({ onComplete }: { onComplete: (score: number) => void }) {
    const [round, setRound] = useState(1);
    const [score, setScore] = useState(0);
    const [task, setTask] = useState<any>(null);
    const [modelA, setModelA] = useState<any>(null);
    const [modelB, setModelB] = useState<any>(null);
    const [revealed, setRevealed] = useState(false);
    const [selected, setSelected] = useState<'A' | 'B' | null>(null);

    // Pre-calculate task map (Same as before)
    const taskMap = useMemo(() => {
        const map = new Map<string, { model: ModelData, example: Example }[]>();
        benchmarkData.models.forEach(m => {
            m.examples.forEach(ex => {
                if (!ex.info?.task_id) return;
                const taskId = ex.info.task_id;
                if (!map.has(taskId)) map.set(taskId, []);
                map.get(taskId)?.push({ model: m, example: ex });
            });
        });
        const validTaskIds: string[] = [];
        map.forEach((list, id) => {
            const models = new Set(list.map(i => i.model.model));
            if (models.size >= 2) validTaskIds.push(id);
        });
        return { map, validTaskIds };
    }, []);

    const prepareRound = () => {
        if (taskMap.validTaskIds.length === 0) return;
        const taskId = taskMap.validTaskIds[Math.floor(Math.random() * taskMap.validTaskIds.length)];
        const candidates = taskMap.map.get(taskId)!;
        let retries = 0;
        while (retries < 20) {
            const c1 = candidates[Math.floor(Math.random() * candidates.length)];
            const c2 = candidates[Math.floor(Math.random() * candidates.length)];
            if (c1.model.model !== c2.model.model) {
                setTask(c1.example);
                setModelA(c1);
                setModelB(c2);
                setRevealed(false);
                setSelected(null);
                return;
            }
            retries++;
        }
    };

    useEffect(() => { if (taskMap.validTaskIds.length > 0) prepareRound(); }, [round, taskMap]);

    const handleVote = (vote: 'A' | 'B') => {
        setSelected(vote);
        setRevealed(true);
        const exA = modelA.example;
        const exB = modelB.example;
        let winner: 'A' | 'B' | 'Tie' = 'Tie';
        if (exA.score_correctness > exB.score_correctness) winner = 'A';
        else if (exB.score_correctness > exA.score_correctness) winner = 'B';
        else {
            if (exA.generation_ms < exB.generation_ms) winner = 'A';
            else if (exB.generation_ms < exA.generation_ms) winner = 'B';
            // If times are equal, winner stays 'Tie'
        }
        if (vote === winner || winner === 'Tie') setScore(s => s + 10);
    };

    const extractCode = (completion: any[]) => {
        const text = completion.map(c => c.content).join('\n');
        const codeMatch = text.match(/<code>([\s\S]*?)<\/code>/) || text.match(/```python([\s\S]*?)```/);
        return codeMatch ? codeMatch[1].trim() : text.slice(0, 300) + '...';
    };

    if (!task) return <div className="p-10 text-center text-gray-400">Loading Arena...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-black/20 p-4 rounded-lg">
                <div>
                    <h3 className="text-xl font-bold text-emerald-400">Round {round}/5</h3>
                    <p className="text-gray-400">Vote for the better solution</p>
                </div>
                <div className="text-2xl font-bold text-white">Score: {score}</div>
            </div>

            <div className="bg-black/30 p-6 rounded-lg border border-white/10">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Task</h4>
                <p className="text-lg text-white font-medium">
                    {task.prompt && task.prompt[1] ? task.prompt[1].content : "Task description not available"}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['A', 'B'].map((side) => {
                    const m = side === 'A' ? modelA : modelB;
                    const isSelected = selected === side;
                    const isWinner = revealed && (
                        (side === 'A' && m.example.score_correctness >= modelB.example.score_correctness) ||
                        (side === 'B' && m.example.score_correctness >= modelA.example.score_correctness)
                    );

                    return (
                        <div key={side} onClick={() => !revealed && handleVote(side as 'A' | 'B')}
                            className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${!revealed ? 'border-white/10 hover:border-emerald-500/50 hover:bg-black/20' : isSelected ? isWinner ? 'border-emerald-500 bg-emerald-500/10' : 'border-red-500 bg-red-500/10' : isWinner ? 'border-emerald-500/50 opacity-60' : 'border-white/10 opacity-40'}`}
                        >
                            {revealed && <div className="absolute top-0 right-0 p-2 bg-black/50 rounded-bl-lg text-xs font-mono text-white">{m.model.name}</div>}
                            <div className="flex justify-between items-center mb-4">
                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center font-bold text-white">{side}</div>
                                {revealed && <div className={`font-bold ${m.example.score_correctness > 0.5 ? 'text-emerald-400' : 'text-red-400'}`}>{m.example.score_correctness > 0.5 ? 'Correct' : 'Failed'}</div>}
                            </div>
                            <div className="h-64 overflow-y-auto bg-black/40 rounded p-2 text-xs font-mono">
                                <pre className="text-xs font-mono text-emerald-100/80 whitespace-pre-wrap">{extractCode(m.example.completion)}</pre>
                            </div>
                        </div>
                    );
                })}
            </div>
            {revealed && (
                <div className="flex justify-center pt-4">
                    <button onClick={() => round < 5 ? setRound(r => r + 1) : onComplete(score)} className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-bold transition-all">
                        {round < 5 ? 'Next Round' : 'Finish Arena'} <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}

function DebugChallenge({ onComplete }: { onComplete: (score: number) => void }) {
    const [round, setRound] = useState(1);
    const [score, setScore] = useState(0);
    const [task, setTask] = useState<any>(null);
    const [revealed, setRevealed] = useState(false);
    const [userGuess, setUserGuess] = useState<'pass' | 'fail' | null>(null);

    const prepareRound = () => {
        const models = benchmarkData.models;
        const m = models[Math.floor(Math.random() * models.length)];
        if (!m.examples.length) return prepareRound(); // retry
        const ex = m.examples[Math.floor(Math.random() * m.examples.length)];

        setTask({ model: m, example: ex });
        setRevealed(false);
        setUserGuess(null);
    };

    useEffect(() => { prepareRound(); }, [round]);

    const handleGuess = (guess: 'pass' | 'fail') => {
        setUserGuess(guess);
        setRevealed(true);
        const passed = task.example.score_correctness > 0.9;
        const isCorrect = (guess === 'pass' && passed) || (guess === 'fail' && !passed);
        if (isCorrect) setScore(s => s + 20);
    };

    const extractCode = (completion: any[]) => {
        const text = completion.map(c => c.content).join('\n');
        const codeMatch = text.match(/<code>([\s\S]*?)<\/code>/) || text.match(/```python([\s\S]*?)```/);
        return codeMatch ? codeMatch[1].trim() : text.slice(0, 300) + '...';
    };

    if (!task) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-black/20 p-4 rounded-lg">
                <div>
                    <h3 className="text-xl font-bold text-amber-400">Debug Round {round}/5</h3>
                    <p className="text-gray-400">Will this code pass the test?</p>
                </div>
                <div className="text-2xl font-bold text-white">Score: {score}</div>
            </div>

            <div className="bg-black/30 p-6 rounded-lg border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded text-gray-300">Model: {task.model.name}</span>
                    <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded text-gray-300">Level: {task.example.info?.level || 'Unknown'}</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Task</h4>
                <p className="text-lg text-white font-medium">
                    {task.example.prompt && task.example.prompt[1] ? task.example.prompt[1].content : "Task description not available"}
                </p>
            </div>

            <div className="bg-black/40 rounded-xl border border-white/10 overflow-hidden">
                <div className="p-2 bg-gray-800/50 border-b border-white/10 text-xs text-gray-400 font-mono">Agency Execution Trace</div>
                <div className="p-4 overflow-x-auto">
                    <pre className="text-xs font-mono text-emerald-100/80 whitespace-pre-wrap">
                        {extractCode(task.example.completion)}
                    </pre>
                </div>
            </div>

            {!revealed ? (
                <div className="flex gap-4">
                    <button
                        onClick={() => handleGuess('pass')}
                        className="flex-1 bg-emerald-600/20 border border-emerald-500/50 hover:bg-emerald-600/40 p-6 rounded-xl flex flex-col items-center gap-2 transition-all group"
                    >
                        <Check className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="text-xl font-bold text-emerald-100">PASS</span>
                        <span className="text-sm text-emerald-400/70">Code is correct</span>
                    </button>
                    <button
                        onClick={() => handleGuess('fail')}
                        className="flex-1 bg-red-600/20 border border-red-500/50 hover:bg-red-600/40 p-6 rounded-xl flex flex-col items-center gap-2 transition-all group"
                    >
                        <X className="w-8 h-8 text-red-400 group-hover:scale-110 transition-transform" />
                        <span className="text-xl font-bold text-red-100">FAIL</span>
                        <span className="text-sm text-red-400/70">Contains bugs/errors</span>
                    </button>
                </div>
            ) : (
                <div className={`p-6 rounded-xl text-center border-2 ${(userGuess === 'pass' && task.example.score_correctness > 0.9) || (userGuess === 'fail' && task.example.score_correctness <= 0.9)
                    ? 'bg-emerald-500/20 border-emerald-500'
                    : 'bg-red-500/20 border-red-500'
                    }`}>
                    <div className="text-2xl font-bold mb-2 text-white">
                        {task.example.score_correctness > 0.9
                            ? "Correct! The code passed."
                            : "Failed! The code had issues."}
                    </div>
                    <p className="text-gray-300 mb-4">
                        Actual Score: {(task.example.score_correctness * 100).toFixed(0)}%
                    </p>
                    <button
                        onClick={() => round < 5 ? setRound(r => r + 1) : onComplete(score)}
                        className="px-8 py-2 text-white font-bold rounded-lg bg-white/10 hover:bg-white/20"
                    >
                        {round < 5 ? 'Next Task' : 'Finish'}
                    </button>
                </div>
            )}

        </div>
    );
}

function SpeedRun({ onComplete }: { onComplete: (score: number) => void }) {
    const [timeLeft, setTimeLeft] = useState(30);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [task, setTask] = useState<any>(null);
    const [gameOver, setGameOver] = useState(false);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

    const nextTask = () => {
        const models = benchmarkData.models;
        const m = models[Math.floor(Math.random() * models.length)];
        if (!m.examples.length) return nextTask();
        const ex = m.examples[Math.floor(Math.random() * m.examples.length)];
        setTask({ model: m, example: ex });
        setFeedback(null);
    };

    useEffect(() => { nextTask(); }, []);

    useEffect(() => {
        if (gameOver) return;
        const timer = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    setGameOver(true);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameOver]);

    const handleGuess = (guess: 'pass' | 'fail') => {
        if (gameOver) return;
        const passed = task.example.score_correctness > 0.9;
        const isCorrect = (guess === 'pass' && passed) || (guess === 'fail' && !passed);

        if (isCorrect) {
            setScore(s => s + 10 + (streak * 2));
            setStreak(s => s + 1);
            setFeedback('correct');
        } else {
            setStreak(0);
            setFeedback('wrong');
            setTimeLeft(t => Math.max(0, t - 5)); // Penalty!
        }
        setTimeout(nextTask, 300); // Quick transition
    };

    const extractCode = (completion: any[]) => {
        const text = completion.map(c => c.content).join('\n');
        const codeMatch = text.match(/<code>([\s\S]*?)<\/code>/) || text.match(/```python([\s\S]*?)```/);
        return codeMatch ? codeMatch[1].trim() : text.slice(0, 300) + '...';
    };

    if (!task) return <div>Loading...</div>;

    if (gameOver) {
        return (
            <div className="text-center py-20">
                <div className="text-6xl font-bold text-white mb-4">{score}</div>
                <div className="text-xl text-gray-400 mb-8">Final Score</div>
                <button onClick={() => onComplete(score)} className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-bold">Return to Menu</button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-black/20 p-4 rounded-lg">
                <div className="flex items-center gap-4">
                    <div className={`text-2xl font-mono font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>{timeLeft}s</div>
                    <div className="text-sm text-gray-400">Streak: <span className="text-white font-bold">{streak}</span></div>
                </div>
                <div className="text-2xl font-bold text-white">Score: {score}</div>
            </div>

            {/* Flash Feedback Overlay */}
            <div className={`relative transition-all ${feedback === 'correct' ? 'ring-4 ring-emerald-500' : feedback === 'wrong' ? 'ring-4 ring-red-500' : ''} rounded-xl`}>
                <div className="bg-black/40 rounded-xl border border-white/10 h-96 overflow-hidden relative">
                    <div className="p-2 bg-gray-800/50 border-b border-white/10 text-xs text-gray-400 flex justify-between">
                        <span className="font-mono">Snippet</span>
                        <span>{task.model.name}</span>
                    </div>
                    <div className="p-4 overflow-y-auto h-full pb-20">
                        <div className="text-sm text-gray-300 mb-4 font-bold border-l-2 border-emerald-500 pl-4">
                            {task.example.prompt[1]?.content}
                        </div>
                        <pre className="text-xs font-mono text-emerald-100/80 whitespace-pre-wrap pb-10">
                            {extractCode(task.example.completion)}
                        </pre>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 h-32">
                <button onClick={() => handleGuess('pass')} className="bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-xl flex flex-col items-center justify-center gap-2 group">
                    <Check className="w-8 h-8 text-emerald-400 group-hover:scale-125 transition-transform" />
                    <span className="font-bold text-emerald-400">PASS</span>
                </button>
                <button onClick={() => handleGuess('fail')} className="bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 rounded-xl flex flex-col items-center justify-center gap-2 group">
                    <X className="w-8 h-8 text-red-400 group-hover:scale-125 transition-transform" />
                    <span className="font-bold text-red-400">FAIL</span>
                </button>
            </div>
        </div>
    );
}

function PromptDetective({ onComplete }: { onComplete: (score: number) => void }) {
    const [round, setRound] = useState(1);
    const [score, setScore] = useState(0);
    const [task, setTask] = useState<any>(null);
    const [revealed, setRevealed] = useState(false);
    const [options, setOptions] = useState<string[]>([]);
    const [userChoice, setUserChoice] = useState<string | null>(null);

    const prepareRound = () => {
        const models = benchmarkData.models;
        const m = models[Math.floor(Math.random() * models.length)];
        if (!m.examples.length) return prepareRound();
        const ex = m.examples[Math.floor(Math.random() * m.examples.length)];

        const correctPrompt = ex.prompt[1]?.content;
        if (!correctPrompt || correctPrompt.length < 10) return prepareRound();

        // Get distractors from OTHER tasks
        const distractors: string[] = [];
        let retries = 0;
        while (distractors.length < 2 && retries < 50) {
            retries++;
            const rm = models[Math.floor(Math.random() * models.length)];
            const re = rm.examples[Math.floor(Math.random() * rm.examples.length)]; // Bug here: km is not defined, should be rm.examples
            const p = re.prompt[1]?.content;
            if (p && p !== correctPrompt && !distractors.includes(p)) {
                distractors.push(p);
            }
        }
        // Fallback
        if (distractors.length < 2) {
            distractors.push("Calculate the mean of column 'age' for 'admin' jobs.");
            distractors.push("Find the max balance for retired technician.");
        }

        const opts = [correctPrompt, ...distractors].sort(() => Math.random() - 0.5);

        setTask({ model: m, example: ex, correctPrompt });
        setOptions(opts);
        setRevealed(false);
        setUserChoice(null);
    };

    useEffect(() => { prepareRound(); }, [round]);

    const handleGuess = (opt: string) => {
        setUserChoice(opt);
        setRevealed(true);
        if (opt === task.correctPrompt) setScore(s => s + 20);
    };

    const extractCode = (completion: any[]) => {
        const text = completion.map(c => c.content).join('\n');
        const codeMatch = text.match(/<code>([\s\S]*?)<\/code>/) || text.match(/```python([\s\S]*?)```/);
        return codeMatch ? codeMatch[1].trim() : text.slice(0, 300) + '...';
    };

    if (!task) return <div>Loading Detective...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-black/20 p-4 rounded-lg">
                <div>
                    <h3 className="text-xl font-bold text-purple-400">Case {round}/5</h3>
                    <p className="text-gray-400">Which prompt triggered this code?</p>
                </div>
                <div className="text-2xl font-bold text-white">Score: {score}</div>
            </div>

            <div className="bg-black/40 rounded-xl border border-white/10 overflow-hidden">
                <div className="p-2 bg-gray-800/50 border-b border-white/10 text-xs text-gray-400 font-mono">Evidence (Code Trace)</div>
                <div className="p-4 overflow-x-auto">
                    <pre className="text-xs font-mono text-emerald-100/80 whitespace-pre-wrap">
                        {extractCode(task.example.completion)}
                    </pre>
                </div>
            </div>

            <div className="space-y-3">
                {options.map((opt, i) => {
                    const isCorrect = opt === task.correctPrompt;
                    const isSelected = userChoice === opt;

                    let bgClass = "bg-black/20 hover:bg-white/5 border-white/10";
                    if (revealed) {
                        if (isCorrect) bgClass = "bg-emerald-500/20 border-emerald-500 text-white";
                        else if (isSelected) bgClass = "bg-red-500/20 border-red-500 text-white";
                        else bgClass = "bg-black/20 opacity-30";
                    }

                    return (
                        <button
                            key={i}
                            disabled={revealed}
                            onClick={() => handleGuess(opt)}
                            className={`w-full p-4 rounded-xl border text-sm text-left transition-all ${bgClass}`}
                        >
                            <span className="mr-2 opacity-50 font-mono">0{i + 1}</span> {opt}
                        </button>
                    );
                })}
            </div>

            {revealed && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={() => round < 5 ? setRound(r => r + 1) : onComplete(score)}
                        className="flex items-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold transition-all"
                    >
                        {round < 5 ? 'Next Case' : 'Close Case'} <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}

function PredictMode({ onComplete }: { onComplete: (score: number) => void }) {
    const [round, setRound] = useState(1);
    const [score, setScore] = useState(0);
    const [task, setTask] = useState<any>(null);
    const [revealed, setRevealed] = useState(false);
    const [options, setOptions] = useState<string[]>([]);
    const [userChoice, setUserChoice] = useState<string | null>(null);
    const [blankedCode, setBlankedCode] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState('');

    const prepareRound = () => {
        const models = benchmarkData.models;
        let retries = 0;

        while (retries < 50) {
            retries++;
            const m = models[Math.floor(Math.random() * models.length)];
            if (!m.examples.length) continue;
            const ex = m.examples[Math.floor(Math.random() * m.examples.length)];

            // Extract prompt and code
            const prompt = ex.prompt[1]?.content || "";
            const code = extractCode(ex.completion);

            // Find candidates for blanking (strings/numbers in both prompt and code)
            // Regex to find 'quoted strings' or numbers
            const tokens = new Set([
                ...Array.from(prompt.matchAll(/'([^']+)'/g)).map(m => m[1]),
                ...Array.from(prompt.matchAll(/"([^"]+)"/g)).map(m => m[1]),
                ...Array.from(prompt.matchAll(/\b(\d+(\.\d+)?)\b/g)).map(m => m[1]),
            ]);

            // Filter keywords that appear in code
            const candidates = Array.from(tokens).filter(t => code.includes(t) && t.length > 1);

            if (candidates.length === 0) continue;

            const target = candidates[Math.floor(Math.random() * candidates.length)];

            // Generate distractors
            // 1. Other candidates
            // 2. Modified target
            // 3. Random strings
            const distractors = new Set<string>();
            candidates.forEach(c => { if (c !== target) distractors.add(c) });

            // Fallback distractors if we don't have enough
            const commonDistractors = ['mean', 'sum', 'count', '0', '1', 'True', 'False', 'date', 'total', 'sales'];
            while (distractors.size < 3) {
                distractors.add(commonDistractors[Math.floor(Math.random() * commonDistractors.length)]);
            }

            const opts = [target, ...Array.from(distractors).slice(0, 3)].sort(() => Math.random() - 0.5);

            setTask({ model: m, example: ex });
            setBlankedCode(code.replace(target, '_________'));
            setCorrectAnswer(target);
            setOptions(opts);
            setRevealed(false);
            setUserChoice(null);
            return;
        }
    };

    useEffect(() => { prepareRound(); }, [round]);

    const handleGuess = (opt: string) => {
        setUserChoice(opt);
        setRevealed(true);
        if (opt === correctAnswer) setScore(s => s + 30);
    };

    const extractCode = (completion: any[]) => {
        const text = completion.map(c => c.content).join('\n');
        const codeMatch = text.match(/<code>([\s\S]*?)<\/code>/) || text.match(/```python([\s\S]*?)```/);
        return codeMatch ? codeMatch[1].trim() : text.slice(0, 300) + '...';
    };

    if (!task) return <div>Loading Predictor...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-black/20 p-4 rounded-lg">
                <div>
                    <h3 className="text-xl font-bold text-purple-400">Predict Round {round}/5</h3>
                    <p className="text-gray-400">Fill in the blank to complete the logic</p>
                </div>
                <div className="text-2xl font-bold text-white">Score: {score}</div>
            </div>

            <div className="bg-black/30 p-6 rounded-lg border border-white/10">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Context (User Prompt)</h4>
                <p className="text-lg text-white font-medium">
                    {task.example.prompt && task.example.prompt[1] ? task.example.prompt[1].content : "Task description not available"}
                </p>
            </div>

            <div className="bg-black/40 rounded-xl border border-white/10 overflow-hidden">
                <div className="p-2 bg-gray-800/50 border-b border-white/10 text-xs text-gray-400 font-mono">Code Snippet (Cloze)</div>
                <div className="p-4 overflow-x-auto">
                    <pre className="text-xs font-mono text-emerald-100/80 whitespace-pre-wrap">
                        {blankedCode}
                    </pre>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {options.map((opt, i) => {
                    const isCorrect = opt === correctAnswer;
                    const isSelected = userChoice === opt;

                    let bgClass = "bg-black/20 hover:bg-gray-800 border-white/20";
                    if (revealed) {
                        if (isCorrect) bgClass = "bg-emerald-500/20 border-emerald-500 text-white";
                        else if (isSelected) bgClass = "bg-red-500/20 border-red-500 text-white";
                        else bgClass = "bg-black/20 opacity-50";
                    }

                    return (
                        <button
                            key={i}
                            disabled={revealed}
                            onClick={() => handleGuess(opt)}
                            className={`p-4 rounded-xl border font-mono text-lg font-bold transition-all ${bgClass}`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>

            {revealed && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={() => round < 5 ? setRound(r => r + 1) : onComplete(score)}
                        className="flex items-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold transition-all"
                    >
                        {round < 5 ? 'Next Round' : 'Finish Game'} <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}

// --- Main Layout ---

export default function TrainingGym() {
    const [mode, setMode] = useState<'menu' | 'human_vs_machine' | 'speed_run' | 'prompt_detective'>('menu');
    const [highScore, setHighScore] = useState(0);

    const handleComplete = (score: number) => {
        setHighScore(Math.max(highScore, score));
        setMode('menu');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20">
                            <Trophy className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">CodeBlue Gym</h1>
                            <p className="text-gray-400">Train your agentic intuition</p>
                        </div>
                    </div>
                    {highScore > 0 && (
                        <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 font-mono">
                            High Score: {highScore}
                        </div>
                    )}
                </div>

                {mode === 'menu' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button
                            onClick={() => setMode('human_vs_machine')}
                            className="relative group overflow-hidden bg-black/20 rounded-2xl p-8 border border-white/10 hover:border-emerald-500 transition-all text-left"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Swords className="w-32 h-32" />
                            </div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                                    <Swords className="w-6 h-6 text-blue-400" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Human vs Machine</h2>
                                <p className="text-gray-400 mb-6">Can you judge which agent wrote the better code? Blind A/B comparison.</p>
                                <span className="inline-flex items-center gap-2 text-emerald-400 font-bold group-hover:translate-x-1 transition-transform">
                                    Enter Arena <ArrowRight className="w-4 h-4" />
                                </span>
                            </div>
                        </button>

                        <button
                            onClick={() => setMode('speed_run')}
                            className="relative group overflow-hidden bg-black/20 rounded-2xl p-8 border border-white/10 hover:border-amber-500 transition-all text-left"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Zap className="w-32 h-32" />
                            </div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4">
                                    <Zap className="w-6 h-6 text-amber-400" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Speed Run</h2>
                                <p className="text-gray-400 mb-6">30 seconds. Infinite tasks. How fast can you spot the bugs? High intensity.</p>
                                <span className="inline-flex items-center gap-2 text-amber-400 font-bold group-hover:translate-x-1 transition-transform">
                                    Start Blitz <ArrowRight className="w-4 h-4" />
                                </span>
                            </div>
                        </button>

                        <button
                            onClick={() => setMode('prompt_detective')}
                            className="relative group overflow-hidden bg-black/20 rounded-2xl p-8 border border-white/10 hover:border-purple-500 transition-all text-left md:col-span-2"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <BrainCircuit className="w-32 h-32" />
                            </div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                                    <BrainCircuit className="w-6 h-6 text-purple-400" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Prompt Detective</h2>
                                <p className="text-gray-400 mb-6">Reverse Engineering. We show the code; you deducethe User Prompt that created it.</p>
                                <span className="inline-flex items-center gap-2 text-purple-400 font-bold group-hover:translate-x-1 transition-transform">
                                    Start Case <ArrowRight className="w-4 h-4" />
                                </span>
                            </div>
                        </button>
                    </div>
                )}

                {mode === 'human_vs_machine' && (
                    <div>
                        <button onClick={() => setMode('menu')} className="mb-4 text-gray-400 hover:text-white flex items-center gap-1">
                            <ArrowRight className="w-4 h-4 rotate-180" /> Back to Menu
                        </button>
                        <HumanVsMachine onComplete={handleComplete} />
                    </div>
                )}

                {mode === 'speed_run' && (
                    <div>
                        <button onClick={() => setMode('menu')} className="mb-4 text-gray-400 hover:text-white flex items-center gap-1">
                            <ArrowRight className="w-4 h-4 rotate-180" /> Back to Menu
                        </button>
                        <SpeedRun onComplete={handleComplete} />
                    </div>
                )}

                {mode === 'prompt_detective' && (
                    <div>
                        <button onClick={() => setMode('menu')} className="mb-4 text-gray-400 hover:text-white flex items-center gap-1">
                            <ArrowRight className="w-4 h-4 rotate-180" /> Back to Menu
                        </button>
                        <PromptDetective onComplete={handleComplete} />
                    </div>
                )}

            </div>
        </div>
    );
}
