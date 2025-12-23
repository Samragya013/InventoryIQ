/**
 * InventoryIQ - Enterprise Inventory Planning Dashboard
 * =====================================================
 * 
 * Market-driven inventory intelligence platform.
 * Uses market and category controls (no raw IDs exposed).
 */

/* ================= DOM REFERENCES (lazy loaded) ================= */
let marketSelect = null;
let categorySelect = null;
let generateBtn = null;
let resultsArea = null;
let riskSummary = null;
let summaryBar = null;
let summaryText = null;

let forecastChart = null;
let currentPlanData = null;

/* ================= PARTICLE BACKGROUND ================= */

function createParticles() {
  const container = document.getElementById("particleContainer");
  if (!container) return;
  
  const particleCount = 30;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    
    const size = Math.random() * 3 + 1;
    const duration = Math.random() * 8 + 6;
    const delay = Math.random() * 2;
    const drift = (Math.random() - 0.5) * 100;
    const left = Math.random() * 100;
    
    particle.style.width = size + "px";
    particle.style.height = size + "px";
    particle.style.left = left + "%";
    particle.style.bottom = "-10px";
    particle.style.backgroundColor = `rgba(59, 130, 246, ${Math.random() * 0.5 + 0.2})`;
    particle.style.setProperty("--drift", drift + "px");
    particle.style.animation = `float ${duration}s linear ${delay}s infinite`;
    
    container.appendChild(particle);
  }
}

/* ================= INITIALIZE APP ================= */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  // DOM already loaded, run immediately
  initializeApp();
}

function initializeApp() {
  // Initialize DOM references after DOM is ready
  marketSelect = document.getElementById("marketSelect");
  categorySelect = document.getElementById("categorySelect");
  generateBtn = document.getElementById("generateBtn");
  resultsArea = document.getElementById("resultsArea");
  riskSummary = document.getElementById("riskSummary");
  summaryBar = document.getElementById("summaryBar");
  summaryText = document.getElementById("summaryText");
  
  // Create particles
  createParticles();
  
  // Load data and attach listeners
  loadMarkets();
  loadCategories();
  loadMarketFocus();
  attachEventListeners();
  attachMarketFilterListener();
  renderInitialStates();
}

/* ================= INITIAL STATES (FALLBACK) ================= */

function renderInitialStates() {
  // Show market-wide overview as default state for all cards
  renderBusinessImpactFallback();
  renderInactionRiskFallback();
  renderScenarioSnapshotFallback();
  renderForecastFallback();
  renderResultsFallback();
  renderRiskSummaryFallback();
  renderConfidenceFallback();
  renderOperationalRecFallback();
  renderModelHealthFallback();
}

function renderBusinessImpactFallback() {
  const container = document.getElementById('businessImpact');
  if (!container) return;
  
  container.innerHTML = `
    <div class="fallback-state">
      <div class="fallback-icon">📊</div>
      <div class="fallback-text">
        <span class="fallback-title">Market-wide Overview</span>
        <span class="fallback-description">Generate a plan to see projected business impact</span>
      </div>
    </div>
  `;
}

function renderInactionRiskFallback() {
  const container = document.getElementById('inactionRisk');
  if (!container) return;
  
  container.innerHTML = `
    <div class="fallback-state">
      <div class="fallback-icon">⚠️</div>
      <div class="fallback-text">
        <span class="fallback-title">Risk Assessment Pending</span>
        <span class="fallback-description">Generate a plan to evaluate inaction risks</span>
      </div>
    </div>
  `;
}

function renderScenarioSnapshotFallback() {
  const container = document.getElementById('scenarioSnapshot');
  if (!container) return;
  
  container.innerHTML = `
    <div class="fallback-state">
      <div class="fallback-icon">🔄</div>
      <div class="fallback-text">
        <span class="fallback-title">Scenarios Ready</span>
        <span class="fallback-description">What-if analysis will appear after plan generation</span>
      </div>
    </div>
  `;
}

function renderForecastFallback() {
  const ctx = document.getElementById("forecastChart");
  if (!ctx) return;
  
  // Clear existing chart
  if (forecastChart) {
    forecastChart.destroy();
    forecastChart = null;
  }
  
  // Create empty chart with message
  forecastChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Awaiting Plan"],
      datasets: [{
        label: "Forecast pending",
        data: [0],
        backgroundColor: "rgba(100, 116, 139, 0.3)",
        borderColor: "rgba(100, 116, 139, 0.5)",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Select market and generate plan to view forecast",
          color: "#94a3b8",
          font: { size: 14, weight: 400 }
        }
      },
      scales: {
        x: { ticks: { color: "#64748b" }, grid: { display: false } },
        y: { ticks: { color: "#64748b" }, grid: { color: "rgba(100, 116, 139, 0.1)" } }
      }
    }
  });
}

