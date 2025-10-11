// Stocks with WACC (used as Avg Cost) and total cost
const stocks = [
  { scrip: 'API', quantity: 360, avgCost: 301.1552, totalCost: 108415.872, LTP: 301.1552, history: [] },
  { scrip: 'CFCL', quantity: 27, avgCost: 100, totalCost: 2700, LTP: 100, history: [] },
  { scrip: 'CLI', quantity: 13, avgCost: 210.7692, totalCost: 2740, LTP: 210.7692, history: [] },
  { scrip: 'GHL', quantity: 90, avgCost: 100, totalCost: 9000, LTP: 100, history: [] },
  { scrip: 'HBL', quantity: 10, avgCost: 157, totalCost: 1570, LTP: 157, history: [] },
  { scrip: 'HIDCL', quantity: 72, avgCost: 100, totalCost: 7200, LTP: 100, history: [] },
  { scrip: 'HLI', quantity: 12, avgCost: 100, totalCost: 1200, LTP: 100, history: [] },
  { scrip: 'HPPL', quantity: 10, avgCost: 100, totalCost: 1000, LTP: 100, history: [] },
  { scrip: 'ILI', quantity: 12, avgCost: 214.0917, totalCost: 2569.1, LTP: 214.0917, history: [] },
  { scrip: 'JBBL', quantity: 19, avgCost: 100, totalCost: 1900, LTP: 100, history: [] },
  { scrip: 'LUK', quantity: 500, avgCost: 10, totalCost: 5000, LTP: 10, history: [] },
  { scrip: 'MBJC', quantity: 10, avgCost: 100, totalCost: 1000, LTP: 100, history: [] },
  { scrip: 'NADEP', quantity: 30, avgCost: 100, totalCost: 3000, LTP: 100, history: [] },
  { scrip: 'NGPL', quantity: 93, avgCost: 100, totalCost: 9300, LTP: 100, history: [] },
  { scrip: 'NIFRA', quantity: 54, avgCost: 100, totalCost: 5400, LTP: 100, history: [] },
  { scrip: 'NIMB', quantity: 125, avgCost: 100, totalCost: 12500, LTP: 100, history: [] },
  { scrip: 'NMB', quantity: 74, avgCost: 100, totalCost: 7400, LTP: 100, history: [] },
  { scrip: 'NRN', quantity: 11, avgCost: 100, totalCost: 1100, LTP: 100, history: [] },
  { scrip: 'RHPL', quantity: 40, avgCost: 100, totalCost: 4000, LTP: 100, history: [] },
  { scrip: 'RNLI', quantity: 12, avgCost: 230.8333, totalCost: 2770, LTP: 230.8333, history: [] },
  { scrip: 'SCB', quantity: 25, avgCost: 576, totalCost: 14400, LTP: 576, history: [] },
  { scrip: 'SGIC', quantity: 10, avgCost: 100, totalCost: 1000, LTP: 100, history: [] },
  { scrip: 'SJCL', quantity: 20, avgCost: 100, totalCost: 2000, LTP: 100, history: [] },
  { scrip: 'SNLI', quantity: 16, avgCost: 186.875, totalCost: 2990, LTP: 186.875, history: [] },
  { scrip: 'SSIS', quantity: 93, avgCost: 10, totalCost: 930, LTP: 10, history: [] },
  { scrip: 'UAIL', quantity: 10, avgCost: 100, totalCost: 1000, LTP: 100, history: [] }
];

// Base NEPSE API
const apiBase = 'https://nepsetty.kokomo.workers.dev/api/stock?symbol=';

// Fetch real LTP for one stock
async function fetchLTP(symbol) {
  try {
    const res = await fetch(apiBase + symbol);
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    // Adjust the property below depending on what the API returns.
    // Typical response: { "symbol":"API","ltp":301,"change":0.5,... }
    const price = data.ltp || data.current_price || data.price || data.last_price;
    return parseFloat(price);
  } catch (err) {
    console.error('Fetch error for', symbol, err);
    return null;
  }
}

// Fetch LTPs for all stocks
async function fetchAllLTPs() {
  const promises = stocks.map(s => fetchLTP(s.scrip));
  const results = await Promise.all(promises);
  const map = {};
  results.forEach((price, i) => {
    map[stocks[i].scrip] = price;
  });
  return map;
}

