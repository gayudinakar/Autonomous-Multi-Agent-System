# 🤖 InvestAI — Autonomous Multi-Agent System for Smart Investment Decision Making

An intelligent, multi-agent AI system that automates stock research and portfolio allocation using specialized autonomous agents. The central orchestrator synthesizes inputs from all agents to provide a data-driven **BUY**, **HOLD**, or **SELL** recommendation with confidence scoring and comprehensive justifications.

---

## 🌟 Architecture & Agents Overview

```
                      ┌────────────────────────────────────────┐
                      │     Web Dashboard (Glassmorphism UI)   │
                      │       HTML5 • Modern CSS • Chart.js    │
                      └───────────────────┬────────────────────┘
                                          │ HTTP /api/analyze
                                          ▼
                      ┌────────────────────────────────────────┐
                      │       FastAPI Orchestration API        │
                      └───────────────────┬────────────────────┘
                                          │
                               ┌──────────▼──────────┐
                               │   Decision Agent    │
                               │  (Central Decision) │
                               └──────────┬──────────┘
             ┌─────────────────┬──────────┼──────────┬─────────────────┐
             │                 │          │          │                 │
             ▼                 ▼          ▼          ▼                 ▼
      ┌─────────────┐   ┌────────────┐ ┌──────┐ ┌──────────┐   ┌───────────────┐
      │Market Agent │   │Fundamental │ │ Risk │ │Sentiment │   │Portfolio Agent│
      │  (Technical)│   │   Agent    │ │ Agent│ │  Agent   │   │  (Optimization│
      │ RSI, MACD,  │   │ P/E, EPS,  │ │Beta, │ │VADER NLP,│   │  MPT, Sharpe) │
      │ SMA, BBands │   │ Growth, FCF│ │VaR,DD│ │News Feed │   │               │
      └─────────────┘   └────────────┘ └──────┘ └──────────┘   └───────────────┘
```

### 1. 📈 Market Agent (`market_agent.py`)
- **Technical Indicators**: 20/50/200 SMA, 14-day RSI, MACD (12/26/9), Bollinger Bands, 52-week position, volume trend ratio.
- **Output**: Technical signal scoring (0–100), trend determination (Bullish/Neutral/Bearish), and 60-day historical chart data.

### 2. 🏦 Fundamental Agent (`fundamental_agent.py`)
- **Financial Metrics**: Trailing & Forward P/E, P/B, Price-to-Sales, EPS & EPS growth, YoY Revenue growth, ROE (Return on Equity), Debt-to-Equity, Profit Margin, Free Cash Flow (FCF), and Dividend Yield.
- **Output**: Fundamental health score (0–100) and categorized balance sheet / income metrics.

### 3. ⚠️ Risk Assessment Agent (`risk_agent.py`)
- **Quantitative Risk Analysis**: Annualized Volatility, Beta vs. S&P 500 (^GSPC), 95% Daily Value-at-Risk (VaR), Maximum Historical Peak-to-Trough Drawdown, and Sharpe Ratio (5% risk-free rate).
- **Output**: Risk classification (Low / Medium / High), risk index score (0–100), and 21-day rolling volatility timeline.

### 4. 💬 Sentiment Agent (`sentiment_agent.py`)
- **NLP Sentiment Engine**: Fetches real-time financial news headlines via Yahoo Finance and evaluates compound polarity with VADER NLP, applying recency weighting.
- **Output**: Polarity index (-1.000 to +1.000), categorization (Positive / Neutral / Negative), and curated feed of articles.

### 5. 📊 Portfolio Optimization Agent (`portfolio_agent.py`)
- **Modern Portfolio Theory (MPT)**: Formulates an optimal asset basket between the target equity and risk-calibrated benchmarks (e.g., SPY, AGQ, QQQ, SHV) via SLSQP Sharpe optimization using `scipy.optimize`.
- **Output**: Capital allocation breakdown (%), dollar-value distribution, expected portfolio return, and overall portfolio Sharpe.

### 6. 🎯 Decision Agent (`decision_agent.py`)
- **Synthesis Engine**: Concurrently executes all agents using `ThreadPoolExecutor`, adjusts weighting dynamically based on the investor's risk tolerance, aggregates the multi-agent signals into a composite score (0–100), decides **BUY / HOLD / SELL**, and generates a natural-language investment thesis.

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.10+ (Python 3.12 supported)
- pip & internet connectivity (for Yahoo Finance live quotes)

### 1. Clone & Navigate to Project
```bash
cd c:/Users/ramya/OneDrive/Desktop/project
```

### 2. Set Up Virtual Environment
```bash
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Or Command Prompt:
.\venv\Scripts\activate.bat
```

### 3. Install Dependencies
```bash
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

### 4. Launch the Server
```bash
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

### 5. Open the Dashboard
Navigate your browser to:
```
http://127.0.0.1:8000/
```
*(Or open `frontend/index.html` directly in your browser)*

---

## 📡 API Endpoints

### Health Check
- **`GET /api/health`**
  ```json
  { "status": "ok", "service": "Investment Multi-Agent System" }
  ```

### Stock Analysis
- **`POST /api/analyze`**
  - **Request**:
    ```json
    {
      "ticker": "NVDA",
      "investment_amount": 10000,
      "risk_tolerance": "medium"
    }
    ```
  - **Response**:
    ```json
    {
      "ticker": "NVDA",
      "recommendation": "BUY",
      "confidence": 68.2,
      "composite_score": 84.1,
      "explanation": "...",
      "component_scores": {
        "market": 86.4,
        "fundamental": 88.0,
        "risk_adjusted": 65.0,
        "sentiment": 75.2,
        "portfolio_fit": 82.0
      },
      "market_analysis": { ... },
      "fundamental_analysis": { ... },
      "risk_assessment": { ... },
      "sentiment_analysis": { ... },
      "portfolio_optimization": { ... }
    }
    ```

---

## 🛠️ Project Structure

```
project/
├── backend/
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── base_agent.py          # Abstract base agent class
│   │   ├── market_agent.py        # Technical analysis agent
│   │   ├── fundamental_agent.py   # Fundamental financial agent
│   │   ├── risk_agent.py          # Quantitative risk agent
│   │   ├── sentiment_agent.py     # VADER NLP sentiment agent
│   │   ├── portfolio_agent.py     # Modern Portfolio Theory agent
│   │   └── decision_agent.py      # Orchestrator & recommendation engine
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py              # FastAPI endpoints & Pydantic models
│   ├── utils/
│   │   ├── __init__.py
│   │   └── data_fetcher.py        # yfinance data provider with LRU cache
│   ├── main.py                    # Server entrypoint & static mount
│   └── requirements.txt
├── frontend/
│   ├── index.html                 # Dashboard layout & controls
│   ├── styles.css                 # Glassmorphism dark-theme styling
│   └── app.js                     # Async client & Chart.js visualizations
└── README.md
```

---

## 🛡️ License
MIT License. Built for smart investment research and educational purposes.
