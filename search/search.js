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

function renderResults(stockMap, keyword) {
    const resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = '';
    const keywordUpper = keyword.trim().toUpperCase();
    const allResults = [];
    Object.entries(stockMap).forEach(([stock, dates]) => {
        if (!keywordUpper || stock.includes(keywordUpper)) {
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
    allResults.forEach(({ stock, date }) => {
        const link = document.createElement('a');
        link.href = createReportLink(stock, date);
        link.target = '_blank';
        link.textContent = stock;
        if (date === 'new') {
            const span = document.createElement('span');
            span.className = 'result-date';
            span.textContent = '（最新）';
            link.appendChild(span);
        } else {
            const span = document.createElement('span');
            span.className = 'result-date';
            span.textContent = `（${date}）`;
            link.appendChild(span);
        }
        resultsDiv.appendChild(link);
    });
}

window.addEventListener('DOMContentLoaded', async () => {
    const summary = await loadSummary();
    const stockMap = buildStockMap(summary);
    const input = document.getElementById('search-input');
    input.addEventListener('input', () => {
        renderResults(stockMap, input.value);
    });
    renderResults(stockMap, '');
});
