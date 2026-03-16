// Supported chains configuration
module.exports = {
  BSC: {
    id: 'bsc',
    name: 'BNB Smart Chain',
    nativeCurrency: 'BNB',
    explorer: 'https://bscscan.com',
    dex: 'PancakeSwap'
  },
  Base: {
    id: 'base',
    name: 'Base',
    nativeCurrency: 'ETH',
    explorer: 'https://basescan.org',
    dex: 'Uniswap'
  },
  SOL: {
    id: 'solana',
    name: 'Solana',
    nativeCurrency: 'SOL',
    explorer: 'https://solscan.io',
    dex: 'Raydium'
  },
  ETH: {
    id: 'ethereum',
    name: 'Ethereum',
    nativeCurrency: 'ETH',
    explorer: 'https://etherscan.io',
    dex: 'Uniswap'
  }
};