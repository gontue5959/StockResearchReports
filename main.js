// 取得網址參數
function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

// 根據網址參數決定檔案路徑
const stockid = getQueryParam('stockid') || 'AAPL';
const date = getQueryParam('date') || '';
let dataFolder = '';
if (date) {
    dataFolder = `data/${date}/`;
}
const reportDataPath = dataFolder ? `${dataFolder}${stockid}.json` : 'report-data.json';
const priceDataPath = dataFolder ? `${dataFolder}${stockid}_price.json` : `${stockid}_price.json`;

// 載入並渲染資料
async function loadReportData() {
    try {
        // 所有股票都讀 info/sections 兩個檔案
        const [infoRes, sectionsRes] = await Promise.all([
            fetch(`${dataFolder}${stockid}_info.json`),
            fetch(`${dataFolder}${stockid}_sections.json`)
        ]);
        const info = await infoRes.json();
        const sections = await sectionsRes.json();
        const data = { ...info, sections: sections.sections };
        // 設定頁面標題
        document.title = data.meta.title;
        document.getElementById('page-title').textContent = data.meta.title;
        // 填入標題區資料
        document.getElementById('firm-name').textContent = data.header.firmName;
        document.getElementById('report-title').textContent = data.header.reportTitle;
        document.getElementById('publish-date').textContent = data.meta.publishDate;
        document.getElementById('report-number').textContent = data.meta.reportNumber;
        document.getElementById('page-info').textContent = data.meta.pageInfo;
        document.getElementById('company-name').textContent = data.header.companyName;
        document.getElementById('company-name-en').textContent = data.header.companyNameEn;
        // 填入股票詳情
        const stockDetailsContainer = document.getElementById('stock-details');
        const stockDetailItems = (data.stockDetails.fields || []).map(field => [
            field.label,
            data.stockDetails[field.key] || ''
        ]);
        stockDetailsContainer.innerHTML = stockDetailItems.map(([label, value]) => `
            <div class="detail-item">
                <span class="detail-label">${label}</span>
                <span class="detail-value">${value}</span>
            </div>
        `).join('');
        // 填入推薦資訊
        const recommendationEl = document.getElementById('recommendation');
        recommendationEl.textContent = data.recommendation.rating;
        recommendationEl.className = `recommendation ${data.recommendation.ratingClass}`;
        document.getElementById('target-price').textContent = data.recommendation.targetPrice;
        document.getElementById('potential-return').textContent = data.recommendation.potentialReturn;
        // 評級資訊
        document.getElementById('rating-title').textContent = data.ratingInfo.title;
        document.getElementById('rating-value').textContent = data.ratingInfo.rating.value;
        document.getElementById('rating-label').textContent = data.ratingInfo.rating.label;
        document.getElementById('target-price-value').textContent = data.ratingInfo.targetPrice.value;
        document.getElementById('target-price-label').textContent = data.ratingInfo.targetPrice.label;
        document.getElementById('risk-assessment-title').textContent = data.ratingInfo.riskAssessment.title;
        // 風險指標
        const riskIndicators = document.getElementById('risk-indicators');
        riskIndicators.innerHTML = data.ratingInfo.riskAssessment.risks.map(([text, label, className]) => {
            const riskClass = className ? className : 'risk-unknown';
            return `
                <div class="risk-item ${riskClass}">
                    <div>${text}</div>
                    <div>${label}</div>
                </div>
            `;
        }).join('');
        // 關鍵指標
        document.getElementById('key-metrics-title').textContent = data.keyMetrics.title;
        const keyMetricsList = document.getElementById('key-metrics-list');
        keyMetricsList.innerHTML = data.keyMetrics.data.map(([label, value]) => `
            <div class="metric-item">
                <span class="metric-label">${label}</span>
                <span class="metric-value">${value}</span>
            </div>
        `).join('');
        // 動態產生 sections 區塊
        const dynamicSections = document.getElementById('dynamic-sections');
        dynamicSections.innerHTML = data.sections.map(section => {
            if (Array.isArray(section.content)) {
                const contentHtml = section.content.map(item => {
                    if (item.type === 'text') {
                        return `<p style=\"margin-bottom: 15px; color: #1e3a8a;\">${item.text}</p>`;
                    } else if (item.type === 'points') {
                        return item.points.map(point => `<p style=\"margin-bottom: 15px;\"><strong>${point.title}</strong>${point.description}</p>`).join('');
                    } else if (item.type === 'table') {
                        const ths = item.headers.map(h => `<th>${h}</th>`).join('');
                        const trs = item.rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');
                        return `<table class='data-table' style='margin-bottom:15px;'><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
                    } else if (item.type === 'swot') {
                        const swotClass = item.swotType === 'strengths' ? 'strengths' : 'weaknesses';
                        return `<div class=\"swot-item ${swotClass}\"><h4>${item.title}</h4><ul>${item.items.map(i => `<li>${i}</li>`).join('')}</ul></div>`;
                    } else if (item.type === 'swot-group') {
                        const isSingle = item.groups.length === 1;
                        return `<div class=\"swot-analysis${isSingle ? ' single' : ''}\">` +
                            item.groups.map(g => {
                                const swotClass = g.swotType === 'strengths' ? 'strengths' : 'weaknesses';
                                return `<div class=\"swot-item ${swotClass}\"><h4>${g.title}</h4><ul>${g.items.map(i => `<li>${i}</li>`).join('')}</ul></div>`;
                            }).join('') +
                        `</div>`;
                    } else if (item.type === 'metrics-list') {
                        return `
                            <div>
                                ${item.title ? `<h4 style=\"color: #1e3a8a; margin-bottom: 8px;\">${item.title}</h4>` : ''}
                                <div>
                                    ${item.items.map(m => `
                                        <div class=\"metric-item\">
                                            <span class=\"metric-label\">${m.label}</span>
                                            <span class=\"metric-value ${m.class || ''}\">${m.value}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    } else if (item.type === 'metrics-list-group') {
                        return `
                            <div style=\"margin-bottom: 20px;\">
                                <div style=\"display: grid; grid-template-columns: repeat(${item.groups.length}, 1fr); gap: 20px;\">${item.groups.map(group => `
                                        <div>${group.title ? `<div class=\"metrics-group-title\">${group.title}</div>` : ''}
                                            <div>${group.items.map(m => `
                                                    <div class=\"metric-item\">
                                                        <span class=\"metric-label\">${m.label}</span>
                                                        <span class=\"metric-value ${m.class || ''}\">${m.value}</span>
                                                    </div>
                                                `).join('')}</div>
                                        </div>
                                    `).join('')}</div>
                            </div>
                        `;
                    }
                    return '';
                }).join('');
                return `<div class=\"section\"><div class=\"section-header\">${section.title}</div><div class=\"section-content\">${contentHtml}</div></div>`;
            }
            return '';
        }).join('');
        // 隱藏載入中，顯示內容
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
    } catch (error) {
        console.error('載入資料失敗:', error);
        document.getElementById('loading').innerHTML = `載入資料失敗，請檢查 ${dataFolder}${stockid}_info.json 與 ${dataFolder}${stockid}_sections.json 檔案是否存在。`;
    }
}
// 頁面載入時執行
document.addEventListener('DOMContentLoaded', async function() {
    await loadReportData();
    // 讀取股價資料畫股價走勢圖
    try {
        const res = await fetch(priceDataPath);
        const stockData = await res.json();
        // 取出日期與收盤價，並轉換格式
        const labels = stockData.Data.map(item => {
            const d = item[0];
            const year = d.slice(0, 4);
            const month = d.slice(4, 6);
            if (month === '01') {
                return year; // 1月顯示年份
            } else {
                return parseInt(month, 10) + '月';
            }
        }).reverse(); // 反轉讓時間由舊到新
        const prices = stockData.Data.map(item => parseFloat(item[1])).reverse();
        const ctx = document.getElementById('stock-chart').getContext('2d');
        // 讓 canvas 高度與 CSS 一致，移除強制設定
        // document.getElementById('stock-chart').height = 100;
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '', // 移除圖例標籤
                    data: prices,
                    borderColor: '#1e3a8a',
                    backgroundColor: 'rgba(30,58,138,0.08)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0, // 移除點點
                    pointHoverRadius: 0, // 滑鼠移上也不顯示點
                    pointBackgroundColor: 'transparent',
                    pointBorderColor: 'transparent'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // 這行很重要，讓高度固定
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false } // 關閉查價顯示標籤
                },
                scales: {
                    x: {
                        display: true,
                        title: { display: false },
                        ticks: {
                            maxTicksLimit: 10,
                            color: function(context) {
                                // 年份(YYYY)顯示藍色，其餘顯示灰色
                                const label = context.tick.label;
                                return (/^\d{4}$/.test(label)) ? '#2563eb' : '#64748b';
                            }
                        }
                    },
                    y: { display: true, title: { display: false } }
                }
            }
        });
    } catch (e) {
        console.error(`載入${priceDataPath}失敗`, e);
    }
});
