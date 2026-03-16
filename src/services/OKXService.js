// OKX API service - tries CLI first, then direct API, then mock data
require('dotenv').config();
const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execPromise = util.promisify(exec);
const MockOKXService = require('./MockOKXService');
const DirectOKXService = require('./DirectOKXService');

class OKXService {
  constructor() {
    this.apiKey = process.env.OKX_API_KEY;
    this.secretKey = process.env.OKX_SECRET_KEY;
    this.passphrase = process.env.OKX_PASSPHRASE;
    this.cliPath = path.resolve(__dirname, '../../onchainos.exe'); // Use local CLI binary

    // Initialize all service types
    this.mockService = new MockOKXService();
    this.directService = new DirectOKXService();

    // Service mode: 'cli', 'direct', or 'mock'
    // Default to 'direct' for real data from OKX API
    this.mode = 'direct';

    // Check available services
    this.initializeService();
  }

  async initializeService() {
    console.log('\n========== OKX 服务初始化 ==========');
    console.log(`📅 初始化时间: ${new Date().toISOString()}`);

    // Check credentials
    const hasCredentials = this.apiKey && this.secretKey && this.passphrase;
    console.log(`🔑 API 凭证配置: ${hasCredentials ? '✅ 已配置' : '❌ 未配置'}`);
    if (hasCredentials) {
      console.log(`   - API Key: ${this.apiKey.substring(0, 8)}...${this.apiKey.substring(-4)}`);
      console.log(`   - Secret Key: ${this.secretKey.substring(0, 6)}...${this.secretKey.substring(-4)}`);
    }

    // Prefer direct API for real data
    if (hasCredentials) {
      console.log('\n📡 尝试直接 API 连接...');
      const apiAvailable = await this.directService.checkAPIAvailable();
      if (apiAvailable) {
        this.mode = 'direct';
        console.log('\n✅ 成功: 使用直接 OKX API 获取真实数据\n');
        return;
      }
      console.log('❌ 直接 API 连接失败，尝试 CLI...\n');
    } else {
      console.log('⚠️  未配置 API 凭证，跳过直接 API\n');
    }

    // Try CLI if direct API is not available
    const cliExists = await this.checkCLIAvailable();
    if (cliExists) {
      console.log('🔧 onchainos CLI 已找到，测试功能...');
      const cliFunctional = await this.testCLIFunctionality();
      if (cliFunctional) {
        this.mode = 'cli';
        console.log('✅ 成功: 使用 onchainos CLI 获取数据\n');
        return;
      }
      console.log('❌ CLI 测试失败\n');
    } else {
      console.log('⚠️  onchainos CLI 未找到\n');
    }

    // Fall back to mock data
    this.mode = 'mock';
    console.log('✅ 降级: 使用模拟数据（用于开发和测试）');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (!hasCredentials) {
      console.log('💡 建议: 在 .env 文件中配置 OKX API 凭证以使用真实数据');
    } else {
      console.log('💡 问题诊断:');
      console.log('  1. 检查 API 凭证是否有效和未过期');
      console.log('  2. 检查网络连接是否正常');
      console.log('  3. 检查是否有 IP 白名单限制');
      console.log('  4. 查看上面的详细错误日志获更多信息');
    }
  }

  // Execute onchainos CLI command
  async executeCommand(args) {
    try {
      // Set environment variables for CLI
      const env = {
        ...process.env,
        OKX_API_KEY: this.apiKey,
        OKX_SECRET_KEY: this.secretKey,
        OKX_PASSPHRASE: this.passphrase
      };

      const command = `${this.cliPath} ${args}`;
      console.log(`Executing: ${command}`);

      const { stdout, stderr } = await execPromise(command, { env });

      if (stderr && !stderr.includes('warning')) {
        console.error('CLI stderr:', stderr);
      }

      try {
        return JSON.parse(stdout);
      } catch (e) {
        // If output is not JSON, return raw output
        return stdout;
      }
    } catch (error) {
      console.error('CLI command failed:', error.message);
      if (error.stderr) {
        console.error('CLI error output:', error.stderr);
      }
      return null;
    }
  }

  // Map chain name to CLI chain identifier
  mapChainToCLI(chain) {
    const map = {
      'BSC': 'bsc',
      'Base': 'base',
      'SOL': 'solana',
      'ETH': 'ethereum'
    };
    return map[chain] || chain.toLowerCase();
  }

  // Delegate to mock or real implementation
  async searchTokens(query, chain = null, limit = 50) {
    switch (this.mode) {
      case 'cli':
        let args = `token search --query "${query}"`;
        if (chain) {
          args += ` --chains "${this.mapChainToCLI(chain)}"`;
        }

        const result = await this.executeCommand(args);
        if (!result || !result.tokens) return [];

        const minMarketCap = parseFloat(process.env.MIN_MARKET_CAP) || 10000000;
        const filteredTokens = result.tokens.filter(token => token.marketCap >= minMarketCap);
        return filteredTokens.slice(0, limit);

      case 'direct':
        return this.directService.searchTokens(query, chain, limit);

      case 'mock':
      default:
        return this.mockService.searchTokens(query, chain, limit);
    }
  }

  async getTokenPriceInfo(chain, tokenAddress) {
    switch (this.mode) {
      case 'cli':
        const args = `token price-info --address "${tokenAddress}" --chain "${this.mapChainToCLI(chain)}"`;
        return await this.executeCommand(args);

      case 'direct':
        return this.directService.getTokenPriceInfo(chain, tokenAddress);

      case 'mock':
      default:
        return this.mockService.getTokenPriceInfo(chain, tokenAddress);
    }
  }

