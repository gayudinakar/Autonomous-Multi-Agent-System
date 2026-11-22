/**
 * InvestAI Dashboard — Frontend Logic
 * Communicates with FastAPI backend, renders analysis results.
 */

const API_BASE = (window.location.origin && window.location.origin.startsWith('http'))
  ? window.location.origin
  : 'http://127.0.0.1:8000';

// ───────────────────────────────────────────────────────────────────
//  Chart instances (kept for destroy-on-refresh)
// ───────────────────────────────────────────────────────────────────
let priceChart = null;
let allocChart = null;
let volChart   = null;

// Chart.js global defaults
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
Chart.defaults.font.size = 11;

// ───────────────────────────────────────────────────────────────────
//  Helpers
// ───────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

function showLoader(show) {
  $('loader').classList.toggle('visible', show);
}

function showError(msg) {
  $('error-message').textContent = msg;
  $('error-banner').classList.add('visible');
}

function hideError() {
  $('error-banner').classList.remove('visible');
}

function showResults(show) {
  $('results').classList.toggle('visible', show);
}

function destroyChart(chartRef) {
  if (chartRef) { try { chartRef.destroy(); } catch (_) {} }
  return null;
}

// ───────────────────────────────────────────────────────────────────
//  Analyze button
// ───────────────────────────────────────────────────────────────────
$('analyze-btn').addEventListener('click', runAnalysis);
$('ticker-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') runAnalysis();
  // Auto-uppercase while typing
  setTimeout(() => { $('ticker-input').value = $('ticker-input').value.toUpperCase(); }, 0);
});

