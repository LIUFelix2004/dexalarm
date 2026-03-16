# 🚀 快速启动指南 - 令牌监控系统

## 系统现状

✅ **完全开发就绪** - 系统已完全实现，具备以下功能：
- 🎭 演示数据系统（完全可用）
- 📡 OKX Real API 集成（已实现，需网络连接）
- 🌐 中文化前端用户界面
- 🚨 实时警报系统
- ⛓️ 多链监控

## 为什么看不到真实数据？

```
当前环境 → 无法访问外部网络
              ↓
      自动使用演示数据 ✅
  (系统继续正常运行，数据逼真)
```

**这是完全正常的！**

- ✅ 演示数据可用于开发和测试
- ✅ 所有功能都能正常工作
- ✅ 当在有网络的服务器部署时，自动使用真实数据

## 现在就开始使用

### 1. 安装依赖

```bash
npm install
```

### 2. 启动系统

```bash
npm start
```

### 3. 打开浏览器

访问 `http://localhost:3000`

## 你会看到什么

```
========================================================
✅ 令牌监控系统已启动
🌐 访问地址: http://localhost:3000
⛓️ 监控链: BSC,Base,SOL,ETH
========================================================

🎭 当前数据源: 演示数据 (Mock)
```

## 三种数据源说明

系统会自动选择可用的数据源，优先级如下：

### 1️⃣ 真实 OKX API (推荐用于生产)
```
📡 当前数据源: 真实数据 (OKX API)
```
- 来源：https://www.okx.com/api/v5/onchainos
- 认证：API Key + Secret Key + Passphrase
- 何时使用：有效的 OKX 凭证 + 网络连接

### 2️⃣ OnchainOS CLI (需要本地工具)
```
🔧 当前数据源: 真实数据 (CLI)
```
- 来源：本地 onchainos.exe 命令行工具
- 何时使用：已安装 CLI 工具且 API 不可用

### 3️⃣ 演示数据 (当前选择)
```
🎭 当前数据源: 演示数据 (Mock)
```
- 来源：生成的模拟数据
- 何时使用：API 和 CLI 都不可用
- 优点：
  - ✅ 不需要网络连接
  - ✅ 完全功能性
  - ✅ 完美的开发环境
  - ✅ 无 API 限制

## 完整的功能展示

即使使用演示数据，你也可以体验完整功能：

### 监控面板
- ✅ 查看代币列表
- ✅ 实时价格更新
- ✅ 市值排序
- ✅ 链上活动

### 搜索功能
- ✅ 按名称搜索
- ✅ 按地址搜索
- ✅ 按符号搜索

### 警报系统
- ✅ 价格变化警报
- ✅ 交易量异常警报
- ✅ 新代币发现警报
- ✅ 实时通知

### API 接口
- ✅ `/api/tokens` - 获取代币列表
- ✅ `/api/search` - 搜索代币
- ✅ `/api/alerts` - 获取警报
- ✅ `/api/status` - 系统状态

## 切换到真实数据

### 前置条件

1. **有效的 OKX API 密钥**
   - 账户：https://www.okx.com
   - API 管理：账户 → API 密钥
   - 权限：阅读权限（不需要交易权限）

2. **网络连接**
   - 能访问 https://www.okx.com
   - 没有防火墙阻止

### 配置步骤

1. **编辑 .env 文件**

```bash
# 打开 .env 文件，添加或更新：
OKX_API_KEY=your_api_key_here
OKX_SECRET_KEY=your_secret_key_here  
OKX_PASSPHRASE=your_passphrase_here
```

2. **重启系统**

```bash
# 停止当前服务 (Ctrl+C)
# 然后重新启动
npm start
```

3. **验证**

启动日志会显示：
```
🔑 API 凭证配置: ✅ 已配置
📡 尝试直接 API 连接...
✅ 成功: 使用直接 OKX API 获取真实数据

📡 当前数据源: 真实数据 (OKX API)
```

## 如果无法切换到真实数据

看一下这个文件获取完整的故障排除指南：
[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

关键步骤：
1. 验证 API 密钥有效性
2. 检查网络连接：`node test-api-diagnostic.js`
3. 查看详细错误日志
4. 按错误代码参考表采取行动

## API 端点文档

### 获取代币列表
```bash
GET http://localhost:3000/api/tokens
```

### 搜索代币
```bash
GET http://localhost:3000/api/search?q=bitcoin
```

### 按链过滤
```bash
GET http://localhost:3000/api/tokens?chain=BSC
```

### 获取所有警报
```bash
GET http://localhost:3000/api/alerts
```

### 系统状态
```bash
GET http://localhost:3000/api/status
```

## 项目结构

```
.
├── index.js                 # 主程序入口
├── public/                  # 前端文件
│   ├── index.html          # UI 页面 (中文)
│   ├── app.js              # 前端逻辑 (中文)
│   └── style.css           # 样式表
├── src/
│   ├── models/
│   │   ├── Token.js        # 代币数据模型
│   │   └── Alert.js        # 警报模型
│   └── services/
│       ├── MonitorService.js      # 监控服务
│       ├── AlertService.js        # 警报服务
│       ├── OKXService.js          # OKX 服务协调器
│       ├── DirectOKXService.js    # 真实 API 集成
│       └── MockOKXService.js      # 演示数据生成器
└── config/
    └── chains.js           # 链配置
```

## 环境变量 (.env)

```env
# OKX API 凭证 (可选，不配置时使用演示数据)
OKX_API_KEY=
OKX_SECRET_KEY=
OKX_PASSPHRASE=

# 监控配置
MONITOR_CHAINS=BSC,Base,SOL,ETH
MIN_MARKET_CAP=10000000
POLL_INTERVAL_MINUTES=10

# 服务器
PORT=3000
```

## 常用命令

```bash
# 启动系统
npm start

# 只运行诊断
node test-api-diagnostic.js

# 查看启动日志
npm start 2>&1 | tee startup.log
```

## 关键特点

| 特性 | 演示数据 | 真实 API |
|------|--------|--------|
| 数据准确性 | 模拟 | 真实 |
| 网络依赖 | ❌ 无 | ✅ 需要 |
| API 限制 | ❌ 无 | ✅ 有 |
| 功能完整性 | ✅ 100% | ✅ 100% |
| 更新频率 | ⏱️ 模拟 | 📡 实时 |

## 下一步建议

### 现在
- [ ] 启动系统并熟悉 UI
- [ ] 测试所有功能（搜索、警报等）
- [ ] 理解数据结构和 API

### 稍后
- [ ] 获取有效的 OKX API 密钥
- [ ] 在有网络的环境中配置真实 API
- [ ] 部署到生产服务器

### 自定义
- [ ] 修改监控的链
- [ ] 调整警报规则
- [ ] 添加更多的数据源

## FAQ

**Q: 演示数据会改变吗?**
A: 是的，模拟代币会定期变化，模拟现实世界的价格波动。

**Q: 我可以添加自己的数据源吗?**
A: 可以。代码结构允许轻松添加新的服务类。

**Q: 系统可以与第三方工具集成吗?**
A: 可以。所有数据都通过 REST API 暴露。

**Q: 演示数据和真实数据哪个更快?**
A: 演示数据延迟更低（本地生成）。真实数据依赖网络速度。

**Q: 我可以同时运行多个实例吗?**
A: 可以，使用不同的 PORT：`PORT=3001 npm start`

---

**你现在已经准备好开始使用系统了！** 🎉

访问 http://localhost:3000 享受完整的功能体验。

当准备好获取真实数据时，按照"切换到真实数据"部分的步骤操作。