  async getTopTokensByMarketCap(chain, limit = 20) {
    switch (this.mode) {
      case 'cli':
        // Use trending endpoint sorted by market cap (sort-by=1)
        let args = `token trending --chains "${this.mapChainToCLI(chain)}"`;
        const result = await this.executeCommand(args);

        if (!result || !result.tokens) return [];

        const minMarketCap = parseFloat(process.env.MIN_MARKET_CAP) || 10000000;
        const tokens = result.tokens.filter(token => token.marketCap >= minMarketCap);

        // Limit results manually
        const limitedTokens = tokens.slice(0, limit);

        return limitedTokens.map(token => ({
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

      case 'direct':
        return this.directService.getTopTokensByMarketCap(chain, limit);

      case 'mock':
      default:
        return this.mockService.getTopTokensByMarketCap(chain, limit);
    }
  }

  async getMarketData(chain, tokenAddress) {
    switch (this.mode) {
      case 'cli':
      case 'direct':
        // Both CLI and direct modes use similar logic
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

      case 'mock':
      default:
        return this.mockService.getMarketData(chain, tokenAddress);
    }
  }

  async getRecentTrades(chain, tokenAddress, limit = 100) {
    switch (this.mode) {
      case 'cli':
        const trades = await this.getTokenTrades(chain, tokenAddress, limit);
        return trades.map(trade => ({
          ...trade,
          isBuy: trade.tradeType === 'buy' || trade.amountIn > 0,
          valueUSD: trade.valueUSD || trade.amountUSD || 0,
          timestamp: trade.timestamp || new Date().toISOString()
        }));

      case 'direct':
        return this.directService.getRecentTrades(chain, tokenAddress, limit);

      case 'mock':
      default:
        return this.mockService.getRecentTrades(chain, tokenAddress, limit);
    }
  }

  async getTokenTrades(chain, tokenAddress, limit = 100) {
    switch (this.mode) {
      case 'cli':
        const args = `token trades --address "${tokenAddress}" --chain "${this.mapChainToCLI(chain)}" --limit ${limit}`;
        const result = await this.executeCommand(args);
        return result?.trades || [];

      case 'direct':
        return this.directService.getTokenTrades(chain, tokenAddress, limit);

      case 'mock':
      default:
        return this.mockService.getTokenTrades(chain, tokenAddress, limit);
    }
  }

  async getTrendingTokens(chain = null, sortBy = '5', timeFrame = '4', limit = 20) {
    switch (this.mode) {
      case 'cli':
        let args = `token trending`;
        if (chain) {
          args += ` --chains "${this.mapChainToCLI(chain)}"`;
        }

        const result = await this.executeCommand(args);
        if (!result || !result.tokens) return [];

        const minMarketCap = parseFloat(process.env.MIN_MARKET_CAP) || 10000000;
        const filteredTokens = result.tokens.filter(token => token.marketCap >= minMarketCap);
        return filteredTokens.slice(0, limit);

      case 'direct':
        return this.directService.getTrendingTokens(chain, sortBy, timeFrame, limit);

      case 'mock':
      default:
        return this.mockService.getTrendingTokens(chain, sortBy, timeFrame, limit);
    }
  }

  async getHotTokens(rankingType = '4', chain = null, limit = 50) {
    switch (this.mode) {
      case 'cli':
        let args = `token hot-tokens --ranking-type ${rankingType}`;
        if (chain) {
          args += ` --chain "${this.mapChainToCLI(chain)}"`;
        }

        const result = await this.executeCommand(args);
        if (!result || !result.tokens) return [];

        const minMarketCap = parseFloat(process.env.MIN_MARKET_CAP) || 10000000;
        const filteredTokens = result.tokens.filter(token => token.marketCap >= minMarketCap);
        return filteredTokens.slice(0, limit);

      case 'direct':
        // Direct API doesn't have hot-tokens, use trending instead
        return this.directService.getTrendingTokens(chain, rankingType, '4', limit);

      case 'mock':
      default:
        return this.mockService.getHotTokens(rankingType, chain, limit);
    }
  }

  async getTokenHolders(chain, tokenAddress, limit = 100) {
    switch (this.mode) {
      case 'cli':
        const args = `token holders --address "${tokenAddress}" --chain "${this.mapChainToCLI(chain)}"`;
        return await this.executeCommand(args);

      case 'direct':
        return this.directService.getTokenHolders(chain, tokenAddress, limit);

      case 'mock':
      default:
        return this.mockService.getTokenHolders(chain, tokenAddress, limit);
    }
  }

  // Check if CLI is available
  async checkCLIAvailable() {
    try {
      const { stdout } = await execPromise(`${this.cliPath} --version`);
      console.log(`CLI version: ${stdout.trim()}`);
      return true;
    } catch (error) {
      console.log('onchainos CLI not found. Using mock service.');
      console.log('To use real data, install onchainos from: https://github.com/okx/onchainos-skills');
      return false;
    }
  }

  // Test if CLI actually works with API calls
  async testCLIFunctionality() {
    try {
      // Test a simple command that should work if API is accessible
      // Use token search with a common query
      const testArgs = 'token search --query "USDT" --chains "ethereum"';
      const result = await this.executeCommand(testArgs);

      // If executeCommand returns null or empty result, CLI is not functional
      if (!result || !result.tokens || result.tokens.length === 0) {
        console.log('CLI test failed: No results returned');
        return false;
      }

      console.log('CLI test successful');
      return true;
    } catch (error) {
      console.log('CLI test failed:', error.message);
      return false;
    }
  }
}

module.exports = OKXService;