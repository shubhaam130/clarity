const demoRows = [
  ["date","customer","product","category","region","channel","units","revenue","margin","satisfaction","repeat_purchase"],
  ["2026-01-05","Northstar Retail","Atlas Pro","Premium","West","Direct",42,18480,7392,94,"Yes"],
  ["2026-01-12","BrightLane","Atlas Pro","Premium","East","Direct",38,16720,6688,91,"Yes"],
  ["2026-01-18","UrbanNest","Core Kit","Essentials","North","Marketplace",76,16720,4514,82,"Yes"],
  ["2026-02-02","Luma Home","Core Kit","Essentials","South","Marketplace",84,18480,4990,80,"No"],
  ["2026-02-11","Evergreen Co","Flow Mini","Value","West","Partner",128,17920,3584,75,"No"],
  ["2026-02-19","Northstar Retail","Atlas Pro","Premium","West","Direct",47,20680,8272,95,"Yes"],
  ["2026-03-04","BrightLane","Atlas Pro","Premium","East","Direct",44,19360,7744,93,"Yes"],
  ["2026-03-16","Civic Goods","Core Kit","Essentials","North","Marketplace",91,20020,5405,84,"Yes"],
  ["2026-03-27","UrbanNest","Flow Mini","Value","North","Partner",143,20020,4004,76,"No"],
  ["2026-04-06","Luma Home","Flow Mini","Value","South","Partner",168,23520,4704,72,"No"],
  ["2026-04-18","Northstar Retail","Atlas Pro","Premium","West","Direct",39,17160,6864,90,"Yes"],
  ["2026-04-25","BudgetBay","Flow Mini","Value","East","Marketplace",196,27440,4116,68,"No"],
  ["2026-05-03","BudgetBay","Flow Mini","Value","East","Marketplace",126,17640,2646,64,"No"],
  ["2026-05-14","Evergreen Co","Core Kit","Essentials","West","Marketplace",63,13860,3742,78,"No"],
  ["2026-05-21","BrightLane","Atlas Pro","Premium","East","Direct",24,10560,4224,86,"Yes"],
  ["2026-06-02","Civic Goods","Core Kit","Essentials","North","Marketplace",58,12760,3445,83,"Yes"],
  ["2026-06-10","Northstar Retail","Atlas Pro","Premium","West","Direct",21,9240,3696,88,"Yes"],
  ["2026-06-17","BudgetBay","Flow Mini","Value","East","Marketplace",132,18480,2772,61,"No"],
  ["2026-06-21","UrbanNest","Flow Mini","Value","North","Partner",96,13440,2688,73,"No"],
  ["2026-06-23","Luma Home","Core Kit","Essentials","South","Marketplace",null,0,0,70,"No"],
  ["2026-06-23","Luma Home","Core Kit","Essentials","South","Marketplace",null,0,0,70,"No"]
];

const thinkingSteps = [
  "Reading your data...",
  "Finding missing values...",
  "Detecting anomalies...",
  "Understanding relationships...",
  "Identifying risks...",
  "Generating recommendations...",
  "Preparing executive dashboard...",
  "Analysis Complete"
];

const state = {
  rows: [],
  profile: null,
  presentationIndex: 0
};

const $ = (id) => document.getElementById(id);
const money = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
const safe = (value) => escapeHTML(String(value ?? ""));

