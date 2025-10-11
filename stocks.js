const TICK = 1000; // 1 second
const HIST_LEN = 60;

const NEPAL_UTC_OFFSET = 5 * 60 + 45; // minutes

// 26 stocks list with shares and buyPrice (same as before)
const allStocks = [
  { symbol: 'API', shares: 360, buyPrice: 108415.872 / 360 },
  { symbol: 'CFCL', shares: 27, buyPrice: 100 },
  { symbol: 'CLI', shares: 13, buyPrice: 2740 / 13 },
  { symbol: 'GHL', shares: 90, buyPrice: 100 },
  { symbol: 'HBL', shares: 10, buyPrice: 157 },
  { symbol: 'HIDCL', shares: 72, buyPrice: 100 },
  { symbol: 'HLI', shares: 12, buyPrice: 100 },
  { symbol: 'HPPL', shares: 10, buyPrice: 100 },
  { symbol: 'ILI', shares: 12, buyPrice: 2569.1 / 12 },
  { symbol: 'JBBL', shares: 19, buyPrice: 100 },
  { symbol: 'LUK', shares: 500, buyPrice: 10 },
  { symbol: 'MBJC', shares: 10, buyPrice: 100 },
  { symbol: 'NADEP', shares: 30, buyPrice: 100 },
  { symbol: 'NGPL', shares: 93, buyPrice: 100 },
  { symbol: 'NIFRA', shares: 54, buyPrice: 100 },
  { symbol: 'NIMB', shares: 125, buyPrice: 100 },
  { symbol: 'NMB', shares: 74, buyPrice: 100 },
  { symbol: 'NRN', shares: 11, buyPrice: 100 },
  { symbol: 'RHPL', shares: 40, buyPrice: 100 },
  { symbol: 'RNLI', shares: 12, buyPrice: 2770 / 12 },
  { symbol: 'SCB', shares: 25, buyPrice: 576 },
  { symbol: 'SGIC', shares: 10, buyPrice: 100 },
  { symbol: 'SJCL', shares: 20, buyPrice: 100 },
  { symbol: 'SNLI', shares: 16, buyPrice: 186.875 },
  { symbol: 'SSIS', shares: 93, buyPrice: 10 },
  { symbol: 'UAIL', shares: 10, buyPrice: 100 }
];

// Initial stocks: default empty (no stocks selected)
let stocks = [];

// Saved previous close prices from localStorage or empty object
let prevCloseLTPs = JSON.parse(localStorage.getItem('prevCloseLTPs') || '{}');

// Store price history for aggregated chart (array of net profit)
const profitHistory = Array(HIST_LEN).fill(0);

const profitEl = document.getElementById('profit');
const capitalEl = document.getElementById('capital');
const bullishEl = document.getElementById('bullish');
const bearishEl = document.getElementById('bearish');
const stockListEl = document.getElementById('stockList');
const liveTimeEl = document.getElementById('liveTime');
const lastUpdatedEl = document.getElementById('lastUpdated');
const btnAllStocks = document.getElementById('btnAllStocks');

const ctx = document.getElementById('chart').getContext('2d');

const chartConfig = {
  type: 'line',
  data: {
    labels: Array(HIST_LEN).fill(''),
    datasets: [{
      label: 'Net Profit',
      data: profitHistory,
      borderColor: '#3bcf81',
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.3,
      fill: false,
    }]
  },
  options: {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { display: false },
      y: { beginAtZero: false }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label(ctx) {
            const val = ctx.parsed.y;
            return (val >= 0 ? 'Profit: ₹' : 'Loss: -₹') + Math.abs(val).toFixed(2);
          }
        },
        backgroundColor: '#1b2735',
        titleColor: '#fff',
        bodyColor: '#3bcf81',
        borderColor: '#3bcf81',
        borderWidth: 1,
        padding: 6,
      }
    }
  }
};
const chart = new Chart(ctx, chartConfig);

// Helper: get Nepal time as Date object
function getNepalTime() {
  // UTC time plus 5h45m offset
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + NEPAL_UTC_OFFSET * 60000);
}

