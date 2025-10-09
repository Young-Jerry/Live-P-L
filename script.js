// 26-stock WACC dataset
const stocks = [
    { scrip: "API", quantity: 360, WACC: 301.1552, totalCost: 108415.872, LTP: 302 },
    { scrip: "CFCL", quantity: 27, WACC: 100, totalCost: 2700, LTP: 105 },
    { scrip: "CLI", quantity: 13, WACC: 210.7692, totalCost: 2740, LTP: 448 },
    { scrip: "GHL", quantity: 90, WACC: 100, totalCost: 9000, LTP: 212 },
    { scrip: "HBL", quantity: 10, WACC: 157, totalCost: 1570, LTP: 198 },
    { scrip: "HIDCL", quantity: 72, WACC: 100, totalCost: 7200, LTP: 264.7 },
    { scrip: "HLI", quantity: 12, WACC: 100, totalCost: 1200, LTP: 375 },
    { scrip: "HPPL", quantity: 10, WACC: 100, totalCost: 1000, LTP: 439 },
    { scrip: "ILI", quantity: 12, WACC: 214.0917, totalCost: 2569.1, LTP: 433.4 },
    { scrip: "JBBL", quantity: 19, WACC: 100, totalCost: 1900, LTP: 316.3 },
    { scrip: "LUK", quantity: 500, WACC: 10, totalCost: 5000, LTP: 9.38 },
    { scrip: "MBJC", quantity: 10, WACC: 100, totalCost: 1000, LTP: 287 },
    { scrip: "NADEP", quantity: 30, WACC: 100, totalCost: 3000, LTP: 767 },
    { scrip: "NGPL", quantity: 93, WACC: 100, totalCost: 9300, LTP: 380 },
    { scrip: "NIFRA", quantity: 54, WACC: 100, totalCost: 5400, LTP: 260 },
    { scrip: "NIMB", quantity: 125, WACC: 100, totalCost: 12500, LTP: 203.9 },
    { scrip: "NMB", quantity: 74, WACC: 100, totalCost: 7400, LTP: 238.1 },
    { scrip: "NRN", quantity: 11, WACC: 100, totalCost: 1100, LTP: 1800 },
    { scrip: "RHPL", quantity: 40, WACC: 100, totalCost: 4000, LTP: 270.1 },
    { scrip: "RNLI", quantity: 12, WACC: 230.8333, totalCost: 2770, LTP: 448.8 },
    { scrip: "SCB", quantity: 25, WACC: 576, totalCost: 14400, LTP: 620 },
    { scrip: "SGIC", quantity: 10, WACC: 100, totalCost: 1000, LTP: 481.5 },
    { scrip: "SJCL", quantity: 20, WACC: 100, totalCost: 2000, LTP: 291.9 },
    { scrip: "SNLI", quantity: 16, WACC: 186.875, totalCost: 2990, LTP: 440 },
    { scrip: "SSIS", quantity: 93, WACC: 10, totalCost: 930, LTP: 10.25 },
    { scrip: "UAIL", quantity: 10, WACC: 100, totalCost: 1000, LTP: 453.8 }
];

// Populate Table
function updateTable() {
    const tbody = document.querySelector("#stocksTable tbody");
    tbody.innerHTML = "";
    stocks.forEach(stock => {
        const profitLoss = (stock.LTP - stock.WACC) * stock.quantity;
        const currentValue = stock.LTP * stock.quantity;
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${stock.scrip}</td>
            <td>${stock.quantity}</td>
            <td>${stock.WACC.toFixed(4)}</td>
            <td>${stock.totalCost.toFixed(2)}</td>
            <td>${stock.LTP.toFixed(2)}</td>
            <td>${currentValue.toFixed(2)}</td>
            <td class="${profitLoss>=0?'profit':'loss'}">${profitLoss.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
        stock.profitLoss = profitLoss;
        stock.currentValue = currentValue;
    });

    // Update totals
    const totalPL = stocks.reduce((acc, s) => acc + s.profitLoss, 0);
    const totalValue = stocks.reduce((acc, s) => acc + s.currentValue, 0);
    document.getElementById("totalPL").textContent = totalPL.toFixed(2);
    document.getElementById("totalValue").textContent = totalValue.toFixed(2);
}

// Chart Setup
const ctx = document.getElementById('plChart').getContext('2d');
const plChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Cumulative P/L',
            data: [],
            borderColor: 'green',
            backgroundColor: 'rgba(0,255,0,0.2)',
            fill: true,
            tension: 0.3
        }]
    },
    options: {
        animation: { duration: 500 },
        responsive: true,
        scales: {
            x: { display: true, title: { display: true, text: 'Time' } },
            y: { display: true, title: { display: true, text: 'P/L' } }
        }
    }
});

// Simulate fetching LTP and update chart
function updateChartData() {
    const now = new Date().toLocaleTimeString();

    // Example: simulate LTP fluctuation (replace with real NEPSE API fetch)
    stocks.forEach(stock => {
        const change = (Math.random() - 0.5) * 2; // ±1 fluctuation
        stock.LTP = Math.max(stock.LTP + change, 0.01);
    });

    updateTable();

    const totalPL = stocks.reduce((acc, s) => acc + s.profitLoss, 0);
    plChart.data.labels.push(now);
    plChart.data.datasets[0].data.push(totalPL);

    // Keep last 50 points
    if (plChart.data.labels.length > 50) {
        plChart.data.labels.shift();
        plChart.data.datasets[0].data.shift();
    }

    plChart.data.datasets[0].borderColor = totalPL >= 0 ? 'green' : 'red';
    plChart.data.datasets[0].backgroundColor = totalPL >= 0 ? 'rgba(0,255,0,0.2)' : 'rgba(255,59,59,0.2)';
    plChart.update();
}

// Initial load
updateTable();
updateChartData();

// Auto-refresh every 5 seconds
setInterval(updateChartData, 5000);

