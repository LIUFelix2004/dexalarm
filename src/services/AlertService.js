// Alert service for monitoring and triggering alerts
const Alert = require('../models/Alert');

class AlertService {
  constructor() {
    this.alerts = []; // In-memory storage for alerts
    this.alertCallbacks = []; // Callbacks for when alerts are triggered
    this.minMarketCap = parseFloat(process.env.MIN_MARKET_CAP) || 10000000;
    this.volumeSpikeThreshold = parseFloat(process.env.ALERT_VOLUME_SPIKE_PERCENT) || 30;
    this.largeTradeThreshold = parseFloat(process.env.ALERT_LARGE_TRADE_VALUE) || 10000;
  }

  // Register a callback for new alerts
  onAlert(callback) {
    this.alertCallbacks.push(callback);
  }

  // Add an alert and notify callbacks
  addAlert(alert) {
    this.alerts.push(alert);
    console.log(`🔔 New alert: ${alert.message}`);

    // Notify all registered callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Alert callback error:', error);
      }
    });

    return alert;
  }

  // Check for volume spike alerts
  checkVolumeSpike(token) {
    if (!token.volumeHistory || token.volumeHistory.length < 2) {
      return null;
    }

    const volumeChange = token.calculateVolumeChange(30); // 30 minutes
    if (volumeChange >= this.volumeSpikeThreshold) {
      return Alert.createVolumeSpikeAlert(token, volumeChange);
    }

    return null;
  }

  // Check for large trades in recent trade data
  checkLargeTrades(token, recentTrades) {
    const alerts = [];

    for (const trade of recentTrades) {
      // Check if trade size exceeds threshold
      if (trade.valueUSD >= this.largeTradeThreshold) {
        const tradeType = trade.isBuy ? 'buy' : 'sell';
        alerts.push(Alert.createLargeTradeAlert(token, trade.valueUSD, tradeType));
      }
    }

    return alerts;
  }

  // Check for significant price changes
  checkPriceChange(token) {
    const priceChange = token.priceChange1h;
    const threshold = 10; // 10% change in 1 hour

    if (Math.abs(priceChange) >= threshold) {
      return Alert.createPriceChangeAlert(token, priceChange, '1 hour');
    }

    return null;
  }

  // Monitor a token for all alert conditions
  monitorToken(token, recentTrades = []) {
    const newAlerts = [];

    // Only monitor tokens that meet market cap requirement
    if (!token.meetsMarketCapRequirement(this.minMarketCap)) {
      return newAlerts;
    }

    // Check volume spike
    const volumeAlert = this.checkVolumeSpike(token);
    if (volumeAlert) newAlerts.push(volumeAlert);

    // Check large trades
    const tradeAlerts = this.checkLargeTrades(token, recentTrades);
    newAlerts.push(...tradeAlerts);

    // Check price change
    const priceAlert = this.checkPriceChange(token);
    if (priceAlert) newAlerts.push(priceAlert);

    // Add all new alerts
    newAlerts.forEach(alert => this.addAlert(alert));

    return newAlerts;
  }

  // Get all alerts (optionally filtered)
  getAllAlerts(filters = {}) {
    let filtered = [...this.alerts];

    if (filters.type) {
      filtered = filtered.filter(alert => alert.type === filters.type);
    }

    if (filters.chain) {
      filtered = filtered.filter(alert => alert.chain === filters.chain);
    }

    if (filters.severity) {
      filtered = filtered.filter(alert => alert.severity === filters.severity);
    }

    if (filters.acknowledged !== undefined) {
      filtered = filtered.filter(alert => alert.acknowledged === filters.acknowledged);
    }

    if (filters.resolved !== undefined) {
      filtered = filtered.filter(alert => alert.resolved === filters.resolved);
    }

    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    // Sort by timestamp descending (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return filtered;
  }

  // Acknowledge an alert
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  // Resolve an alert
  resolveAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  // Get statistics about alerts
  getAlertStats() {
    const total = this.alerts.length;
    const acknowledged = this.alerts.filter(a => a.acknowledged).length;
    const resolved = this.alerts.filter(a => a.resolved).length;
    const byType = {};
    const byChain = {};
    const bySeverity = {};

    this.alerts.forEach(alert => {
      byType[alert.type] = (byType[alert.type] || 0) + 1;
      byChain[alert.chain] = (byChain[alert.chain] || 0) + 1;
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
    });

    return {
      total,
      acknowledged,
      resolved,
      byType,
      byChain,
      bySeverity,
      open: total - resolved
    };
  }

  // Clear old alerts (older than 7 days)
  clearOldAlerts(days = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const beforeCount = this.alerts.length;
    this.alerts = this.alerts.filter(alert => new Date(alert.timestamp) >= cutoff);
    const afterCount = this.alerts.length;

    return beforeCount - afterCount;
  }

  // Export alerts to JSON
  exportAlerts() {
    return this.alerts.map(alert => alert.toJSON());
  }

  // Import alerts from JSON
  importAlerts(alertsJson) {
    const imported = alertsJson.map(data => Alert.fromJSON(data));
    this.alerts.push(...imported);
    return imported.length;
  }
}

module.exports = AlertService;