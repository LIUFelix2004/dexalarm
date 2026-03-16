// Token data model
class Token {
  constructor(data) {
    this.id = data.id || null;
    this.symbol = data.symbol || '';
    this.name = data.name || '';
    this.chain = data.chain || ''; // BSC, Base, SOL, ETH
    this.address = data.address || '';

    // Market data
    this.price = data.price || 0;
    this.priceChange1h = data.priceChange1h || 0; // percentage change
    this.volume10m = data.volume10m || 0; // 10-minute volume in USD
    this.volume24h = data.volume24h || 0; // 24-hour volume in USD
    this.marketCap = data.marketCap || 0; // market cap in USD

    // Additional info
    this.dex = data.dex || '';
    this.liquidity = data.liquidity || 0;
    this.holders = data.holders || 0;

    // Timestamps
    this.lastUpdated = data.lastUpdated || new Date();
    this.createdAt = data.createdAt || new Date();

    // Historical data for tracking changes
    this.volumeHistory = data.volumeHistory || []; // array of { timestamp, volume10m, volume24h }
    this.priceHistory = data.priceHistory || []; // array of { timestamp, price }
  }

  // Check if token meets minimum market cap requirement
  meetsMarketCapRequirement(minMarketCap) {
    return this.marketCap >= minMarketCap;
  }

  // Calculate volume change over time
  calculateVolumeChange(minutes = 30) {
    if (this.volumeHistory.length < 2) return 0;

    const now = new Date();
    const pastTime = new Date(now.getTime() - minutes * 60000);

    const recentVolumes = this.volumeHistory
      .filter(entry => new Date(entry.timestamp) >= pastTime)
      .map(entry => entry.volume10m);

    if (recentVolumes.length < 2) return 0;

    const oldest = recentVolumes[0];
    const newest = recentVolumes[recentVolumes.length - 1];

    if (oldest === 0) return newest > 0 ? 100 : 0;

    return ((newest - oldest) / oldest) * 100;
  }

  // Add new volume data point
  addVolumeData(volume10m, volume24h) {
    this.volume10m = volume10m;
    this.volume24h = volume24h;

    this.volumeHistory.push({
      timestamp: new Date(),
      volume10m,
      volume24h
    });

    // Keep only last 100 data points to prevent memory issues
    if (this.volumeHistory.length > 100) {
      this.volumeHistory = this.volumeHistory.slice(-100);
    }
  }

  // Add new price data point
  addPriceData(price) {
    const oldPrice = this.price;
    this.price = price;

    // Calculate 1h price change if we have history
    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentPrices = this.priceHistory
      .filter(entry => new Date(entry.timestamp) >= oneHourAgo)
      .map(entry => entry.price);

    if (recentPrices.length > 0) {
      const oldestPrice = recentPrices[0];
      if (oldestPrice > 0) {
        this.priceChange1h = ((price - oldestPrice) / oldestPrice) * 100;
      }
    }

    this.priceHistory.push({
      timestamp: new Date(),
      price
    });

    // Keep only last 100 data points
    if (this.priceHistory.length > 100) {
      this.priceHistory = this.priceHistory.slice(-100);
    }
  }

  // Convert to plain object for storage
  toJSON() {
    return {
      id: this.id,
      symbol: this.symbol,
      name: this.name,
      chain: this.chain,
      address: this.address,
      price: this.price,
      priceChange1h: this.priceChange1h,
      volume10m: this.volume10m,
      volume24h: this.volume24h,
      marketCap: this.marketCap,
      dex: this.dex,
      liquidity: this.liquidity,
      holders: this.holders,
      lastUpdated: this.lastUpdated,
      createdAt: this.createdAt,
      volumeHistory: this.volumeHistory,
      priceHistory: this.priceHistory
    };
  }

  // Create from plain object
  static fromJSON(data) {
    return new Token(data);
  }
}

module.exports = Token;