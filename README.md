# Green Graph

A tiny daily-commit ritual turned into a polished contribution dashboard.

The project keeps a repository alive by making a small automated commit every day, then visualizes the streak, momentum, and heatmap in a clean web dashboard.

## What is included

- Daily GitHub Actions automation to push a fresh commit
- A generated `activity.json` dataset from the commit log
- A modern dashboard at `index.html` showing:
  - total commits
  - active days
  - current streak
  - best streak
  - heatmap and monthly momentum

## Local development

```bash
npm test
npm start
```

Then open http://localhost:8000 in a browser.

## How it works

- `log.txt` stores the historical GitHub Actions commit entries
- `scripts/generate_activity.py` parses the log and builds summary metrics
- `index.html`, `styles.css`, and `app.js` render the live dashboard

## Automation

The workflow runs every day at 06:00 UTC and performs a fresh daily update. It also regenerates the contribution data before committing.
