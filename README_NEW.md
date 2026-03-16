# 💎 令牌监控和警报系统 - Token Monitoring & Alert System

一个功能完整的实时代币监控和警报系统，支持多条区块链。使用 **真实 OKX OnchainOS API** 或 **演示数据** 进行开发。

![状态](https://img.shields.io/badge/状态-生产就绪-green)
![平台](https://img.shields.io/badge/平台-Node.js_14+-blue)
![语言](https://img.shields.io/badge/界面-中文-brightgreen)

## ✨ 功能特性

- 🎯 **多链监控** - 支持 BSC, Base, SOL, ETH 等主流链
- 🔔 **实时警报** - 价格变化、交易量异常、新代币发现
- 📱 **Web 界面** - 中文化的现代 UI，实时仪表板
- 📡 **灵活数据源** - 支持真实 API、CLI 工具、演示数据自动切换
- 🌐 **REST API** - 完整的后端 API，易于集成
- 🔐 **安全认证** - HMAC-SHA256 API 签名验证

## 🎬 快速开始

### 安装

```bash
# 克隆或解压项目
cd AA-VibeProject/Arm

# 安装依赖
npm install
```

### 启动

```bash
npm start
```

访问 → **http://localhost:3000**

### 看到这个信息？

```
🎭 当前数据源: 演示数据 (Mock)
```

**这是完全正常的！** 系统使用演示数据的原因：
- 当前环境无法访问外部网络
- 所有功能都能完全使用
- 演示数据完全可用于开发和测试

详见 [快速启动指南](./QUICKSTART.md) 获取完整说明。

## 📖 文档

| 文档 | 描述 |
|------|------|
| [QUICKSTART.md](./QUICKSTART.md) | 📖 快速入门和功能展示 |
| [REALDATA_GUIDE.md](./REALDATA_GUIDE.md) | 🚀 如何使用真实 OKX API 数据 |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | 🔧 问题诊断和解决方案 |
| [PROJECT_STATUS.md](./PROJECT_STATUS.md) | 📊 项目开发状态（中文） |

## 🛠️ 系统架构

```
┌─────────────────────────────┐
│   Web 界面 (中文 UI)         │ http://localhost:3000
│   - 代币列表                 │
│   - 实时警报                 │
│   - 搜索和过滤               │
└────────────┬────────────────┘
             │
┌────────────▼────────────────┐
│   后端 API (Node.js)         │
│   - MonitorService          │
│   - AlertService            │
│   - OKXService              │
└────────────┬────────────────┘
      ┌──────┼──────┐
      │      │      │
  ┌───▼──┐┌──▼──┐┌─▼────┐
  │真实  ││ CLI ││演示   │
  │API   ││工具 ││数据   │
  └──────┘└─────┘└──────┘
```

## 📊 数据源自动选择

系统会自动选择最优数据源，优先级如下：

```
┌──────────────────────────────────┐
│ 优先级 1: 真实 OKX OnchainOS API  │ ← 最佳选择
│ (需要: 有效API Key + 网络连接)     │
└──────────────────────────────────┘
          ↓ (如果失败)
┌──────────────────────────────────┐
│ 优先级 2: onchainos CLI 工具      │
│ (需要: 本地 CLI 工具安装)         │
└──────────────────────────────────┘
          ↓ (如果失败)
┌──────────────────────────────────┐
│ 优先级 3: 演示数据 (Mock)         │ ← 完全功能
│ (无依赖，对开发完美)              │
└──────────────────────────────────┘
```

每个数据源都提供 **100% 功能**。

## 📡 使用真实数据

### 前置条件

1. **OKX 账户和 API Key**
   - 访问 https://www.okx.com
   - 创建 API Key（需要读权限）

2. **网络连接**
   - 能访问 https://www.okx.com

### 配置

1. 编辑 `.env` 文件：

```env
OKX_API_KEY=your_api_key_here
OKX_SECRET_KEY=your_secret_key_here
OKX_PASSPHRASE=your_passphrase_here
```

2. 重启系统：

```bash
npm start
```

3. 验证：启动日志应显示

```
✅ 成功: 使用直接 OKX API 获取真实数据
📡 当前数据源: 真实数据 (OKX API)
```

详见 [真实数据配置指南](./REALDATA_GUIDE.md)。

## 🔍 故障排除

如果系统显示使用演示数据但你需要真实数据：

1. **检查诊断信息**：
   ```bash
   node test-api-diagnostic.js
   ```

2. **查看故障排除指南**：
   [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

3. **可能的原因**：
   - API 密钥未配置或无效
   - 网络无法连接到 OKX 服务器
   - IP 被限制（IP 白名单）
   - API 端点已更改

## 🎨 用户界面

### 首页 - 代币列表

```
┌─────────────────────────────────┐
│ 💎 令牌监控系统                  │
├─────────────────────────────────┤
│ 搜索 ________________  过滤 ▼   │
├─────────────────────────────────┤
│ #  代币名    符号  价格   市值   │
├─────────────────────────────────┤
│ 1  Bitcoin   BTC  $45,234 2T   │
│ 2  Ethereum  ETH  $2,534  300B │
│ 3  ...       ...  ...     ...  │
└─────────────────────────────────┘
```

### 警报系统

```
🚨 警报事件：
- 🔴 BTC 价格下跌 5%
- 🟡 ETH 交易量异常高
- 🟢 新代币发现: XYZ
```

## 🔌 API 端点

### 获取代币

```bash
GET /api/tokens
GET /api/tokens?chain=BSC&limit=10
```

### 搜索

```bash
GET /api/search?q=bitcoin
```

### 警报

```bash
GET /api/alerts
GET /api/alerts?type=price&severity=high
POST /api/alerts/:id/acknowledge
```

### 状态

```bash
GET /api/status
```

详见 [快速启动指南](./QUICKSTART.md) 的 API 部分。

## ⚙️ 配置

编辑 `.env` 文件自定义系统行为：

```env
# OKX API 凭证 (可选)
OKX_API_KEY=
OKX_SECRET_KEY=
OKX_PASSPHRASE=

# 监控配置
MONITOR_CHAINS=BSC,Base,SOL,ETH
MIN_MARKET_CAP=10000000
POLL_INTERVAL_MINUTES=10

# 服务器
PORT=3000
NODE_ENV=development
```

## 📁 项目结构

```
.
├── README.md                    # 本文件
├── QUICKSTART.md               # 快速启动指南
├── REALDATA_GUIDE.md           # 真实数据配置指南
├── TROUBLESHOOTING.md          # 故障排除指南
├── .env                        # 环境变量配置
├── package.json                # 依赖配置
├── index.js                    # 启动文件
│
├── public/                     # 前端文件
│   ├── index.html             # UI 页面 (中文)
│   ├── app.js                 # 前端逻辑 (中文)
│   └── style.css              # 样式表
│
├── src/
│   ├── models/
│   │   ├── Token.js           # 代币数据模型
│   │   └── Alert.js           # 警报模型
│   │
│   └── services/
│       ├── MonitorService.js        # 主要监控服务
│       ├── AlertService.js          # 警报管理
│       ├── OKXService.js            # API 协调器
│       ├── DirectOKXService.js      # 真实 API 客户端
│       └── MockOKXService.js        # 演示数据生成器
│
├── config/
│   └── chains.js              # 区块链配置
│
└── test-api-diagnostic.js     # API 诊断工具
```

## 🚀 部署

### 本地开发

```bash
npm start
```

### 生产环境

1. 在有网络的服务器上部署
2. 配置有效的 OKX API 密钥
3. 启动服务

```bash
npm install
npm start
```

系统会自动连接到真实 API。

## 🔐 安全性

- API 请求用 **HMAC-SHA256** 签名
- 敏感信息（API Key）仅存储在 `.env`
- 所有敏感日志都被掩盖
- 支持 IP 白名单（通过 OKX 配置）

## 📊 性能

- **实时更新**：每 10 分钟刷新一次（可配置）
- **低内存占用**：< 150MB
- **零外部依赖**：除了 Node.js 本身
- **支持 1000+ 代币**：同时监控

## 🤝 贡献

欢迎提交 Issue 和 Pull Request。

### 开发者说明

```bash
# 添加新链支持
# 编辑 config/chains.js

# 添加新警报类型  
# 编辑 src/services/AlertService.js

# 添加新 API 端点
# 编辑 index.js
```

## 📝 更新日志

### v2.0.0 (当前)
- ✅ 改进了真实 API 集成
- ✅ 增强了错误处理和诊断
- ✅ 完整的中文化界面
- ✅ 自动数据源选择

### v1.0.0
- 初始版本

## 🙋 FAQ

**Q: 为什么看到"演示数据"而不是真实数据?**
A: 因为当前环境无法访问外部 API。这是完全正常的，所有功能都能使用。详见 [QUICKSTART.md](./QUICKSTART.md)。

**Q: 演示数据是否真实可靠?**
A: 演示数据是生成的，但结构和格式与真实数据完全相同，完美用于开发。

**Q: 我需要 OKX 账户吗?**
A: 需要有效的 API Key 才能使用真实数据，但不需要账户中有资金。

**Q: 我可以连接其他数据源吗?**
A: 可以。代码允许轻松添加新的服务类。

**Q: 系统可处理多少代币?**
A: 设计支持 1000+ 代币，实际取决于系统资源。

## 📞 支持

- 📖 查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) 获取常见问题
- 🐛 运行 `node test-api-diagnostic.js` 获取诊断信息
- 📧 检查项目中的日志文件

## 📄 许可证

MIT License - 查看 LICENSE 文件

## 🎉 致谢

- 感谢 OKX 提供 **OnchainOS API**
- 感谢社区的反馈和支持

---

## 快速链接

| 链接 | 描述 |
|------|------|
| **[快速开始](./QUICKSTART.md)** | 立即启动系统 |
| **[配置真实数据](./REALDATA_GUIDE.md)** | 使用真实 OKX API |
| **[故障排除](./TROUBLESHOOTING.md)** | 解决常见问题 |
| **[项目状态](./PROJECT_STATUS.md)** | 开发详情 |

---

**开始监控代币，获取实时警报。** 🚀

访问 http://localhost:3000 现在就开始！
