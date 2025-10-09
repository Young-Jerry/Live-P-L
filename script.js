// Stocks with WACC and total cost
const stocks = [
  {scrip:'API', quantity:360, WACC:301.1552, totalCost:108415.872, LTP:301.1552, history:[]},
  {scrip:'CFCL', quantity:27, WACC:100, totalCost:2700, LTP:100, history:[]},
  {scrip:'CLI', quantity:13, WACC:210.7692, totalCost:2740, LTP:210.7692, history:[]},
  {scrip:'GHL', quantity:90, WACC:100, totalCost:9000, LTP:100, history:[]},
  {scrip:'HBL', quantity:10, WACC:157, totalCost:1570, LTP:157, history:[]},
  {scrip:'HIDCL', quantity:72, WACC:100, totalCost:7200, LTP:100, history:[]},
  {scrip:'HLI', quantity:12, WACC:100, totalCost:1200, LTP:100, history:[]},
  {scrip:'HPPL', quantity:10, WACC:100, totalCost:1000, LTP:100, history:[]},
  {scrip:'ILI', quantity:12, WACC:214.0917, totalCost:2569.1, LTP:214.0917, history:[]},
  {scrip:'JBBL', quantity:19, WACC:100, totalCost:1900, LTP:100, history:[]},
  {scrip:'LUK', quantity:500, WACC:10, totalCost:5000, LTP:10, history:[]},
  {scrip:'MBJC', quantity:10, WACC:100, totalCost:1000, LTP:100, history:[]},
  {scrip:'NADEP', quantity:30, WACC:100, totalCost:3000, LTP:100, history:[]},
  {scrip:'NGPL', quantity:93, WACC:100, totalCost:9300, LTP:100, history:[]},
  {scrip:'NIFRA', quantity:54, WACC:100, totalCost:5400, LTP:100, history:[]},
  {scrip:'NIMB', quantity:125, WACC:100, totalCost:12500, LTP:100, history:[]},
  {scrip:'NMB', quantity:74, WACC:100, totalCost:7400, LTP:100, history:[]},
  {scrip:'NRN', quantity:11, WACC:100, totalCost:1100, LTP:100, history:[]},
  {scrip:'RHPL', quantity:40, WACC:100, totalCost:4000, LTP:100, history:[]},
  {scrip:'RNLI', quantity:12, WACC:230.8333, totalCost:2770, LTP:230.8333, history:[]},
  {scrip:'SCB', quantity:25, WACC:576, totalCost:14400, LTP:576, history:[]},
  {scrip:'SGIC', quantity:10, WACC:100, totalCost:1000, LTP:100, history:[]},
  {scrip:'SJCL', quantity:20, WACC:100, totalCost:2000, LTP:100, history:[]},
  {scrip:'SNLI', quantity:16, WACC:186.875, totalCost:2990, LTP:186.875, history:[]},
  {scrip:'SSIS', quantity:93, WACC:10, totalCost:930, LTP:10, history:[]},
  {scrip:'UAIL', quantity:10, WACC:100, totalCost:1000, LTP:100, history:[]}
];

// Simulated LTP updates (±2% random)
function simulateLTP() {
    const ltpData = {};
    stocks.forEach(stock => {
        const change = stock.WACC * (Math.random() * 0.04 - 0.02);
        ltpData[stock.scrip] = +(stock.WACC + change).toFixed(2);
    });
    return ltpData;
}

// Update table, P/L, charts, alerts
function updateData() {
    const ltpData = simulateLTP();
    let totalPL = 0, totalValue = 0;

    stocks.forEach(stock => {
        stock.LTP = ltpData[stock.scrip];
        stock.currentValue = stock.LTP * stock.quantity;
        stock.profitLoss = (stock.LTP - stock.WACC) * stock.quantity;
        totalPL += stock.profitLoss;
        totalValue += stock.currentValue;

        stock.history.push(stock.LTP);
        if(stock.history.length>30) stock.history.shift();
    });

    document.getElementById('totalPL').textContent = totalPL.toFixed(2);
    document.getElementById('totalValue').textContent = totalValue.toFixed(2);

    renderTable();
    updateCharts();
    checkAlerts();
}

