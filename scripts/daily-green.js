const fs = require('fs');
const path = require('path');

const root = process.cwd();
const logPath = path.join(root, 'log.txt');
const statusPath = path.join(root, 'data', 'green-status.json');
const readmePath = path.join(root, 'README.md');

const themes = [
  { name: 'Sunrise Bloom', emoji: '🌞', focus: 'Plant a fresh idea before the coffee cools.' },
  { name: 'Forest Glow', emoji: '🌿', focus: 'Keep the streak growing with one tiny win.' },
  { name: 'Rainy Spark', emoji: '🌧️', focus: 'Even drizzle turns into green momentum.' },
  { name: 'Moonlit Growth', emoji: '🌙', focus: 'Ship a small improvement and rest beautifully.' },
  { name: 'Aurora Energy', emoji: '✨', focus: 'Build something delightful, then keep going.' },
  { name: 'Wildflower Rush', emoji: '🌼', focus: 'Momentum is a habit, not a mood.' }
];

const actions = [
  'watered the repo',
  'sparked a tiny upgrade',
  'planted a fresh commit',
  'fed the graph with optimism',
  'trimmed a little friction',
  'kept the streak alive',
  'made the project prettier',
  'added a little joy to the code'
];

function ensureDir(target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    throw new Error(`Could not parse ${filePath}`);
  }
}

function formatDate(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function calculateStreak(history) {
  const dates = [...new Set(history.map((entry) => entry.date))].sort().reverse();
  if (!dates.length) return 0;

  let streak = 0;
  let current = new Date(dates[0] + 'T00:00:00Z');

  for (const date of dates) {
    const candidate = new Date(date + 'T00:00:00Z');
    const difference = (current - candidate) / 86400000;

    if (difference === 0 || difference === 1) {
      streak += 1;
      current = candidate;
    } else {
      break;
    }
  }

  return streak;
}

function buildSparkline(history) {
  const values = Array.from({ length: 7 }, (_, idx) => {
    const entry = history[history.length - 7 + idx];
    return entry ? Math.min(entry.energy, 100) : 0;
  });

  const blocks = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  return values
    .map((value) => {
      if (!value) return '·';
      const index = Math.min(blocks.length - 1, Math.max(0, Math.round((value / 100) * (blocks.length - 1))));
      return blocks[index];
    })
    .join(' ');
}

function buildReadme(state) {
  const { history, streak, mood, totalDays, sparkline, action, energy } = state;
  const latestEntry = history[history.length - 1];
  const lastSeven = history.slice(-7).map((entry) => `${entry.emoji} ${entry.date.slice(5)}`).join(' • ');

  return `# 🌿 Green Graph Garden

> A tiny ritual for keeping the GitHub contribution graph lush, playful, and alive.

## 🌱 Today’s growth report

- ${mood.emoji} Mood: ${mood.name}
- 🌾 Focus: ${mood.focus}
- 📈 Current streak: ${streak} day${streak === 1 ? '' : 's'}
- 🌍 Total green days: ${totalDays}
- ⚡ Energy: ${energy}%
- 🧠 Latest move: ${action}
- 📅 Last 7 days: ${lastSeven}
- ✨ Sparkline: ${sparkline}

## 🌼 Why this project is cool

This repo turns a regular daily commit into a tiny botanic experience.
Each run adds a bit of joy to the log, refreshes the README, and keeps the graph looking alive.
The idea is simple: small daily actions compound into something beautiful.

## 📊 Dashboard

Open index.html to explore the contribution heatmap, current streak, best streak, and monthly momentum.

For local development, run npm test to regenerate and validate activity.json, then npm start and visit http://localhost:8000.

## 🏆 Daily ritual

1. Water the repo with a fresh commit.
2. Add a little momentum to the project.
3. Keep the streak alive, one green day at a time.

## 📜 Last update

The latest green check-in was recorded on ${latestEntry.date}.
`;
}

function main() {
  ensureDir(statusPath);

  const today = formatDate(new Date());
  const previous = readJson(statusPath, { history: [] });
  const history = Array.isArray(previous.history) ? previous.history : [];

  const existing = history.find((entry) => entry.date === today);
  if (existing) {
    const moodIndex = Math.abs(Math.floor((new Date(today).getTime() / 86400000) % themes.length));
    const mood = themes[moodIndex % themes.length];
    const streak = calculateStreak(history);
    const energy = 68 + (streak % 21) + (today.length % 10);

    const state = {
      history,
      streak,
      mood,
      totalDays: history.length,
      sparkline: buildSparkline(history),
      action: actions[(history.length + today.length) % actions.length],
      energy: Math.min(100, energy)
    };

    fs.writeFileSync(readmePath, buildReadme(state), 'utf8');
    return;
  }

  const moodIndex = Math.abs(Math.floor((new Date(today).getTime() / 86400000) % themes.length));
  const mood = themes[moodIndex % themes.length];
  const action = actions[(history.length + today.length) % actions.length];
  const entry = {
    date: today,
    emoji: mood.emoji,
    mood: mood.name,
    energy: 72 + (history.length % 25),
    action,
    focus: mood.focus
  };

  history.push(entry);
  const streak = calculateStreak(history);
  const energy = Math.min(100, 72 + (history.length % 25) + (streak % 10));

  const state = {
    history,
    streak,
    mood,
    totalDays: history.length,
    sparkline: buildSparkline(history),
    action,
    energy
  };

  fs.writeFileSync(statusPath, JSON.stringify({ history }, null, 2) + '\n', 'utf8');
  fs.writeFileSync(readmePath, buildReadme(state), 'utf8');

  const timestamp = new Date().toISOString();
  const line = `${timestamp} - ${mood.emoji} ${action} (${mood.name})\n`;

  if (fs.existsSync(logPath)) {
    const existingLog = fs.readFileSync(logPath, 'utf8');
    if (!existingLog.includes(today)) {
      fs.appendFileSync(logPath, line);
    }
  } else {
    fs.writeFileSync(logPath, line, 'utf8');
  }
}

main();
