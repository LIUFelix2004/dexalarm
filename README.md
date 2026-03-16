# Token Monitoring System

A real-time token monitoring dashboard that tracks tokens across BSC, Base, Solana, and Ethereum blockchains. The system monitors market data, detects volume spikes, large trades, and price changes, and provides alerts through a web dashboard.

## Features

- **Multi-chain Monitoring**: Tracks tokens on BSC, Base, Solana, and Ethereum
- **Market Cap Filter**: Only monitors tokens with market cap > $10M
- **Real-time Data**: Updates every 10 minutes (configurable)
- **Alert System**:
  - Volume spikes (30%+ increase in 30 minutes)
  - Large trades (> $10,000 USD)
  - Significant price changes (> 10% in 1 hour)
- **Web Dashboard**: Responsive HTML dashboard with charts and tables
- **Mock Data**: Works out-of-the-box with simulated data
- **Real Data Integration**: Can connect to OKX OnchainOS API for real market data

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` (or create your own `.env` file):
```bash
# For mock data (default), no configuration needed
# For real data, add your OKX API credentials:
# OKX_API_KEY="your-api-key"
# OKX_SECRET_KEY="your-secret-key"
# OKX_PASSPHRASE="your-passphrase"
```

### 3. Start the Server
```bash
node index.js
```

### 4. Open Dashboard
Open your browser to: http://localhost:3000

## Using Real Data (Optional)

To use real market data from OKX:

1. **Get API Credentials**:
   - Visit [OKX Developer Portal](https://web3.okx.com/onchain-os/dev-portal)
   - Create an account and generate API keys
   - Add credentials to `.env` file

2. **Install onchainos CLI** (if not auto-installed):
   ```bash
   # macOS/Linux
   curl -sSL https://raw.githubusercontent.com/okx/onchainos-skills/main/install.sh | sh

   # Windows (PowerShell)
   # Download and install manually from: https://github.com/okx/onchainos-skills
   ```

3. **Restart the server**:
   ```bash
   node index.js
   ```

## Dashboard Features

### Tokens Tab
- View all monitored tokens with real-time prices
- Sort by market cap, volume, or price change
- Filter by blockchain
- Manual token addition/removal

### Alerts Tab
- View active and historical alerts
- Acknowledge and resolve alerts
- Filter by alert type and severity
- Alert statistics

### Charts Tab
- Market cap distribution by chain
- Trading volume breakdown
- Visual trends and patterns

### Search Tab
- Search tokens across all chains
- Add new tokens to monitoring
- View token details

## Configuration

Edit `.env` file to customize:

```bash
# Monitoring configuration
MIN_MARKET_CAP=10000000           # Minimum market cap in USD
ALERT_VOLUME_SPIKE_PERCENT=30     # Volume spike threshold (30%)
ALERT_LARGE_TRADE_VALUE=10000     # Large trade threshold in USD
POLL_INTERVAL_MINUTES=10          # Data refresh interval

# Chains to monitor (comma separated)
MONITOR_CHAINS=BSC,Base,SOL,ETH

# Server port
PORT=3000
```

## Project Structure

```
token-monitor/
├── index.js              # Main server entry point
├── package.json          # Dependencies
├── .env                  # Environment variables
├── config/
│   └── chains.js        # Blockchain configuration
├── src/
│   ├── models/          # Data models (Token, Alert)
│   ├── services/        # Business logic services
│   │   ├── OKXService.js        # OKX API integration
│   │   ├── MockOKXService.js    # Mock data service
│   │   ├── MonitorService.js    # Token monitoring
│   │   └── AlertService.js      # Alert management
│   └── utils/           # Utility functions
├── public/              # Frontend assets
│   ├── index.html      # Dashboard HTML
│   ├── style.css       # Styles
│   └── app.js          # Frontend JavaScript
└── README.md           # This file
```

## API Endpoints

- `GET /api/status` - System status and statistics
- `GET /api/tokens` - List all monitored tokens
- `GET /api/tokens/:chain/:address` - Get specific token
- `GET /api/search?q=query` - Search tokens
- `GET /api/alerts` - List alerts
- `POST /api/alerts/:id/acknowledge` - Acknowledge alert
- `POST /api/alerts/:id/resolve` - Resolve alert
- `POST /api/tokens` - Add token to monitor
- `DELETE /api/tokens/:chain/:address` - Remove token
- `POST /api/monitor/start` - Start monitoring
- `POST /api/monitor/stop` - Stop monitoring

## Notion Integration (Planned)

The system can be extended to export alerts and token data to Notion. To enable:

1. Create a Notion integration and database
2. Add `NOTION_API_KEY` and `NOTION_DATABASE_ID` to `.env`
3. Uncomment Notion-related code in services

## Development

### Running Tests
```bash
npm test  # (Test suite to be implemented)
```

### Code Style
```bash
npm run lint  # (Linting to be configured)
```

### Building for Production
```bash
npm run build  # (Build script to be implemented)
```

## Troubleshooting

### CLI Not Found
If you see "onchainos CLI not found" messages:
- The system will automatically use mock data
- To use real data, install the CLI as shown above
- Windows users may need to install manually

### API Rate Limits
OKX API has rate limits. If using shared sandbox keys:
- You may experience throttling
- Get your own API keys for production use

### No Data Showing
- Check that chains are correctly specified in `.env`
- Ensure minimum market cap is not set too high
- Verify API credentials (if using real data)

## License

MIT

## Acknowledgments

- Data provided by OKX OnchainOS API
- Icons by Font Awesome
- Charts by Chart.js
- UI inspiration from modern dashboards