function renderResultsFallback() {
  const container = document.getElementById('resultsArea');
  if (!container) return;
  
  container.className = "placeholder";
  container.innerHTML = `
    <div class="fallback-state centered">
      <div class="fallback-icon large">📋</div>
      <div class="fallback-text">
        <span class="fallback-title">Ready to Generate Plan</span>
        <span class="fallback-description">Select a market and category, then click "Generate Inventory Plan"</span>
      </div>
    </div>
  `;
}

function renderRiskSummaryFallback() {
  const container = document.getElementById('riskSummary');
  if (!container) return;
  
  container.innerHTML = `
    <div class="fallback-state">
      <div class="fallback-icon">📈</div>
      <div class="fallback-text">
        <span class="fallback-title">Risk Analysis</span>
        <span class="fallback-description">Product-level risk assessment pending</span>
      </div>
    </div>
  `;
}

function renderConfidenceFallback() {
  const container = document.getElementById('confidenceBox');
  if (!container) return;
  
  container.innerHTML = `
    <div class="confidence-item fallback">
      <div class="confidence-icon">🎯</div>
      <div class="confidence-text">
        <span class="confidence-label">PLANNING ASSUMPTIONS</span>
        <span class="confidence-description">
            Key reasoning will appear after you generate a plan.
        </span>
      </div>
    </div>
  `;
}

function renderOperationalRecFallback() {
  const container = document.getElementById('operationalRec');
  if (!container) return;
  
  container.innerHTML = `
    <div class="fallback-state">
      <div class="fallback-icon">✅</div>
      <div class="fallback-text">
        <span class="fallback-title">Action Recommendations</span>
        <span class="fallback-description">Next steps will be provided after plan generation</span>
      </div>
    </div>
  `;
}

function renderModelHealthFallback() {
  const container = document.getElementById('modelHealth');
  if (!container) return;
  
  container.innerHTML = `
    <div class="health-item">
      <span class="health-label">SYSTEM STATUS</span>
      <span class="health-value">Online</span>
      <span class="health-status">✓ Ready</span>
    </div>
    <div class="health-item">
      <span class="health-label">MODEL VERSION</span>
      <span class="health-value">v1.0 Enterprise</span>
      <span class="health-status">✓ Active</span>
    </div>
  `;
}

/* ================= LOADING STATES ================= */

function showLoadingState(containerId, message = "Loading...") {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <span class="loading-text">${message}</span>
    </div>
  `;
}

/* ================= MARKET FOCUS ================= */

function loadMarketFocus(marketFilter = "all") {
  const marketFocusContent = document.getElementById("marketFocusContent");
  const marketFilterSelect = document.getElementById("marketFilter");
  
  const url = marketFilter && marketFilter !== "all" 
    ? `/api/v1/market/summary?market=${encodeURIComponent(marketFilter)}`
    : "/api/v1/market/summary";
  
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      renderMarketFocus(data);
      
      if (marketFilter === "all" && marketFilterSelect && marketFilterSelect.options.length <= 1) {
        populateMarketFilter(data);
      }
    })
    .catch(error => {
      console.error("Error loading market focus:", error);
      if (marketFocusContent) {
        marketFocusContent.innerHTML = `
          <div class="market-focus-error">
            Unable to load market intelligence. Please refresh the page.
          </div>
        `;
      }
    });
}

function populateMarketFilter(data) {
  const marketFilterSelect = document.getElementById("marketFilter");
  if (!marketFilterSelect) return;
  
  data.forEach(market => {
    const opt = document.createElement("option");
    opt.value = market.market;
    opt.textContent = market.market;
    marketFilterSelect.appendChild(opt);
  });
}

function attachMarketFilterListener() {
  const marketFilterSelect = document.getElementById("marketFilter");
  if (!marketFilterSelect) return;
  
  marketFilterSelect.addEventListener("change", () => {
    const selectedMarket = marketFilterSelect.value;
    loadMarketFocus(selectedMarket);
  });
}

function renderMarketFocus(data) {
  const marketFocusContent = document.getElementById("marketFocusContent");
  if (!marketFocusContent) return;
  
  if (!data || data.length === 0) {
    marketFocusContent.innerHTML = `
      <div class="market-focus-empty">
        No market data available for the selected filter.
      </div>
    `;
    return;
  }
  
  let html = '<div class="market-focus-grid">';
  
  data.forEach(market => {
    const attentionClass = market.attention_level.toLowerCase();
    const attentionIcon = getAttentionIcon(market.attention_level);
    
    html += `
      <div class="market-focus-item ${attentionClass}">
        <div class="market-focus-item-header">
          <span class="market-name">${market.market}</span>
          <span class="attention-badge ${attentionClass}">
            ${attentionIcon} ${market.attention_level}
          </span>
        </div>
        <div class="market-focus-item-body">
          <p class="market-explanation">${market.explanation}</p>
          <div class="market-meta">
            <span class="demand-trend">${market.demand_trend}</span>
            <span class="strategy-hint">${market.strategy_recommendation}</span>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  marketFocusContent.innerHTML = html;
}

