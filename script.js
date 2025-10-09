// 26-stock dataset
const stocks = [
    { scrip: "API", quantity: 360, WACC: 301.1552, totalCost: 108415.872 },
    { scrip: "CFCL", quantity: 27, WACC: 100, totalCost: 2700 },
    { scrip: "CLI", quantity: 13, WACC: 210.7692, totalCost: 2740 },
    { scrip: "GHL", quantity: 90, WACC: 100, totalCost: 9000 },
    { scrip: "HBL", quantity: 10, WACC: 157, totalCost: 1570 },
    { scrip: "HIDCL", quantity: 72, WACC: 100, totalCost: 7200 },
    { scrip: "HLI", quantity: 12, WACC: 100, totalCost: 1200 },
    { scrip: "HPPL", quantity: 10, WACC: 100, totalCost: 1000 },
    { scrip: "ILI", quantity: 12, WACC: 214.0917, totalCost: 2569.1 },
    { scrip: "JBBL", quantity: 19, WACC: 100, totalCost: 1900 },
    { scrip: "LUK", quantity: 500, WACC: 10, totalCost: 5000 },
    { scrip: "MBJC", quantity: 10, WACC: 100, totalCost: 1000 },
    { scrip: "NADEP", quantity: 30, WACC: 100, totalCost: 3000 },
    { scrip: "NGPL", quantity: 93, WACC: 100, totalCost: 9300 },
    { scrip: "NIFRA", quantity: 54, WACC: 100, totalCost: 5400 },
    { scrip: "NIMB", quantity: 125, WACC: 100, totalCost: 12500 },
    { scrip: "NMB", quantity: 74, WACC: 100, totalCost: 7400 },
    { scrip: "NRN", quantity: 11, WACC: 100, totalCost: 1100 },
    { scrip: "RHPL", quantity: 40, WACC: 100, totalCost: 4000 },
    { scrip: "RNLI", quantity: 12, WACC: 230.8333, totalCost: 2770 },
    { scrip: "SCB", quantity: 25, WACC: 576, totalCost: 14400 },
    { scrip: "SGIC", quantity: 10, WACC: 100, totalCost: 1000 },
    { scrip: "SJCL", quantity: 20, WACC: 100, totalCost: 2000 },
    { scrip: "SNLI", quantity: 16, WACC: 186.875, totalCost: 2990 },
    { scrip: "SSIS", quantity: 93, WACC: 10, totalCost: 930 },
    { scrip: "UAIL", quantity: 10, WACC: 100, totalCost: 1000 }
];

// Fetch real-time LTP data
async function fetchLTPData() {
    const url = 'https://nepse-test.vercel.app/api?symbol=';
    const ltpData = {};

    for (const stock of stocks) {
        try {
            const response = await fetch(url + stock.scrip);
            const data = await response.json();
            ltpData[stock.scrip] = data.current_price;
        } catch (error) {
            console.error(`Error fetching data for ${stock.scrip}:`, error);
            ltpData[stock.scrip] = null; // Handle missing data gracefully
        }
    }

    return ltpData;
}

// Update table and chart
async function updateData() {
    const ltpData = await fetchLTPData();

    stocks.forEach(stock => {
        stock.LTP = ltpData[stock.scrip] || 0;
        stock.profitLoss = (stock.LTP - stock.WACC) * stock.quantity;
        stock.currentValue = stock.LTP * stock.quantity;
    });

    updateTable();
    updateChartData();
}

// Update table
function updateTable() {
    const tbody = document.querySelector("#stocksTable tbody");
    tbody.innerHTML = "";
    stocks.forEach(stock => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${stock.scrip}</td>
            <td>${stock.quantity}</td>
            <td>${stock.WACC.toFixed(4)}</td>
            <td>${stock.totalCost.toFixed(2)}</td>
            <td>${stock.LTP.toFixed(2)}</td>
            <td>${stock.currentValue.toFixed(2)}</td>
            <td class="${stock.profitLoss >= 0 ? 'profit' : 'loss'}">${stock.profitLoss.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });

    const totalPL = stocks.reduce((acc, s) => acc + s.profitLoss, 0);
    const totalValue = stocks.reduce((acc, s) => acc + s.currentValue, 0);

    document.getElementById("totalPL").textContent = totalPL.toFixed(2);
    document.getElementById("totalValue").textContent = totalValue.toFixed(2);
}

// Chart setup
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

// Update chart data
function updateChartData() {
    const now = new Date().toLocaleTimeString();
    const totalPL = stocks.reduce((acc, s) => acc + s.profitLoss, 0);

    plChart.data.labels.push(now);
    plChart.data.datasets[0].data.push(totalPL);

    if (plChart.data.labels.length > 50) {
        plChart.data.labels.shift();
        plChart.data.datasets[0].data.shift();
    }

    plChart.data.datasets[0].borderColor = totalPL >= 0 ? 'green' : 'red';
    plChart.data.datasets[0].backgroundColor = totalPL >= 0 ? 'rgba(0,255,0,0.2)' : 'rgba(255,59,59,0.2)';
    plChart.update();
}

// Initial load
updateData();

// Auto-refresh every 5 seconds
setInterval(updateData, 5000);
