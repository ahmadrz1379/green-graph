const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });

async function loadActivity() {
  try {
    const response = await fetch("./activity.json");
    if (!response.ok) {
      throw new Error(`Failed to load activity data: ${response.status}`);
    }

    const activity = await response.json();
    render(activity);
  } catch (error) {
    console.error(error);
    document.getElementById("status-pill").textContent = "Data unavailable";
    document.getElementById("metric-totalCommits").textContent = "—";
  }
}

function formatDate(value) {
  if (!value || value === "no data") {
    return "—";
  }

  const date = new Date(`${value}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getIntensity(count) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  if (count === 4) return 4;
  return 5;
}

function render(activity) {
  const summary = activity.summary ?? {};

  document.getElementById("status-pill").textContent = `${summary.totalCommits ?? 0} commits logged`;
  document.getElementById("metric-currentStreak").textContent = `${summary.currentStreak ?? 0}d`;
  document.getElementById("metric-bestStreak").textContent = `${summary.bestStreak ?? 0}d`;
  document.getElementById("metric-lastCommit").textContent = formatDate(summary.lastCommit);
  document.getElementById("metric-totalCommits").textContent = summary.totalCommits ?? 0;
  document.getElementById("metric-activeDays").textContent = summary.uniqueDays ?? 0;
  document.getElementById("metric-average").textContent = `${summary.averagePerActiveDay ?? 0}`;
  document.getElementById("metric-momentum").textContent = `${summary.currentStreak ?? 0}-day run`;

  renderHeatmap(activity.heatmap ?? []);
  renderMonthlyBreakdown(activity.monthBreakdown ?? []);
}

function renderHeatmap(heatmap) {
  const grid = document.getElementById("heatmap");
  if (!heatmap.length) {
    grid.innerHTML = '<div class="heat-cell level-0" aria-label="No activity yet"></div>';
    return;
  }

  grid.innerHTML = heatmap
    .map((entry) => {
      const intensity = getIntensity(Number(entry.count ?? 0));
      const title = `${entry.date}: ${entry.count} commit${Number(entry.count) === 1 ? "" : "s"}`;
      return `<div class="heat-cell level-${intensity}" title="${title}" aria-label="${title}"></div>`;
    })
    .join("");
}

function renderMonthlyBreakdown(monthBreakdown) {
  const container = document.getElementById("monthly-bars");
  if (!monthBreakdown.length) {
    container.innerHTML = '<div class="month-bar"><div class="bar-track"><div class="bar-fill" style="height: 0%"></div></div><span class="month-label">No data</span></div>';
    return;
  }

  const maxCount = Math.max(...monthBreakdown.map((item) => Number(item.count ?? 0)), 1);

  container.innerHTML = monthBreakdown
    .map((item) => {
      const month = item.month;
      const count = Number(item.count ?? 0);
      const shortName = month ? monthFormatter.format(new Date(`${month}-01T00:00:00Z`)) : "—";
      const height = Math.max((count / maxCount) * 100, count > 0 ? 18 : 0);
      return `
        <div class="month-bar">
          <div class="bar-track">
            <div class="bar-fill" style="height: ${height}%"></div>
          </div>
          <span class="month-label">${shortName}</span>
        </div>
      `;
    })
    .join("");
}

loadActivity();