async function runAnalysis() {
  const ticker = $('ticker-input').value.trim().toUpperCase();
  const amount = parseFloat($('amount-input').value) || 10000;
  const risk   = $('risk-select').value;

  if (!ticker) {
    showError('Please enter a stock ticker symbol (e.g. AAPL).');
    return;
  }

  hideError();
  showResults(false);
  showLoader(true);
  $('analyze-btn').disabled = true;
  $('btn-icon').textContent = '⏳';
  $('btn-text').textContent = 'Analyzing…';

  try {
    const res = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker, investment_amount: amount, risk_tolerance: risk }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Server error ${res.status}`);
    }

    const data = await res.json();
    renderResults(data);
    showResults(true);

    // Smooth scroll to results
    setTimeout(() => {
      $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

  } catch (err) {
    showError(`Analysis failed: ${err.message}. Make sure the backend server is running.`);
  } finally {
    showLoader(false);
    $('analyze-btn').disabled = false;
    $('btn-icon').textContent = '⚡';
    $('btn-text').textContent = 'Analyze';
  }
}

// ───────────────────────────────────────────────────────────────────
//  Main render
// ───────────────────────────────────────────────────────────────────
function renderResults(d) {
  renderHero(d);
  renderComponentScores(d.component_scores);
  renderPriceChart(d.market_analysis);
  renderMarketCard(d.market_analysis);
  renderFundamentalCard(d.fundamental_analysis);
  renderRiskCard(d.risk_assessment);
  renderSentimentCard(d.sentiment_analysis);
  renderPortfolioCard(d.portfolio_optimization);
  renderVolChart(d.risk_assessment);
}

// ───────────────────────────────────────────────────────────────────
//  1. Hero / Recommendation
// ───────────────────────────────────────────────────────────────────
function renderHero(d) {
  const rec = d.recommendation;
  const ma  = d.market_analysis;
  const fa  = d.fundamental_analysis;

  $('rec-ticker').textContent = d.ticker;
  $('rec-company').textContent = fa.metrics?.company_name || d.ticker;
  $('rec-price').textContent = ma.current_price ? `$${ma.current_price.toLocaleString()}` : '—';

  const badge = $('rec-badge');
  badge.textContent = rec;
  badge.className = `rec-badge ${rec}`;

  $('rec-confidence').textContent = d.confidence;
  $('rec-score').textContent = d.composite_score;

  // Render explanation with markdown-like bold
  const expl = (d.explanation || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  $('rec-explanation').innerHTML = expl;
}

// ───────────────────────────────────────────────────────────────────
//  2. Component score bars
// ───────────────────────────────────────────────────────────────────
function renderComponentScores(scores) {
  if (!scores) return;
  const map = {
    market: 'bar-market',
    fundamental: 'bar-fund',
    risk_adjusted: 'bar-risk',
    sentiment: 'bar-sent',
    portfolio_fit: 'bar-port',
  };
  const valMap = {
    market: 'val-market',
    fundamental: 'val-fund',
    risk_adjusted: 'val-risk',
    sentiment: 'val-sent',
    portfolio_fit: 'val-port',
  };
  Object.entries(map).forEach(([key, barId]) => {
    const val = scores[key] ?? 50;
    setTimeout(() => {
      $(barId).style.width = `${val}%`;
    }, 200);
    $(valMap[key]).textContent = val;
  });
}

// ───────────────────────────────────────────────────────────────────
//  3. Price chart
// ───────────────────────────────────────────────────────────────────
function renderPriceChart(ma) {
  priceChart = destroyChart(priceChart);
  if (!ma.chart_dates || !ma.chart_prices) return;

  const ctx = $('price-chart').getContext('2d');
  const gradFill = ctx.createLinearGradient(0, 0, 0, 280);
  gradFill.addColorStop(0, 'rgba(99,102,241,0.25)');
  gradFill.addColorStop(1, 'rgba(99,102,241,0.0)');

  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ma.chart_dates,
      datasets: [
        {
          label: 'Price',
          data: ma.chart_prices,
          borderColor: '#6366f1',
          backgroundColor: gradFill,
          borderWidth: 2,
          pointRadius: 0,
          fill: true,
          tension: 0.4,
          order: 1,
        },
        {
          label: 'SMA 20',
          data: ma.chart_sma20,
          borderColor: '#06b6d4',
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          tension: 0.4,
          borderDash: [],
          order: 2,
        },
        {
          label: 'SMA 50',
          data: ma.chart_sma50,
          borderColor: '#f59e0b',
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          tension: 0.4,
          borderDash: [4, 4],
          order: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { boxWidth: 16, padding: 16, usePointStyle: true },
        },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,0.95)',
          borderColor: 'rgba(99,102,241,0.3)',
          borderWidth: 1,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: $${ctx.raw?.toFixed(2) ?? '—'}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { maxTicksLimit: 8, maxRotation: 0 },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { callback: v => `$${v}` },
        },
      },
    },
  });
}

// ───────────────────────────────────────────────────────────────────
//  4. Market card
// ───────────────────────────────────────────────────────────────────
function renderMarketCard(ma) {
  // Trend badge
  const trend = (ma.trend || 'Neutral').toLowerCase();
  const trendClass = trend.includes('bull') ? 'bullish' : trend.includes('bear') ? 'bearish' : 'neutral';
  const trendIcon  = trend.includes('bull') ? '↑' : trend.includes('bear') ? '↓' : '→';
  $('trend-badge-container').innerHTML = `
    <div class="trend-badge ${trendClass}">${trendIcon} ${ma.trend || '—'}</div>
  `;

  // Metrics
  $('market-metrics').innerHTML = metricItems([
    { label: 'RSI (14)', value: ma.rsi, color: rsiColor(ma.rsi) },
    { label: 'MACD Hist', value: ma.macd_histogram?.toFixed(4), color: ma.macd_histogram > 0 ? 'good' : 'bad' },
    { label: 'SMA 20', value: `$${ma.sma_20}` },
    { label: 'SMA 50', value: `$${ma.sma_50}` },
    { label: '52W High', value: `$${ma.week_52_high}` },
    { label: '52W Low', value: `$${ma.week_52_low}` },
    { label: 'Vol Ratio', value: ma.volume_ratio, color: ma.volume_ratio > 1.2 ? 'good' : '' },
    { label: 'BB Position', value: ma.bollinger_position },
  ]);

  // Signals
  const sigs = ma.signals || {};
  const signalMap = [
    ['Price > SMA20', sigs.price_above_sma20],
    ['Price > SMA50', sigs.price_above_sma50],
    ['Price > SMA200', sigs.price_above_sma200],
    ['Golden Cross', sigs.golden_cross],
    ['MACD Bullish', sigs.macd_bullish],
    ['RSI Oversold', sigs.rsi_oversold],
    ['Volume ↑', sigs.volume_expanding],
  ];
  $('market-signals').innerHTML = signalMap
    .map(([label, val]) =>
      `<span class="signal-chip ${val ? 'positive' : 'negative'}">${val ? '✓' : '✗'} ${label}</span>`
    )
    .join('');
}

function rsiColor(rsi) {
  if (rsi < 30) return 'good';
  if (rsi > 70) return 'bad';
  return '';
}

// ───────────────────────────────────────────────────────────────────
//  5. Fundamental card
// ───────────────────────────────────────────────────────────────────
function renderFundamentalCard(fa) {
  const m = fa.metrics || {};
  $('fund-metrics').innerHTML = metricItems([
    { label: 'Sector', value: m.sector, mono: false },
    { label: 'Market Cap', value: `$${m.market_cap_B}B` },
    { label: 'P/E Ratio', value: m.pe_ratio },
    { label: 'Fwd P/E', value: m.forward_pe },
    { label: 'P/B Ratio', value: m.pb_ratio },
    { label: 'EPS', value: `$${m.eps}` },
    { label: 'Rev Growth', value: m.revenue_growth, color: growthColor(m.revenue_growth) },
    { label: 'EPS Growth', value: m.eps_growth, color: growthColor(m.eps_growth) },
    { label: 'ROE', value: m.roe, color: growthColor(m.roe) },
    { label: 'D/E Ratio', value: m.debt_to_equity },
    { label: 'Profit Margin', value: m.profit_margin, color: growthColor(m.profit_margin) },
    { label: 'Free CF', value: m.free_cashflow_B !== 'N/A' ? `$${m.free_cashflow_B}B` : 'N/A' },
  ]);
}

function growthColor(val) {
  if (!val || val === 'N/A') return '';
  const num = parseFloat(val);
  if (isNaN(num)) return '';
  return num > 0 ? 'good' : num < 0 ? 'bad' : '';
}

// ───────────────────────────────────────────────────────────────────
//  6. Risk card
// ───────────────────────────────────────────────────────────────────
function renderRiskCard(ra) {
  const level = (ra.risk_level || 'Medium').toLowerCase();
  const lbl = $('risk-level-label');
  lbl.textContent = ra.risk_level || '—';
  lbl.className = `risk-level-label ${level}`;

  const bar = $('risk-bar');
  bar.className = `risk-bar-inner ${level}`;
  setTimeout(() => { bar.style.width = `${ra.risk_score || 50}%`; }, 200);

  const m = ra.metrics || {};
  $('risk-metrics').innerHTML = metricItems([
    { label: 'Volatility (ann.)', value: m.annualized_volatility },
    { label: 'Beta', value: m.beta, color: betaColor(m.beta) },
    { label: 'VaR 95% (daily)', value: m.var_95_daily, color: 'bad' },
    { label: 'Max Drawdown', value: m.max_drawdown, color: 'bad' },
    { label: 'Sharpe Ratio', value: m.sharpe_ratio, color: sharpeColor(m.sharpe_ratio) },
  ]);
}

function betaColor(b) {
  if (!b) return '';
  const n = parseFloat(b);
  return n > 1.5 ? 'bad' : n < 0.8 ? 'good' : '';
}

function sharpeColor(s) {
  if (!s) return '';
  const n = parseFloat(s);
  return n > 1 ? 'good' : n < 0 ? 'bad' : '';
}

// ───────────────────────────────────────────────────────────────────
//  7. Sentiment card
// ───────────────────────────────────────────────────────────────────
function renderSentimentCard(sa) {
  const score = sa.sentiment_score ?? 0;
  const pct   = ((score + 1) / 2 * 100).toFixed(0);

  $('sent-score-big').textContent = score.toFixed(3);
  $('sent-label').textContent     = sa.sentiment_label || '—';

  // Move needle: left 0% = very negative (-1), left 100% = very positive (+1)
  setTimeout(() => {
    $('sent-needle').style.left = `${pct}%`;
  }, 300);

  const bd = sa.breakdown || {};
  $('sent-pos').textContent = bd.positive ?? '—';
  $('sent-neu').textContent = bd.neutral  ?? '—';
  $('sent-neg').textContent = bd.negative ?? '—';

  // News items
  const news = sa.news || [];
  $('news-list').innerHTML = news.length
    ? news.map(n => `
        <div class="news-item">
          <div class="news-sentiment-dot ${n.sentiment}" title="${n.sentiment}"></div>
          <div>
            <div class="news-text">${escHtml(n.title)}</div>
            <div class="news-source">${escHtml(n.source)}</div>
          </div>
        </div>
      `).join('')
    : '<div style="color:var(--text-muted);font-size:0.8rem;padding:8px">No recent news found.</div>';
}

// ───────────────────────────────────────────────────────────────────
//  8. Portfolio card + Pie chart
// ───────────────────────────────────────────────────────────────────
const ALLOC_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];

function renderPortfolioCard(po) {
  $('port-return').textContent = po.expected_annual_return  || '—';
  $('port-sharpe').textContent = po.portfolio_sharpe        || '—';
  $('port-vol').textContent    = po.portfolio_volatility    || '—';
  $('port-method').textContent = po.optimization_method    || '—';

  const alloc  = po.allocation_pct    || {};
  const amounts = po.allocation_amounts || {};
  const labels = Object.keys(alloc);
  const values = Object.values(alloc);

  // Allocation bars
  $('alloc-list').innerHTML = labels.map((label, i) => `
    <div class="alloc-row">
      <div class="alloc-label" title="${label}">${label}</div>
      <div class="alloc-bar-outer">
        <div class="alloc-bar-inner alloc-color-${i % 5}" id="ab-${i}" style="width:0%"></div>
      </div>
      <div class="alloc-pct">${values[i]}%</div>
      <div class="alloc-amount">$${(amounts[label] || 0).toLocaleString(undefined, {maximumFractionDigits:0})}</div>
    </div>
  `).join('');

  setTimeout(() => {
    labels.forEach((_, i) => {
      const el = document.getElementById(`ab-${i}`);
      if (el) el.style.width = `${values[i]}%`;
    });
  }, 300);

  // Pie chart
  allocChart = destroyChart(allocChart);
  const ctx = $('alloc-chart').getContext('2d');
  allocChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: ALLOC_COLORS.slice(0, labels.length),
        borderColor: '#020817',
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,0.95)',
          borderColor: 'rgba(99,102,241,0.3)',
          borderWidth: 1,
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.raw}%`,
          },
        },
      },
    },
  });
}

