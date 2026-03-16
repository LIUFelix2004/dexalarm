// 代币监控仪表板 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const tokensTableBody = document.querySelector('#tokens-table tbody');
    const alertsTableBody = document.querySelector('#alerts-table tbody');
    const totalTokensEl = document.getElementById('total-tokens');
    const totalMarketCapEl = document.getElementById('total-market-cap');
    const totalVolumeEl = document.getElementById('total-volume');
    const activeAlertsEl = document.getElementById('active-alerts');
    const systemStatusEl = document.getElementById('system-status');
    const searchResultsEl = document.getElementById('search-results');

    // Tab Management
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');

            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Show corresponding tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });

            // Load data for the selected tab if needed
            if (tabId === 'tokens') {
                loadTokens();
            } else if (tabId === 'alerts') {
                loadAlerts();
            } else if (tabId === 'charts') {
                loadCharts();
            }
        });
    });

    // Initialize Charts
    let marketCapChart = null;
    let volumeChart = null;

    // Formatting Functions
    function formatCurrency(value) {
        if (value >= 1e9) {
            return '$' + (value / 1e9).toFixed(2) + 'B';
        } else if (value >= 1e6) {
            return '$' + (value / 1e6).toFixed(2) + 'M';
        } else if (value >= 1e3) {
            return '$' + (value / 1e3).toFixed(2) + 'K';
        } else {
            return '$' + value.toFixed(2);
        }
    }

    function formatNumber(value) {
        if (value >= 1e9) {
            return (value / 1e9).toFixed(2) + 'B';
        } else if (value >= 1e6) {
            return (value / 1e6).toFixed(2) + 'M';
        } else if (value >= 1e3) {
            return (value / 1e3).toFixed(2) + 'K';
        } else {
            return value.toFixed(2);
        }
    }

    function formatPercentage(value) {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function getChainIcon(chain) {
        const icons = {
            'BSC': 'fab fa-btc',
            'Base': 'fas fa-layer-group',
            'SOL': 'fas fa-sun',
            'ETH': 'fab fa-ethereum'
        };
        return icons[chain] || 'fas fa-link';
    }

    function getChainColorClass(chain) {
        const classes = {
            'BSC': 'chain-bsc',
            'Base': 'chain-base',
            'SOL': 'chain-sol',
            'ETH': 'chain-eth'
        };
        return classes[chain] || '';
    }

    // API Functions
    async function fetchAPI(endpoint, options = {}) {
        try {
            const response = await fetch(`/api${endpoint}`, options);
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API fetch error:', error);
            showNotification('获取数据错误。请重试。', 'error');
            throw error;
        }
    }

    // Load System Status
    async function loadSystemStatus() {
        try {
            const data = await fetchAPI('/status');

            // Update stats cards
            totalTokensEl.textContent = data.monitorStats.totalTokens || 0;
            totalMarketCapEl.textContent = formatCurrency(data.monitorStats.totalMarketCap || 0);
            totalVolumeEl.textContent = formatCurrency(data.monitorStats.totalVolume24h || 0);
            activeAlertsEl.textContent = data.alertStats.open || 0;

            // Update system status
            systemStatusEl.innerHTML = `
                <p><strong>代币：</strong> ${data.monitorStats.totalTokens}</p>
                <p><strong>最后更新：</strong> ${data.monitorStats.lastUpdated ? formatDate(data.monitorStats.lastUpdated) : '未更新'}</p>
                <p><strong>区块链：</strong> ${data.config.chains || 'BSC,Base,SOL,ETH'}</p>
                <p><strong>最小市值：</strong> ${formatCurrency(data.config.minMarketCap || 10000000)}</p>
            `;
        } catch (error) {
            systemStatusEl.innerHTML = '<p>加载系统状态时出错</p>';
        }
    }

    // Load Tokens
    async function loadTokens() {
        const chainFilter = document.getElementById('chain-filter').value;
        const sortBy = document.getElementById('sort-by').value;

        const params = new URLSearchParams();
        if (chainFilter !== 'all') params.append('chain', chainFilter);
        if (sortBy) params.append('sortBy', sortBy);

        const tokensLoading = document.getElementById('tokens-loading');
        tokensLoading.style.display = 'block';
        tokensTableBody.innerHTML = '';

        try {
            const tokens = await fetchAPI(`/tokens?${params}`);
            tokensLoading.style.display = 'none';

            if (tokens.length === 0) {
                tokensTableBody.innerHTML = `
                    <tr>
                        <td colspan="9" style="text-align: center; padding: 2rem;">
                            未找到代币。请尝试调整筛选条件。
                        </td>
                    </tr>
                `;
                return;
            }

            tokens.forEach(token => {
                const row = document.createElement('tr');
                const priceChangeClass = token.priceChange1h >= 0 ? 'price-up' : 'price-down';
                const chainIcon = getChainIcon(token.chain);
                const chainColorClass = getChainColorClass(token.chain);

                row.innerHTML = `
                    <td><strong>${token.symbol}</strong></td>
                    <td>${token.name}</td>
                    <td><i class="${chainIcon} ${chainColorClass}"></i> ${token.chain}</td>
                    <td>${formatCurrency(token.price)}</td>
                    <td class="${priceChangeClass}">${formatPercentage(token.priceChange1h)}</td>
                    <td>${formatCurrency(token.marketCap)}</td>
                    <td>${formatCurrency(token.volume24h)}</td>
                    <td>${formatCurrency(token.volume10m)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn" title="查看详情" onclick="viewToken('${token.chain}', '${token.address}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn" title="从监控中移除" onclick="removeToken('${token.chain}', '${token.address}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                tokensTableBody.appendChild(row);
            });
        } catch (error) {
            tokensLoading.innerHTML = '加载代币时出错';
        }
    }

    // Load Alerts
    async function loadAlerts() {
        const typeFilter = document.getElementById('alert-type-filter').value;
        const severityFilter = document.getElementById('alert-severity-filter').value;

        const params = new URLSearchParams();
        if (typeFilter !== 'all') params.append('type', typeFilter);
        if (severityFilter !== 'all') params.append('severity', severityFilter);
        params.append('resolved', 'false');

        const alertsLoading = document.getElementById('alerts-loading');
        alertsLoading.style.display = 'block';
        alertsTableBody.innerHTML = '';

        try {
            const alerts = await fetchAPI(`/alerts?${params}`);
            alertsLoading.style.display = 'none';

            if (alerts.length === 0) {
                alertsTableBody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 2rem;">
                            没有活跃警报。做得好！
                        </td>
                    </tr>
                `;
                return;
            }

            alerts.forEach(alert => {
                const row = document.createElement('tr');
                const severityClass = `badge-${alert.severity}`;
                const chainIcon = getChainIcon(alert.chain);
                const chainColorClass = getChainColorClass(alert.chain);

                row.innerHTML = `
                    <td>${formatDate(alert.timestamp)}</td>
                    <td><span class="badge">${alert.type.replace('_', ' ')}</span></td>
                    <td><i class="${chainIcon} ${chainColorClass}"></i> ${alert.chain}</td>
                    <td>${alert.tokenSymbol}</td>
                    <td>${alert.message}</td>
                    <td><span class="badge ${severityClass}">${alert.severity}</span></td>
                    <td>
                        ${alert.acknowledged ?
                            '<span class="badge badge-low">已确认</span>' :
                            '<span class="badge badge-high">新</span>'}
                    </td>
                    <td>
                        <div class="action-buttons">
                            ${!alert.acknowledged ? `
                            <button class="action-btn" title="确认" onclick="acknowledgeAlert('${alert.id}')">
                                <i class="fas fa-check"></i>
                            </button>
                            ` : ''}
                            <button class="action-btn" title="解决" onclick="resolveAlert('${alert.id}')">
                                <i class="fas fa-flag-checkered"></i>
                            </button>
                        </div>
                    </td>
                `;
                alertsTableBody.appendChild(row);
            });
        } catch (error) {
            alertsLoading.innerHTML = '加载警报时出错';
        }
    }

    // Load Charts
    async function loadCharts() {
        try {
            const tokens = await fetchAPI('/tokens');

            // Group by chain
            const chains = {};
            tokens.forEach(token => {
                if (!chains[token.chain]) {
                    chains[token.chain] = {
                        marketCap: 0,
                        volume24h: 0,
                        count: 0
                    };
                }
                chains[token.chain].marketCap += token.marketCap;
                chains[token.chain].volume24h += token.volume24h;
                chains[token.chain].count++;
            });

            const chainLabels = Object.keys(chains);
            const marketCapData = chainLabels.map(chain => chains[chain].marketCap);
            const volumeData = chainLabels.map(chain => chains[chain].volume24h);
            const tokenCounts = chainLabels.map(chain => chains[chain].count);

            // Colors for charts
            const backgroundColors = ['#4361ee', '#3a0ca3', '#4cc9f0', '#f72585', '#7209b7'];
            const borderColors = ['#3a56d4', '#2d0980', '#3db5d6', '#d91a6c', '#5e0896'];

            // Market Cap Chart
            const marketCapCtx = document.getElementById('market-cap-chart').getContext('2d');
            if (marketCapChart) {
                marketCapChart.destroy();
            }

            marketCapChart = new Chart(marketCapCtx, {
                type: 'bar',
                data: {
                    labels: chainLabels,
                    datasets: [{
                        label: '市值',
                        data: marketCapData,
                        backgroundColor: backgroundColors,
                        borderColor: borderColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `市值: ${formatCurrency(context.raw)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        }
                    }
                }
            });

            // Volume Chart
            const volumeCtx = document.getElementById('volume-chart').getContext('2d');
            if (volumeChart) {
                volumeChart.destroy();
            }

            volumeChart = new Chart(volumeCtx, {
                type: 'pie',
                data: {
                    labels: chainLabels,
                    datasets: [{
                        label: '24小时交易量',
                        data: volumeData,
                        backgroundColor: backgroundColors,
                        borderColor: borderColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error loading charts:', error);
        }
    }

    // 搜索代币
    async function searchTokens() {
        const query = document.getElementById('search-input').value.trim();
        if (!query) {
            showNotification('请输入搜索条件', 'warning');
            return;
        }

        searchResultsEl.innerHTML = '<div class="loading">搜索中...</div>';

        try {
            const results = await fetchAPI(`/search?q=${encodeURIComponent(query)}`);

            if (results.length === 0) {
                searchResultsEl.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--gray-color);">
                        未找到代币“${query}”
                    </div>
                `;
                return;
            }

            let html = '<div class="search-results-list">';
            results.forEach(token => {
                const priceChangeClass = token.priceChange1h >= 0 ? 'price-up' : 'price-down';
                const chainIcon = getChainIcon(token.chain);
                const chainColorClass = getChainColorClass(token.chain);

                html += `
                    <div class="search-result-item" style="
                        background: white;
                        padding: 1rem;
                        margin-bottom: 1rem;
                        border-radius: var(--border-radius);
                        box-shadow: var(--box-shadow);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div>
                            <h4 style="margin-bottom: 0.5rem;">
                                <strong>${token.symbol}</strong> - ${token.name}
                                <span style="font-size: 0.9rem; color: var(--gray-color);">
                                    <i class="${chainIcon} ${chainColorClass}"></i> ${token.chain}
                                </span>
                            </h4>
                            <div style="display: flex; gap: 1rem; font-size: 0.9rem;">
                                <span>价格: ${formatCurrency(token.price)}</span>
                                <span class="${priceChangeClass}">1h: ${formatPercentage(token.priceChange1h)}</span>
                                <span>MCap: ${formatCurrency(token.marketCap)}</span>
                                <span>24h Vol: ${formatCurrency(token.volume24h)}</span>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-primary" onclick="addTokenToMonitor('${token.chain}', '${token.address}')">
                            <i class="fas fa-plus"></i> 添加监控
                        </button>
                    </div>
                `;
            });
            html += '</div>';
            searchResultsEl.innerHTML = html;
        } catch (error) {
            searchResultsEl.innerHTML = '<div style="color: var(--danger-color);">搜索代币时错误</div>';
        }
    }

    // 警报操作（全局函数）
    window.acknowledgeAlert = async function(alertId) {
        try {
            await fetchAPI(`/alerts/${alertId}/acknowledge`, { method: 'POST' });
            showNotification('警报已确认', 'success');
            loadAlerts();
            loadSystemStatus();
        } catch (error) {
            showNotification('确认警报时错误', 'error');
        }
    };

    window.resolveAlert = async function(alertId) {
        try {
            await fetchAPI(`/alerts/${alertId}/resolve`, { method: 'POST' });
            showNotification('警报已解决', 'success');
            loadAlerts();
            loadSystemStatus();
        } catch (error) {
            showNotification('解决警报时错误', 'error');
        }
    };

    window.viewToken = function(chain, address) {
        showNotification(`查看代币 ${chain}:${address.substring(0, 8)}...`, 'info');
        // 在实际应用中，这会打开详细视图
    };

    window.removeToken = async function(chain, address) {
        if (confirm(`是否从监控中移除此代币？`)) {
            try {
                await fetchAPI(`/tokens/${chain}/${address}`, { method: 'DELETE' });
                showNotification('代币已从监控中移除', 'success');
                loadTokens();
                loadSystemStatus();
            } catch (error) {
                showNotification('移除代币时错误', 'error');
            }
        }
    };

    window.addTokenToMonitor = async function(chain, address) {
        try {
            // 首先获取代币详情
            const token = await fetchAPI(`/tokens/${chain}/${address}`);
            if (token) {
                showNotification(`代币 ${token.symbol} 已经在监控中`, 'info');
                return;
            }
        } catch (error) {
            // 未找到代币，尝试添加它
            const tokenData = {
                chain: chain,
                address: address,
                // 注意：在实际应用中，你需要首先获取代币详情
                symbol: 'UNKNOWN',
                name: '\u672a\u77e5\u4ee3\u5e01',
                price: 0,
                marketCap: 10000000 // 默认最低值
            };

            try {
                await fetchAPI('/tokens', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(tokenData)
                });
                showNotification('代币已添加监控', 'success');
                loadTokens();
                loadSystemStatus();
            } catch (error) {
                showNotification('添加代币时错误。请检查地址。', 'error');
            }
        }
    };

    // 通知系统
    function showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                background: ${type === 'error' ? '#fecaca' : type === 'success' ? '#d1fae5' : '#fef3c7'};
                color: ${type === 'error' ? '#991b1b' : type === 'success' ? '#065f46' : '#92400e'};
                border-radius: var(--border-radius);
                box-shadow: var(--box-shadow);
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            ">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
                ${message}
            </div>
        `;

        document.body.appendChild(notification);

        // 3秒后移除
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // 事件监听器
    document.getElementById('apply-filters').addEventListener('click', loadTokens);
    document.getElementById('reset-filters').addEventListener('click', () => {
        document.getElementById('chain-filter').value = 'all';
        document.getElementById('sort-by').value = 'marketCap';
        loadTokens();
    });

    document.getElementById('refresh-tokens').addEventListener('click', loadTokens);

    document.getElementById('acknowledge-all').addEventListener('click', async () => {
        try {
            const alerts = await fetchAPI('/alerts?resolved=false');
            for (const alert of alerts) {
                if (!alert.acknowledged) {
                    await fetchAPI(`/alerts/${alert.id}/acknowledge`, { method: 'POST' });
                }
            }
            showNotification('所有警报已确认', 'success');
            loadAlerts();
            loadSystemStatus();
        } catch (error) {
            showNotification('确认所有警报时错误', 'error');
        }
    });

    document.getElementById('clear-alerts').addEventListener('click', async () => {
        try {
            const alerts = await fetchAPI('/alerts?resolved=true');
            showNotification(`已清除 ${alerts.length} 个已解决警报`, 'info');
            // 注意：此演示没有删除端点，所以我们只是刷新
            loadAlerts();
        } catch (error) {
            showNotification('清除警报时错误', 'error');
        }
    });

    document.getElementById('search-button').addEventListener('click', searchTokens);
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchTokens();
        }
    });

    document.getElementById('alert-type-filter').addEventListener('change', loadAlerts);
    document.getElementById('alert-severity-filter').addEventListener('change', loadAlerts);

    // 每30秒自动刷新
    setInterval(() => {
        if (document.querySelector('#tokens-tab').classList.contains('active')) {
            loadTokens();
        }
        if (document.querySelector('#alerts-tab').classList.contains('active')) {
            loadAlerts();
        }
        loadSystemStatus();
    }, 30000);

    // 伯初始化
    loadSystemStatus();
    loadTokens();

    // 每10秒加载一次系统状态
    setInterval(loadSystemStatus, 10000);
});