document.addEventListener("DOMContentLoaded", () => {
  drawHeroChart();
  decryptHeroTitle();
  $("demoButton").addEventListener("click", () => runAnalysis(rowsToObjects(demoRows), "Demo retail sales dataset"));
  $("csvInput").addEventListener("change", handleUpload);
  $("runQuery").addEventListener("click", runAnalystQuery);
  $("analystInput").addEventListener("input", runAnalystQuery);
  $("reportButton").addEventListener("click", downloadReport);
  $("copilotToggle").addEventListener("click", () => $("copilotPanel").classList.toggle("collapsed"));
  $("closeCopilot").addEventListener("click", () => $("copilotPanel").classList.add("collapsed"));
  $("presentationToggle").addEventListener("click", togglePresentation);
  $("stepForward").addEventListener("click", () => movePresentation(1));
  $("stepBack").addEventListener("click", () => movePresentation(-1));
  document.querySelectorAll(".tab-button").forEach((button) => button.addEventListener("click", () => showPanel(button.dataset.target)));
  document.querySelectorAll(".dock-nav button").forEach((button) => button.addEventListener("click", () => {
    const target = button.dataset.jump;
    if (["brief", "story", "insights", "actions", "console", "copilotWorkspace"].includes(target)) showPanel(target);
    $(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  seedQuickPrompts();
});

function handleUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showToast("This file is larger than 5MB. Use a smaller CSV for the live demo.");
    event.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => showToast("CLARITY could not read that file. Please try another CSV.");
  reader.onload = () => {
    try {
      const rows = parseCSV(reader.result);
      runAnalysis(rows, file.name.replace(/\.csv$/i, "") || "Uploaded dataset");
      showToast("Dataset uploaded. CLARITY is preparing the Decision Center.");
    } catch (error) {
      showToast(error.message || "This CSV could not be analyzed. Please check the file and try again.");
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function parseCSV(text) {
  if (!text || !text.trim()) throw new Error("This CSV is empty. Upload a file with headers and at least one data row.");
  const lines = text.trim().split(/\r?\n/).filter((line) => line.trim().length);
  if (lines.length < 2) throw new Error("This CSV needs a header row and at least one data row.");
  const parsed = lines.map(parseCSVLine);
  if (parsed[0].every((cell) => !String(cell || "").trim())) throw new Error("This CSV is missing usable column headers.");
  return rowsToObjects(parsed);
}

function parseCSVLine(line) {
  const cells = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      value += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  if (quoted) throw new Error("This CSV has an unmatched quote. Please export it again and retry.");
  cells.push(value);
  return cells;
}

function rowsToObjects(rows) {
  const headers = makeUniqueHeaders(rows[0]);
  if (!headers.length) throw new Error("This CSV is missing usable column headers.");
  const objects = rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, normalize(row[index])])));
  const usableRows = objects.filter((row) => Object.values(row).some((value) => value !== null));
  if (!usableRows.length) throw new Error("This CSV does not contain analyzable rows.");
  return usableRows;
}

function makeUniqueHeaders(headers) {
  const counts = {};
  return headers.map((header, index) => {
    const base = String(header || `Column ${index + 1}`).trim() || `Column ${index + 1}`;
    counts[base] = (counts[base] || 0) + 1;
    return counts[base] === 1 ? base : `${base} ${counts[base]}`;
  });
}

function normalize(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && String(value).trim() !== "" ? number : String(value).trim();
}

function runAnalysis(rows, label) {
  if (!Array.isArray(rows) || !rows.length) {
    showToast("CLARITY needs at least one row of data to analyze.");
    return;
  }
  state.rows = rows;
  try {
    state.profile = analyze(rows, label);
  } catch (error) {
    showToast(error.message || "CLARITY could not analyze this dataset.");
    return;
  }
  showThinking(() => {
    showReplay(() => {
      renderDashboard();
      ["dashboard", "brief", "story", "insights", "actions", "console", "copilot", "copilotWorkspace"].forEach((id) => $(id).classList.remove("hidden"));
      showPanel("brief");
      answerPrompt("Proactive brief");
      $("dashboard").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function showToast(message) {
  const toast = $("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("hidden");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.add("hidden"), 4200);
}

function escapeHTML(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showThinking(done) {
  const p = state.profile;
  const liveSteps = p ? [
    `Reading CSV: ${p.rows} records found.`,
    `Understanding schema: ${p.columns.length} columns detected.`,
    `Detecting missing values: ${p.missingCells} found.`,
    `Detecting anomalies: ${p.outliers} unusual transactions flagged.`,
    `Finding correlations: ${p.topCategory} drives ${Math.round(p.topCategoryShare)}% of revenue.`,
    `Ranking business risks: ${p.topCustomer} concentration identified.`,
    `Generating executive briefing: ${p.summary.Decision}`,
    "Preparing Decision Center..."
  ] : thinkingSteps;
  $("thinking").classList.remove("hidden");
  $("thinkingTrack").innerHTML = liveSteps.map((step) => `<div class="think-step"><span>●</span><strong>${safe(step)}</strong></div>`).join("");
  const items = [...document.querySelectorAll(".think-step")];
  let index = 0;
  const timer = setInterval(() => {
    items.forEach((item, itemIndex) => {
      item.classList.toggle("active", itemIndex === index);
      item.classList.toggle("done", itemIndex < index);
    });
    $("thinkingTitle").textContent = liveSteps[Math.min(index, liveSteps.length - 1)];
    index++;
    if (index > liveSteps.length) {
      clearInterval(timer);
      setTimeout(() => {
        $("thinking").classList.add("hidden");
        done();
      }, 260);
    }
  }, 520);
}

function showReplay(done) {
  const p = state.profile;
  const steps = [
    `Read ${p.columns.length} columns and ${p.rows} business records.`,
    `Found ${p.missingCells} missing values and ${p.duplicateRecords} duplicate records.`,
    `${p.topCustomer} represents ${Math.round(p.topCustomerShare)}% of revenue.`,
    `Revenue ${p.momentum >= 0 ? "improved" : "softened"} ${Math.abs(p.momentum).toFixed(1)}% in the later period.`,
    `${p.topCategory} is the largest growth lane at ${Math.round(p.topCategoryShare)}% of revenue.`,
    `Prepared the Decision Center with ${p.confidence}% confidence.`
  ];
  $("replay").classList.remove("hidden");
  $("replayStage").innerHTML = steps.map((step, index) => `
    <div class="replay-step" style="animation-delay:${index * 180}ms">
      <span>${index + 1}</span>
      <strong>${safe(step)}</strong>
    </div>
  `).join("");
  $("replay").scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => {
    $("replay").classList.add("hidden");
    done();
  }, 2600);
}

function analyze(rows, label) {
  const columns = Object.keys(rows[0] || {});
  if (!columns.length) throw new Error("This dataset has no usable columns.");
  const numericColumns = columns.filter((column) => rows.some((row) => typeof row[column] === "number" && Number.isFinite(row[column])));
  const revenueColumn = pickColumn(columns, ["revenue", "sales", "amount", "total", "value"]) || numericColumns[0];
  if (!revenueColumn) throw new Error("CLARITY could not find a numeric business metric. Add a revenue, sales, amount, total, value, or numeric column.");
  const marginColumn = pickColumn(columns, ["margin", "profit", "gross"]);
  const dateColumn = pickColumn(columns, ["date", "month", "created"]);
  const customerColumn = pickColumn(columns, ["customer", "client", "account", "company"]);
  const categoryColumn = pickColumn(columns, ["category", "product", "segment", "department"]);
  const satisfactionColumn = pickColumn(columns, ["satisfaction", "nps", "rating", "score"]);

  const totalCells = rows.length * Math.max(columns.length, 1);
  const missingCells = rows.reduce((sum, row) => sum + columns.filter((column) => row[column] === null || row[column] === "").length, 0);
  const duplicateRecords = rows.length - new Set(rows.map((row) => JSON.stringify(row))).size;
  const values = rows.map((row) => Number(row[revenueColumn])).filter(Number.isFinite);
  const revenue = values.reduce((sum, value) => sum + value, 0);
  const average = values.length ? revenue / values.length : 0;
  const outliers = values.filter((value) => value > average * 1.8 || value < average * 0.18).length;
  const completeness = totalCells ? 1 - missingCells / totalCells : 1;
  const quality = clamp(Math.round((completeness * 100) - duplicateRecords * 4 - outliers * 1.5), 52, 98);

  const byMonth = groupSum(rows, dateColumn, revenueColumn, monthKey);
  const byCategory = groupSum(rows, categoryColumn, revenueColumn);
  const byCustomer = groupSum(rows, customerColumn, revenueColumn);
  const monthEntries = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b));
  const categoryEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const customerEntries = Object.entries(byCustomer).sort((a, b) => b[1] - a[1]);
  const firstHalf = sum(monthEntries.slice(0, Math.ceil(monthEntries.length / 2)).map((entry) => entry[1]));
  const secondHalf = sum(monthEntries.slice(Math.ceil(monthEntries.length / 2)).map((entry) => entry[1]));
  const momentum = firstHalf ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;
  const topCategoryShare = revenue ? (categoryEntries[0]?.[1] || 0) / revenue * 100 : 0;
  const topCustomerShare = revenue ? (customerEntries[0]?.[1] || 0) / revenue * 100 : 0;
  const margin = marginColumn ? rows.reduce((sum, row) => sum + (Number(row[marginColumn]) || 0), 0) : revenue * 0.28;
  const avgSatisfaction = satisfactionColumn ? averageOf(rows.map((row) => Number(row[satisfactionColumn])).filter(Number.isFinite)) : 82;

  const riskScore = clamp(Math.round(30 + Math.max(0, -momentum) * 0.75 + topCustomerShare * 0.45 + (100 - avgSatisfaction) * 0.35 + duplicateRecords * 4), 12, 91);
  const opportunityScore = clamp(Math.round(58 + Math.max(0, momentum) * 0.4 + (margin / Math.max(revenue, 1)) * 45 + avgSatisfaction * 0.12), 42, 96);
  const confidence = clamp(Math.round(quality * 0.68 + Math.min(rows.length, 80) * 0.28), 55, 96);
  const health = clamp(Math.round(quality * 0.44 + (100 - riskScore) * 0.25 + opportunityScore * 0.2 + confidence * 0.11), 45, 97);
  const topCategory = categoryEntries[0]?.[0] || "the leading segment";
  const topCustomer = customerEntries[0]?.[0] || "the largest customer";
  const trendWord = momentum >= 0 ? "improved" : "softened";
  const nextAction = momentum < 0 ? "stabilize the highest-value customer base before expanding promotions" : "double down on the strongest category while protecting service quality";
  const customerSql = `SELECT ${customerColumn || "customer"}, SUM(${revenueColumn}) AS revenue FROM dataset GROUP BY ${customerColumn || "customer"} ORDER BY revenue DESC LIMIT 10;`;
  const categorySql = `SELECT ${categoryColumn || "category"}, SUM(${revenueColumn}) AS revenue FROM dataset GROUP BY ${categoryColumn || "category"} ORDER BY revenue DESC LIMIT 10;`;
  const qualitySql = `SELECT COUNT(*) AS records, SUM(CASE WHEN ${revenueColumn} IS NULL THEN 1 ELSE 0 END) AS missing_revenue FROM dataset;`;

  return {
    label,
    columns,
    revenueColumn,
    categoryColumn,
    customerColumn,
    dateColumn,
    rows: rows.length,
    revenue,
    margin,
    quality,
    confidence,
    health,
    riskScore,
    opportunityScore,
    avgSatisfaction,
    momentum,
    topCategory,
    topCategoryShare,
    topCustomer,
    topCustomerShare,
    missingCells,
    duplicateRecords,
    outliers,
    completeness: Math.round(completeness * 100),
    monthEntries,
    categoryEntries,
    customerEntries,
    healthExplanation: `The score reflects ${Math.round(completeness * 100)}% usable data coverage, ${duplicateRecords} duplicate record${duplicateRecords === 1 ? "" : "s"}, ${outliers} unusual transaction${outliers === 1 ? "" : "s"}, and ${confidence}% confidence in the pattern. The business is healthy enough to act, but leadership should address concentration risk before funding broad growth.`,
    summary: {
      "Decision": momentum < 0 ? "Stabilize repeat revenue before expanding promotions." : "Scale the strongest segment while protecting margin quality.",
      "Why Now": `Revenue ${trendWord} ${Math.abs(momentum).toFixed(1)}% in the later period, while ${topCustomer} now represents ${Math.round(topCustomerShare)}% of revenue.`,
      "Opportunity": `${topCategory} is the highest-confidence growth lane at ${Math.round(topCategoryShare)}% of measured revenue.`,
      "Risk": `Customer concentration can turn a manageable slowdown into a board-level miss if buying behavior changes.`,
      "Impact": `A 5% improvement in retention or premium mix protects approximately ${money(revenue * 0.05)} over a similar period.`
    },
    story: `The business entered the period with healthy demand, then momentum changed. Early revenue was supported by premium buyers and repeat accounts; later revenue softened as the mix moved toward lower-confidence volume and fewer high-value purchases. That matters because ${topCustomer} now represents ${Math.round(topCustomerShare)}% of revenue, so one customer decision can shape the quarter. The growth engine is still visible: ${topCategory} contributes ${Math.round(topCategoryShare)}% of revenue and deserves focused investment. Leadership should not respond with broad promotions. The better move is to protect repeat buyers, recover premium mix, and build a second growth lane so the next quarter is less dependent on one customer or one segment.`,
    actions: [
      {
        priority: riskScore > 60 ? "HIGH" : "MEDIUM",
        title: "Reduce revenue concentration",
        reason: `${topCustomer} contributes ${Math.round(topCustomerShare)}% of revenue.`,
        evidence: `${Math.round(topCustomerShare)}% of measured revenue comes from one account.`,
        sql: customerSql,
        chart: "Accounts leadership cannot afford to lose",
        explanation: `This is the fastest risk reduction move because ${topCustomer} has enough revenue weight to influence the quarter.`,
        value: money(revenue * 0.04),
        confidence: confidence,
        impact: "★★★★★",
        difficulty: "Easy",
        time: "10 minutes"
      },
      {
        priority: "HIGH",
        title: `Protect ${topCategory} demand`,
        reason: `${topCategory} is the largest revenue pool and should receive the next campaign focus.`,
        evidence: `${topCategory} contributes ${Math.round(topCategoryShare)}% of revenue.`,
        sql: categorySql,
        chart: "Where the business depends most",
        explanation: `This is the best growth move because ${topCategory} is already proving demand and can be scaled with less market risk.`,
        value: money(revenue * 0.05),
        confidence: clamp(confidence - 3, 50, 99),
        impact: "★★★★☆",
        difficulty: "Medium",
        time: "1 week"
      },
      {
        priority: quality < 90 ? "MEDIUM" : "LOW",
        title: "Clean decision-critical data",
        reason: `${duplicateRecords} duplicate and ${missingCells} missing values reduce confidence in executive decisions.`,
        evidence: `${missingCells} missing values, ${duplicateRecords} duplicate records, and ${outliers} unusual transactions detected.`,
        sql: qualitySql,
        chart: "Decision confidence quality check",
        explanation: "This improves executive trust by reducing the chance that decisions are based on duplicated or incomplete records.",
        value: "Higher forecast trust",
        confidence: quality,
        impact: "★★★☆☆",
        difficulty: "Easy",
        time: "30 minutes"
      }
    ]
  };
}

function pickColumn(columns, names) {
  return columns.find((column) => names.some((name) => column.toLowerCase().includes(name)));
}

function groupSum(rows, keyColumn, valueColumn, keyFormatter = (value) => value || "Unknown") {
  return rows.reduce((acc, row) => {
    const key = keyColumn ? keyFormatter(row[keyColumn]) : "All Records";
    acc[key] = (acc[key] || 0) + (Number(row[valueColumn]) || 0);
    return acc;
  }, {});
}

function monthKey(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 7);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function renderDashboard() {
  const p = state.profile;
  $("dashboardSubtitle").textContent = `${p.label}: ${p.rows} records analyzed and translated into executive decisions.`;
  renderKpis(p);
  animateNumber($("healthScore"), p.health);
  $("scoreRing").style.background = `conic-gradient(var(--green) ${p.health * 3.6}deg, rgba(255,255,255,.09) 0deg)`;
  $("healthExplanation").textContent = p.healthExplanation;
  $("summaryList").innerHTML = Object.entries(p.summary).map(([label, value]) => `
    <div class="summary-item"><strong>${safe(label)}</strong><p>${safe(value)}</p></div>
  `).join("");
  renderBrief(p);
  $("businessStory").textContent = p.story;
  renderCharts(p);
  renderActions(p);
  runAnalystQuery();
}

function renderBrief(p) {
  $("briefGrid").innerHTML = `
    <article class="brief-card hero-brief">
      <span>Primary Decision</span>
      <strong>${safe(p.summary.Decision)}</strong>
      <p>${safe(p.summary["Why Now"])}</p>
    </article>
    <article class="brief-card">
      <span>Risk</span>
      <strong>${p.riskScore}/100</strong>
      <p>${safe(p.summary.Risk)}</p>
    </article>
    <article class="brief-card">
      <span>Opportunity</span>
      <strong>${p.opportunityScore}/100</strong>
      <p>${safe(p.summary.Opportunity)}</p>
    </article>
    <article class="brief-card">
      <span>Impact</span>
      <strong>${money(p.revenue * 0.05)}</strong>
      <p>${safe(p.summary.Impact)}</p>
    </article>
  `;
}

function renderKpis(p) {
  const items = [
    ["Business Health", p.health, "/100"],
    ["Risk Score", p.riskScore, "/100"],
    ["Opportunity Score", p.opportunityScore, "/100"],
    ["Dataset Quality", p.quality, "%"],
    ["AI Confidence", p.confidence, "%"]
  ];
  $("kpiGrid").innerHTML = items.map(([label, value, suffix], index) => `
    <div class="kpi-card" style="animation-delay:${index * 70}ms">
      <span>${safe(label)}</span>
      <strong data-value="${value}">0${suffix}</strong>
    </div>
  `).join("");
  document.querySelectorAll(".kpi-card strong").forEach((node) => animateNumber(node, Number(node.dataset.value), node.textContent.replace(/^0/, "")));
}

function renderCharts(p) {
  drawLineChart($("trendChart"), p.monthEntries, [70, 227, 255]);
  drawBarChart($("mixChart"), p.categoryEntries.slice(0, 6), [87, 242, 154]);
  $("trendBadge").textContent = p.momentum >= 0 ? "Growing" : "Watch";
  $("trendContext").innerHTML = contextBlock(
    "AI Interpretation",
    `Revenue ${p.momentum >= 0 ? "increased" : "declined"} ${Math.abs(p.momentum).toFixed(1)}% between the first and second half of the period.`,
    "Business Meaning",
    p.momentum >= 0 ? "The business has usable momentum, but leadership should verify that growth is not coming from low-margin volume." : "The later-period decline is a leadership issue, not just a chart pattern. Customer and product focus should tighten immediately.",
    "Recommended Action",
    p.momentum >= 0 ? "Reinvest in the top-performing segment and preserve margin discipline." : "Run a retention campaign for top customers and pause broad discounting until the revenue mix stabilizes.",
    "Potential Business Impact",
    `${money(p.revenue * 0.05)} protected if retention or premium mix improves by 5%.`,
    "Confidence",
    `${p.confidence}% based on ${p.rows} records and ${p.completeness}% usable coverage.`
  );
  $("mixContext").innerHTML = contextBlock(
    "AI Interpretation",
    `${p.topCategory} is the largest business driver at ${Math.round(p.topCategoryShare)}% of revenue.`,
    "Business Meaning",
    "The company has a clear growth engine, but too much dependence on one segment can make performance fragile.",
    "Recommended Action",
    `Create a focused plan for ${p.topCategory}, then build a second growth lane to reduce dependency risk.`,
    "Potential Business Impact",
    `${money(p.categoryEntries[0]?.[1] * 0.08 || 0)} upside from an 8% lift in the largest segment.`,
    "Confidence",
    `${clamp(p.confidence - 3, 50, 99)}% because the segment signal is consistent across the dataset.`
  );
}

function contextBlock(...parts) {
  let html = "";
  for (let i = 0; i < parts.length; i += 2) {
    html += `<div><span>${safe(parts[i])}</span><p>${safe(parts[i + 1])}</p></div>`;
  }
  return html;
}

function renderActions(p) {
  $("actionGrid").innerHTML = p.actions.map((action, index) => `
    <article class="action-card">
      <span class="priority">${safe(action.priority)}</span>
      <h3>${safe(action.title)}</h3>
      <p>${safe(action.reason)}</p>
      <div class="evidence-box">
        <span>Evidence</span>
        <strong>${safe(action.evidence)}</strong>
      </div>
      <div class="action-meta">
        <div><span>Business Impact</span><strong>${safe(action.impact)}</strong></div>
        <div><span>Difficulty</span><strong>${safe(action.difficulty)}</strong></div>
        <div><span>Estimated Time</span><strong>${safe(action.time)}</strong></div>
        <div><span>Business Value</span><strong>${safe(action.value)}</strong></div>
        <div><span>Confidence</span><strong>${action.confidence}%</strong></div>
        <div><span>Related Chart</span><strong>${safe(action.chart)}</strong></div>
      </div>
      <div class="supporting-sql"><span>Supporting SQL</span><code>${safe(action.sql)}</code></div>
      <button class="support-button" data-action-index="${index}">Explain Recommendation</button>
    </article>
  `).join("");
  document.querySelectorAll(".support-button").forEach((button) => button.addEventListener("click", () => {
    const action = state.profile.actions[Number(button.dataset.actionIndex)];
    $("analystInput").value = action.title.includes("demand") ? "Which products should I focus on?" : "Show top 10 customers.";
    runAnalystQuery();
    $("consoleMeaning").textContent = `${action.explanation} Evidence: ${action.evidence}`;
    showPanel("console");
    $("console").scrollIntoView({ behavior: "smooth", block: "start" });
  }));
}

function drawHeroChart() {
  $("heroChart").style.setProperty("--ready", "1");
}

function drawLineChart(canvas, entries, color) {
  const ctx = canvas.getContext("2d");
  clearCanvas(ctx, canvas);
  const values = entries.map((entry) => entry[1]);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const pad = 48;
  grid(ctx, canvas, pad);
  ctx.lineWidth = 5;
  ctx.strokeStyle = `rgb(${color.join(",")})`;
  ctx.shadowColor = `rgba(${color.join(",")}, .45)`;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  entries.forEach(([label, value], index) => {
    const x = pad + (index / Math.max(entries.length - 1, 1)) * (canvas.width - pad * 2);
    const y = canvas.height - pad - ((value - min) / Math.max(max - min, 1)) * (canvas.height - pad * 2);
    index ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    ctx.fillStyle = "#cbd8e8";
    ctx.font = "22px Inter, sans-serif";
    ctx.fillText(label, x - 16, canvas.height - 15);
  });
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawBarChart(canvas, entries, color) {
  const ctx = canvas.getContext("2d");
  clearCanvas(ctx, canvas);
  const max = Math.max(...entries.map((entry) => entry[1]), 1);
  const pad = 46;
  grid(ctx, canvas, pad);
  entries.forEach(([label, value], index) => {
    const width = (canvas.width - pad * 2) / entries.length - 18;
    const x = pad + index * ((canvas.width - pad * 2) / entries.length) + 9;
    const height = (value / max) * (canvas.height - pad * 2);
    const y = canvas.height - pad - height;
    const gradient = ctx.createLinearGradient(0, y, 0, canvas.height - pad);
    gradient.addColorStop(0, `rgba(${color.join(",")}, .96)`);
    gradient.addColorStop(1, "rgba(95, 168, 255, .32)");
    ctx.fillStyle = gradient;
    roundRect(ctx, x, y, width, height, 10);
    ctx.fillStyle = "#cbd8e8";
    ctx.font = "20px Inter, sans-serif";
    ctx.fillText(String(label).slice(0, 12), x, canvas.height - 14);
  });
}

function clearCanvas(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function grid(ctx, canvas, pad) {
  ctx.strokeStyle = "rgba(255,255,255,.08)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = pad + i * ((canvas.height - pad * 2) / 4);
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(canvas.width - pad, y);
    ctx.stroke();
  }
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.fill();
}

function runAnalystQuery() {
  if (!state.profile) return;
  const p = state.profile;
  const question = $("analystInput").value.toLowerCase();
  let rows;
  if (question.includes("product") || question.includes("category") || question.includes("focus")) {
    rows = p.categoryEntries.slice(0, 10).map(([name, revenue]) => [name, money(revenue)]);
    $("queryReasoning").textContent = `The question is about focus, so CLARITY ranks business segments by revenue contribution and compares them with the recommendation.`;
    $("sqlOutput").textContent = `SELECT ${p.categoryColumn || "category"}, SUM(${p.revenueColumn}) AS revenue FROM dataset GROUP BY ${p.categoryColumn || "category"} ORDER BY revenue DESC LIMIT 10;`;
    $("consoleMeaning").textContent = `${p.topCategory} should receive leadership attention first because it is the largest measurable revenue pool. Recommended action: protect this demand while building a second growth lane.`;
    renderTable(["Segment", "Revenue"], rows);
  } else {
    rows = p.customerEntries.slice(0, 10).map(([name, revenue]) => [name, money(revenue)]);
    $("queryReasoning").textContent = `The question is account-oriented, so CLARITY groups revenue by customer to identify dependency risk and retention priority.`;
    $("sqlOutput").textContent = `SELECT ${p.customerColumn || "customer"}, SUM(${p.revenueColumn}) AS revenue FROM dataset GROUP BY ${p.customerColumn || "customer"} ORDER BY revenue DESC LIMIT 10;`;
    $("consoleMeaning").textContent = `${p.topCustomer} is the highest-value account. Recommended action: assign an owner to protect this account and grow the next tier of customers.`;
    renderTable(["Customer", "Revenue"], rows);
  }
}

function renderTable(headers, rows) {
  $("resultTable").innerHTML = `<thead><tr>${headers.map((h) => `<th>${safe(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${safe(cell)}</td>`).join("")}</tr>`).join("")}</tbody>`;
}

function seedQuickPrompts() {
  const prompts = ["Explain", "Show Evidence", "What If?", "Open SQL"];
  $("quickPrompts").innerHTML = prompts.map((prompt) => `<button type="button">${safe(prompt)}</button>`).join("");
  $("workspacePrompts").innerHTML = prompts.map((prompt) => `<button type="button">${safe(prompt)}</button>`).join("");
  const handlePrompt = (event) => {
    if (event.target.tagName === "BUTTON") answerPrompt(event.target.textContent);
  };
  $("quickPrompts").addEventListener("click", handlePrompt);
  $("workspacePrompts").addEventListener("click", handlePrompt);
}

function answerPrompt(prompt) {
  const p = state.profile;
  if (!p) return;
  const lower = prompt.toLowerCase();
  let answer;
  if (lower.includes("proactive")) {
    answer = `I found three decisions that deserve your attention: protect ${p.topCustomer}, focus investment on ${p.topCategory}, and clean the ${p.missingCells} missing values that reduce forecast trust. The primary recommendation is to protect repeat revenue before expanding promotions.`;
  } else if (lower.includes("explain") || lower.includes("falling")) {
    answer = `Revenue changed because the later period shifted away from the strongest premium mix and became more dependent on lower-margin volume. The evidence is a ${Math.abs(p.momentum).toFixed(1)}% ${p.momentum >= 0 ? "increase" : "decline"} between the first and second half. The next decision is to protect top customers and reduce unfocused discounting.`;
  } else if (lower.includes("evidence") || lower.includes("risk")) {
    answer = `The biggest risk is concentration. ${p.topCustomer} represents ${Math.round(p.topCustomerShare)}% of revenue, so a single account can materially change the quarter. Leadership should create a retention plan and expand the next tier of customers.`;
    showPanel("insights");
  } else if (lower.includes("what if")) {
    answer = `What if retention improves by 5%? CLARITY estimates roughly ${money(p.revenue * 0.05)} in protected revenue over a similar period. The most practical path is to protect ${p.topCustomer} while increasing focus on ${p.topCategory}.`;
  } else if (lower.includes("sql")) {
    answer = `I opened the SQL Explorer with the supporting query. It ranks accounts by revenue so the recommendation is traceable, not guessed.`;
    showPanel("console");
    $("console").scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (lower.includes("products")) {
    answer = `Focus on ${p.topCategory}. It contributes ${Math.round(p.topCategoryShare)}% of revenue, which makes it the strongest near-term growth lane. The second move is to build an adjacent category so the business is not dependent on one engine.`;
  } else {
    answer = `Board summary: business health is ${p.health}/100 with ${p.confidence}% AI confidence. Revenue totals ${money(p.revenue)}, the top opportunity is ${p.topCategory}, and the top risk is dependency on ${p.topCustomer}. Recommended action: protect repeat revenue first, then scale the best-performing segment.`;
  }
  $("copilotAnswer").textContent = answer;
  $("workspaceCopilotAnswer").textContent = answer;
  $("copilotPanel").classList.remove("collapsed");
}

function downloadReport() {
  if (!state.profile) runAnalysis(rowsToObjects(demoRows), "Demo retail sales dataset");
  setTimeout(() => {
    const p = state.profile;
    if (!p) return;
    const report = buildReportHTML(p);
    const url = `data:text/html;charset=utf-8,${encodeURIComponent(report)}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = "clarity-ai-board-report.html";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, state.profile ? 0 : 3400);
}

function buildReportHTML(p) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CLARITY AI Board Report</title>
  <style>
    body{font-family:Inter,Arial,sans-serif;margin:0;color:#101828;background:#f7f9fc}
    main{max-width:980px;margin:0 auto;padding:48px 32px}
    .cover{background:#06111d;color:white;border-radius:18px;padding:36px;margin-bottom:24px}
    h1{font-size:42px;line-height:1;margin:0 0 12px} h2{margin-top:30px;color:#101828}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:22px 0}
    .card{background:white;border:1px solid #e4e7ec;border-radius:14px;padding:18px;box-shadow:0 16px 40px rgba(16,24,40,.06)}
    .card span{display:block;color:#667085;font-size:12px;text-transform:uppercase;letter-spacing:.08em}
    .card strong{display:block;margin-top:8px;font-size:24px}.wide{grid-column:span 2}
    p,li{line-height:1.62;color:#344054}.rec{margin-bottom:14px}
    code{display:block;white-space:pre-wrap;background:#101828;color:#d1fadf;border-radius:10px;padding:12px;font-size:12px}
    @media(max-width:760px){.grid{grid-template-columns:1fr}.wide{grid-column:auto}main{padding:24px 16px}}
  </style>
</head>
<body><main>
  <section class="cover">
    <p>CLARITY AI Executive Decision Report</p>
    <h1>${safe(p.summary.Decision)}</h1>
    <p>${safe(p.label)} · ${p.rows} records · ${p.confidence}% AI confidence</p>
  </section>
  <section class="grid">
    <div class="card"><span>Business Health</span><strong>${p.health}/100</strong></div>
    <div class="card"><span>Risk Score</span><strong>${p.riskScore}/100</strong></div>
    <div class="card"><span>Opportunity</span><strong>${p.opportunityScore}/100</strong></div>
    <div class="card"><span>Readiness</span><strong>${p.completeness}%</strong></div>
  </section>
  <section class="card">
    <h2>Executive Summary</h2>
    ${Object.entries(p.summary).map(([key, value]) => `<p><strong>${safe(key)}:</strong> ${safe(value)}</p>`).join("")}
  </section>
  <section class="card">
    <h2>Business Story</h2>
    <p>${safe(p.story)}</p>
  </section>
  <section class="grid">
    <div class="card wide"><span>Evidence</span><strong>Revenue momentum</strong><p>${safe(`Revenue ${p.momentum >= 0 ? "improved" : "softened"} ${Math.abs(p.momentum).toFixed(1)}% in the later period.`)}</p></div>
    <div class="card wide"><span>Evidence</span><strong>Concentration</strong><p>${safe(`${p.topCustomer} represents ${Math.round(p.topCustomerShare)}% of revenue.`)}</p></div>
  </section>
  <section class="card">
    <h2>Recommendations</h2>
    ${p.actions.map((action, index) => `<div class="rec"><h3>${index + 1}. ${safe(action.title)} · ${safe(action.priority)}</h3><p>${safe(action.reason)} Evidence: ${safe(action.evidence)} Confidence: ${action.confidence}% Business value: ${safe(action.value)}.</p><code>${safe(action.sql)}</code></div>`).join("")}
  </section>
  <section class="card">
    <h2>SQL Appendix</h2>
    ${p.actions.map((action) => `<p><strong>${safe(action.title)}</strong></p><code>${safe(action.sql)}</code>`).join("")}
  </section>
</main></body></html>`;
}

function togglePresentation() {
  document.body.classList.toggle("presentation");
  $("presentationDock").classList.toggle("hidden");
  if (!state.profile) runAnalysis(rowsToObjects(demoRows), "Demo retail sales dataset");
  movePresentation(0);
}

function movePresentation(direction) {
  const sections = ["hero", "dashboard", "story", "insights", "actions", "copilotWorkspace", "console"];
  const labels = ["Landing", "Decision Center", "Business Story", "Evidence", "Recommendations", "Copilot", "Board Report"];
  state.presentationIndex = clamp(state.presentationIndex + direction, 0, sections.length - 1);
  if (["brief", "story", "insights", "actions", "console", "copilotWorkspace"].includes(sections[state.presentationIndex])) showPanel(sections[state.presentationIndex]);
  $(sections[state.presentationIndex]).scrollIntoView({ behavior: "smooth", block: "start" });
  $("presentationLabel").textContent = labels[state.presentationIndex];
}

function showPanel(target) {
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    const active = panel.id === target;
    panel.classList.toggle("active-panel", active);
    panel.classList.toggle("panel-collapsed", !active);
  });
  document.querySelectorAll(".tab-button").forEach((button) => button.classList.toggle("active", button.dataset.target === target));
  document.querySelectorAll(".tab-button").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.target === target)));
}

function decryptHeroTitle() {
  const title = document.querySelector(".decrypt-title");
  if (!title) return;
  const original = title.dataset.text;
  const chars = "A1B2C3D4E5F6G7H8I9J0KLMNPQRSTUVXYZ";
  let frame = 0;
  const timer = setInterval(() => {
    title.textContent = original.split("").map((char, index) => {
      if (char === " " || index < frame) return char;
      return chars[Math.floor(Math.random() * chars.length)];
    }).join("");
    frame += 1;
    if (frame > original.length) {
      title.textContent = original;
      clearInterval(timer);
    }
  }, 36);
}

function animateNumber(node, target, suffix = "") {
  const start = performance.now();
  const duration = 900;
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    node.textContent = `${Math.round(target * eased)}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function averageOf(values) {
  return values.length ? sum(values) / values.length : 0;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
