const TICK = 5000;
const HIST_LEN = 60;

const initialStocks = [
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

let stocks = initialStocks.map(s => ({ ...s, price: s.buyPrice }));

const profitEl = document.getElementById('todayProfit');
const totalProfitEl = document.getElementById('totalProfit');
const capitalEl = document.getElementById('capital');
const stockListEl = document.getElementById('stockList');
const timeEl = document.getElementById('time');

const ctx = document.getElementById('stakeChart').getContext('2d');
const gradient = ctx.createLinearGradient(0, 0, 0, 220);
gradient.addColorStop(0, 'rgba(59, 207, 129, 0.8)');
gradient.addColorStop(1, 'rgba(59, 207, 129, 0.1)');

const chartData = Array(HIST_LEN).fill(0);
const myChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: Array(HIST_LEN).fill(''),
    datasets: [{
      data: chartData,
      borderColor: gradient,
      backgroundColor: 'rgba(59, 207, 129, 0.08)',
      borderWidth: 3,
      pointRadius: 0,
      tension: 0.4,
      fill: true
    }]
  },
  options: {
    animation: { duration: 600, easing: 'easeOutQuart' },
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { display: false }, y: { display: false } },
    plugins: { legend: { display: false }, tooltip: { enabled: false } }
  }
});

function renderStockList() {
  stockListEl.innerHTML = '';
  stocks.forEach(s => {
    const div = document.createElement('div');
    div.className = 'stock-item';
    div.innerHTML = `<div><span class="stock-symbol">${s.symbol}</span> &nbsp; x${s.shares}</div>
                     <div class="stock-price">₹${s.price.toFixed(2)}</div>`;
    stockListEl.appendChild(div);
  });
}

function computeMetrics(dailyPrices) {
  const totalMarket = stocks.reduce((sum, s) => sum + s.price * s.shares, 0);
  const totalProfit = stocks.reduce((sum, s) => sum + (s.price - s.buyPrice) * s.shares, 0);
  const todayProfit = stocks.reduce((sum, s) => sum + ((s.price - (dailyPrices[s.symbol] ?? s.buyPrice)) * s.shares), 0);
  return { totalMarket, totalProfit, todayProfit };
}

function updateUI(metrics) {
  totalProfitEl.innerText = (metrics.totalProfit >= 0 ? '₹' : '-₹') + Math.abs(metrics.totalProfit).toFixed(2);
  profitEl.innerText = (metrics.todayProfit >= 0 ? '₹' : '-₹') + Math.abs(metrics.todayProfit).toFixed(2);
  capitalEl.innerText = '₹' + metrics.totalMarket.toFixed(2);
}

function pushChartValue(val) {
  const data = myChart.data.datasets[0].data;
  data.push(+val.toFixed(2));
  if (data.length > HIST_LEN) data.shift();
  myChart.update();
}

async function fetchYesterdayPrices() {
  try {
    const res = await fetch('./daily_prices.json');
    if (!res.ok) throw new Error('Failed to fetch yesterday prices');
    return await res.json();
  } catch (err) { console.error(err); return {}; }
}

async function fetchLivePrices() {
  const symbols = stocks.map(s => s.symbol);
  const proxyUrl = 'https://corsproxy.io/?';
  try {
    const results = await Promise.all(symbols.map(async symbol => {
      const url = `${proxyUrl}https://nepsetty.kokomo.workers.dev/api/stock?symbol=${symbol}`;
      const res = await fetch(url);
      const data = await res.json();
      return { symbol, price: data.ltp };
    }));
    results.forEach(np => {
      const s = stocks.find(x => x.symbol === np.symbol);
      if (s && np.price != null) s.price = +np.price;
    });
    renderStockList();
    const dailyPrices = await fetchYesterdayPrices();
    const metrics = computeMetrics(dailyPrices);
    updateUI(metrics);
    pushChartValue(metrics.todayProfit);
  } catch (err) { console.error(err); }
}

renderStockList();
fetchLivePrices();
setInterval(fetchLivePrices, TICK);

setInterval(() => {
  const now = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kathmandu' });
  timeEl.textContent = now;
}, 1000);
