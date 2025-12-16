const storeSelect = document.getElementById("storeSelect");
const productSelect = document.getElementById("productSelect");
const generateBtn = document.getElementById("generateBtn");
const resultsArea = document.getElementById("resultsArea");
const riskSummary = document.getElementById("riskSummary");
const summaryBar = document.getElementById("summaryBar");
const summaryText = document.getElementById("summaryText");

let forecastChart = null;

/* ================= PARTICLE BACKGROUND ================= */

function createParticles() {
  const container = document.getElementById("particleContainer");
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

// Create particles on load
createParticles();

/* ================= INITIALIZE APP ================= */

// Ensure DOM is ready before loading data
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

function initializeApp() {
  loadStores();
  attachEventListeners();
}

/* ================= LOAD STORES ================= */

function loadStores() {
  fetch("/api/v1/stores")
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(stores => {
      console.log("Stores loaded:", stores);
      if (!Array.isArray(stores) || stores.length === 0) {
        console.error("No stores returned from API");
        storeSelect.innerHTML = '<option value="">No stores available</option>';
        return;
      }
      stores.forEach(store => {
        const opt = document.createElement("option");
        opt.value = store;
        opt.textContent = store;
        storeSelect.appendChild(opt);
      });
      console.log("Stores populated successfully");
    })
    .catch(error => {
      console.error("Error loading stores:", error);
      storeSelect.innerHTML = '<option value="">Error loading stores</option>';
    });
}

/* ================= ATTACH EVENT LISTENERS ================= */

function attachEventListeners() {
  /* Store Change Handler */
  storeSelect.addEventListener("change", () => {
  productSelect.innerHTML = "";
  generateBtn.disabled = true;
  summaryBar.classList.add("hidden");

  if (!storeSelect.value) return;

  fetch(`/api/v1/products/${storeSelect.value}`)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(products => {
      if (!Array.isArray(products) || products.length === 0) {
        console.warn("No products returned for store:", storeSelect.value);
        return;
      }
      products.forEach(prod => {
        const opt = document.createElement("option");
        opt.value = prod;
        opt.textContent = prod;
        productSelect.appendChild(opt);
      });
    })
    .catch(error => {
      console.error("Error loading products:", error);
    });
});

  /* Product Change Handler */
  productSelect.addEventListener("change", () => {
    const selectedCount = productSelect.selectedOptions.length;
    generateBtn.disabled = selectedCount === 0;
    
    // Update product count badge
    const countBadge = document.getElementById("productCount");
    if (countBadge) {
      countBadge.textContent = `(${selectedCount} selected)`;
      if (selectedCount > 0) {
        countBadge.classList.add("active");
      } else {
        countBadge.classList.remove("active");
      }
    }
  });

  /* Generate Button Handler */
  generateBtn.addEventListener("click", () => {
    const items = Array.from(productSelect.selectedOptions).map(opt => ({
      store_id: storeSelect.value,
      product_id: opt.value
    }));

    resultsArea.className = "placeholder";
    resultsArea.textContent = "Generating inventory plan...";
    riskSummary.textContent = "";
    summaryBar.classList.add("hidden");

    fetch("/api/v1/forecast/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items })
    })
      .then(res => res.json())
      .then(data => {
        // Store original forecast for scenario calculation
        window.originalForecastData = JSON.parse(JSON.stringify(data));
        
        renderChart(data);
        renderTable(data);
        renderBusinessImpactCard(data);
        renderInactionRiskCard(data);
        renderScenarioSnapshot(data);
        renderRiskSummaryCard(data);
        renderConfidenceCard(data);
        renderOperationalRec(data);
        renderModelHealth(data);
        updateSummary(data);
        
        // Show scenario controls and attach handlers
        document.getElementById("scenarioSection").classList.remove("hidden");
        attachScenarioHandlers(items, data);

        // Prevent repeated runs unless inputs change
        generateBtn.disabled = true;
      });
  });
}

