// Mock OKX service for demonstration when CLI is not available
require('dotenv').config();

class MockOKXService {
  constructor() {
    this.tokensByChain = {
      'BSC': this.generateChainTokens('BSC', 15),
      'Base': this.generateChainTokens('Base', 12),
      'SOL': this.generateChainTokens('SOL', 20),
      'ETH': this.generateChainTokens('ETH', 18)
    };

    // Track trade history for volume calculations
    this.tradeHistory = {};
  }

  // Generate mock tokens for a chain
  generateChainTokens(chain, count) {
    const symbols = {
      'BSC': ['CAKE', 'BUSD', 'BAKE', 'XVS', 'ALPACA', 'TWT', 'SFUND', 'BNX', 'GMR', 'FLOKI', 'METIS', 'PEEL', 'HIGH', 'RACA', 'BETA'],
      'Base': ['BASE', 'AERO', 'DEGEN', 'BRETT', 'MOCHI', 'TOSHI', 'NORMIE', 'BLAZE', 'KIBSHI', 'MOG', 'TYR', 'ONCHAIN', 'DEFI'],
      'SOL': ['SOL', 'BONK', 'WIF', 'JUP', 'RAY', 'PYTH', 'JTO', 'BOME', 'POPCAT', 'MYRO', 'WEN', 'SLERF', 'SAMO', 'CHILL', 'MOON'],
      'ETH': ['ETH', 'USDT', 'USDC', 'LINK', 'UNI', 'AAVE', 'MKR', 'SNX', 'COMP', 'YFI', 'CRV', 'SUSHI', 'LDO', 'RPL', 'FXS']
    };

    const names = {
      'BSC': ['PancakeSwap', 'Binance USD', 'BakeryToken', 'Venus', 'Alpaca Finance', 'Trust Wallet', 'Seedify', 'BinaryX', 'GamerCoin', 'Floki', 'Metis', 'Peel', 'Highstreet', 'Radio Caca', 'Beta Finance'],
      'Base': ['Base', 'Aerodrome', 'Degen', 'Brett', 'Mochi', 'Toshi', 'Normie', 'Blaze', 'Kibashi', 'Mog Coin', 'Tyr', 'Onchain', 'DeFi'],
      'SOL': ['Solana', 'Bonk', 'dogwifhat', 'Jupiter', 'Raydium', 'Pyth', 'Jito', 'BOOK OF MEME', 'Popcat', 'Myro', 'Wen', 'Slerf', 'Samoyedcoin', 'Chill', 'Moon'],
      'ETH': ['Ethereum', 'Tether', 'USD Coin', 'Chainlink', 'Uniswap', 'Aave', 'Maker', 'Synthetix', 'Compound', 'Yearn', 'Curve', 'Sushi', 'Lido', 'Rocket Pool', 'Frax Share']
    };

    const tokens = [];
    const chainSymbols = symbols[chain] || ['TOKEN'];
    const chainNames = names[chain] || ['Token'];

    for (let i = 0; i < count; i++) {
      const symbol = chainSymbols[i % chainSymbols.length];
      const name = chainNames[i % chainNames.length];
      const price = this.randomPrice(chain);
      const marketCap = this.randomMarketCap();
      const volume24h = marketCap * this.randomFloat(0.01, 0.2);
      const volume10m = volume24h / 144 * this.randomFloat(0.5, 2); // 10-min volume

      tokens.push({
        symbol: symbol,
        name: name,
        address: `0x${this.randomHex(40)}`,
        chain: chain,
        price: price,
        marketCap: marketCap,
        volume24h: volume24h,
        volume10m: volume10m,
        dex: chain === 'SOL' ? 'Raydium' : 'Uniswap',
        liquidity: marketCap * this.randomFloat(0.1, 0.5),
        holders: Math.floor(marketCap / price / 1000),
        priceChange1h: this.randomFloat(-5, 5),
        priceChange24h: this.randomFloat(-10, 15)
      });
    }

    return tokens;
  }

  // Generate random price based on chain
  randomPrice(chain) {
    const ranges = {
      'ETH': [1000, 5000],
      'SOL': [50, 200],
      'BSC': [0.1, 50],
      'Base': [0.01, 10]
    };
    const [min, max] = ranges[chain] || [0.1, 100];
    return this.randomFloat(min, max);
  }

  // Generate random market cap (mostly above 10M)
  randomMarketCap() {
    // 70% chance above 10M, 30% chance below (for filtering test)
    if (Math.random() < 0.7) {
      return this.randomFloat(10e6, 500e6);
    } else {
      return this.randomFloat(1e6, 10e6);
    }
  }

