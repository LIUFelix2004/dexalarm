// Direct OKX API service using HTTP requests (no CLI dependency)
require('dotenv').config();
const crypto = require('crypto');

class DirectOKXService {
  constructor() {
    this.apiKey = process.env.OKX_API_KEY;
    this.secretKey = process.env.OKX_SECRET_KEY;
    this.passphrase = process.env.OKX_PASSPHRASE;
    // Try multiple possible base URLs
    this.baseURLs = [
      'https://www.okx.com/api/v5/onchainos',
      'https://api.okx.com/api/v5/onchainos',
      'https://okx.com/api/v5/onchainos'
    ];
    this.baseURL = this.baseURLs[0]; // Start with first one
    this.fetchFn = null; // Will be initialized on first use
  }

  // Initialize fetch function
  async ensureFetch() {
    if (!this.fetchFn) {
      try {
        // Try to use native fetch if available (Node.js 18+)
        this.fetchFn = fetch;
      } catch {
        // Fall back to node-fetch for older Node.js versions
        const nodeFetch = await import('node-fetch');
        this.fetchFn = nodeFetch.default;
      }
    }
    return this.fetchFn;
  }

  // Generate OKX API signature
  generateSignature(timestamp, method, requestPath, body = '') {
    const message = timestamp + method + requestPath + body;
    const hmac = crypto.createHmac('sha256', this.secretKey);
    return hmac.update(message).digest('base64');
  }