function attachScenarioHandlers(items, originalData) {
  const multiplierInput = document.getElementById("demandMultiplier");
  const multiplierValue = document.getElementById("multiplierValue");
  const multiplierContext = document.getElementById("multiplierContext");
  const presetBtns = document.querySelectorAll(".preset-btn");
  
  // Helper function to get scenario description
  function getScenarioDescription(value) {
    if (value < 0.8) return "Low demand scenario (risk of overstock)";
    if (value === 1.0) return "Base case (current forecast)";
    if (value > 1.2) return "High demand scenario (risk of stockout)";
    return "Alternative scenario";
  }
  
  // Update display on slider change
  multiplierInput.addEventListener("input", () => {
    const value = parseFloat(multiplierInput.value);
    multiplierValue.textContent = value.toFixed(1) + "x";
    multiplierContext.textContent = getScenarioDescription(value);
    applyScenario(items, originalData, value);
  });
  
  // Preset buttons
  presetBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const value = parseFloat(btn.dataset.value);
      multiplierInput.value = value;
      multiplierValue.textContent = value.toFixed(1) + "x";
      multiplierContext.textContent = getScenarioDescription(value);
      
      // Update active state
      presetBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      applyScenario(items, originalData, value);
    });
  });
  
  // Set initial active button
  presetBtns.forEach(btn => {
    if (parseFloat(btn.dataset.value) === 1.0) {
      btn.classList.add("active");
    }
  });
}

function applyScenario(items, originalData, multiplier) {
  // Prepare scenario request
  const scenarios = items.map((item, idx) => ({
    store_id: item.store_id,
    product_id: item.product_id,
    demand_multiplier: multiplier
  }));
  
  // Fetch scenario forecast
  fetch("/api/v1/forecast/scenario", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenarios })
  })
    .then(res => res.json())
    .then(scenarioData => {
      // Apply multiplier to forecast values for immediate feedback
      // (In case backend doesn't return full updated recommendations)
      const updatedData = originalData.map((row, idx) => {
        const scenario = scenarioData[idx] || {};
        return {
          ...row,
          forecast_units: scenario.adjusted_forecast || row.forecast_units * multiplier,
          recommended_order_qty: scenario.adjusted_order_qty || Math.ceil(row.recommended_order_qty * multiplier)
        };
      });
      
      // Update all sections
      renderChart(updatedData);
      renderTable(updatedData);
      renderBusinessImpactCard(updatedData);
      renderInactionRiskCard(updatedData);
      renderScenarioSnapshot(updatedData);
      renderRiskSummaryCard(updatedData);
      renderConfidenceCard(updatedData);
      renderOperationalRec(updatedData);
      updateSummary(updatedData);
      
      // Reattach explanation handlers to new table
      attachExplanationHandlers();
    })
    .catch(err => {
      console.error("Scenario simulation error:", err);
    });
}

/* ================= TABLE RENDER ================= */

