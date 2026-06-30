"use strict";

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
  presentationIndex: 0,
  thinkingTimer: null,
  thinkingDoneTimer: null,
  replayTimer: null
};

const NUMBER_WORDS = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  fifteen: 15,
  twenty: 20
};

const $ = (id) => document.getElementById(id);
const money = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
const safe = (value) => escapeHTML(String(value ?? ""));

document.addEventListener("DOMContentLoaded", () => {
  drawHeroChart();
  decryptHeroTitle();
  bindUIEvents();
  setupTabAccessibility();
  $("copilotToggle")?.setAttribute("aria-expanded", "false");
  $("copilotPanel")?.setAttribute("aria-hidden", "true");
  showPanel("brief");
  updateHeroPreviewFallback();
  updateHeroScoreFallback();
  seedQuickPrompts();
});

function bindUIEvents() {
  on("demoButton", "click", () => runAnalysis(rowsToObjects(demoRows), "Demo retail sales dataset"));
  on("csvInput", "change", handleUpload);
  on("runQuery", "click", runAnalystQuery);
  on("analystInput", "input", runAnalystQuery);
  on("reportButton", "click", downloadReport);
  on("copilotToggle", "click", () => {
    const panel = $("copilotPanel");
    if (!panel) return;
    panel.classList.toggle("collapsed");
    const expanded = !panel.classList.contains("collapsed");
    $("copilotToggle")?.setAttribute("aria-expanded", String(expanded));
    panel.setAttribute("aria-hidden", String(!expanded));
  });
  on("closeCopilot", "click", () => {
    $("copilotPanel")?.classList.add("collapsed");
    $("copilotToggle")?.setAttribute("aria-expanded", "false");
    $("copilotPanel")?.setAttribute("aria-hidden", "true");
  });
  on("presentationToggle", "click", togglePresentation);
  on("stepForward", "click", () => movePresentation(1));
  on("stepBack", "click", () => movePresentation(-1));
  document.querySelectorAll(".tab-button").forEach((button) => button.addEventListener("click", () => showPanel(button.dataset.target)));
  document.querySelectorAll(".dock-nav button").forEach((button) => button.addEventListener("click", () => {
    const target = button.dataset.jump;
    if (["brief", "story", "insights", "actions", "console", "copilotWorkspace"].includes(target)) showPanel(target);
    $(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
}

function on(id, eventName, handler) {
  const node = $(id);
  if (!node) {
    console.warn(`Missing DOM element: #${id}`);
    return;
  }
  node.addEventListener(eventName, handler);
}

function setupTabAccessibility() {
  const tabs = [...document.querySelectorAll(".tab-button")];
  tabs.forEach((button, index) => {
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End", "Enter", " "].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Enter" || event.key === " ") {
        button.click();
        return;
      }
      let nextIndex = index;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabs.length - 1;
      tabs[nextIndex].focus();
      tabs[nextIndex].click();
    });
  });
}

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
  if (!text || !String(text).trim()) throw new Error("This CSV is empty. Upload a file with headers and at least one data row.");
  const parsed = parseCSVRows(String(text).replace(/^\uFEFF/, ""));
  const nonEmptyRows = parsed.filter((row) => row.some((cell) => String(cell ?? "").trim().length));
  if (nonEmptyRows.length < 2) throw new Error("This CSV needs a header row and at least one data row.");
  if (nonEmptyRows[0].every((cell) => !String(cell || "").trim())) throw new Error("This CSV is missing usable column headers.");
  if (nonEmptyRows[0].length > 100) throw new Error("This CSV has too many columns for this live demo. Please keep it under 100 columns.");
  return rowsToObjects(nonEmptyRows);
}

