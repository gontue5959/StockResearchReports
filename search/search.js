// 研究報告搜尋頁面 JS
async function loadSummary() {
    const res = await fetch('data_folder_summary.json');
    return await res.json();
}

function buildStockMap(summary) {
    const stockMap = {};
    Object.entries(summary).forEach(([date, stocks]) => {
        stocks.forEach(stock => {
            if (!stockMap[stock]) stockMap[stock] = [];
            stockMap[stock].push(date);
        });
    });
    Object.values(stockMap).forEach(arr => arr.sort((a, b) => b.localeCompare(a)));
    return stockMap;
}

function createReportLink(stock, date) {
    if (date === 'new') {
        return `https://gontue5959.github.io/StockResearchReports/main.html?stockid=${stock}`;
    } else {
        return `https://gontue5959.github.io/StockResearchReports/main.html?stockid=${stock}&date=${date}`;
    }
}

// 新增：載入股票名稱
async function loadStockNames() {
    const res = await fetch('stockName.json');
    const data = await res.json();
    const codeNameMap = {};
    const codeEnNameMap = {};
    if (data && data.Data) {
        data.Data.forEach(item => {
            if (item.length >= 2) codeNameMap[item[0].toUpperCase()] = item[1];
            if (item.length >= 3) codeEnNameMap[item[0].toUpperCase()] = item[2];
        });
    }
    return { codeNameMap, codeEnNameMap };
}

window.addEventListener('DOMContentLoaded', async () => {
    const summary = await loadSummary();
    const stockMap = buildStockMap(summary);
    const { codeNameMap, codeEnNameMap } = await loadStockNames();
    const input = document.getElementById('search-input');
    function renderResultsWithName(stockMap, keyword) {
        const resultsDiv = document.getElementById('search-results');
        resultsDiv.innerHTML = '';
        const keywordUpper = keyword.trim().toUpperCase();
        const keywordLower = keyword.trim().toLowerCase();
        const allResults = [];
        Object.entries(stockMap).forEach(([stock, dates]) => {
            const stockName = codeNameMap[stock] || '';
            const stockEnName = codeEnNameMap[stock] || '';
            if (
                !keywordUpper ||
                stock.includes(keywordUpper) ||
                stockName.includes(keyword) ||
                stockEnName.toLowerCase().includes(keywordLower)
            ) {
                dates.forEach(date => {
                    allResults.push({ stock, date });
                });
            }
        });
        allResults.sort((a, b) => {
            if (a.date === b.date) return a.stock.localeCompare(b.stock);
            if (a.date === 'new') return -1;
            if (b.date === 'new') return 1;
            return b.date.localeCompare(a.date);
        });
        if (allResults.length === 0) {
            resultsDiv.textContent = '查無資料';
            return;
        }
        // 建立表格（無表頭）
        const table = document.createElement('table');
        table.className = 'search-table';
        const tbody = document.createElement('tbody');
        allResults.forEach(({ stock, date }) => {
            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            tr.addEventListener('click', () => {
                window.open(createReportLink(stock, date), '_blank');
            });
            // 代號
            const tdCode = document.createElement('td');
            const codeSpan = document.createElement('span');
            codeSpan.textContent = stock;
            codeSpan.className = 'stock-code-blue';
            tdCode.appendChild(codeSpan);
            tr.appendChild(tdCode);
            // 名稱
            const tdName = document.createElement('td');
            tdName.textContent = codeNameMap[stock] || '';
            tr.appendChild(tdName);
            // 日期
            const tdDate = document.createElement('td');
            tdDate.className = 'result-date';
            tdDate.textContent = date === 'new' ? '最新' : date;
            tr.appendChild(tdDate);
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        resultsDiv.appendChild(table);
    }
    input.addEventListener('input', () => {
        renderResultsWithName(stockMap, input.value);
    });
    renderResultsWithName(stockMap, '');
});