// Update data using real API
async function updateData() {
  const ltpData = await fetchAllLTPs();
  let totalPL = 0, totalValue = 0;

  stocks.forEach(stock => {
    const fetched = ltpData[stock.scrip];
    if (fetched && !isNaN(fetched)) stock.LTP = fetched;

    stock.currentValue = +(stock.LTP * stock.quantity);
    stock.profitLoss = +((stock.LTP - stock.avgCost) * stock.quantity);
    totalPL += stock.profitLoss;
    totalValue += stock.currentValue;

    stock.history.push(stock.LTP);
    if (stock.history.length > 30) stock.history.shift();
  });

  document.getElementById('totalPL').textContent = totalPL.toFixed(2);
  document.getElementById('totalValue').textContent = totalValue.toFixed(2);

  renderTable();
  updatePLChart();
}

// Render table
function renderTable() {
  const tbody = document.querySelector('#stocksTable tbody');
  tbody.innerHTML = '';
  stocks.forEach(stock => {
    const row = document.createElement('tr');
    const plClass = stock.profitLoss >= 0 ? 'profit' : 'loss';
    row.innerHTML = `
      <td class="scrip">${stock.scrip}</td>
      <td class="quantity ${plClass}">${stock.quantity}</td>
      <td>${stock.avgCost.toFixed(2)}</td>
      <td>${stock.totalCost.toFixed(2)}</td>
      <td>${stock.LTP.toFixed(2)}</td>
      <td>${stock.currentValue.toFixed(2)}</td>
      <td class="${plClass}">${stock.profitLoss.toFixed(2)}</td>
      <td><canvas id="spark-${stock.scrip}" width="120" height="30"></canvas></td>
    `;
    tbody.appendChild(row);
    renderSparkline(stock);
  });
}

// Sparkline chart for each stock
function renderSparkline(stock) {
  const canvas = document.getElementById('spark-' + stock.scrip);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (canvas._chartInstance) canvas._chartInstance.destroy();

  canvas._chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: stock.history.map((_, i) => i),
      datasets: [{
        data: stock.history,
        borderColor: stock.profitLoss >= 0 ? '#00ff00' : '#ff3b3b',
        borderWidth: 1,
        fill: false,
        pointRadius: 0
      }]
    },
    options: {
      responsive: false,
      plugins: { legend: { display: false } },
      elements: { line: { tension: 0.2 } },
      scales: { x: { display: false }, y: { display: false } },
      layout: { padding: 0 },
      animation: false
    }
  });
}

// Main Profit/Loss Chart
let plChartInstance = null;
function updatePLChart() {
  const ctx = document.getElementById('plChart').getContext('2d');
  const labels = stocks.map(s => s.scrip);
  const plValues = stocks.map(s => +s.profitLoss.toFixed(2));
  const bgColors = stocks.map(s => s.profitLoss >= 0 ? 'rgba(0,255,0,0.35)' : 'rgba(255,59,59,0.35)');
  const borderColors = stocks.map(s => s.profitLoss >= 0 ? 'rgba(0,255,0,1)' : 'rgba(255,59,59,1)');

  if (!plChartInstance) {
    plChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Profit / Loss (Rs)',
          data: plValues,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                const i = ctx.dataIndex;
                const s = stocks[i];
                return `${s.scrip} — P/L: ${s.profitLoss.toFixed(2)} | Qty: ${s.quantity} | LTP: ${s.LTP.toFixed(2)}`;
              }
            }
          }
        },
        scales: { y: { beginAtZero: true } },
        animation: false
      }
    });
  } else {
    plChartInstance.data.labels = labels;
    plChartInstance.data.datasets[0].data = plValues;
    plChartInstance.data.datasets[0].backgroundColor = bgColors;
    plChartInstance.data.datasets[0].borderColor = borderColors;
    plChartInstance.update();
  }
}

// Sorting
function sortTable(n) {
  const table = document.getElementById("stocksTable");
  const tbody = table.tBodies[0];
  const rows = Array.from(tbody.rows);
  const asc = table.rows[0].cells[n].asc = !(table.rows[0].cells[n].asc || false);
  rows.sort((a, b) => {
    let x = a.cells[n].textContent.trim();
    let y = b.cells[n].textContent.trim();
    const xn = parseFloat(x.replace(/,/g, ''));
    const yn = parseFloat(y.replace(/,/g, ''));
    if (!isNaN(xn) && !isNaN(yn)) return asc ? xn - yn : yn - xn;
    return asc ? x.localeCompare(y) : y.localeCompare(x);
  });
  rows.forEach(r => tbody.appendChild(r));
}

// CSV export
document.getElementById('exportBtn').addEventListener('click', () => {
  let csv = 'Scrip,Quantity,AvgCost,TotalCost,LTP,CurrentValue,ProfitLoss\n';
  stocks.forEach(s => {
    csv += `${s.scrip},${s.quantity},${s.avgCost},${s.totalCost},${s.LTP},${s.currentValue},${s.profitLoss}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'portfolio.csv';
  link.click();
});

// Initialize
updateData();
setInterval(updateData, 5000); // update every 5 seconds