// Format HH:mm:ss for display
function formatTime(date) {
  const pad = n => n.toString().padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// Show live Nepal time
function updateLiveTime() {
  const nowNep = getNepalTime();
  liveTimeEl.textContent = formatTime(nowNep);
}

// Save previous close prices exactly at 15:00 NST
function checkAndSavePrevClose() {
  const nowNep = getNepalTime();
  if (nowNep.getHours() === 15 && nowNep.getMinutes() === 0 && nowNep.getSeconds() === 0) {
    // Save current LTP prices as prev close
    stocks.forEach(s => {
      prevCloseLTPs[s.symbol] = s.price || s.buyPrice;
    });
    localStorage.setItem('prevCloseLTPs', JSON.stringify(prevCloseLTPs));
    console.log('Saved previous close LTPs at 15:00 NST:', prevCloseLTPs);
  }
}

// Fetch prices from API (mock fetch with proxy)
async function fetchPrices() {
  if (stocks.length === 0) return;

  const symbols = stocks.map(s => s.symbol);

  try {
    const proxyUrl = 'https://corsproxy.io/?';
    const fetchPromises = symbols.map(async symbol => {
      // Use your actual API here. Example from previous code:
      const url = `${proxyUrl}https://nepsetty.kokomo.workers.dev/api/stock?symbol=${symbol}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch ${symbol}: ${res.status}`);
      const data = await res.json();
      return { symbol, price: data.ltp };
    });

    const results = await Promise.all(fetchPromises);

    results.forEach(({ symbol, price }) => {
      const stock = stocks.find(s => s.symbol === symbol);
      if (stock && price != null) {
        stock.price = +price;
      }
    });

    updateUI();
  } catch (e) {
    console.error('Fetch error:', e);
  }
}

// Compute metrics
function computeMetrics() {
  const totalMarket = stocks.reduce((sum, s) => sum + (s.price || s.buyPrice) * s.shares, 0);
  const totalCost = stocks.reduce((sum, s) => sum + s.buyPrice * s.shares, 0);
  const netProfit = totalMarket - totalCost;

  // Bullish / Bearish based on saved prevCloseLTPs
  const bullish = stocks.filter(s => {
    const prev = prevCloseLTPs[s.symbol] ?? s.buyPrice;
    return (s.price ?? s.buyPrice) > prev;
  }).length;

  const bearish = stocks.filter(s => {
    const prev = prevCloseLTPs[s.symbol] ?? s.buyPrice;
    return (s.price ?? s.buyPrice) < prev;
  }).length;

  return { totalMarket, totalCost, netProfit, bullish, bearish };
}

// Update UI
function updateUI() {
  const { totalMarket, netProfit, bullish, bearish } = computeMetrics();

  profitEl.textContent = (netProfit >= 0 ? '₹' : '-₹') + Math.abs(netProfit).toFixed(2);
  profitEl.className = 'value ' + (netProfit >= 0 ? 'profit' : 'loss');

  capitalEl.textContent = '₹' + totalMarket.toFixed(2);
  bullishEl.textContent = bullish;
  bullishEl.className = 'value bullish';
  bearishEl.textContent = bearish;
  bearishEl.className = 'value bearish';

  renderStockList();

  // Push to chart history and update chart
  profitHistory.push(netProfit);
  if (profitHistory.length > HIST_LEN) profitHistory.shift();

  const maxAbs = Math.max(...profitHistory.map(Math.abs));
  const pad = Math.max(50, maxAbs * 1.1);

  chart.options.scales.y.min = -pad;
  chart.options.scales.y.max = pad;
  chart.update();

  // Update last updated time
  lastUpdatedEl.textContent = 'Last updated: ' + formatTime(getNepalTime());
}

// Render stock list (empty by default)
function renderStockList() {
  stockListEl.innerHTML = '';
  if (stocks.length === 0) {
    stockListEl.textContent = '(No stocks loaded. Click "Load All Stocks" to begin.)';
    return;
  }

  stocks.forEach(s => {
    const prev = prevCloseLTPs[s.symbol] ?? s.buyPrice;
    const price = s.price ?? s.buyPrice;
    const bullish = price > prev;
    const bearish = price < prev;

    const div = document.createElement('div');
    div.className = 'stock-item';
    div.innerHTML = `
      <div class="stock-symbol">${s.symbol} &times;${s.shares}</div>
      <div class="stock-price ${bullish ? 'bullish' : bearish ? 'bearish' : ''}">₹${price.toFixed(2)}</div>
    `;
    stockListEl.appendChild(div);
  });
}

// Check if current time is market hours (11:00 to 15:00 NST)
function isMarketOpen() {
  const now = getNepalTime();
  const h = now.getHours();
  const m = now.getMinutes();
  // Open at 11:00:00 (inclusive), close at 15:00:00 (inclusive)
  return (h > 11 || (h === 11 && m >= 0)) && (h < 15);
}

// Button click to load all stocks
btnAllStocks.addEventListener('click', () => {
  // Load all stocks into current stocks
  stocks = allStocks.map(s => ({ ...s, price: null }));
  updateUI();
});

// Main interval loop: update time + fetch prices if market open + save prev close at 15:00
setInterval(() => {
  updateLiveTime();
  checkAndSavePrevClose();

  if (isMarketOpen()) {
    fetchPrices();
  }
}, TICK);

// Initial live time update
updateLiveTime();
updateUI();
