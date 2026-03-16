// Alert model
class Alert {
  constructor(data) {
    this.id = data.id || Date.now().toString();
    this.type = data.type || ''; // 'volume_spike', 'large_trade', 'price_change'
    this.chain = data.chain || '';
    this.tokenSymbol = data.tokenSymbol || '';
    this.tokenAddress = data.tokenAddress || '';
    this.severity = data.severity || 'medium'; // low, medium, high, critical
    this.message = data.message || '';
    this.data = data.data || {}; // Additional data like volume change, trade size, etc.
    this.timestamp = data.timestamp || new Date();
    this.acknowledged = data.acknowledged || false;
    this.resolved = data.resolved || false;
  }

  // Alert types
  static TYPES = {
    VOLUME_SPIKE: 'volume_spike',
    LARGE_TRADE: 'large_trade',
    PRICE_CHANGE: 'price_change'
  };

  // Severity levels
  static SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  };

  // Create a volume spike alert
  static createVolumeSpikeAlert(token, volumeChangePercent) {
    return new Alert({
      type: Alert.TYPES.VOLUME_SPIKE,
      chain: token.chain,
      tokenSymbol: token.symbol,
      tokenAddress: token.address,
      severity: volumeChangePercent > 50 ? Alert.SEVERITY.HIGH : Alert.SEVERITY.MEDIUM,
      message: `Volume spike detected for ${token.symbol} on ${token.chain}: ${volumeChangePercent.toFixed(2)}% increase in 30 minutes`,
      data: {
        volumeChangePercent,
        currentVolume10m: token.volume10m,
        currentVolume24h: token.volume24h,
        price: token.price,
        marketCap: token.marketCap
      }
    });
  }

  // Create a large trade alert
  static createLargeTradeAlert(token, tradeSizeUSD, tradeType) {
    return new Alert({
      type: Alert.TYPES.LARGE_TRADE,
      chain: token.chain,
      tokenSymbol: token.symbol,
      tokenAddress: token.address,
      severity: tradeSizeUSD > 50000 ? Alert.SEVERITY.CRITICAL :
                tradeSizeUSD > 25000 ? Alert.SEVERITY.HIGH : Alert.SEVERITY.MEDIUM,
      message: `Large ${tradeType} detected for ${token.symbol} on ${token.chain}: $${tradeSizeUSD.toLocaleString()} USD`,
      data: {
        tradeSizeUSD,
        tradeType, // 'buy' or 'sell'
        price: token.price,
        marketCap: token.marketCap,
        volume24h: token.volume24h
      }
    });
  }

  // Create a price change alert
  static createPriceChangeAlert(token, priceChangePercent, timeframe) {
    const severity = Math.abs(priceChangePercent) > 20 ? Alert.SEVERITY.HIGH :
                     Math.abs(priceChangePercent) > 10 ? Alert.SEVERITY.MEDIUM : Alert.SEVERITY.LOW;

    return new Alert({
      type: Alert.TYPES.PRICE_CHANGE,
      chain: token.chain,
      tokenSymbol: token.symbol,
      tokenAddress: token.address,
      severity,
      message: `Significant price change for ${token.symbol} on ${token.chain}: ${priceChangePercent.toFixed(2)}% in ${timeframe}`,
      data: {
        priceChangePercent,
        timeframe,
        currentPrice: token.price,
        marketCap: token.marketCap,
        volume24h: token.volume24h
      }
    });
  }

  // Convert to plain object for storage
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      chain: this.chain,
      tokenSymbol: this.tokenSymbol,
      tokenAddress: this.tokenAddress,
      severity: this.severity,
      message: this.message,
      data: this.data,
      timestamp: this.timestamp,
      acknowledged: this.acknowledged,
      resolved: this.resolved
    };
  }

  // Create from plain object
  static fromJSON(data) {
    return new Alert(data);
  }
}

module.exports = Alert;