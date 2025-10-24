// DOM Elements
const companyInput = document.getElementById('companyInput');
const searchBtn = document.getElementById('searchBtn');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const dashboard = document.getElementById('dashboard');

// Company Info Elements
const companyName = document.getElementById('companyName');
const stockSymbol = document.getElementById('stockSymbol');
const companyRegion = document.getElementById('companyRegion');
const companyCurrency = document.getElementById('companyCurrency');

// Stock Data Elements
const currentPrice = document.getElementById('currentPrice');
const priceChange = document.getElementById('priceChange');
const openPrice = document.getElementById('openPrice');
const previousClose = document.getElementById('previousClose');
const dayHigh = document.getElementById('dayHigh');
const dayLow = document.getElementById('dayLow');
const volume = document.getElementById('volume');

// Chart
let performanceChart = null;

// Event Listeners
searchBtn.addEventListener('click', searchStock);
companyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchStock();
    }
});

// Mobile Navigation Toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Search Stock Function
async function searchStock() {
    const company = companyInput.value.trim();
    
    if (!company) {
        showError('Please enter a company name');
        return;
    }

    // Show loading, hide error and dashboard
    showLoading();
    hideError();
    hideDashboard();

    try {
        const response = await fetch('/stock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ company_name: company })
        });

        const data = await response.json();

        if (data.success) {
            displayStockData(data);
        } else {
            showError(data.error || 'Failed to fetch stock data');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Network error. Please try again.');
    } finally {
        hideLoading();
    }
}

// Display Stock Data
function displayStockData(data) {
    // Update company info
    companyName.textContent = data.company_name;
    stockSymbol.textContent = data.symbol;
    companyRegion.textContent = data.region;
    companyCurrency.textContent = data.currency;

    // Update stock data
    const stockInfo = data.stock_info;
    const change = stockInfo.current_price - stockInfo.previous_close;
    const changePercent = (change / stockInfo.previous_close) * 100;

    currentPrice.textContent = formatCurrency(stockInfo.current_price, data.currency);
    
    // Price change
    priceChange.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)`;
    priceChange.className = `price-change ${change >= 0 ? 'positive' : 'negative'}`;

    openPrice.textContent = formatCurrency(stockInfo.open_price, data.currency);
    previousClose.textContent = formatCurrency(stockInfo.previous_close, data.currency);
    dayHigh.textContent = formatCurrency(stockInfo.high_price, data.currency);
    dayLow.textContent = formatCurrency(stockInfo.low_price, data.currency);
    volume.textContent = formatNumber(stockInfo.volume);

    // Create or update chart
    createChart(data.chart_data, data.currency);

    // Show dashboard
    showDashboard();
}

// Create Performance Chart
function createChart(chartData, currency) {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (performanceChart) {
        performanceChart.destroy();
    }

    // Determine chart color based on trend
    const firstPrice = chartData.prices[0];
    const lastPrice = chartData.prices[chartData.prices.length - 1];
    const chartColor = lastPrice >= firstPrice ? '#48bb78' : '#f56565';

    performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.dates.map(date => formatDate(date)),
            datasets: [{
                label: 'Stock Price',
                data: chartData.prices,
                borderColor: chartColor,
                backgroundColor: `${chartColor}20`,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: chartColor,
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `Price: ${formatCurrency(context.parsed.y, currency)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 0,
                        callback: function(value, index) {
                            // Show only every 5th label to avoid crowding
                            return index % 5 === 0 ? this.getLabelForValue(value) : '';
                        }
                    }
                },
                y: {
                    grid: {
                        color: '#e2e8f0'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value, currency, true);
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            }
        }
    });
}

// Utility Functions
function formatCurrency(amount, currency, compact = false) {
    if (currency === 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    } else {
        // Fallback for other currencies
        return `${amount.toFixed(2)} ${currency}`;
    }
}

function formatNumber(number) {
    if (number >= 1000000) {
        return (number / 1000000).toFixed(2) + 'M';
    } else if (number >= 1000) {
        return (number / 1000).toFixed(2) + 'K';
    }
    return number.toString();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
    });
}

// UI Control Functions
function showLoading() {
    loading.classList.remove('hidden');
    searchBtn.disabled = true;
}

function hideLoading() {
    loading.classList.add('hidden');
    searchBtn.disabled = false;
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function showDashboard() {
    dashboard.classList.remove('hidden');
}

function hideDashboard() {
    dashboard.classList.add('hidden');
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Any initialization code can go here
    console.log('Stock Market Insights Dashboard loaded');
});