#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOG_PATH = ROOT / "log.txt"
OUTPUT_PATH = ROOT / "activity.json"
LINE_PATTERN = re.compile(
    r"(?P<date>[A-Z][a-z]{2}\s+[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+UTC\s+\d{4})"
)


def parse_commit_dates() -> list[datetime]:
    if not LOG_PATH.exists():
        return []

    dates: list[datetime] = []
    for raw_line in LOG_PATH.read_text(encoding="utf-8", errors="replace").splitlines():
        if not raw_line.strip():
            continue

        match = LINE_PATTERN.search(raw_line)
        if not match:
            continue

        try:
            parsed = datetime.strptime(match.group("date"), "%a %b %d %H:%M:%S UTC %Y")
        except ValueError:
            continue

        dates.append(parsed)

    return sorted(dates)


def calculate_streak(unique_days: list[date]) -> int:
    if not unique_days:
        return 0

    streak = 0
    cursor = unique_days[-1]
    unique_set = set(unique_days)
    while cursor in unique_set:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def calculate_best_streak(unique_days: list[date]) -> int:
    if not unique_days:
        return 0

    best = 1
    current = 1
    for index in range(1, len(unique_days)):
        previous_day = unique_days[index - 1]
        current_day = unique_days[index]
        if (current_day - previous_day) == timedelta(days=1):
            current += 1
            best = max(best, current)
        else:
            current = 1
    return best


def build_month_breakdown(unique_days: list[date]) -> list[dict[str, int | str]]:
    month_counts: defaultdict[str, int] = defaultdict(int)
    for current_day in unique_days:
        month_counts[current_day.strftime("%Y-%m")] += 1

    return [{"month": month, "count": count} for month, count in sorted(month_counts.items())]


def build_heatmap(unique_days: list[date]) -> list[dict[str, int | str]]:
    if not unique_days:
        return []

    last_day = unique_days[-1]
    start_day = last_day - timedelta(days=55)
    heatmap: list[dict[str, int | str]] = []

    for offset in range(56):
        day = start_day + timedelta(days=offset)
        count = sum(1 for unique_day in unique_days if unique_day == day)
        heatmap.append({"date": day.isoformat(), "count": count})

    return heatmap


def main() -> None:
    commit_dates = parse_commit_dates()
    unique_days = sorted({entry.date() for entry in commit_dates})
    latest_day = unique_days[-1] if unique_days else date.today()

    summary = {
        "totalCommits": len(commit_dates),
        "uniqueDays": len(unique_days),
        "currentStreak": calculate_streak(unique_days),
        "bestStreak": calculate_best_streak(unique_days),
        "lastCommit": latest_day.isoformat() if unique_days else "no data",
        "averagePerActiveDay": round(len(commit_dates) / len(unique_days), 2) if unique_days else 0,
    }

    payload = {
        "generatedAt": (
            commit_dates[-1].replace(tzinfo=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            if commit_dates
            else "no data"
        ),
        "summary": summary,
        "heatmap": build_heatmap(unique_days),
        "monthBreakdown": build_month_breakdown(unique_days),
    }

    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
