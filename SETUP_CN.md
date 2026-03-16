# 代币监控系统 - 实时数据集成指南

## 功能变更

本项目已进行以下更新：

✅ **前端中文化**: 所有用户界面已改成中文
✅ **真实数据支持**: 集成 OKX OnchainOS 官方 API
✅ **多数据源**: 支持 CLI 工具、直接 API 和模拟数据三种方式

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置 API 凭证

编辑 `.env` 文件，添加你的 OKX API 凭证：

```env
OKX_API_KEY="你的API密钥"
OKX_SECRET_KEY="你的密钥"
OKX_PASSPHRASE="你的密钥"
```

### 3. 启动项目
```bash
npm start
```

项目会自动尝试以下优先级连接数据源：
1. **直接 API 连接** (最快，推荐)
2. **OnchainOS CLI** (需要安装官方CLI)
3. **模拟数据** (开发/测试用)

## 获取 API 凭证

### 方法 1: 使用 OKX OnchainOS 官方 API

1. 访问 [OKX OnchainOS 开发者门户](https://www.okx.com/web3/onchainos)
2. 登录或创建账户
3. 创建 API 凭证
4. 注意事项：
   - API 凭证注意保密
   - 确保有足够的 API 调用配额
   - 根据不同的接口调整权限设置

### 方法 2: 安装 OnchainOS CLI 工具

```bash
# 下载 OnchainOS CLI
# 访问: https://github.com/okx/onchainos-skills

# 或者如果已经有 onchainos.exe，确保它在项目根目录
```

## 数据源配置

### 系统自动选择流程

当启动项目时，系统会：

1. **检查 API 凭证** 
   - 如果配置了 OKX_API_KEY 等，优先使用直接 API
   
2. **测试连接**
   - 尝试向 OnchainOS API 发送测试请求
   - 验证凭证有效性

3. **尝试 CLI**
   - 如果 API 连接失败，查找 onchainos.exe
   - 测试 CLI 功能

4. **使用模拟数据**
   - 如果以上都失败，使用内置模拟数据
   - 带有虚拟但逼真的数据

### 强制使用特定数据源

可以在代码中修改 `OKXService.js` 中的初始化模式：

```javascript
// 直接指定模式
this.mode = 'direct';    // 使用直接API
this.mode = 'cli';       // 使用CLI
this.mode = 'mock';      // 使用模拟数据
```

## 支持的链

- **BSC** (Binance Smart Chain)
- **Base**
- **SOL** (Solana)
- **ETH** (Ethereum)
- **更多**: Polygon, Arbitrum, Sui 等

## 监控功能

### 代币监控
- 实时价格监控
- 市值跟踪
- 24 小时交易量分析
- 10 分钟内交易量分析

### 警报系统
- **交易量激增**: 30%+ 增长
- **大额交易**: > $10,000
- **价格变化**: > 10% 涨跌 (可自定义)

### 仪表板功能
- 📊 实时图表
- 🔍 代币搜索
- 🔔 警报管理
- 📈 市场概览

## 常见问题

### Q: API 连接失败怎么办？

A: 检查以下内容：
1. `.env` 文件中的凭证是否正确
2. 网络连接是否正常
3. API 凭证是否有效期内
4. 是否达到 API 调用配额限制

日志会显示具体原因，系统会自动降级到可用的数据源。

### Q: 如何切换到使用 CLI？

A: 
1. 下载安装 onchain-os CLI
2. 将 `onchainos.exe` 放到项目根目录
3. 重启项目

### Q: 模拟数据足够用吗？

A: 是的！模拟数据包含：
- 真实的代币符号和名称
- 逼真的价格和市值数据
- 随机生成但合理的交易数据

完全可用于开发、测试和演示。

## API 端点

所有本地 API 端点都在 `/api` 前缀下：

- `GET /api/status` - 系统状态
- `GET /api/tokens` - 获取代币列表
- `GET /api/search?q=...` - 搜索代币
- `GET /api/alerts` - 获取警报

## 更新日志

### v1.1.0 (当前)
- ✅ 完整的中文本地化
- ✅ 直接 OKX API 集成
- ✅ CLI 命令参数修复
- ✅ 改进的数据源导向

### v1.0.0
- ✅ 初始项目发布
- ✅ 模拟数据系统
- ✅ 英文界面

## 技术栈

- **后端**: Node.js + Express
- **前端**: JavaScript + Chart.js
- **数据源**: OKX OnchainOS API
- **数据库**: 内存存储 (可扩展)

## 许可证

MIT License

## 支持

如有问题，请：
1. 检查日志输出
2. 参考 OKX 官方文档
3. 确保所有依赖已安装

---

祝你使用愉快！🚀