function getAttentionIcon(level) {
  switch (level) {
    case "High": return "🔴";
    case "Medium": return "🟡";
    case "Low": return "🟢";
    default: return "⚪";
  }
}

/* ================= LOAD MARKETS ================= */

function loadMarkets() {
  fetch("/api/v1/markets")
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(markets => {
      if (!marketSelect) return;
      
      if (!Array.isArray(markets) || markets.length === 0) {
        console.warn("No markets returned from API");
        return;
      }
      
      markets.forEach(market => {
        const opt = document.createElement("option");
        opt.value = market;
        opt.textContent = market;
        marketSelect.appendChild(opt);
      });
    })
    .catch(error => {
      console.error("Error loading markets:", error);
    });
}

/* ================= LOAD CATEGORIES ================= */

function loadCategories() {
  fetch("/api/v1/categories")
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(categories => {
      if (!categorySelect) return;
      
      if (!Array.isArray(categories) || categories.length === 0) {
        console.warn("No categories returned from API");
        return;
      }
      
      categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat.id;
        opt.textContent = cat.name;
        categorySelect.appendChild(opt);
      });
    })
    .catch(error => {
      console.error("Error loading categories:", error);
    });
}

/* ================= ATTACH EVENT LISTENERS ================= */

function attachEventListeners() {
  if (!generateBtn) return;
  
  /* Generate Button Handler */
  generateBtn.addEventListener("click", generateInventoryPlan);
}

/* ================= GENERATE INVENTORY PLAN ================= */