  // Make authenticated API request
  async makeRequest(method, endpoint, params = {}) {
    const fetch = await this.ensureFetch();
    const timestamp = new Date().toISOString();
    const requestPath = endpoint;
    const body = method === 'GET' ? '' : JSON.stringify(params);

    const signature = this.generateSignature(timestamp, method, requestPath, body);

    const headers = {
      'OK-ACCESS-KEY': this.apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': this.passphrase,
      'Content-Type': 'application/json'
    };

    const queryString = method === 'GET' && Object.keys(params).length ? '?' + new URLSearchParams(params) : '';
    const url = `${this.baseURL}${endpoint}${queryString}`;

    try {
      console.log(`[API] 请求: ${method} ${url}`, params);
      
      const response = await fetch(url, {
        method,
        headers,
        body: method !== 'GET' ? JSON.stringify(params) : undefined
      });

      console.log(`[API] 响应状态: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OKX API error ${response.status}: ${errorText}`);
        return null;
      }

      const data = await response.json();
      console.log(`[API] 响应数据:`, JSON.stringify(data).substring(0, 200) + '...');
      
      if (data.code !== '0') {
        console.error(`OKX API returned error: ${data.msg}`);
        return null;
      }

      return data.data;
    } catch (error) {
      console.error(`OKX API request failed [${this.baseURL}${endpoint}]:`, error.message);
      return null;
    }
  }

  // Map chain name to OKX chain identifier
  mapChainToOKX(chain) {
    const map = {
      'BSC': 'bsc',
      'Base': 'base',
      'SOL': 'solana',
      'ETH': 'ethereum'
    };
    return map[chain] || chain.toLowerCase();
  }

  // Search tokens
  async searchTokens(query, chain = null, limit = 50) {
    const params = {
      query,
      limit: limit.toString()
    };

    if (chain) {
      params.chains = this.mapChainToOKX(chain);
    }

    const data = await this.makeRequest('GET', '/dex/token/search', params);
    if (!data || !Array.isArray(data)) return [];

    const minMarketCap = parseFloat(process.env.MIN_MARKET_CAP) || 10000000;
    return data.filter(token => token.marketCap >= minMarketCap);
  }

  // Get token price info
  async getTokenPriceInfo(chain, tokenAddress) {
    const data = await this.makeRequest('GET', '/dex/token/price-info', {
      chain: this.mapChainToOKX(chain),
      tokenAddress
    });
    return data;
  }

  // Get top tokens by market cap
  async getTopTokensByMarketCap(chain, limit = 20) {
    // Use trending endpoint sorted by market cap (sort-by=1)
    const data = await this.makeRequest('GET', '/dex/token/trending', {
      chains: this.mapChainToOKX(chain),
      limit: limit.toString()
    });

    if (!data || !Array.isArray(data)) return [];

    const minMarketCap = parseFloat(process.env.MIN_MARKET_CAP) || 10000000;
    const tokens = data.filter(token => token.marketCap >= minMarketCap);

    return tokens.map(token => ({
      symbol: token.symbol,
      name: token.name,
      address: token.tokenContractAddress,
      chain: chain,
      price: token.price,
      marketCap: token.marketCap,
      volume24h: token.volume24h,
      volume10m: token.volume10m || 0,
      dex: token.dex || '',
      liquidity: token.liquidity || 0,
      holders: token.holders || 0
    }));
  }

  // Get market data
  async getMarketData(chain, tokenAddress) {
    const priceInfo = await this.getTokenPriceInfo(chain, tokenAddress);
    if (!priceInfo) return null;

    // Get recent trades for volume calculation
    const trades = await this.getTokenTrades(chain, tokenAddress, 100);

    // Calculate 10-minute volume
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    const recentTrades = trades.filter(trade =>
      trade.timestamp && new Date(trade.timestamp).getTime() > tenMinutesAgo
    );

    const volume10m = recentTrades.reduce((sum, trade) => sum + (trade.valueUSD || 0), 0);

    return {
      price: priceInfo.price,
      marketCap: priceInfo.marketCap,
      volume24h: priceInfo.volume24h,
      volume10m: volume10m,
      liquidity: priceInfo.liquidity,
      priceChange24h: priceInfo.priceChange24h,
      priceChange1h: priceInfo.priceChange1h || 0
    };
  }

  // Get token trades
  async getTokenTrades(chain, tokenAddress, limit = 100) {
    const data = await this.makeRequest('GET', '/dex/token/trades', {
      chain: this.mapChainToOKX(chain),
      tokenAddress,
      limit: limit.toString()
    });

    return Array.isArray(data) ? data : [];
  }

  // Get recent trades (compatible with MonitorService)
  async getRecentTrades(chain, tokenAddress, limit = 100) {
    const trades = await this.getTokenTrades(chain, tokenAddress, limit);
    return trades.map(trade => ({
      ...trade,
      isBuy: trade.tradeType === 'buy' || trade.amountIn > 0,
      valueUSD: trade.valueUSD || trade.amountUSD || 0,
      timestamp: trade.timestamp || new Date().toISOString()
    }));
  }

  // Get trending tokens
  async getTrendingTokens(chain = null, sortBy = '5', timeFrame = '4', limit = 20) {
    const params = {
      limit: limit.toString()
    };

    if (chain) {
      params.chains = this.mapChainToOKX(chain);
    }

    const data = await this.makeRequest('GET', '/dex/token/trending', params);
    if (!Array.isArray(data)) return [];

    const minMarketCap = parseFloat(process.env.MIN_MARKET_CAP) || 10000000;
    return data.filter(token => token.marketCap >= minMarketCap).slice(0, limit);
  }

  // Get token holders
  async getTokenHolders(chain, tokenAddress, limit = 100) {
    const data = await this.makeRequest('GET', '/dex/token/holders', {
      chain: this.mapChainToOKX(chain),
      tokenAddress,
      limit: limit.toString()
    });

    return Array.isArray(data) ? data : [];
  }

  // Check if API credentials are valid
  async checkAPIAvailable() {
    console.log('🔍 开始 API 可用性检查...');
    
    try {
      // First, try with authentication
      console.log('📡 尝试带认证的 API 调用...', {
        apiKey: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : '未配置',
        baseURL: this.baseURL
      });
      
      const data = await this.makeRequest('GET', '/dex/token/trending', {
        chains: 'ethereum',
        limit: '1'
      });
      
      if (data && Array.isArray(data) && data.length > 0) {
        console.log('✅ API 认证成功！找到响应数据');
        return true;
      }
      
      if (data && Array.isArray(data) && data.length === 0) {
        console.log('✅ API 连接成功，但无数据返回（可能是网络问题）');
        return true;
      }
      
      if (data === null) {
        console.log('❌ API 返回 null');
        return false;
      }
      
      console.log('❓ 未预期的响应格式:', typeof data, data);
      return false;
      
    } catch (error) {
      console.error('❌ API 可用性检查失败:', error.message);
      return false;
    }
  }
}

module.exports = DirectOKXService;