// ───────────────────────────────────────────────────────────────────
//  9. Volatility chart
// ───────────────────────────────────────────────────────────────────
function renderVolChart(ra) {
  volChart = destroyChart(volChart);
  if (!ra.chart_vol_dates || !ra.chart_vol_values) return;

  const ctx = $('vol-chart').getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 220);
  grad.addColorStop(0, 'rgba(245,158,11,0.25)');
  grad.addColorStop(1, 'rgba(245,158,11,0.0)');

  volChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ra.chart_vol_dates,
      datasets: [{
        label: 'Annualized Volatility (%)',
        data: ra.chart_vol_values,
        borderColor: '#f59e0b',
        backgroundColor: grad,
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,0.95)',
          borderColor: 'rgba(245,158,11,0.3)',
          borderWidth: 1,
          callbacks: { label: ctx => ` Volatility: ${ctx.raw}%` },
        },
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { maxTicksLimit: 8, maxRotation: 0 } },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { callback: v => `${v}%` },
        },
      },
    },
  });
}

// ───────────────────────────────────────────────────────────────────
//  Utility: build metric grid HTML
// ───────────────────────────────────────────────────────────────────
function metricItems(items) {
  return items.map(({ label, value, color = '', mono = true }) => `
    <div class="metric-item">
      <div class="metric-label">${label}</div>
      <div class="metric-value ${color}" style="${mono ? '' : 'font-family:Inter,sans-serif;font-size:0.82rem'}">${value ?? '—'}</div>
    </div>
  `).join('');
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