function generateInventoryPlan() {
  const market = marketSelect ? marketSelect.value : "all";
  const category = categorySelect ? categorySelect.value : "all";
  
  // Show loading states
  showLoadingState('businessImpact', 'Calculating business impact...');
  showLoadingState('inactionRisk', 'Analyzing risk factors...');
  showLoadingState('scenarioSnapshot', 'Building scenarios...');
  showLoadingState('riskSummary', 'Assessing risk levels...');
  
  if (resultsArea) {
    resultsArea.className = "placeholder";
    resultsArea.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <span class="loading-text">Generating inventory plan...</span>
      </div>
    `;
  }
  
  // Build API URL with filters
  let url = `/api/v1/inventory/plan?limit=20`;
  if (market && market !== "all") {
    url += `&market=${encodeURIComponent(market)}`;
  }
  if (category && category !== "all") {
    url += `&category=${encodeURIComponent(category)}`;
  }
  
  // Fetch both plan and metrics in parallel
  Promise.all([
    fetch(url).then(res => res.json()),
    fetch(`/api/v1/inventory/metrics?market=${encodeURIComponent(market)}&category=${encodeURIComponent(category)}`).then(res => res.json())
  ])
    .then(([planData, metricsData]) => {
      currentPlanData = planData;
      
      // Render all sections
      renderChart(planData.recommendations);
      renderTable(planData.recommendations);
      renderBusinessImpactCard(metricsData.business_impact, metricsData.context);
      renderInactionRiskCard(metricsData.inaction_risk, metricsData.context);
      renderScenarioSnapshot(planData.recommendations);
      renderRiskSummaryCard(planData.summary);
      renderConfidenceCard(planData.summary);
      renderOperationalRec(planData.summary, planData.recommendations);
      renderModelHealth(planData.summary);
      updateSummary(planData.summary, planData.recommendations);
      
      // Show scenario controls
      const scenarioSection = document.getElementById("scenarioSection");
      if (scenarioSection) {
        scenarioSection.classList.remove("hidden");
        attachScenarioHandlers(planData.recommendations);
      }
    })
    .catch(error => {
      console.error("Error generating plan:", error);
      renderResultsFallback();
      renderBusinessImpactFallback();
      renderInactionRiskFallback();
    });
}

/* ================= SCENARIO HANDLERS ================= */

function attachScenarioHandlers(originalData) {
  const multiplierInput = document.getElementById("demandMultiplier");
  const multiplierValue = document.getElementById("multiplierValue");
  const multiplierContext = document.getElementById("multiplierContext");
  const presetBtns = document.querySelectorAll(".preset-btn");
  
  if (!multiplierInput) return;

  // Small debounce for smoother chart updates and to avoid rapid re-renders
  function debounce(fn, delay) {
    let t;
    return function(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  }
  
  function getScenarioDescription(value) {
    if (value < 0.8) return "Low demand scenario (risk of overstock)";
    if (value === 1.0) return "Base case (current forecast)";
    if (value > 1.2) return "High demand scenario (risk of stockout)";
    return "Alternative scenario";
  }
  
  // Remove existing listeners by cloning
  const newMultiplierInput = multiplierInput.cloneNode(true);
  multiplierInput.parentNode.replaceChild(newMultiplierInput, multiplierInput);
  
  const applyDebounced = debounce((value) => {
    if (multiplierValue) multiplierValue.textContent = value.toFixed(1) + "x";
    if (multiplierContext) multiplierContext.textContent = getScenarioDescription(value);
    applyScenario(originalData, value);
  }, 150);

  newMultiplierInput.addEventListener("input", () => {
    const value = parseFloat(newMultiplierInput.value);
    applyDebounced(value);
  });
  
  presetBtns.forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener("click", () => {
      const value = parseFloat(newBtn.dataset.value);
      newMultiplierInput.value = value;
      if (multiplierValue) multiplierValue.textContent = value.toFixed(1) + "x";
      if (multiplierContext) multiplierContext.textContent = getScenarioDescription(value);
      
      document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
      newBtn.classList.add("active");
      
      applyScenario(originalData, value);
    });
  });
  
  // Set initial active button
  document.querySelectorAll(".preset-btn").forEach(btn => {
    if (parseFloat(btn.dataset.value) === 1.0) {
      btn.classList.add("active");
    }
  });
}

function applyScenario(originalData, multiplier) {
  // Apply multiplier to data
  const updatedData = originalData.map(row => ({
    ...row,
    forecast_units: Math.round(row.forecast_units * multiplier),
    recommended_order_qty: Math.ceil(row.recommended_order_qty * multiplier)
  }));
  
  // Update relevant sections
  // Do not re-render datasets; only update x-axis labels
  updateChartLabels(updatedData);
  renderTable(updatedData);
  renderScenarioSnapshot(updatedData);
}

/* ================= TABLE RENDER ================= */

function renderTable(data) {
  if (!resultsArea) return;
  
  if (!data || data.length === 0) {
    renderResultsFallback();
    return;
  }
  
  let html = `
    <table>
      <tr>
        <th>Product</th>
        <th>Category</th>
        <th>Market</th>
        <th>Forecast</th>
        <th>Order Qty</th>
        <th>Risk</th>
      </tr>
  `;

  data.forEach(row => {
    const forecastUnitsSafe = Math.max(Number(row.forecast_units) || 0, 1);
    const safetyStockPct = row.safety_buffer_pct || 
      Math.round(((row.recommended_order_qty - forecastUnitsSafe) / forecastUnitsSafe) * 100);
    const safetyStockContext = safetyStockPct > 0 
      ? `+${safetyStockPct}% safety buffer`
      : 'Base forecast';
    
    const riskLevel = row.risk_level || row.demand_risk || 'Medium';
    const confidenceLevel = {
      'Low': 'High',
      'Medium': 'Medium',
      'High': 'Low'
    };

    const productLabel = (row.product_name && String(row.product_name).trim().length > 0)
      ? row.product_name
      : `Product ${row.product_id}`;
    
    html += `
      <tr class="${riskLevel === "High" ? "row-alert" : ""}">
        <td>
          <div class="product-name" title="${productLabel}">${productLabel}</div>
          <div class="product-id subtle">ID: ${row.product_id}</div>
        </td>
        <td><span class="category-badge">${row.category || 'N/A'}</span></td>
        <td><span class="market-badge">${row.market || 'N/A'}</span></td>
        <td>${Math.round(row.forecast_units)}</td>
        <td>
          <div class="order-qty-badge">RECOMMENDED</div>
          <div class="order-qty-primary">${row.recommended_order_qty} units</div>
          <div class="order-qty-context">${safetyStockContext}</div>
        </td>
        <td class="risk ${riskLevel.toLowerCase()}">
          <span class="risk-label">${riskLevel}</span>
          <span class="risk-confidence">• Recommendation reliability ${confidenceLevel[riskLevel] || 'Medium'}</span>
        </td>
      </tr>
    `;
  });

  html += "</table>";
  resultsArea.className = "";
  resultsArea.innerHTML = html;
}

/* ================= CHART RENDER ================= */

function renderChart(data) {
  const ctx = document.getElementById("forecastChart");
  if (!ctx) return;
  
  if (!data || data.length === 0) {
    renderForecastFallback();
    return;
  }
  
  // Destroy existing chart and clear canvas to avoid ghost drawings
  if (forecastChart) forecastChart.destroy();
  const c2d = ctx.getContext("2d");
  if (c2d) {
    c2d.clearRect(0, 0, ctx.width, ctx.height);
  }
  
  const labels = data.map(d => d.product_id);
  const displayLabels = data.map(d => (d.product_name && String(d.product_name).trim().length > 0) ? d.product_name : `Product ${d.product_id}`);
  const forecast = data.map(d => d.forecast_units);
  const orderQty = data.map(d => d.recommended_order_qty);
  
  // Calculate confidence bounds
  const lowerBounds = data.map(row => Math.round(row.forecast_units * 0.85));
  const upperBounds = data.map(row => Math.round(row.forecast_units * 1.15));
  
  const datasets = [
    {
      type: "line",
      label: "Maximum Expected Demand",
      data: upperBounds,
      borderColor: "rgba(34, 211, 238, 0.95)",
      backgroundColor: "transparent",
      pointRadius: 4,
      pointHoverRadius: 5,
      pointBackgroundColor: "rgba(34, 211, 238, 0.95)",
      pointBorderColor: "rgba(6, 182, 212, 1)",
      pointBorderWidth: 2,
      borderWidth: 2,
      fill: false,
      tension: 0.3
    },
    {
      type: "line",
      label: "Minimum Expected Demand",
      data: lowerBounds,
      borderColor: "rgba(124, 58, 237, 0.35)",
      backgroundColor: "transparent",
      pointRadius: 0,
      pointHoverRadius: 0,
      borderWidth: 1,
      fill: false,
      tension: 0.3
    },
    {
      label: "Expected Demand",
      data: forecast,
      backgroundColor: "rgba(168, 85, 247, 0.85)",
      borderColor: "rgba(196, 181, 253, 1)",
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: "rgba(196, 181, 253, 1)",
      pointBorderColor: "rgba(168, 85, 247, 1)",
      pointBorderWidth: 1
    },
    {
      label: "Recommended Order",
      data: orderQty,
      backgroundColor: "rgba(16, 185, 129, 0.8)",
      borderColor: "rgba(52, 211, 153, 1)",
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: "rgba(52, 211, 153, 1)",
      pointBorderColor: "rgba(16, 185, 129, 1)",
      pointBorderWidth: 1
    }
  ];

  forecastChart = new Chart(ctx, {
    type: "bar",
    data: { labels: displayLabels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: "index", intersect: false },
      animation: false,
      plugins: {
        filler: { propagate: true },
        legend: { 
          labels: { color: "#f1f5f9", font: { size: 12, weight: 600 } },
          padding: 16,
          position: 'bottom'
        },
        tooltip: {
          backgroundColor: "rgba(10, 14, 39, 0.9)",
          titleColor: "#f1f5f9",
          bodyColor: "#cbd5e1",
          borderColor: "rgba(6, 182, 212, 0.3)",
          borderWidth: 1,
          padding: 12,
          boxPadding: 8,
          callbacks: {
            title: function(context) {
              if (!context || !context.length) return '';
              return context[0].label || '';
            },
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) label += Math.round(context.parsed.y);
              return label;
            }
          }
        }
      },
      scales: {
        x: { 
          ticks: { 
            color: "#94a3b8",
            autoSkip: true,
            maxRotation: 30,
            minRotation: 0,
            callback: function(value) {
              const label = this.getLabelForValue(value) || '';
              return label.length > 18 ? label.slice(0, 18) + '…' : label;
            }
          },
          grid: { color: "rgba(6, 182, 212, 0.05)" }
        },
        y: { 
          ticks: { color: "#94a3b8" },
          grid: { color: "rgba(6, 182, 212, 0.05)" }
        }
      }
    }
  });
}

// Update only x-axis labels without changing datasets
function updateChartLabels(data) {
  if (!forecastChart) return;
  const newLabels = data.map(d => (d.product_name && String(d.product_name).trim().length > 0) ? d.product_name : `Product ${d.product_id}`);
  forecastChart.data.labels = newLabels;
  forecastChart.update('none');
}

/* ================= SUMMARY BAR ================= */

function updateSummary(summary, data) {
  if (!summaryBar || !summary) return;
  
  const totalOrder = summary.total_order_qty || 0;
  const highRiskCount = summary.high_risk_count || 0;
  const mediumRiskCount = summary.medium_risk_count || 0;
  const totalItems = summary.total_items || 0;
  
  let actionText = '';
  let riskLevel = 'low';
  let riskBadge = 'LOW RISK';

  if (highRiskCount > 0) {
    riskLevel = 'high';
    riskBadge = 'HIGH RISK';
    const riskPct = Math.round((highRiskCount / Math.max(totalItems, 1)) * 100);
    actionText = `⚠ <strong>${riskPct}% of selected items</strong> show unstable demand. Review <strong>${highRiskCount} items</strong> before ordering <strong>${Math.round(totalOrder)} units</strong>.`;
  } else if (mediumRiskCount > 0) {
    riskLevel = 'medium';
    riskBadge = 'MEDIUM RISK';
    actionText = `→ Plan acceptable. <strong>${mediumRiskCount} items</strong> need a quick check. Proceed with <strong>${Math.round(totalOrder)} units</strong> across <strong>${totalItems} products</strong>.`;
  } else {
    actionText = `✓ Ready to order <strong>${Math.round(totalOrder)} units</strong> across <strong>${totalItems} products</strong>. Demand appears stable.`;
  }

  const marketContext = summary.market_context || 'All Markets';
  const categoryContext = summary.category_context || 'All Categories';

  summaryBar.innerHTML = `
    <div class="summary-content">
      <span class="summary-action">${actionText}</span>
      <span class="summary-badge" data-risk="${riskLevel}">${riskBadge}</span>
    </div>
    <p class="summary-subtitle">
      ${marketContext} • ${categoryContext} — Based on recent sales history; assumes normal operations.
    </p>
  `;
  summaryBar.classList.remove("hidden");
}

/* ================= BUSINESS IMPACT CARD ================= */

function renderBusinessImpactCard(impact, context) {
  const container = document.getElementById('businessImpact');
  if (!container) return;
  
  if (!impact) {
    renderBusinessImpactFallback();
    return;
  }
  
  const html = `
    <div class="impact-item">
      <span class="impact-label">STOCKOUT RISK AVOIDED</span>
      <span class="impact-value">${impact.stockout_risk_avoided || 0}%</span>
      <span class="impact-unit">Demand coverage</span>
      <span class="impact-note">Lower chance of missed sales with current plan.</span>
    </div>
    <div class="impact-item">
      <span class="impact-label">SAFETY BUFFER</span>
      <span class="impact-value">${impact.safety_buffer_pct || 0}%</span>
      <span class="impact-unit">${impact.safety_buffer_units || 0} units</span>
      <span class="impact-note">Extra units added to absorb demand swings.</span>
    </div>
    <div class="impact-item">
      <span class="impact-label">EXPECTED SERVICE LEVEL</span>
      <span class="impact-value">${impact.expected_service_level || 95}%</span>
      <span class="impact-unit">fulfillment rate</span>
      <span class="impact-note">Orders expected to meet customer demand.</span>
    </div>
    <div class="impact-item">
      <span class="impact-label">COST IMPACT</span>
      <span class="impact-direction">${impact.cost_direction || '→'}</span>
      <span class="impact-unit">${impact.cost_text || 'Minimal'}</span>
      <span class="impact-note">Direction of inventory cost pressure.</span>
    </div>
  `;
  
  container.innerHTML = html;
}

/* ================= INACTION RISK CARD ================= */

function renderInactionRiskCard(risk, context) {
  const container = document.getElementById('inactionRisk');
  if (!container) return;
  
  if (!risk) {
    renderInactionRiskFallback();
    return;
  }
  
  const html = `
    <div class="inaction-item">
      <span class="inaction-label">STOCKOUT RISK ↑</span>
      <span class="inaction-value">+${risk.stockout_risk_increase || 0}%</span>
      <span class="inaction-unit">vs. recommended plan</span>
      <span class="inaction-note">Waiting increases the chance of missed sales.</span>
    </div>
    <div class="inaction-item">
      <span class="inaction-label">POTENTIAL UNFULFILLED</span>
      <span class="inaction-value">~${risk.potential_lost_units || 0}</span>
      <span class="inaction-unit">units</span>
      <span class="inaction-note">Estimated demand not met without this order.</span>
    </div>
    <div class="inaction-item">
      <span class="inaction-label">SERVICE LEVEL ↓</span>
      <span class="inaction-value">−${risk.service_level_drop || 0}%</span>
      <span class="inaction-unit">fulfillment rate</span>
      <span class="inaction-note">Customer fulfillment degrades if plan is delayed.</span>
    </div>
    <div class="inaction-item">
      <span class="inaction-label">RECOMMENDATION</span>
      <span class="inaction-value">⚠️</span>
      <span class="inaction-unit">${risk.recommendation || 'Proceed with plan'}</span>
      <span class="inaction-note">Act promptly on the plan to avoid service drops.</span>
    </div>
  `;
  
  container.innerHTML = html;
}

/* ================= SCENARIO SNAPSHOT ================= */

function renderScenarioSnapshot(data) {
  const container = document.getElementById('scenarioSnapshot');
  if (!container) return;
  
  if (!data || data.length === 0) {
    renderScenarioSnapshotFallback();
    return;
  }
  
  const baseTotal = data.reduce((sum, d) => sum + d.recommended_order_qty, 0);
  const conservativeTotal = Math.ceil(baseTotal * 0.7);
  const aggressiveTotal = Math.ceil(baseTotal * 1.3);
  
  const html = `
    <table>
      <tr>
        <th>Scenario</th>
        <th>Order Qty</th>
        <th>Interpretation</th>
      </tr>
      <tr>
        <td>Conservative (−30%)</td>
        <td>${conservativeTotal}</td>
        <td class="scenario-interpretation">Pessimistic demand outlook</td>
      </tr>
      <tr style="background: rgba(6, 182, 212, 0.1);">
        <td><strong>Base Case</strong></td>
        <td><strong>${baseTotal}</strong></td>
        <td class="scenario-interpretation"><strong>Recommended</strong></td>
      </tr>
      <tr>
        <td>Aggressive (+30%)</td>
        <td>${aggressiveTotal}</td>
        <td class="scenario-interpretation">Optimistic demand outlook</td>
      </tr>
    </table>
  `;
  
  container.innerHTML = html;
}

/* ================= RISK SUMMARY CARD ================= */

function renderRiskSummaryCard(summary) {
  const container = document.getElementById('riskSummary');
  if (!container) return;
  
  if (!summary) {
    renderRiskSummaryFallback();
    return;
  }
  
  const html = `
    <p>Products with unstable demand: <strong>${summary.high_risk_count || 0}</strong></p>
    <p>Products requiring attention: <strong>${summary.medium_risk_count || 0}</strong></p>
    <p>Stable products: <strong>${summary.low_risk_count || 0}</strong></p>
  `;
  
  container.innerHTML = html;
  
  // Update risk insight
  const riskInsightDiv = document.getElementById('riskInsight');
  if (riskInsightDiv) {
    const highCount = summary.high_risk_count || 0;
    const mediumCount = summary.medium_risk_count || 0;
    let insightText = '';
    
    if (highCount > 0) {
      insightText = `What could go wrong: Unpredictable demand in <strong>${highCount}</strong> products can cause stockouts or excess inventory. Action: Review these items and confirm safety buffers before ordering.`;
    } else if (mediumCount > 0) {
      insightText = `Why it matters: <strong>${mediumCount}</strong> products show some demand swings. Action: Proceed, but monitor them and adjust if signals change.`;
    } else {
      insightText = `Stable demand across selected products. Proceed with the plan.`;
    }
    
    const textDiv = riskInsightDiv.querySelector('.risk-insight-text');
    if (textDiv) textDiv.innerHTML = insightText;
    riskInsightDiv.classList.remove('hidden');
  }
}

/* ================= CONFIDENCE CARD ================= */

function renderConfidenceCard(summary) {
  const container = document.getElementById('confidenceBox');
  if (!container) return;
  
  if (!summary) {
    renderConfidenceFallback();
    return;
  }
  
  const highRiskCount = summary.high_risk_count || 0;
  const hasVolatility = highRiskCount > 0;
  
  const html = `
    <div class="confidence-item">
      <div class="confidence-icon">📊</div>
      <div class="confidence-text">
        <span class="confidence-label">RECENT SALES PATTERNS</span>
        <span class="confidence-description">
          Recommendations reflect recent sales history for each product.
        </span>
      </div>
    </div>
    <div class="confidence-item">
      <div class="confidence-icon">📈</div>
      <div class="confidence-text">
        <span class="confidence-label">DEMAND STABILITY</span>
        <span class="confidence-description">
          ${hasVolatility ? 'Some items show demand swings; safety buffers protect against shortfalls.' : 'Demand appears stable across selected products.'}
        </span>
        <span class="confidence-badge ${highRiskCount === 0 ? 'stable' : 'variable'}">
          ${highRiskCount === 0 ? '✓ STEADY' : '⚠ SWINGS'}
        </span>
      </div>
    </div>
    <div class="confidence-item">
      <div class="confidence-icon">🌍</div>
      <div class="confidence-text">
        <span class="confidence-label">MARKET CONTEXT</span>
        <span class="confidence-description">
          Based on ${summary.market_context || 'All Markets'} data. ${summary.total_items || 0} products included.
        </span>
      </div>
    </div>
    <div class="confidence-item">
      <div class="confidence-icon">✓</div>
      <div class="confidence-text">
        <span class="confidence-label">PLANNING ASSUMPTIONS</span>
        <span class="confidence-description">
          Assumes no major supply disruptions or promotions.
        </span>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}

/* ================= OPERATIONAL RECOMMENDATION ================= */

function renderOperationalRec(summary, data) {
  const container = document.getElementById('operationalRec');
  if (!container) return;
  
  if (!summary || !data) {
    renderOperationalRecFallback();
    return;
  }
  
  const totalOrder = summary.total_order_qty || 0;
  const totalItems = summary.total_items || 0;
  const highRiskCount = summary.high_risk_count || 0;
  const mediumRiskCount = summary.medium_risk_count || 0;
  
  let primaryRec = '';
  let followUpTiming = '';
  let authorityMsg = '';
  
  if (highRiskCount > 2) {
    primaryRec = 'Review items with unstable demand before committing to order';
    followUpTiming = '⏳ Estimated review time: 15–20 minutes. Re-check forecast in 3 days.';
    authorityMsg = 'This recommendation balances service-level targets and inventory cost given recent demand swings.';
  } else if (highRiskCount > 0) {
    primaryRec = 'Proceed with order, monitor items with unstable demand closely';
    followUpTiming = '⏳ Monitor for anomalies. Re-evaluate in 7 days.';
    authorityMsg = 'This recommendation balances service-level targets and inventory cost based on recent demand signals.';
  } else if (mediumRiskCount > totalItems * 0.5) {
    primaryRec = 'Safe to proceed with current plan';
    followUpTiming = '⏳ Routine monitoring. Next review in 14 days.';
    authorityMsg = 'This recommendation balances service-level targets and inventory cost using recent demand stability and historical performance.';
  } else {
    primaryRec = 'Ready to execute with confidence';
    followUpTiming = '⏳ Low risk portfolio. Monthly review sufficient.';
    authorityMsg = 'This recommendation balances service-level targets and inventory cost using stable demand signals.';
  }
  
  const html = `
    <div class="rec-item">
      <span class="rec-icon">✅</span>
      <div class="rec-content">
        <div class="rec-title">${primaryRec}</div>
        <div class="rec-text">
          Order <strong>${Math.round(totalOrder)} units</strong> across <strong>${totalItems} products</strong> to meet forecasted demand with appropriate safety buffers.
        </div>
        <div class="rec-authority">
          <em>${authorityMsg}</em>
        </div>
        <div class="rec-timing">
          ${followUpTiming}
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}

/* ================= MODEL HEALTH ================= */

function renderModelHealth(summary) {
  const container = document.getElementById('modelHealth');
  if (!container) return;
  
  if (!summary) {
    renderModelHealthFallback();
    return;
  }
  
  const html = `
    <div class="health-item">
      <span class="health-label">DATA FRESHNESS</span>
      <span class="health-value">Updated today</span>
      <span class="health-status">✓ Current</span>
    </div>
    <div class="health-item">
      <span class="health-label">MODEL VERSION</span>
      <span class="health-value">v1.0 Enterprise</span>
      <span class="health-status">✓ Active</span>
    </div>
    <div class="health-item">
      <span class="health-label">FORECAST RELIABILITY</span>
      <span class="health-value">Production</span>
      <span class="health-status">✓ Stable</span>
    </div>
    <div class="health-item">
      <span class="health-label">ITEMS ANALYZED</span>
      <span class="health-value">${summary.total_items || 0}</span>
      <span class="health-status">✓ Complete</span>
    </div>
  `;
  
  container.innerHTML = html;
}
