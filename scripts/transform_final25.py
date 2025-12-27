#!/usr/bin/env python3
"""
Transform benchmark_final_25 data into web UI format.

Reads:
- benchmark_final_25/final_25_results.json
- benchmark_final_25/final_25_tasks.jsonl
- benchmark_final_25/bank_rescored_c1/*.jsonl (for rollouts)
- benchmark_final_25/eval_logs/*/results.jsonl (for rollouts)

Outputs:
- src/data/final25-data.json
"""

import json
from pathlib import Path
from datetime import datetime
from collections import defaultdict

# Paths
BENCHMARK_DIR = Path(__file__).parent.parent.parent / "benchmark_final_25"
OUTPUT_FILE = Path(__file__).parent.parent / "src/data/final25-data.json"

# Final task IDs
BANK_19_IDS = {
    'bank_hard_001', 'bank_hard_005', 'bank_hard_012', 'bank_hard_019', 'bank_hard_020',
    'bank_hard_021', 'bank_hard_023', 'bank_hard_026', 'bank_hard_028', 'bank_hard_029',
    'bank_hard_030', 'bank_hard_031', 'bank_hard_033', 'bank_hard_035', 'bank_hard_038',
    'bank_hard_039', 'bank_hard_040', 'bank_hard_041', 'bank_hard_044'
}

ROAD_6_IDS = {
    'road_hard_002', 'road_hard_004', 'road_hard_007',
    'road_hard_014', 'road_hard_015', 'road_hard_021'
}

# Provider colors (matching BenchmarkCharts.tsx)
PROVIDER_COLORS = {
    'anthropic': '#8B5CF6',
    'qwen': '#10B981',
    'google': '#3B82F6',
    'openai': '#F59E0B',
    'deepseek': '#EC4899',
    'mistralai': '#F97316',
    'meta-llama': '#06B6D4',
    'x-ai': '#EF4444',
    'prime-intellect': '#A855F7',
}


def load_results():
    """Load model results from final_25_results.json."""
    with open(BENCHMARK_DIR / "final_25_results.json") as f:
        return json.load(f)


def load_tasks():
    """Load task definitions from final_25_tasks.jsonl."""
    tasks = []
    with open(BENCHMARK_DIR / "final_25_tasks.jsonl") as f:
        for line in f:
            task = json.loads(line)
            tasks.append({
                "id": task["id"],
                "dataset": task["dataset"],
                "level": task["level"],
                "template": task["template"],
                "goal": task["goal"],
                "expected_type": task["expected_output_type"],
                "expected_value": task["golden"]["answer_value"],
                "tolerance": task.get("tolerance", 0.01),
                "slots": task.get("metadata", {}).get("slots", {}),
                "ambiguities": task.get("ambiguities", []),
            })
    return tasks


def parse_info(info):
    """Parse info field which may be dict or JSON string."""
    if isinstance(info, str):
        try:
            return json.loads(info)
        except:
            return {}
    return info or {}


def load_rollouts_bank(model_key):
    """Load rollouts for a model from bank_rescored_c1."""
    rollouts = []
    bank_dir = BENCHMARK_DIR / "bank_rescored_c1"

    # Map model key to filename
    filename = model_key + ".jsonl"
    filepath = bank_dir / filename

    if not filepath.exists():
        return rollouts

    by_task = defaultdict(list)
    with open(filepath) as f:
        for line in f:
            record = json.loads(line)
            info = parse_info(record.get("info", {}))
            task_id = info.get("task_id", "")
            if task_id in BANK_19_IDS:
                by_task[task_id].append(record)

    # Take first 3 per task
    for task_id, records in by_task.items():
        for r in records[:3]:
            info = parse_info(r.get("info", {}))
            rollouts.append({
                "task_id": task_id,
                "dataset": "bank",
                "score_correctness": r.get("score_correctness", 0),
                "score_efficiency": r.get("score_efficiency", 0),
                "reward": r.get("reward", 0),
                "answer": r.get("answer"),
                "expected": info.get("expected"),
            })

    return rollouts


def load_rollouts_road(model_key):
    """Load rollouts for a model from eval_logs."""
    rollouts = []
    eval_dir = BENCHMARK_DIR / "eval_logs"

    # Find model directory
    model_dir = eval_dir / f"codeblue_env--{model_key}"
    if not model_dir.exists():
        return rollouts

    results_file = model_dir / "results.jsonl"
    if not results_file.exists():
        return rollouts

    by_task = defaultdict(list)
    with open(results_file) as f:
        for line in f:
            record = json.loads(line)
            info = parse_info(record.get("info", {}))
            task_id = info.get("task_id", "")
            if task_id in ROAD_6_IDS:
                by_task[task_id].append(record)

    # Take first 3 per task
    for task_id, records in by_task.items():
        for r in records[:3]:
            info = parse_info(r.get("info", {}))
            rollouts.append({
                "task_id": task_id,
                "dataset": "road",
                "score_correctness": r.get("score_correctness", 0),
                "score_efficiency": r.get("score_efficiency", 0),
                "reward": r.get("reward", 0),
                "answer": r.get("answer"),
                "expected": info.get("expected"),
            })

    return rollouts


