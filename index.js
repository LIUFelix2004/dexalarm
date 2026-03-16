// Main entry point for token monitoring system
require('dotenv').config();
const express = require('express');
const path = require('path');
const MonitorService = require('./src/services/MonitorService');
const AlertService = require('./src/services/AlertService');

// Initialize services
const monitorService = new MonitorService();
const alertService = new AlertService();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// Get monitoring status
app.get('/api/status', (req, res) => {
  const stats = monitorService.getStats();
  const alertStats = alertService.getAlertStats();

  res.json({
    status: 'running',
    timestamp: new Date().toISOString(),
    monitorStats: stats,
    alertStats,
    config: {
      chains: process.env.MONITOR_CHAINS,
      minMarketCap: process.env.MIN_MARKET_CAP,
      pollInterval: process.env.POLL_INTERVAL_MINUTES
    }
  });
});

// Get all tokens
app.get('/api/tokens', (req, res) => {
  const { chain, sortBy, limit } = req.query;
  const filters = {};

  if (chain) filters.chain = chain;
  if (sortBy) filters.sortBy = sortBy;
  if (limit) filters.limit = parseInt(limit);

  const tokens = monitorService.getAllTokens(filters);
  res.json(tokens.map(token => token.toJSON()));
});

// Get token by address
app.get('/api/tokens/:chain/:address', (req, res) => {
  const { chain, address } = req.params;
  const token = monitorService.getToken(chain, address);

  if (token) {
    res.json(token.toJSON());
  } else {
    res.status(404).json({ error: 'Token not found' });
  }
});

// Search tokens
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  const results = monitorService.searchTokens(q);
  res.json(results.map(token => token.toJSON()));
});

// Get all alerts
app.get('/api/alerts', (req, res) => {
  const { type, chain, severity, acknowledged, resolved, limit } = req.query;
  const filters = {};

  if (type) filters.type = type;
  if (chain) filters.chain = chain;
  if (severity) filters.severity = severity;
  if (acknowledged !== undefined) filters.acknowledged = acknowledged === 'true';
  if (resolved !== undefined) filters.resolved = resolved === 'true';
  if (limit) filters.limit = parseInt(limit);

  const alerts = alertService.getAllAlerts(filters);
  res.json(alerts.map(alert => alert.toJSON()));
});

// Acknowledge alert
app.post('/api/alerts/:id/acknowledge', (req, res) => {
  const { id } = req.params;
  const success = alertService.acknowledgeAlert(id);

  if (success) {
    res.json({ success: true, message: 'Alert acknowledged' });
  } else {
    res.status(404).json({ error: 'Alert not found' });
  }
});

// Resolve alert
app.post('/api/alerts/:id/resolve', (req, res) => {
  const { id } = req.params;
  const success = alertService.resolveAlert(id);

  if (success) {
    res.json({ success: true, message: 'Alert resolved' });
  } else {
    res.status(404).json({ error: 'Alert not found' });
  }
});

// Get alert statistics
app.get('/api/alerts/stats', (req, res) => {
  const stats = alertService.getAlertStats();
  res.json(stats);
});

// Add token to monitor (admin endpoint)
app.post('/api/tokens', (req, res) => {
  const tokenData = req.body;
  const success = monitorService.addToken(tokenData);

  if (success) {
    res.json({ success: true, message: 'Token added to monitoring' });
  } else {
    res.status(400).json({ error: 'Token does not meet market cap requirement' });
  }
});

// Remove token from monitor (admin endpoint)
app.delete('/api/tokens/:chain/:address', (req, res) => {
  const { chain, address } = req.params;
  const success = monitorService.removeToken(chain, address);

  if (success) {
    res.json({ success: true, message: 'Token removed from monitoring' });
  } else {
    res.status(404).json({ error: 'Token not found in monitoring' });
  }
});

// Start/stop monitoring (admin endpoints)
app.post('/api/monitor/start', (req, res) => {
  monitorService.start();
  res.json({ success: true, message: 'Monitor started' });
});

app.post('/api/monitor/stop', (req, res) => {
  monitorService.stop();
  res.json({ success: true, message: 'Monitor stopped' });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize and start server
async function startServer() {
  try {
    // Initialize monitor service (which initializes OKX service and shows data source)
    await monitorService.initialize();

    // Start monitoring automatically
    monitorService.start();

    // Set up alert callback for logging
    alertService.onAlert((alert) => {
      console.log(`🚨 ALERT: ${alert.message}`);
      // Here you could add integration with email, Slack, etc.
    });

    app.listen(PORT, () => {
      console.log('\n' + '═'.repeat(50));
      console.log(`✅ 令牌监控系统已启动`);
      console.log(`🌐 访问地址: http://localhost:${PORT}`);
      console.log(`⛓️  监控链: ${process.env.MONITOR_CHAINS || 'BSC,Base,SOL,ETH'}`);
      console.log('═'.repeat(50) + '\n');
      
      // Show data source status
      const dataSource = monitorService.okxService.mode || 'unknown';
      const sourceEmoji = {
        'direct': '📡',
        'cli': '🔧',
        'mock': '🎭'
      }[dataSource] || '❓';
      
      const sourceText = {
        'direct': '真实数据 (OKX API)',
        'cli': '真实数据 (CLI)',
        'mock': '演示数据 (Mock)'
      }[dataSource] || 'Unknown';
      
      console.log(`${sourceEmoji} 当前数据源: ${sourceText}`);
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down monitor...');
  monitorService.stop();
  process.exit(0);
});

// Start the server
startServer();