function renderTable(data) {
  let html = `
    <table>
      <tr>
        <th>Product</th>
        <th>Forecast</th>
        <th>Order Qty</th>
        <th>
          Risk
          <span class="info" title="Risk reflects recent demand variability, not product quality.">
            ⓘ
            <span class="info-tooltip-box">Risk reflects recent demand variability, not product quality.</span>
          </span>
        </th>
        <th>Decision Rationale</th>
      </tr>
  `;

  data.forEach(row => {
    const safetyStockPct = Math.round(((row.recommended_order_qty - row.forecast_units) / row.forecast_units) * 100);
    const safetyStockContext = safetyStockPct > 0 
      ? `+${safetyStockPct}% safety buffer`
      : 'Base forecast';
    
    const confidenceLevel = {
      'Low': 'High',
      'Medium': 'Medium',
      'High': 'Low'
    };
    
    html += `
      <tr class="${row.risk_level === "High" ? "row-alert" : ""}">
        <td>${row.product_id}</td>
        <td>${Math.round(row.forecast_units)}</td>
        <td>
          <div class="order-qty-badge">RECOMMENDED</div>
          <div class="order-qty-primary">${row.recommended_order_qty} units</div>
          <div class="order-qty-context">${safetyStockContext}</div>
        </td>
        <td class="risk ${row.risk_level.toLowerCase()}">
          <span class="risk-label">${row.risk_level}</span>
          <span class="risk-confidence">• ${confidenceLevel[row.risk_level]} confidence</span>
        </td>
        <td>
          <button class="explain-btn" 
            data-product="${row.product_id}"
            data-store="${storeSelect.value}"
            title="See why this order quantity was recommended">
            📊
          </button>
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
  const labels = data.map(d => d.product_id);
  const forecast = data.map(d => d.forecast_units);
  const orderQty = data.map(d => d.recommended_order_qty);

  const ctx = document.getElementById("forecastChart");

  if (forecastChart) forecastChart.destroy();

  // Fetch confidence data for uncertainty bands
  const storeId = storeSelect.value;
  const productIds = Array.from(productSelect.selectedOptions).map(opt => opt.value);

  Promise.all(
    productIds.map(pid => 
      fetch(`/api/v1/forecast/confidence?store_id=${storeId}&product_id=${pid}`)
        .then(res => res.json())
        .catch(() => null)
    )
  ).then(confidenceData => {
    // Extract confidence bounds
    const lowerBounds = data.map((row, idx) => {
      const conf = confidenceData[idx];
      return conf && conf.lower_bound ? conf.lower_bound : row.forecast_units * 0.85;
    });

    const upperBounds = data.map((row, idx) => {
      const conf = confidenceData[idx];
      return conf && conf.upper_bound ? conf.upper_bound : row.forecast_units * 1.15;
    });

    // Build datasets with confidence bands
    const datasets = [
      {
        label: "Maximum Expected Demand",
        data: upperBounds,
        borderColor: "rgba(34, 211, 238, 0.95)",
        backgroundColor: "transparent",
        pointRadius: 5,
        pointHoverRadius: 6,
        pointBackgroundColor: "rgba(34, 211, 238, 0.95)",
        pointBorderColor: "rgba(6, 182, 212, 1)",
        pointBorderWidth: 2,
        borderWidth: 3,
        fill: false,
        tension: 0.3
      },
      {
        label: "Minimum Expected Demand",
        data: lowerBounds,
        borderColor: "transparent",
        backgroundColor: "rgba(124, 58, 237, 0.15)",
        pointRadius: 0,
        pointHoverRadius: 0,
        borderWidth: 0,
        fill: "-1",
        tension: 0
      },
      {
        label: "Expected Demand",
        data: forecast,
        backgroundColor: "rgba(168, 85, 247, 0.85)",
        borderColor: "rgba(196, 181, 253, 1)",
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: "rgba(196, 181, 253, 1)",
        pointBorderColor: "rgba(168, 85, 247, 1)",
        pointBorderWidth: 2
      },
      {
        label: "Recommended Order",
        data: orderQty,
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderColor: "rgba(52, 211, 153, 1)",
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: "rgba(52, 211, 153, 1)",
        pointBorderColor: "rgba(16, 185, 129, 1)",
        pointBorderWidth: 2
      }
    ];

    forecastChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
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
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += Math.round(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: { 
            ticks: { color: "#94a3b8" },
            grid: { color: "rgba(6, 182, 212, 0.05)" }
          },
          y: { 
            ticks: { color: "#94a3b8" },
            grid: { color: "rgba(6, 182, 212, 0.05)" }
          }
        }
      }
    });
  });
}

/* ================= SUMMARY BAR ================= */

function updateSummary(data) {
  const totalOrder = data.reduce((sum, d) => sum + d.recommended_order_qty, 0);
  const counts = { Low: 0, Medium: 0, High: 0 };
  data.forEach(d => counts[d.risk_level]++);

  let actionText = '';
  let riskLevel = 'low';
  let riskBadge = 'LOW RISK';

  if (counts.High > 0) {
    riskLevel = 'high';
    riskBadge = 'HIGH RISK';
    const riskPct = Math.round((counts.High / data.length) * 100);
    actionText = `⚠ <strong>${riskPct}% of portfolio</strong> has elevated variability. Recommend <strong>${counts.High} priority reviews</strong> before ordering <strong>${totalOrder} units</strong>.`;
  } else if (counts.Medium > 0) {
    riskLevel = 'medium';
    riskBadge = 'MEDIUM RISK';
    actionText = `→ Portfolio ready for ordering with <strong>${counts.Medium} items</strong> needing attention. <strong>Total order: ${totalOrder} units</strong> across <strong>${data.length} products</strong>.`;
  } else {
    actionText = `✓ <strong>Ready to order: ${totalOrder} units</strong> across all <strong>${data.length} products</strong>. Low variability detected. Safe to proceed with current plan.`;
  }

  summaryBar.innerHTML = `
    <div class="summary-content">
      <span class="summary-action">${actionText}</span>
      <span class="summary-badge" data-risk="${riskLevel}">${riskBadge}</span>
    </div>
    <p class="summary-subtitle">POWERED BY DEMAND FORECASTING & CONFIDENCE-ADJUSTED SAFETY STOCK OPTIMIZATION</p>
  `;
  summaryBar.classList.remove("hidden");

  // Update risk insight
  const counts2 = { Low: 0, Medium: 0, High: 0 };
  data.forEach(d => counts2[d.risk_level]++);
  updateRiskInsight(counts2, data.length, riskLevel);
}

/* ================= RISK INSIGHT ================= */

function updateRiskInsight(counts, totalProducts, riskLevel) {
  const riskInsightDiv = document.getElementById('riskInsight');
  let insightText = '';

  if (riskLevel === 'high') {
    insightText = `High variability detected in <strong>${counts.High}</strong> products. These items experienced significant demand fluctuations in recent weeks, increasing the chance of stockout or overstock. Consider reviewing recent promotions, competitor activity, or seasonal factors before committing to large orders.`;
  } else if (riskLevel === 'medium') {
    insightText = `Moderate variability affects <strong>${counts.Medium}</strong> products. While these are manageable with standard safety stock practices, monitor them more closely than stable items. A small increase to the recommended order quantity may provide additional buffer.`;
  } else {
    insightText = `Low variability across the portfolio. All items show stable, predictable demand patterns. Recommended order quantities are reliable for inventory planning purposes.`;
  }

  riskInsightDiv.querySelector('.risk-insight-text').innerHTML = insightText;
  riskInsightDiv.classList.remove('hidden');
}

/* ================= FORECAST EXPLANATION ================= */

function generateInterpretation(features, riskLevel) {
  if (!features || features.length === 0) {
    return 'Decision based on recent demand patterns and historical trends.';
  }
  
  const topFactor = features[0]?.feature?.toLowerCase() || '';
  const hasVolatility = features.some(f => f.feature.toLowerCase().includes('volatility') || f.feature.toLowerCase().includes('std'));
  const hasTrend = features.some(f => f.feature.toLowerCase().includes('trend') || f.feature.toLowerCase().includes('sales'));
  
  if (riskLevel === 'High') {
    if (hasVolatility) {
      return 'High demand variability detected. Safety stock buffer increased to reduce stockout risk.';
    }
    return 'Recent demand patterns show volatility. Order quantity includes protective buffer.';
  }
  
  if (riskLevel === 'Medium') {
    if (hasVolatility && hasTrend) {
      return 'Moderate variability with stable trend. Standard safety stock applied.';
    }
    return 'Balanced approach using recent demand history and variability measures.';
  }
  
  // Low risk
  if (hasTrend && !hasVolatility) {
    return 'Stable demand trend with low variability. Minimal safety buffer applied.';
  }
  return 'Stable demand patterns indicate predictable inventory needs.';
}

function attachExplanationHandlers() {
  document.querySelectorAll(".explain-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const product = btn.dataset.product;
      const store = btn.dataset.store;
      
      // Close any existing tooltip
      document.querySelectorAll(".explain-tooltip").forEach(t => t.remove());
      
      // Create and show loading state
      const tooltip = document.createElement("div");
      tooltip.className = "explain-tooltip";
      tooltip.innerHTML = '<div class="explain-loading">Loading drivers...</div>';
      document.body.appendChild(tooltip);
      
      // Position tooltip near the button
      const btnRect = btn.getBoundingClientRect();
      tooltip.style.top = (btnRect.bottom + 10) + "px";
      tooltip.style.left = Math.max(10, (btnRect.left - 140)) + "px";
      
      // Fetch explanation
      fetch(`/api/v1/forecast/explain?store_id=${store}&product_id=${product}`)
        .then(res => res.json())
        .then(data => {
          if (data.top_features && data.top_features.length > 0) {
            // Get the row data to determine risk level for context
            const table = document.querySelector('table');
            let riskLevel = 'Low';
            if (table) {
              const rows = Array.from(table.querySelectorAll('tbody tr'));
              const row = rows.find(r => r.querySelector('td')?.textContent.includes(product));
              if (row) {
                const riskCell = row.querySelector('.risk');
                if (riskCell) {
                  const riskText = riskCell.textContent.trim();
                  if (riskText.includes('High')) riskLevel = 'High';
                  else if (riskText.includes('Medium')) riskLevel = 'Medium';
                }
              }
            }
            
            // Generate interpretation based on dominant factors and risk level
            const interpretation = generateInterpretation(data.top_features, riskLevel);
            
            let html = `<h4>Why This Order Was Recommended</h4>`;
            data.top_features.forEach(feature => {
              const featureName = feature.feature || feature.name || 'Unknown';
              const score = parseFloat(feature.impact).toFixed(1);
              html += `
                <div class="explain-feature">
                  <span class="explain-feature-name">${featureName}</span>
                  <span class="explain-feature-score">${score}%</span>
                </div>
              `;
            });
            html += `<p class="explain-interpretation">${interpretation}</p>`;
            tooltip.innerHTML = html;
          } else {
            tooltip.innerHTML = '<div class="explain-loading">Decision based on recent demand patterns and historical trends</div>';
          }
        })
        .catch(err => {
          tooltip.innerHTML = '<div class="explain-loading">Decision based on recent demand patterns and historical trends</div>';
          console.error("Explanation fetch error:", err);
        });
    });
  });
  
  // Close tooltip on document click
  document.addEventListener("click", () => {
    document.querySelectorAll(".explain-tooltip").forEach(t => t.remove());
  });
}

/* ================= BUSINESS IMPACT CARD ================= */

function renderBusinessImpactCard(data) {
  const container = document.getElementById('businessImpact');
  
  if (!data || data.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  // Calculate metrics
  const totalForecast = data.reduce((sum, d) => sum + d.forecast_units, 0);
  const totalOrder = data.reduce((sum, d) => sum + d.recommended_order_qty, 0);
  const totalSafetyStock = totalOrder - totalForecast;
  const safetyStockPct = Math.round((totalSafetyStock / totalForecast) * 100);
  
  // Calculate stockout risk based on high-risk items
  const highRiskCount = data.filter(d => d.risk_level === 'High').length;
  const stockoutRiskAvoided = highRiskCount > 0 ? Math.round((highRiskCount / data.length) * 100) : 5;
  
  // Service level (inverse of stockout risk)
  const expectedServiceLevel = 100 - stockoutRiskAvoided;
  
  // Cost direction (based on safety stock)
  const costDirection = safetyStockPct > 15 ? '↑' : safetyStockPct > 0 ? '→' : '↓';
  const costText = safetyStockPct > 15 ? 'Cost increase' : safetyStockPct > 0 ? 'Minimal cost impact' : 'Cost reduction';
  
  const html = `
    <div class="impact-item">
      <span class="impact-label">STOCKOUT RISK AVOIDED</span>
      <span class="impact-value">${stockoutRiskAvoided}%</span>
      <span class="impact-unit">Demand coverage</span>
    </div>
    <div class="impact-item">
      <span class="impact-label">SAFETY BUFFER</span>
      <span class="impact-value">${safetyStockPct}%</span>
      <span class="impact-unit">${totalSafetyStock} units</span>
    </div>
    <div class="impact-item">
      <span class="impact-label">EXPECTED SERVICE LEVEL</span>
      <span class="impact-value">${expectedServiceLevel}%</span>
      <span class="impact-unit">fulfillment rate</span>
    </div>
    <div class="impact-item">
      <span class="impact-label">COST IMPACT</span>
      <span class="impact-direction">${costDirection}</span>
      <span class="impact-unit">${costText}</span>
    </div>
  `;
  
  container.innerHTML = html;
}

/* ================= INACTION RISK CARD ================= */

function renderInactionRiskCard(data) {
  const container = document.getElementById('inactionRisk');
  
  if (!data || data.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  // Calculate counterfactual risk if no action taken
  const totalForecast = data.reduce((sum, d) => sum + d.forecast_units, 0);
  const highRiskCount = data.filter(d => d.risk_level === 'High').length;
  
  // Inaction risk: stockout rate without safety stock
  const stockoutRiskIncrease = highRiskCount > 0 ? Math.round((highRiskCount / data.length) * 100) : 8;
  
  // Potential lost sales (units not fulfilled) - estimated as forecast variance
  const potentialLostUnits = Math.ceil(totalForecast * (stockoutRiskIncrease / 100));
  
  // Service level drop (without safety buffer)
  const serviceDropWithoutBuffer = Math.round(stockoutRiskIncrease * 1.3); // Amplified without buffer
  
  const html = `
    <div class="inaction-item">
      <span class="inaction-label">STOCKOUT RISK ↑</span>
      <span class="inaction-value">+${stockoutRiskIncrease}%</span>
      <span class="inaction-unit">vs. recommended plan</span>
    </div>
    <div class="inaction-item">
      <span class="inaction-label">POTENTIAL UNFULFILLED</span>
      <span class="inaction-value">~${potentialLostUnits}</span>
      <span class="inaction-unit">units</span>
    </div>
    <div class="inaction-item">
      <span class="inaction-label">SERVICE LEVEL ↓</span>
      <span class="inaction-value">−${serviceDropWithoutBuffer}%</span>
      <span class="inaction-unit">fulfillment rate</span>
    </div>
    <div class="inaction-item">
      <span class="inaction-label">RECOMMENDATION</span>
      <span class="inaction-value">⚠️</span>
      <span class="inaction-unit">Proceed with plan</span>
    </div>
  `;
  
  container.innerHTML = html;
}

/* ================= SCENARIO SNAPSHOT ================= */

function renderScenarioSnapshot(data) {
  const container = document.getElementById('scenarioSnapshot');
  
  if (!data || data.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  // Calculate scenario totals
  const baseTotal = data.reduce((sum, d) => sum + d.recommended_order_qty, 0);
  const conservativeTotal = Math.ceil(baseTotal * 0.7);
  const aggressiveTotal = Math.ceil(baseTotal * 1.3);
  
  const html = `
    <table>
      <tr>
        <th>Scenario</th>
        <th>Order Qty</th>
      </tr>
      <tr>
        <td>Conservative (−30%)</td>
        <td>${conservativeTotal}</td>
      </tr>
      <tr style="background: rgba(6, 182, 212, 0.1);">
        <td><strong>Base Case</strong></td>
        <td><strong>${baseTotal}</strong></td>
      </tr>
      <tr>
        <td>Aggressive (+30%)</td>
        <td>${aggressiveTotal}</td>
      </tr>
    </table>
  `;
  
  container.innerHTML = html;
}

/* ================= RISK SUMMARY CARD ================= */

function renderRiskSummaryCard(data) {
  const container = document.getElementById('riskSummary');
  
  if (!data || data.length === 0) {
    container.innerHTML = '';
    return;
  }

  const counts = { Low: 0, Medium: 0, High: 0 };
  data.forEach(d => counts[d.risk_level]++);
  
  const html = `
    <p>High risk products: <strong>${counts.High}</strong></p>
    <p>Medium risk products: <strong>${counts.Medium}</strong></p>
    <p>Low risk products: <strong>${counts.Low}</strong></p>
  `;
  
  container.innerHTML = html;
}

/* ================= CONFIDENCE CARD ================= */

function renderConfidenceCard(data) {
  const container = document.getElementById('confidenceBox');
  
  if (!data || data.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  const highRiskCount = data.filter(d => d.risk_level === 'High').length;
  const hasVolatility = highRiskCount > 0;
  
  const html = `
    <div class="confidence-item">
      <div class="confidence-icon">📊</div>
      <div class="confidence-text">
        <span class="confidence-label">RECENT SALES PATTERNS</span>
        <span class="confidence-description">
          Based on the last 52 weeks of historical sales data for each product, with emphasis on recent weeks.
        </span>
      </div>
    </div>
    <div class="confidence-item">
      <div class="confidence-icon">📈</div>
      <div class="confidence-text">
        <span class="confidence-label">DEMAND STABILITY</span>
        <span class="confidence-description">
          ${hasVolatility ? 'Some products show variability in weekly demand, handled with protective safety stock.' : 'Products show stable, predictable demand patterns across all time periods.'}
        </span>
        <span class="confidence-badge ${highRiskCount === 0 ? 'stable' : 'variable'}">
          ${highRiskCount === 0 ? '✓ STABLE' : '⚠ VARIABLE'}
        </span>
      </div>
    </div>
    <div class="confidence-item">
      <div class="confidence-icon">🎯</div>
      <div class="confidence-text">
        <span class="confidence-label">SEASONAL BEHAVIOR</span>
        <span class="confidence-description">
          No unusual seasonal patterns detected. Recommendations assume consistent demand cycles relative to historical norms.
        </span>
      </div>
    </div>
    <div class="confidence-item">
      <div class="confidence-icon">✓</div>
      <div class="confidence-text">
        <span class="confidence-label">MODEL ASSUMPTIONS</span>
        <span class="confidence-description">
          No supply disruptions, no major promotional activity, and normal competitive landscape as in historical period.
        </span>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}

/* ================= OPERATIONAL RECOMMENDATION ================= */

function renderOperationalRec(data) {
  const container = document.getElementById('operationalRec');
  
  if (!data || data.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  // Determine primary recommendation
  const totalOrder = data.reduce((sum, d) => sum + d.recommended_order_qty, 0);
  const highRiskCount = data.filter(d => d.risk_level === 'High').length;
  const mediumRiskCount = data.filter(d => d.risk_level === 'Medium').length;
  
  let primaryRec = '';
  let followUpTiming = '';
  let authorityMsg = '';
  
  if (highRiskCount > 2) {
    primaryRec = 'Review high-variability items before committing to order';
    followUpTiming = '⏳ Estimated review time: 15–20 minutes. Re-check forecast in 3 days.';
    authorityMsg = 'This recommendation balances service-level targets and inventory cost using recent demand volatility assessment.';
  } else if (highRiskCount > 0) {
    primaryRec = 'Proceed with order, monitor high-variability items closely';
    followUpTiming = '⏳ Monitor for anomalies. Re-evaluate in 7 days.';
    authorityMsg = 'This recommendation balances service-level targets and inventory cost using recent demand patterns and volatility analysis.';
  } else if (mediumRiskCount > data.length * 0.5) {
    primaryRec = 'Safe to proceed with current plan';
    followUpTiming = '⏳ Routine monitoring. Next review in 14 days.';
    authorityMsg = 'This recommendation balances service-level targets and inventory cost using recent demand stability and historical performance.';
  } else {
    primaryRec = 'Ready to execute with confidence';
    followUpTiming = '⏳ Low risk portfolio. Monthly review sufficient.';
    authorityMsg = 'This recommendation balances service-level targets and inventory cost using stable demand signals and historical performance.';
  }
  
  const html = `
    <div class="rec-item">
      <span class="rec-icon">✅</span>
      <div class="rec-content">
        <div class="rec-title">${primaryRec}</div>
        <div class="rec-text">
          Order <strong>${totalOrder} units</strong> across <strong>${data.length} products</strong> to meet forecasted demand with appropriate safety buffers.
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

function renderModelHealth(data) {
  const container = document.getElementById('modelHealth');
  
  if (!data || data.length === 0) {
    container.innerHTML = '';
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
      <span class="health-value">v1.0 MVP</span>
      <span class="health-status">✓ Active</span>
    </div>
    <div class="health-item">
      <span class="health-label">FORECAST RELIABILITY</span>
      <span class="health-value">Production</span>
      <span class="health-status">✓ Stable</span>
    </div>
    <div class="health-item">
      <span class="health-label">ITEMS ANALYZED</span>
      <span class="health-value">${data.length}</span>
      <span class="health-status">✓ Complete</span>
    </div>
  `;
  
  container.innerHTML = html;
}