  randomFloat(min, max) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(4));
  }

  randomHex(length) {
    let result = '';
    const chars = '0123456789abcdef';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  // Simulate API delay
  async delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Mock API methods
  async searchTokens(query, chain = null, limit = 50) {
    await this.delay();
    const minMarketCap = parseFloat(process.env.MIN_MARKET_CAP) || 10000000;
    let allTokens = [];

    if (chain) {
      allTokens = this.tokensByChain[chain] || [];
    } else {
      allTokens = Object.values(this.tokensByChain).flat();
    }

    const filtered = allTokens.filter(token =>
      token.symbol.toLowerCase().includes(query.toLowerCase()) ||
      token.name.toLowerCase().includes(query.toLowerCase()) ||
      token.address.toLowerCase().includes(query.toLowerCase())
    ).filter(token => token.marketCap >= minMarketCap);

    return filtered.slice(0, limit);
  }

  async getTokenPriceInfo(chain, tokenAddress) {
    await this.delay();
    const tokens = this.tokensByChain[chain] || [];
    const token = tokens.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());

    if (!token) {
      return {
        price: 0,
        marketCap: 0,
        volume24h: 0,
        liquidity: 0,
        priceChange24h: 0,
        priceChange1h: 0
      };
    }

    // Add some random variation
    const variation = this.randomFloat(-0.02, 0.02);
    const newPrice = token.price * (1 + variation);

    return {
      price: newPrice,
      marketCap: token.marketCap * (1 + variation),
      volume24h: token.volume24h * this.randomFloat(0.8, 1.2),
      volume10m: token.volume10m * this.randomFloat(0.5, 2),
      liquidity: token.liquidity,
      priceChange24h: token.priceChange24h + this.randomFloat(-1, 1),
      priceChange1h: token.priceChange1h + this.randomFloat(-0.5, 0.5)
    };
  }

  async getTopTokensByMarketCap(chain, limit = 20) {
    await this.delay();
    const tokens = this.tokensByChain[chain] || [];
    const minMarketCap = parseFloat(process.env.MIN_MARKET_CAP) || 10000000;

    return tokens
      .filter(token => token.marketCap >= minMarketCap)
      .sort((a, b) => b.marketCap - a.marketCap)
      .slice(0, limit)
      .map(token => ({
        ...token,
        // Add some variation
        price: token.price * this.randomFloat(0.99, 1.01),
        volume24h: token.volume24h * this.randomFloat(0.9, 1.1),
        volume10m: token.volume10m * this.randomFloat(0.8, 1.2)
      }));
  }

  async getMarketData(chain, tokenAddress) {
    await this.delay();
    const priceInfo = await this.getTokenPriceInfo(chain, tokenAddress);
    return {
      ...priceInfo,
      // Ensure volume10m is included
      volume10m: priceInfo.volume10m || priceInfo.volume24h / 144
    };
  }

  async getRecentTrades(chain, tokenAddress, limit = 100) {
    await this.delay();
    const tokens = this.tokensByChain[chain] || [];
    const token = tokens.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());

    if (!token) return [];

    const trades = [];
    const now = Date.now();
    const tradeCount = Math.min(limit, Math.floor(Math.random() * 30) + 5);

    for (let i = 0; i < tradeCount; i++) {
      const timeAgo = Math.random() * 3600000; // Up to 1 hour ago
      const isBuy = Math.random() > 0.5;
      const valueUSD = this.randomFloat(100, token.volume10m * 10);

      trades.push({
        timestamp: new Date(now - timeAgo).toISOString(),
        isBuy: isBuy,
        valueUSD: valueUSD,
        tradeType: isBuy ? 'buy' : 'sell',
        amountIn: isBuy ? valueUSD / token.price : 0,
        amountOut: isBuy ? 0 : valueUSD / token.price,
        price: token.price * this.randomFloat(0.99, 1.01)
      });
    }

    // Occasionally add a large trade (>10k USD)
    if (Math.random() < 0.3) {
      const largeTradeValue = this.randomFloat(10000, 50000);
      trades.unshift({
        timestamp: new Date(now - this.randomFloat(0, 600000)).toISOString(), // Within 10 minutes
        isBuy: Math.random() > 0.5,
        valueUSD: largeTradeValue,
        tradeType: Math.random() > 0.5 ? 'buy' : 'sell',
        amountIn: largeTradeValue / token.price,
        price: token.price,
        isLarge: true
      });
    }

    return trades.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  }

  // For monitoring service compatibility
  async getTokenTrades(chain, tokenAddress, limit = 100) {
    return this.getRecentTrades(chain, tokenAddress, limit);
  }

  async getTokenHolders(chain, tokenAddress, limit = 100) {
    await this.delay();
    return {
      holders: Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
        address: `0x${this.randomHex(40)}`,
        percentage: (100 / (i + 1)) * 0.1,
        valueUSD: this.randomFloat(1000, 1000000)
      }))
    };
  }

  async getTrendingTokens(chain = null, sortBy = '5', timeFrame = '4', limit = 20) {
    await this.delay();
    const minMarketCap = parseFloat(process.env.MIN_MARKET_CAP) || 10000000;
    let allTokens = [];

    if (chain) {
      allTokens = this.tokensByChain[chain] || [];
    } else {
      allTokens = Object.values(this.tokensByChain).flat();
    }

    return allTokens
      .filter(token => token.marketCap >= minMarketCap)
      .sort((a, b) => b.volume24h - a.volume24h) // Sort by volume for trending
      .slice(0, limit);
  }

  async getHotTokens(rankingType = '4', chain = null, limit = 50) {
    return this.getTrendingTokens(chain, rankingType, '4', limit);
  }

  async checkCLIAvailable() {
    return false; // Mock service, CLI not available
  }
}

module.exports = MockOKXService;