def transform_models(results):
    """Transform model results to UI format."""
    models = []

    for r in results:
        model_key = r["model"]
        provider = model_key.split("--")[0]
        name = model_key.split("--")[-1]

        # Load rollouts
        bank_rollouts = load_rollouts_bank(model_key)
        road_rollouts = load_rollouts_road(model_key)
        all_rollouts = bank_rollouts + road_rollouts

        models.append({
            "model": model_key,
            "provider": provider,
            "name": name,
            "displayName": name.replace("-", " ").title(),
            "color": PROVIDER_COLORS.get(provider, "#6B7280"),

            # Bank metrics
            "bank": {
                "correct": r["bank_correct"],
                "total": r["bank_total"],
                "partial": r["bank_partial"],
                "pct": r["bank_pct"],
            },

            # Road metrics
            "road": {
                "correct": r["road_correct"],
                "total": r["road_total"],
                "partial": r["road_partial"],
                "pct": r["road_pct"],
            },

            # Combined metrics
            "combined": {
                "correct": r["total_correct"],
                "total": r["total_attempts"],
                "partial": r["total_partial"],
                "pct": r["total_pct"],
            },

            "avgReward": r["avg_reward"],
            "hasBank": r["has_bank"],
            "hasRoad": r["has_road"],
            "complete": r["complete"],

            # Rollouts for trajectory viewer
            "rollouts": all_rollouts[:15],  # Limit to 15 samples
        })

    return models


def compute_task_performance(models, tasks):
    """Compute per-task performance across models."""
    task_perf = {}

    for task in tasks:
        task_id = task["id"]
        task_perf[task_id] = {
            "task": task,
            "models": {},
        }

        for model in models:
            model_key = model["model"]
            rollouts = [r for r in model["rollouts"] if r["task_id"] == task_id]

            if rollouts:
                correct = sum(1 for r in rollouts if r["score_correctness"] >= 0.80)
                partial = sum(1 for r in rollouts if 0.20 <= r["score_correctness"] < 0.80)
                total = len(rollouts)

                task_perf[task_id]["models"][model_key] = {
                    "correct": correct,
                    "partial": partial,
                    "total": total,
                    "pct": round(100 * correct / total, 1) if total else 0,
                }

    return task_perf


def compute_template_stats(tasks, models):
    """Compute accuracy by template type."""
    template_stats = defaultdict(lambda: {"tasks": 0, "correct": 0, "total": 0})

    for task in tasks:
        template = task["template"]
        task_id = task["id"]
        template_stats[template]["tasks"] += 1

        for model in models:
            if not model["complete"]:
                continue

            rollouts = [r for r in model["rollouts"] if r["task_id"] == task_id]
            for r in rollouts:
                template_stats[template]["total"] += 1
                if r["score_correctness"] >= 0.80:
                    template_stats[template]["correct"] += 1

    # Convert to list and compute percentages
    result = []
    for template, stats in template_stats.items():
        result.append({
            "template": template,
            "tasks": stats["tasks"],
            "correct": stats["correct"],
            "total": stats["total"],
            "pct": round(100 * stats["correct"] / stats["total"], 1) if stats["total"] else 0,
        })

    return sorted(result, key=lambda x: x["pct"], reverse=True)


def compute_anomalies(models):
    """Detect notable performance anomalies."""
    anomalies = []

    for model in models:
        if not model["complete"]:
            continue

        bank_pct = model["bank"]["pct"]
        road_pct = model["road"]["pct"]
        partial = model["combined"]["partial"]

        # Large gap between bank and road
        gap = abs(bank_pct - road_pct)
        if gap > 30:
            direction = "road > bank" if road_pct > bank_pct else "bank > road"
            anomalies.append({
                "model": model["model"],
                "type": "domain_gap",
                "description": f"{model['name']}: {direction} gap of {gap:.1f}%",
                "details": {
                    "bank_pct": bank_pct,
                    "road_pct": road_pct,
                    "gap": gap,
                },
            })

        # High partial credit count
        if partial >= 5:
            anomalies.append({
                "model": model["model"],
                "type": "partial_credits",
                "description": f"{model['name']}: {partial} partial credits (100x scale errors)",
                "details": {
                    "partial_count": partial,
                },
            })

    return anomalies


def main():
    print("Loading source data...")
    results = load_results()
    tasks = load_tasks()

    print(f"Found {len(results)} models, {len(tasks)} tasks")

    print("Transforming model data...")
    models = transform_models(results)

    print("Computing task performance...")
    task_perf = compute_task_performance(models, tasks)

    print("Computing template stats...")
    template_stats = compute_template_stats(tasks, models)

    print("Detecting anomalies...")
    anomalies = compute_anomalies(models)

    # Build output
    output = {
        "generated": datetime.now().isoformat(),
        "version": "v2.0-corrected",
        "summary": {
            "total_tasks": len(tasks),
            "bank_tasks": len([t for t in tasks if t["dataset"] == "bank"]),
            "road_tasks": len([t for t in tasks if t["dataset"] == "road"]),
            "models_complete": len([m for m in models if m["complete"]]),
            "models_partial": len([m for m in models if not m["complete"]]),
            "templates": len(set(t["template"] for t in tasks)),
            "levels": sorted(set(t["level"] for t in tasks)),
        },
        "models": models,
        "tasks": tasks,
        "templateStats": template_stats,
        "anomalies": anomalies,
    }

    print(f"Writing to {OUTPUT_FILE}...")
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(output, f, indent=2)

    print("Done!")
    print(f"\nSummary:")
    print(f"  Models: {len(models)} ({output['summary']['models_complete']} complete)")
    print(f"  Tasks: {len(tasks)} ({output['summary']['bank_tasks']} bank, {output['summary']['road_tasks']} road)")
    print(f"  Templates: {output['summary']['templates']}")
    print(f"  Anomalies: {len(anomalies)}")


if __name__ == "__main__":
    main()