function parseCSVRows(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  if (quoted) throw new Error("This CSV has an unmatched quote. Please export it again and retry.");

  if (value.length || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows;
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
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (trimmed === "") return null;

  const canonical = trimmed.replace(/^[$€£¥]/, "").replaceAll(",", "").replace(/%$/, "");
  const number = Number(canonical);
  if (Number.isFinite(number)) return number;

  return trimmed;
}

function runAnalysis(rows, label) {
  if (!Array.isArray(rows) || !rows.length) {
    showToast("CLARITY needs at least one row of data to analyze.");
    return;
  }
  clearAnalysisTimers();
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
      ["dashboard", "brief", "story", "insights", "actions", "console", "copilot", "copilotWorkspace"].forEach((id) => $(id)?.classList.remove("hidden"));
      showPanel("brief");
      answerPrompt("Proactive brief");
      updateHeroPreviewFromProfile(state.profile);
      updateHeroScoreFallback();
      $("dashboard")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
  state.thinkingTimer = window.setInterval(() => {
    items.forEach((item, itemIndex) => {
      item.classList.toggle("active", itemIndex === index);
      item.classList.toggle("done", itemIndex < index);
    });
    $("thinkingTitle").textContent = liveSteps[Math.min(index, liveSteps.length - 1)];
    index++;
    if (index > liveSteps.length) {
      window.clearInterval(state.thinkingTimer);
      state.thinkingTimer = null;
      state.thinkingDoneTimer = window.setTimeout(() => {
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
  state.replayTimer = window.setTimeout(() => {
    $("replay").classList.add("hidden");
    done();
  }, 2600);
}

function analyze(rows, label) {
  const columns = Object.keys(rows[0] || {});
  if (!columns.length) throw new Error("This dataset has no usable columns.");
  const numericColumns = columns.filter((column) => rows.some((row) => typeof row[column] === "number" && Number.isFinite(row[column])));
  const revenueColumn = pickColumn(columns, ["revenue", "sales", "amount", "income", "turnover", "total", "value"]) || numericColumns[0];
  if (!revenueColumn) throw new Error("CLARITY could not find a numeric business metric. Add a revenue, sales, amount, total, value, or numeric column.");
  const marginColumn = pickColumn(columns, ["margin", "profit", "gross"]);
  const unitsColumn = pickColumn(columns, ["units", "qty", "quantity", "volume", "orders"]);
  const dateColumn = pickColumn(columns, ["date", "month", "created", "timestamp"]);
  const customerColumn = pickColumn(columns, ["customer", "client", "company", "account", "buyer"]);
  const categoryColumn = pickColumn(columns, ["category", "product", "segment", "department"]);
  const repeatColumn = pickColumn(columns, ["repeat", "retention", "returning", "loyal"]);
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
  const margin = marginColumn ? rows.reduce((sum, row) => sum + (Number(row[marginColumn]) || 0), 0) : null;
  const marginRate = margin !== null && revenue > 0 ? (margin / revenue) * 100 : null;
  const totalUnits = unitsColumn ? rows.reduce((sum, row) => sum + Math.max(0, Number(row[unitsColumn]) || 0), 0) : 0;
  const averageOrderValue = values.length ? revenue / values.length : 0;
  const repeatCustomers = customerColumn
    ? rows.filter((row) => {
      if (repeatColumn) return /^(yes|y|true|1|repeat|returning)$/i.test(String(row[repeatColumn] ?? "").trim());
      const customer = String(row[customerColumn] ?? "").trim();
      if (!customer) return false;
      return rows.filter((innerRow) => String(innerRow[customerColumn] ?? "").trim() === customer).length > 1;
    }).length
    : 0;
  const repeatRate = rows.length ? (repeatCustomers / rows.length) * 100 : 0;
  const avgSatisfaction = satisfactionColumn ? averageOf(rows.map((row) => Number(row[satisfactionColumn])).filter(Number.isFinite)) : 82;

  const riskScore = clamp(Math.round(30 + Math.max(0, -momentum) * 0.75 + topCustomerShare * 0.45 + (100 - avgSatisfaction) * 0.35 + duplicateRecords * 4), 12, 91);
  const opportunityScore = clamp(Math.round(52 + Math.max(0, momentum) * 0.45 + topCategoryShare * 0.25 + avgSatisfaction * 0.18 + (marginRate !== null ? marginRate * 0.32 : 0)), 42, 96);
  const confidence = clamp(Math.round(quality * 0.68 + Math.min(rows.length, 80) * 0.28), 55, 96);
  const health = clamp(Math.round(quality * 0.44 + (100 - riskScore) * 0.25 + opportunityScore * 0.2 + confidence * 0.11), 45, 97);
  const topCategory = categoryEntries[0]?.[0] || "the leading segment";
  const topCustomer = customerEntries[0]?.[0] || "the largest customer";
  const trendWord = momentum >= 0 ? "improved" : "softened";
  const customerSql = `SELECT ${customerColumn || "customer"}, SUM(${revenueColumn}) AS revenue FROM dataset GROUP BY ${customerColumn || "customer"} ORDER BY revenue DESC LIMIT 10;`;
  const categorySql = `SELECT ${categoryColumn || "category"}, SUM(${revenueColumn}) AS revenue FROM dataset GROUP BY ${categoryColumn || "category"} ORDER BY revenue DESC LIMIT 10;`;
  const qualitySql = `SELECT COUNT(*) AS records, SUM(CASE WHEN ${revenueColumn} IS NULL THEN 1 ELSE 0 END) AS missing_revenue FROM dataset;`;
  const marginSql = `SELECT ${marginColumn || "NULL"} AS margin, ${revenueColumn} AS revenue FROM dataset;`;

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
    marginRate,
    unitsColumn,
    totalUnits,
    averageOrderValue,
    repeatColumn,
    repeatCustomers,
    repeatRate,
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
      "Decision": momentum < 0 ? "Stabilize repeat revenue before expanding promotions." : "Scale the strongest segment while protecting performance quality.",
      "Why Now": `Revenue ${trendWord} ${Math.abs(momentum).toFixed(1)}% in the later period, while ${topCustomer} now represents ${Math.round(topCustomerShare)}% of revenue.`,
      "Opportunity": `${topCategory} is the highest-confidence growth lane at ${Math.round(topCategoryShare)}% of measured revenue.${marginRate !== null ? ` Estimated margin rate is ${marginRate.toFixed(1)}%.` : ""}`,
      "Risk": `Customer concentration can turn a manageable slowdown into a board-level miss if buying behavior changes.`,
      "Impact": `A 5% improvement in retention or premium mix protects approximately ${money(revenue * 0.05)} over a similar period.${averageOrderValue ? ` Average order value is ${money(averageOrderValue)}.` : ""}`
    },
    story: `The business entered the period with measurable demand, then momentum ${momentum >= 0 ? "accelerated" : "softened"}. ${topCustomer} now represents ${Math.round(topCustomerShare)}% of revenue, so concentration risk is material. ${topCategory} contributes ${Math.round(topCategoryShare)}% of revenue and remains the strongest growth lane. Repeat customer activity is ${Math.round(repeatRate)}%, and average order value is ${money(averageOrderValue)}. Leadership should protect key accounts, keep focus on high-performing categories, and improve dataset quality before expanding broad promotions.`,
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
        priority: marginRate !== null && marginRate < 18 ? "HIGH" : "MEDIUM",
        title: "Improve unit economics",
        reason: marginRate !== null
          ? `Current margin rate is ${marginRate.toFixed(1)}%, leaving limited room for aggressive discounting.`
          : `Margin column not provided; monitor contribution quality while scaling revenue.`,
        evidence: marginRate !== null
          ? `Revenue ${money(revenue)} and margin ${money(margin)} indicate a ${marginRate.toFixed(1)}% margin rate.`
          : `Dataset has ${rows.length} records but no explicit margin column.`,
        sql: marginSql,
        chart: "Margin resilience check",
        explanation: marginRate !== null
          ? "Protecting margin quality prevents growth that looks strong in volume but weak in profitability."
          : "Capturing margin in future uploads improves recommendation precision.",
        value: marginRate !== null ? money(revenue * 0.03) : "Higher profitability visibility",
        confidence: clamp(confidence - (marginRate === null ? 12 : 4), 45, 99),
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
    const rawKey = keyColumn ? keyFormatter(row[keyColumn]) : "All Records";
    const key = rawKey === null || rawKey === undefined || String(rawKey).trim() === "" ? "Unknown" : String(rawKey);
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
  updateHeroPreviewFromProfile(p);
  updateHeroScoreFallback();
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
    ["Avg Order Value", Math.round(p.averageOrderValue || 0), "$"],
    ["Repeat Rate", Math.round(p.repeatRate || 0), "%"]
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
  drawHeroSparkline($("heroMiniChart"), p.monthEntries);
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
  const miniChart = $("heroMiniChart");
  if (!miniChart) return;
  drawHeroSparkline(miniChart, state.profile?.monthEntries || []);
}

function drawHeroSparkline(canvas, entries) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const values = entries.length ? entries.map((entry) => Number(entry[1]) || 0) : [12, 20, 16, 28, 24, 30];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 12;
  const w = canvas.width;
  const h = canvas.height;

  ctx.strokeStyle = "rgba(255,255,255,.12)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const y = pad + i * ((h - pad * 2) / 3);
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(w - pad, y);
    ctx.stroke();
  }

  ctx.beginPath();
  values.forEach((value, index) => {
    const x = pad + (index / Math.max(values.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - ((value - min) / Math.max(max - min, 1)) * (h - pad * 2);
    index ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  });
  ctx.strokeStyle = "#46e3ff";
  ctx.lineWidth = 2.4;
  ctx.shadowColor = "rgba(70,227,255,.4)";
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawLineChart(canvas, entries, color) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  clearCanvas(ctx, canvas);
  if (!entries.length) {
    grid(ctx, canvas, 48);
    ctx.fillStyle = "#9aa9bd";
    ctx.font = "20px Inter, sans-serif";
    ctx.fillText("No trend data available", 56, canvas.height / 2);
    return;
  }
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
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  clearCanvas(ctx, canvas);
  if (!entries.length) {
    grid(ctx, canvas, 46);
    ctx.fillStyle = "#9aa9bd";
    ctx.font = "20px Inter, sans-serif";
    ctx.fillText("No category data available", 56, canvas.height / 2);
    return;
  }
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
  const question = ($("analystInput")?.value || "Show top 10 customers").trim().toLowerCase();
  const { limit: requestedLimit, explicit } = parseRequestedLimit(question);

  const wantsProduct = /product|category|segment|department|sku|item|catalog/i.test(question);
  const wantsCategoryComparison = /compare|comparison|versus|vs|mix/i.test(question) && /category|segment|product/i.test(question);
  const wantsWorst = /worst|lowest|bottom|least/i.test(question);
  const wantsRisk = /risk|danger|dependency|concentration|exposure/i.test(question);
  const wantsConcentration = /concentration|dependency|dependence|single customer/i.test(question);
  const wantsOpportunity = /opportunity|growth|upside/i.test(question);
  const wantsTrend = /trend|month|monthly|time|timeline|revenue trend/i.test(question);
  const wantsMargin = /margin|profit|profitability|unit economics/i.test(question);
  const wantsAov = /average order value|aov|avg order/i.test(question);
  const wantsAverageRevenue = /average revenue|avg revenue|average sales|average sale/i.test(question);
  const wantsRepeat = /repeat customers|retention|returning customers|repeat rate/i.test(question);
  const wantsQuality = /data quality|duplicate rows|duplicates|missing values|missing data|outliers|quality/i.test(question);
  const wantsBusinessHealth = /business health|health score/i.test(question);
  const wantsExecutiveSummary = /executive summary|board summary|summary/i.test(question);
  const wantsSql = /generate sql|show sql|sql/i.test(question);
  const wantsDecision = /decision|recommendation|recommended action|what should/i.test(question);

  const singleResultIntent = !explicit && /highest|lowest|biggest|smallest|best performing|top customer|top category/.test(question);
  const limit = singleResultIntent ? 1 : requestedLimit;
  const sortDirection = wantsWorst ? "ASC" : "DESC";

  // ---------- BUSINESS RISKS ----------
  if (wantsRisk) {

    $("queryReasoning").textContent =
      "CLARITY evaluated customer concentration, revenue momentum and data quality to identify executive risk.";

    $("sqlOutput").textContent =
      `SELECT ${p.customerColumn || "customer"}, SUM(${p.revenueColumn}) AS revenue\nFROM dataset\nGROUP BY ${p.customerColumn || "customer"}\nORDER BY revenue DESC\nLIMIT 1;`;

    $("consoleMeaning").textContent =
      `Risk Score ${p.riskScore}/100.\n\n${p.summary.Risk}`;

    renderTable(
      ["Metric","Value"],
      [
        ["Risk Score",p.riskScore],
        ["Largest Customer",p.topCustomer],
        ["Customer Share",Math.round(p.topCustomerShare)+"%"],
        ["Business Health",p.health]
      ]
    );

    return;
  }

  if (wantsConcentration) {
    const top = p.customerEntries.slice(0, Math.max(1, limit));
    const rows = top.map(([customer, value]) => [customer, `${((value / Math.max(p.revenue, 1)) * 100).toFixed(1)}%`, money(value)]);
    $("queryReasoning").textContent = "CLARITY calculated customer concentration by dividing each customer revenue by total revenue.";
    $("sqlOutput").textContent = `SELECT ${p.customerColumn || "customer"},\nSUM(${p.revenueColumn}) AS revenue,\nSUM(${p.revenueColumn}) / (SELECT SUM(${p.revenueColumn}) FROM dataset) * 100 AS revenue_share_pct\nFROM dataset\nGROUP BY ${p.customerColumn || "customer"}\nORDER BY revenue DESC\nLIMIT ${Math.max(1, limit)};`;
    $("consoleMeaning").textContent = `${p.topCustomer} concentration is ${Math.round(p.topCustomerShare)}%. Concentration above 30% should be treated as a board-level monitoring metric.`;
    renderTable(["Customer", "Revenue Share", "Revenue"], rows);
    return;
  }

  // ---------- OPPORTUNITIES ----------
  if (wantsOpportunity) {

    $("queryReasoning").textContent =
      "CLARITY searched for the strongest growth opportunity using category contribution and momentum.";

    $("sqlOutput").textContent =
      `SELECT ${p.categoryColumn || "category"}, SUM(${p.revenueColumn}) AS revenue\nFROM dataset\nGROUP BY ${p.categoryColumn || "category"}\nORDER BY revenue DESC\nLIMIT 1;`;

    $("consoleMeaning").textContent =
      p.summary.Opportunity;

    renderTable(
      ["Opportunity","Value"],
      [
        ["Top Category",p.topCategory],
        ["Revenue Share",Math.round(p.topCategoryShare)+"%"],
        ["Opportunity Score",p.opportunityScore]
      ]
    );

    return;
  }

  if (wantsMargin) {
    if (p.marginRate === null) {
      $("queryReasoning").textContent = "Margin analysis requires a margin/profit column in the uploaded dataset.";
      $("sqlOutput").textContent = `-- Margin column not detected in this dataset`;
      $("consoleMeaning").textContent = "Upload a dataset containing margin, profit, or gross columns for margin analysis.";
      renderTable(["Metric", "Value"], [["Revenue", money(p.revenue)], ["Records", p.rows], ["Status", "Margin column unavailable"]]);
      return;
    }
    $("queryReasoning").textContent = "CLARITY calculated margin rate from total margin and total revenue.";
    $("sqlOutput").textContent = `SELECT SUM(${pickColumn(p.columns, ["margin", "profit", "gross"] ) || "margin"}) AS margin,\nSUM(${p.revenueColumn}) AS revenue,\n(SUM(${pickColumn(p.columns, ["margin", "profit", "gross"] ) || "margin"}) / NULLIF(SUM(${p.revenueColumn}), 0)) * 100 AS margin_rate_pct\nFROM dataset;`;
    $("consoleMeaning").textContent = `Margin rate is ${p.marginRate.toFixed(1)}%. ${p.marginRate < 18 ? "Protect margin before scaling discounts." : "Margin quality supports measured growth."}`;
    renderTable(["Metric", "Value"], [["Total Margin", money(p.margin)], ["Revenue", money(p.revenue)], ["Margin Rate", `${p.marginRate.toFixed(1)}%`]]);
    return;
  }

  if (wantsAov) {
    $("queryReasoning").textContent = "CLARITY estimated average order value by dividing total revenue by number of records with revenue.";
    $("sqlOutput").textContent = `SELECT SUM(${p.revenueColumn}) / NULLIF(COUNT(${p.revenueColumn}), 0) AS average_order_value\nFROM dataset;`;
    $("consoleMeaning").textContent = `Average order value is ${money(p.averageOrderValue)} across ${p.rows} records.`;
    renderTable(["Metric", "Value"], [["Average Order Value", money(p.averageOrderValue)], ["Total Revenue", money(p.revenue)], ["Records", p.rows]]);
    return;
  }

  if (wantsRepeat) {
    $("queryReasoning").textContent = "CLARITY measured repeat activity from repeat flags when available, otherwise from recurring customer names.";
    $("sqlOutput").textContent = p.repeatColumn
      ? `SELECT SUM(CASE WHEN LOWER(${p.repeatColumn}) IN ('yes','y','true','1','repeat','returning') THEN 1 ELSE 0 END) AS repeat_records,\nCOUNT(*) AS total_records\nFROM dataset;`
      : `SELECT ${p.customerColumn || "customer"}, COUNT(*) AS orders\nFROM dataset\nGROUP BY ${p.customerColumn || "customer"}\nHAVING COUNT(*) > 1;`;
    $("consoleMeaning").textContent = `Repeat activity is ${Math.round(p.repeatRate)}% (${p.repeatCustomers} records).`;
    renderTable(["Metric", "Value"], [["Repeat Records", p.repeatCustomers], ["Repeat Rate", `${Math.round(p.repeatRate)}%`], ["Total Records", p.rows]]);
    return;
  }

  if (wantsBusinessHealth) {
    $("queryReasoning").textContent = "CLARITY explains business health from data completeness, duplicates, outliers, risk, opportunity, and confidence.";
    $("sqlOutput").textContent = `SELECT COUNT(*) AS records,\nSUM(${p.revenueColumn}) AS revenue\nFROM dataset;`;
    $("consoleMeaning").textContent = `Business Health is ${p.health}/100. ${p.healthExplanation}`;
    renderTable(
      ["Metric", "Value"],
      [
        ["Business Health", `${p.health}/100`],
        ["Dataset Quality", `${p.quality}%`],
        ["Risk Score", `${p.riskScore}/100`],
        ["Opportunity Score", `${p.opportunityScore}/100`],
        ["AI Confidence", `${p.confidence}%`]
      ]
    );
    return;
  }

  if (wantsQuality) {
    $("queryReasoning").textContent = "CLARITY checks missing values, duplicate records, and unusual transactions because these affect executive confidence.";
    $("sqlOutput").textContent = `SELECT COUNT(*) AS records,\n-- Missing values, duplicate rows and outliers are calculated during dataset profiling\nSUM(${p.revenueColumn}) AS revenue\nFROM dataset;`;
    $("consoleMeaning").textContent = `Dataset quality is ${p.quality}%. CLARITY found ${p.missingCells} missing values, ${p.duplicateRecords} duplicate records, and ${p.outliers} unusual transactions.`;
    renderTable(
      ["Data Quality Metric", "Value"],
      [
        ["Dataset Quality", `${p.quality}%`],
        ["Missing Values", p.missingCells],
        ["Duplicate Records", p.duplicateRecords],
        ["Outliers", p.outliers],
        ["Completeness", `${p.completeness}%`]
      ]
    );
    return;
  }

  if (wantsExecutiveSummary || wantsDecision) {
    $("queryReasoning").textContent = "CLARITY summarizes the computed decision, why it matters, the risk, the opportunity, and the expected impact.";
    $("sqlOutput").textContent = `-- Executive decision is generated from computed profile metrics\nSELECT SUM(${p.revenueColumn}) AS revenue,\nCOUNT(*) AS records\nFROM dataset;`;
    $("consoleMeaning").textContent = `${p.summary.Decision} ${p.summary["Why Now"]}`;
    renderTable(
      ["Executive Brief", "Value"],
      Object.entries(p.summary)
    );
    return;
  }

  if (wantsTrend) {

    $("queryReasoning").textContent =
      "CLARITY groups revenue by month or date to explain business momentum.";

    $("sqlOutput").textContent =
      p.dateColumn
        ? `SELECT ${p.dateColumn}, SUM(${p.revenueColumn}) AS revenue\nFROM dataset\nGROUP BY ${p.dateColumn}\nORDER BY ${p.dateColumn} ASC;`
        : `SELECT SUM(${p.revenueColumn}) AS revenue\nFROM dataset;`;

    $("consoleMeaning").textContent =
      p.story;

    renderTable(
      ["Month","Revenue"],
      p.dateColumn ? p.monthEntries.map(([m,v])=>[m,money(v)]) : [["All Records", money(p.revenue)]]
    );

	    return;
	  }

  if (wantsAverageRevenue) {
    $("queryReasoning").textContent = "CLARITY calculates average revenue per record from total revenue divided by revenue-bearing rows.";
    $("sqlOutput").textContent = `SELECT AVG(${p.revenueColumn}) AS average_revenue,\nSUM(${p.revenueColumn}) AS total_revenue,\nCOUNT(${p.revenueColumn}) AS revenue_records\nFROM dataset;`;
    $("consoleMeaning").textContent = `Average revenue per record is ${money(p.averageOrderValue)} across ${p.rows} records.`;
    renderTable(["Metric", "Value"], [["Average Revenue", money(p.averageOrderValue)], ["Total Revenue", money(p.revenue)], ["Records", p.rows]]);
    return;
  }

  if (wantsSql) {
    $("queryReasoning").textContent = "CLARITY is showing the default transparency query: top customers by total revenue.";
    $("sqlOutput").textContent = `SELECT ${p.customerColumn || "customer"},\nSUM(${p.revenueColumn}) AS revenue\nFROM dataset\nGROUP BY ${p.customerColumn || "customer"}\nORDER BY revenue DESC\nLIMIT ${Math.max(1, limit)};`;
    $("consoleMeaning").textContent = `This query supports the concentration-risk recommendation. ${p.topCustomer} contributes ${Math.round(p.topCustomerShare)}% of revenue.`;
    renderTable(["Customer", "Revenue"], p.customerEntries.slice(0, Math.max(1, limit)).map(([name, revenue]) => [name, money(revenue)]));
    return;
  }

  if (wantsCategoryComparison) {
    const topCategories = p.categoryEntries.slice(0, Math.max(2, limit));
    const rows = topCategories.map(([name, value]) => [name, money(value), `${((value / Math.max(p.revenue, 1)) * 100).toFixed(1)}%`]);
    $("queryReasoning").textContent = "CLARITY compared category revenue contribution and share of total revenue.";
    $("sqlOutput").textContent = `SELECT ${p.categoryColumn || "category"},\nSUM(${p.revenueColumn}) AS revenue,\nSUM(${p.revenueColumn}) / (SELECT SUM(${p.revenueColumn}) FROM dataset) * 100 AS revenue_share_pct\nFROM dataset\nGROUP BY ${p.categoryColumn || "category"}\nORDER BY revenue DESC\nLIMIT ${Math.max(2, limit)};`;
    $("consoleMeaning").textContent = `Top category is ${p.topCategory} at ${Math.round(p.topCategoryShare)}% share.`;
    renderTable(["Category", "Revenue", "Revenue Share"], rows);
    return;
  }

  // ---------- PRODUCTS / CATEGORIES ----------
  if (wantsProduct) {
    renderRankedBreakdown({
      entries: p.categoryEntries,
      column: p.categoryColumn || "category",
      label: "Category",
      metric: p.revenueColumn,
      limit,
      sortDirection,
      reasoning: `CLARITY ranked ${p.categoryColumn || "categories"} using total ${p.revenueColumn}.`,
      meaning: `${p.topCategory} contributes ${Math.round(p.topCategoryShare)}% of total revenue.`
    });
    return;
  }

  // ---------- CUSTOMERS ----------
  renderRankedBreakdown({
    entries: p.customerEntries,
    column: p.customerColumn || "customer",
    label: "Customer",
    metric: p.revenueColumn,
    limit,
    sortDirection,
    reasoning: `CLARITY ranked customers by total ${p.revenueColumn} to identify concentration and executive priorities.`,
    meaning: `${p.topCustomer} contributes ${Math.round(p.topCustomerShare)}% of total revenue.`
  });
}

function parseRequestedLimit(question) {
  const defaultLimit = 10;
  const digitMatch = question.match(/\b(?:top|bottom|first|last)\s+(\d+)\b/) || question.match(/\b(\d+)\s+(?:customers?|clients?|accounts?|companies?|buyers?|products?|categories?|segments?)\b/);
  if (digitMatch) return { limit: Math.max(1, Number(digitMatch[1])), explicit: true };

  const words = Object.keys(NUMBER_WORDS).join("|");
  const wordRegex = new RegExp(`\\b(?:top|bottom|first|last)\\s+(${words})\\b`);
  const wordCountRegex = new RegExp(`\\b(${words})\\s+(?:customers?|clients?|accounts?|companies?|buyers?|products?|categories?|segments?)\\b`);
  const wordMatch = question.match(wordRegex) || question.match(wordCountRegex);
  if (wordMatch) return { limit: NUMBER_WORDS[wordMatch[1]] || defaultLimit, explicit: true };

  return { limit: defaultLimit, explicit: false };
}

function renderRankedBreakdown({ entries, column, label, metric, limit, sortDirection, reasoning, meaning }) {
  const ordered = [...entries].sort((a, b) => sortDirection === "ASC" ? a[1] - b[1] : b[1] - a[1]);
  const rows = ordered.slice(0, Math.max(1, limit)).map(([name, revenue]) => [name, money(revenue)]);

  $("queryReasoning").textContent = reasoning;
  $("sqlOutput").textContent = `SELECT ${column},\nSUM(${metric}) AS revenue\nFROM dataset\nGROUP BY ${column}\nORDER BY revenue ${sortDirection}\nLIMIT ${Math.max(1, limit)};`;
  $("consoleMeaning").textContent = meaning;
  renderTable([label, "Revenue"], rows);
}

function renderTable(headers, rows) {
  const table = $("resultTable");
  if (!table) return;
  const bodyRows = rows.length
    ? rows.map((row) => `<tr>${row.map((cell) => `<td>${safe(cell)}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="${headers.length}">No matching records</td></tr>`;
  table.innerHTML = `<thead><tr>${headers.map((h) => `<th>${safe(h)}</th>`).join("")}</tr></thead><tbody>${bodyRows}</tbody>`;
}

function clearAnalysisTimers() {
  if (state.thinkingTimer) {
    window.clearInterval(state.thinkingTimer);
    state.thinkingTimer = null;
  }
  if (state.thinkingDoneTimer) {
    window.clearTimeout(state.thinkingDoneTimer);
    state.thinkingDoneTimer = null;
  }
  if (state.replayTimer) {
    window.clearTimeout(state.replayTimer);
    state.replayTimer = null;
  }
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
  const primaryAction = p.actions?.[0];
  const backupAction = p.actions?.[1];
  let answer;
  if (lower.includes("proactive")) {
    answer = `Top priorities: ${primaryAction?.title || `protect ${p.topCustomer}`}, ${backupAction?.title || `focus on ${p.topCategory}`}, and improve data quality by addressing ${p.missingCells} missing values. Primary recommendation: ${p.summary.Decision}`;
  } else if (lower.includes("explain") || lower.includes("falling")) {
    answer = `Revenue ${p.momentum >= 0 ? "improved" : "declined"} ${Math.abs(p.momentum).toFixed(1)}% between the first and second half. ${p.summary["Why Now"]} Next decision: ${primaryAction?.title || "protect top customers first"}.`;
  } else if (lower.includes("evidence") || lower.includes("risk")) {
    answer = `Biggest risk is concentration: ${p.topCustomer} contributes ${Math.round(p.topCustomerShare)}% of revenue. ${p.summary.Risk}`;
    showPanel("insights");
  } else if (lower.includes("what if")) {
    answer = `If retention or premium mix improves by 5%, CLARITY estimates about ${money(p.revenue * 0.05)} protected revenue. Highest-leverage path: ${primaryAction?.title || `protect ${p.topCustomer}`} and ${backupAction?.title || `focus on ${p.topCategory}`}.`;
  } else if (lower.includes("sql")) {
    answer = `I opened the SQL Explorer with the supporting query. It ranks accounts by revenue so the recommendation is traceable, not guessed.`;
    showPanel("console");
    $("console").scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (lower.includes("products") || lower.includes("category")) {
    answer = `Focus on ${p.topCategory}. It contributes ${Math.round(p.topCategoryShare)}% of revenue, which makes it the strongest near-term growth lane. The second move is to build an adjacent category so the business is not dependent on one engine.`;
  } else {
    answer = `Board summary: business health is ${p.health}/100 with ${p.confidence}% confidence. Revenue is ${money(p.revenue)}. Top opportunity: ${p.topCategory}. Top risk: dependence on ${p.topCustomer}. Recommended action: ${p.summary.Decision}`;
  }
  $("copilotAnswer").textContent = answer;
  $("workspaceCopilotAnswer").textContent = answer;
  $("copilotPanel")?.classList.remove("collapsed");
  $("copilotToggle")?.setAttribute("aria-expanded", "true");
  $("copilotPanel")?.setAttribute("aria-hidden", "false");
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
    panel.setAttribute("aria-hidden", String(!active));
  });
  document.querySelectorAll(".tab-button").forEach((button) => button.classList.toggle("active", button.dataset.target === target));
  document.querySelectorAll(".tab-button").forEach((button) => {
    const active = button.dataset.target === target;
    button.setAttribute("aria-selected", String(active));
    button.setAttribute("tabindex", active ? "0" : "-1");
  });
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

function updateHeroPreviewFromProfile(profile) {
  if (!profile) return;
  const topAction = profile.actions?.[0];
  const trendSentence = `Revenue ${profile.momentum >= 0 ? "improved" : "softened"} ${Math.abs(profile.momentum).toFixed(1)}% while ${profile.topCustomer} now represents ${Math.round(profile.topCustomerShare)}% of revenue.`;

  if ($("heroTopRisk")) $("heroTopRisk").textContent = `${profile.topCustomer} concentration`;
  if ($("heroBestMove")) $("heroBestMove").textContent = topAction?.title || profile.summary.Decision;
  if ($("heroInsight")) $("heroInsight").textContent = trendSentence;
  if ($("heroScore")) $("heroScore").textContent = String(profile.health);
}

function updateHeroPreviewFallback() {
  if (state.profile) return;
  if ($("heroTopRisk")) $("heroTopRisk").textContent = "Load dataset";
  if ($("heroBestMove")) $("heroBestMove").textContent = "Run analysis";
}

function updateHeroScoreFallback() {
  const scoreNode = $("heroScore");
  if (!scoreNode) return;
  if (state.profile) return;
  scoreNode.textContent = "91";
}
