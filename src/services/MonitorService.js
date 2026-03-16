// Monitor service for tracking tokens across chains
require('dotenv').config();
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const Token = require('../models/Token');
const OKXService = require('./OKXService');
const AlertService = require('./AlertService');
const chains = require('../../config/chains');

class MonitorService {
  constructor() {
    this.okxService = new OKXService();
    this.alertService = new AlertService();
    this.tokens = new Map(); // token address -> Token object
    this.monitorChains = process.env.MONITOR_CHAINS ? process.env.MONITOR_CHAINS.split(',') : Object.keys(chains);
    this.pollInterval = parseInt(process.env.POLL_INTERVAL_MINUTES) || 10;
    this.minMarketCap = parseFloat(process.env.MIN_MARKET_CAP) || 10000000;
    this.isMonitoring = false;
    this.intervalId = null;
  }

  // Initialize monitoring
  async initialize() {
    console.log('Initializing token monitor...');
    console.log(`Monitoring chains: ${this.monitorChains.join(', ')}`);
    console.log(`Minimum market cap: $${this.minMarketCap.toLocaleString()}`);
    console.log(`Poll interval: ${this.pollInterval} minutes`);

    // Load initial token lists for each chain
    for (const chain of this.monitorChains) {
      await this.loadTopTokensForChain(chain);
    }

    console.log(`Loaded ${this.tokens.size} tokens for monitoring`);
  }

  // Load top tokens by market cap for a chain
  async loadTopTokensForChain(chain, limit = 20) {
    console.log(`Loading top tokens for ${chain}...`);

    try {
      // Use OKX service to get top tokens
      const tokens = await this.okxService.getTopTokensByMarketCap(chain, limit);

      for (const tokenData of tokens) {
        const token = new Token({
          symbol: tokenData.symbol,
          name: tokenData.name,
          chain: chain,
          address: tokenData.address,
          price: tokenData.price || 0,
          marketCap: tokenData.marketCap || 0,
          volume24h: tokenData.volume24h || 0,
          volume10m: tokenData.volume10m || 0,
          dex: tokenData.dex || '',
          liquidity: tokenData.liquidity || 0,
          holders: tokenData.holders || 0
        });

        // Only add if meets market cap requirement
        if (token.meetsMarketCapRequirement(this.minMarketCap)) {
          this.tokens.set(`${chain}:${token.address.toLowerCase()}`, token);
        }
      }

      console.log(`Loaded ${tokens.length} tokens for ${chain}`);
    } catch (error) {
      console.error(`Failed to load tokens for ${chain}:`, error.message);
    }
  }

  // Start monitoring
  start() {
    if (this.isMonitoring) {
      console.log('Monitor is already running');
      return;
    }

    console.log('Starting token monitor...');
    this.isMonitoring = true;

    // Run initial update
    this.updateAllTokens();

    // Set up interval for periodic updates
    this.intervalId = setInterval(() => {
      this.updateAllTokens();
    }, this.pollInterval * 60 * 1000);

    console.log(`Monitor started. Will update every ${this.pollInterval} minutes`);
  }

  // Stop monitoring
  stop() {
    if (!this.isMonitoring) return;

    console.log('Stopping token monitor...');
    this.isMonitoring = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('Monitor stopped');
  }

  // Update all tokens
  async updateAllTokens() {
    console.log(`Updating ${this.tokens.size} tokens...`);

    const updatePromises = [];
    const tokensArray = Array.from(this.tokens.values());

    // Process tokens in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < tokensArray.length; i += batchSize) {
      const batch = tokensArray.slice(i, i + batchSize);
      const batchPromises = batch.map(token => this.updateToken(token));
      updatePromises.push(...batchPromises);

      // Add delay between batches
      if (i + batchSize < tokensArray.length) {
        await this.sleep(2000);
      }
    }