// Table render
function renderTable() {
    const tbody = document.querySelector('#stocksTable tbody');
    tbody.innerHTML = '';
    stocks.forEach(stock => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${stock.scrip}</td>
            <td>${stock.quantity}</td>
            <td>${stock.WACC.toFixed(2)}</td>
            <td>${stock.totalCost.toFixed(2)}</td>
            <td>${stock.LTP.toFixed(2)}</td>
            <td>${stock.currentValue.toFixed(2)}</td>
            <td class="${stock.profitLoss>=0?'profit':'loss'}">${stock.profitLoss.toFixed(2)}</td>
            <td><canvas id="spark-${stock.scrip}" width="100" height="30"></canvas></td>
        `;
        tbody.appendChild(row);
        renderSparkline(stock);
    });
}

// Sparkline per stock
function renderSparkline(stock) {
    const ctx = document.getElementById('spark-' + stock.scrip).getContext('2d');
    new Chart(ctx, {
        type:'line',
        data:{labels:stock.history.map((_,i)=>i), datasets:[{data:stock.history, borderColor:stock.profitLoss>=0?'#00ff00':'#ff3b3b', borderWidth:1, fill:false, pointRadius:0}]},
        options:{responsive:false, plugins:{legend:{display:false}}, scales:{x:{display:false}, y:{display:false}}}
    });
}

// Main charts
let plChartInstance, allocationChartInstance;
function updateCharts() {
    const ctx = document.getElementById('plChart').getContext('2d');
    const labels = stocks.map(s=>s.scrip);
    const plValues = stocks.map(s=>s.profitLoss.toFixed(2));

    if(!plChartInstance){
        plChartInstance = new Chart(ctx, {
            type:'line',
            data:{labels, datasets:[{label:'Profit/Loss', data:plValues, borderColor:'#00ff00', backgroundColor:'rgba(0,255,0,0.2)', fill:true}]},
            options:{responsive:true, plugins:{legend:{display:false}}}
        });
    } else {
        plChartInstance.data.datasets[0].data = plValues;
        plChartInstance.update();
    }

    const pieCtx = document.getElementById('allocationChart').getContext('2d');
    const allocations = stocks.map(s=>s.currentValue);
    if(!allocationChartInstance){
        allocationChartInstance = new Chart(pieCtx,{
            type:'pie',
            data:{labels, datasets:[{data:allocations, backgroundColor:stocks.map(_=>'#00ff00')}]},
            options:{responsive:true}
        });
    } else {
        allocationChartInstance.data.datasets[0].data = allocations;
        allocationChartInstance.update();
    }
}

// Alerts
function checkAlerts() {
    const alertList = document.getElementById('alertList');
    alertList.innerHTML = '';
    stocks.forEach(s=>{
        if(Math.abs(s.profitLoss)>5000){
            const li = document.createElement('li');
            li.textContent = `${s.scrip} P/L exceeds 5k: ${s.profitLoss.toFixed(2)}`;
            alertList.appendChild(li);
        }
    });
}

// Sorting
function sortTable(n) {
    let table = document.getElementById("stocksTable");
    let rows = Array.from(table.rows).slice(1);
    let asc = table.rows[0].cells[n].asc = !(table.rows[0].cells[n].asc||false);
    rows.sort((a,b)=>{
        let x=a.cells[n].textContent, y=b.cells[n].textContent;
        return !isNaN(x)&&!isNaN(y)?(asc?x-y:y-x):(asc?x.localeCompare(y):y.localeCompare(x));
    });
    rows.forEach(r=>table.appendChild(r));
}

// Search
document.getElementById('searchStock').addEventListener('input', e=>{
    const val=e.target.value.toLowerCase();
    const tbody=document.querySelector('#stocksTable tbody');
    Array.from(tbody.rows).forEach(row=>{
        row.style.display = row.cells[0].textContent.toLowerCase().includes(val)?'':'none';
    });
});

// CSV export
document.getElementById('exportBtn').addEventListener('click',()=>{
    let csv='Scrip,Quantity,WACC,TotalCost,LTP,CurrentValue,ProfitLoss\n';
    stocks.forEach(s=>{
        csv+=`${s.scrip},${s.quantity},${s.WACC},${s.totalCost},${s.LTP},${s.currentValue},${s.profitLoss}\n`;
    });
    const blob=new Blob([csv], {type:'text/csv'});
    const link=document.createElement('a');
    link.href=URL.createObjectURL(blob);
    link.download='portfolio.csv';
    link.click();
});

// Auto-update every 5 seconds
updateData();
setInterval(updateData,5000);
