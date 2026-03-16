# 🔧 故障排除指南 - 获取真实数据

## 快速诊断

当系统启动时，你会看到这样的日志：

```
🎭 当前数据源: 演示数据 (Mock)
```

如果看到这个，说明系统无法连接到真实 API，使用了备选的演示数据。

## 原因分析

系统会按以下优先级尝试数据源：

```
优先级 1️⃣  → 直接 OKX API        (真实数据)
优先级 2️⃣  → onchainos CLI       (真实数据)
优先级 3️⃣  → Mock 演示数据       (备选)
```

**如果看到演示数据，说明前两个都失败了。**

## 原因及解决方案

### 原因 1: API 密钥未配置或为空

**症状**: 
```
🔑 API 凭证配置: ❌ 未配置
⚠️  未配置 API 凭证，跳过直接 API
```

**解决方案**:
1. 打开 `.env` 文件
2. 确保包含以下三行（替换为你自己的值）：
```env
OKX_API_KEY=5b2aa70f-d69e-47ca-8a9f-0ad3fd81e8b3
OKX_SECRET_KEY=2AED9C3EEE13CDEF1BFE44D97E537CD2
OKX_PASSPHRASE=onchainOS#666
```
3. 保存文件并重启服务器

### 原因 2: API 密钥无效或过期

**症状**:
```
🔑 API 凭证配置: ✅ 已配置
📡 尝试直接 API 连接...
❌ 直接 API 连接失败
```

**解决方案**:
1. 登录 OKX 官方网站
2. 验证 API Key：
   - 检查是否已激活
   - 检查是否已过期
   - 确认是否有正确的权限
3. 如果密钥过期，生成新密钥
4. 更新 `.env` 文件
5. 重启服务器

### 原因 3: 网络连接问题

**症状**:
```
📡 尝试直接 API 连接...
❌ 直接 API 连接失败
```

且错误日志显示 `fetch failed` 或连接超时

**解决方案**:

#### A. 检查基本网络连接

```bash
# Windows - 测试 DNS 解析
nslookup api.okx.com

# Windows - 测试 Ping
ping api.okx.com

# Windows - 测试 HTTPS 连接
curl https://api.okx.com
```

#### B. 检查防火墙和代理

- [ ] 检查你的防火墙设置是否允许连接到 api.okx.com
- [ ] 如果在公司网络，检查是否需要代理设置
- [ ] 如果使用VPN，尝试关闭VPN后测试

#### C. 在 .env 中配置代理（如适用）

```env
# 如果需要代理
HTTP_PROXY=http://proxy.company.com:8080
HTTPS_PROXY=http://proxy.company.com:8080
```

### 原因 4: API 端点已更改

**症状**:
```
API 连接成功，但返回错误代码
4xx 或 5xx 响应
```

**解决方案**:
1. 运行诊断脚本查看详细错误：
```bash
node test-api-diagnostic.js
```
2. 查看官方文档了解最新端点：
   https://web3.okx.com/onchainos/dev-docs/trade/dex-api-introduction
3. 如果端点已更改，系统代码可能需要更新

### 原因 5: IP 白名单限制

**症状**:
```
403 Forbidden
```

**解决方案**:
1. 登录 OKX 账户
2. 进入 API Key 管理
3. 检查 IP 白名单
4. 添加你的 IP 地址到白名单
5. 重试

## 最常见的情况

### 场景 A: 我在本地开发环境

**现象**: 使用演示数据

**原因**: 很可能是网络隔离（沙箱环境）

**解决方案**:
- 这是正常的！演示数据完全可用于本地开发
- 当部署到有网络的生产服务器时，系统会自动切换到真实数据
- 继续开发和测试你的功能

### 场景 B: 我在公司网络

**现象**: API 连接失败

**原因**: 很可能是代理或防火墙

**解决方案**:
1. 询问 IT 部门是否允许连接到 OKX API
2. 获取代理服务器地址（如果有）
3. 在 .env 中配置代理
4. 测试连接

### 场景 C: 我已经知道真实 API 可用，但系统仍然使用模拟数据

**原因**: API 密钥无效

**解决方案**:
1. 通过运行诊断脚本获取详细错误：
```bash
node test-api-diagnostic.js
```
2. 查看输出中的错误代码和消息
3. 根据错误代码采取相应行动（见下面的错误代码表）

## 错误代码参考

| 错误代码 | 含义 | 解决方案 |
|---------|------|--------|
| `fetch failed` | 网络连接失败 | 检查网络连接、防火墙、代理 |
| 401 | 未授权 | 检查 API Key 和 Secret Key |
| 403 | 禁止访问 | 检查 IP 白名单或权限 |
| 404 | 未找到 | 检查 API 端点是否正确 |
| 429 | 请求过多 | 等待一段时间后重试 |
| 500+ | 服务器错误 | OKX 服务器问题，稍后重试 |

## 诊断脚本

运行这个脚本获取详细的故障排除信息：

```bash
node test-api-diagnostic.js
```

脚本将显示：
- ✅ 各个 API 端点的连接状态
- ✅ 认证是否成功
- ✅ 返回的错误信息
- ✅ 诊断建议

## 获取帮助的步骤

1. **收集信息**:
   ```bash
   # 捕获启动日志
   npm start > startup.log 2>&1
   
   # 运行诊断脚本
   node test-api-diagnostic.js > diagnostic.log 2>&1
   ```

2. **检查这些文件中的错误信息**:
   - `startup.log` - 初始化信息
   - `diagnostic.log` - API 连接详情

3. **根据输出采取相应行动**（按上面的错误代码表）

## 验证真实数据已启用

一旦修复了问题，你应该看到：

```
🔑 API 凭证配置: ✅ 已配置
📡 尝试直接 API 连接...
✅ 成功: 使用直接 OKX API 获取真实数据

📡 当前数据源: 真实数据 (OKX API)
```

此时，系统将使用真实的 OKX OnchainOS 数据。

## 常见问题 (FAQ)

**Q: 演示数据是否可以用于测试?**
A: 是的！演示数据完全可以用于测试所有功能和 UI。仅当需要真实数据时才需要修复 API 连接。

**Q: 我需要钱或 OKX 账户余额吗?**
A: 不需要。只要有有效的 API Key，就可以查询数据，不需要账户中有资金。

**Q: API 调用有限制吗?**
A: 是的，OKX 有调用频率限制。详见官方文档：
https://web3.okx.com/onchainos/dev-docs/trade/dex-api-introduction

**Q: 如何在本地测试真实 API?**
A: 在命令行运行诊断脚本：
```bash
node test-api-diagnostic.js
```

**Q: 我可以使用不同的 API 密钥吗?**
A: 可以。修改 .env 文件中的以下字段：
```env
OKX_API_KEY=your_new_key
OKX_SECRET_KEY=your_new_secret
OKX_PASSPHRASE=your_new_passphrase
```

## 如果还是不工作

1. 验证你的 API 密钥在 OKX 官网上是有效的（访问 api.okx.com 测试）
2. 确保 Node.js 版本是 14 或更高：`node --version`
3. 重新安装依赖：
   ```bash
   npm install
   ```
4. 收集所有的日志和错误信息
5. 查看 `REALDATA_GUIDE.md` 了解部署说明

---

**记住**: 演示数据系统是一个完美的备选方案。即使无法连接到真实 API，系统也能继续运行和测试所有功能！🎉