    try {
      await Promise.all(updatePromises);
      console.log('Token update completed');
    } catch (error) {
      console.error('Error updating tokens:', error);
    }
  }

  // Update a single token
  async updateToken(token) {
    try {
      // Get updated market data
      const marketData = await this.okxService.getMarketData(token.chain, token.address);
      if (!marketData) return;

      // Update token with new data
      if (marketData.price) {
        token.addPriceData(marketData.price);
      }

      if (marketData.volume10m !== undefined) {
        token.addVolumeData(marketData.volume10m, marketData.volume24h || token.volume24h);
      }

      if (marketData.marketCap !== undefined) {
        token.marketCap = marketData.marketCap;
      }

      token.lastUpdated = new Date();

      // Get recent trades for alert checking
      const recentTrades = await this.okxService.getRecentTrades(token.chain, token.address, 50);

      // Check for alerts
      this.alertService.monitorToken(token, recentTrades);

      // Save updated token
      this.tokens.set(`${token.chain}:${token.address.toLowerCase()}`, token);

      return token;
    } catch (error) {
      console.error(`Failed to update token ${token.symbol} on ${token.chain}:`, error.message);
      return null;
    }
  }

  // Add a token to monitor
  addToken(tokenData) {
    const token = new Token(tokenData);
    const key = `${token.chain}:${token.address.toLowerCase()}`;

    if (token.meetsMarketCapRequirement(this.minMarketCap)) {
      this.tokens.set(key, token);
      console.log(`Added token ${token.symbol} on ${token.chain} for monitoring`);
      return true;
    } else {
      console.log(`Token ${token.symbol} does not meet market cap requirement`);
      return false;
    }
  }

  // Remove a token from monitoring
  removeToken(chain, address) {
    const key = `${chain}:${address.toLowerCase()}`;
    const removed = this.tokens.delete(key);
    if (removed) {
      console.log(`Removed token ${address} on ${chain} from monitoring`);
    }
    return removed;
  }

  // Get all monitored tokens
  getAllTokens(filters = {}) {
    let tokens = Array.from(this.tokens.values());

    if (filters.chain) {
      tokens = tokens.filter(token => token.chain === filters.chain);
    }

    if (filters.minMarketCap) {
      tokens = tokens.filter(token => token.marketCap >= filters.minMarketCap);
    }

    if (filters.sortBy) {
      if (filters.sortBy === 'marketCap') {
        tokens.sort((a, b) => b.marketCap - a.marketCap);
      } else if (filters.sortBy === 'volume24h') {
        tokens.sort((a, b) => b.volume24h - a.volume24h);
      } else if (filters.sortBy === 'priceChange1h') {
        tokens.sort((a, b) => Math.abs(b.priceChange1h) - Math.abs(a.priceChange1h));
      }
    }

    if (filters.limit) {
      tokens = tokens.slice(0, filters.limit);
    }

    return tokens;
  }

  // Get token by chain and address
  getToken(chain, address) {
    const key = `${chain}:${address.toLowerCase()}`;
    return this.tokens.get(key);
  }

  // Get monitoring statistics
  getStats() {
    const tokens = Array.from(this.tokens.values());
    const byChain = {};

    tokens.forEach(token => {
      byChain[token.chain] = (byChain[token.chain] || 0) + 1;
    });

    const totalMarketCap = tokens.reduce((sum, token) => sum + token.marketCap, 0);
    const totalVolume24h = tokens.reduce((sum, token) => sum + token.volume24h, 0);

    return {
      totalTokens: tokens.length,
      totalMarketCap,
      totalVolume24h,
      byChain,
      lastUpdated: tokens.length > 0 ?
        new Date(Math.max(...tokens.map(t => new Date(t.lastUpdated).getTime()))) : null
    };
  }

  // Search for tokens across all monitored chains
  searchTokens(query) {
    const tokens = Array.from(this.tokens.values());
    const lowerQuery = query.toLowerCase();

    return tokens.filter(token =>
      token.symbol.toLowerCase().includes(lowerQuery) ||
      token.name.toLowerCase().includes(lowerQuery) ||
      token.address.toLowerCase().includes(lowerQuery)
    );
  }

  // Helper function for delays
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Export token data
  exportTokens() {
    const tokens = Array.from(this.tokens.values());
    return tokens.map(token => token.toJSON());
  }

  // Import token data
  importTokens(tokensJson) {
    let imported = 0;
    tokensJson.forEach(data => {
      const token = Token.fromJSON(data);
      const key = `${token.chain}:${token.address.toLowerCase()}`;

      if (token.meetsMarketCapRequirement(this.minMarketCap)) {
        this.tokens.set(key, token);
        imported++;
      }
    });
    return imported;
  }
}

module.exports = MonitorService;