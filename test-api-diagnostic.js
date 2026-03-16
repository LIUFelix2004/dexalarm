// Diagnostic script to test OKX API connectivity
require('dotenv').config();
const crypto = require('crypto');

async function testOKXAPI() {
  console.log('\n🔍 OKX API 诊断工具\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check environment
  const apiKey = process.env.OKX_API_KEY;
  const secretKey = process.env.OKX_SECRET_KEY;
  const passphrase = process.env.OKX_PASSPHRASE;

  console.log('📋 环境配置检查:');
  console.log(`  ✓ API Key: ${apiKey ? `已配置 (${apiKey.substring(0, 8)}...)` : '❌ 未配置'}`);
  console.log(`  ✓ Secret: ${secretKey ? '已配置' : '❌ 未配置'}`);
  console.log(`  ✓ Passphrase: ${passphrase ? '已配置' : '❌ 未配置'}\n`);

  // Test endpoints
  const endpoints = [
    'https://www.okx.com/api/v5/onchainos/dex/token/trending',
    'https://api.okx.com/api/v5/onchainos/dex/token/trending',
    'https://okx.com/api/v5/onchainos/dex/token/trending'
  ];

  // Get fetch function
  let fetchFn;
  try {
    fetchFn = fetch;
  } catch {
    const nodeFetch = await import('node-fetch');
    fetchFn = nodeFetch.default;
  }

  console.log('🌐 API 端点连接测试:\n');

  for (const endpoint of endpoints) {
    console.log(`📡 测试: ${endpoint}`);
    
    try {
      const response = await fetchFn(endpoint, {
        method: 'GET',
        headers: {
          'User-Agent': 'Node.js Test',
          'Accept': 'application/json'
        },
        timeout: 5000
      });

      console.log(`   ├─ 状态码: ${response.status}`);
      console.log(`   ├─ 内容类型: ${response.headers.get('content-type')}`);
      
      const text = await response.text();
      console.log(`   ├─ 响应长度: ${text.length} bytes`);
      console.log(`   └─ 预览: ${text.substring(0, 100)}...\n`);

    } catch (error) {
      console.log(`   ├─ ❌ 错误: ${error.message}`);
      console.log(`   └─ 错误代码: ${error.code}\n`);
    }
  }

  // Test with authentication
  if (apiKey && secretKey && passphrase) {
    console.log('\n🔐 带认证的 API 测试:\n');

    const testEndpoint = 'https://www.okx.com/api/v5/onchainos/dex/token/trending';
    const timestamp = new Date().toISOString();
    const requestPath = '/dex/token/trending';
    const message = timestamp + 'GET' + requestPath + '';
    
    const hmac = crypto.createHmac('sha256', secretKey);
    const signature = hmac.update(message).digest('base64');

    const headers = {
      'OK-ACCESS-KEY': apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': passphrase,
      'Content-Type': 'application/json'
    };

    console.log('📤 请求头:');
    console.log(`  ├─ OK-ACCESS-KEY: ${apiKey.substring(0, 8)}...`);
    console.log(`  ├─ OK-ACCESS-SIGN: ${signature.substring(0, 20)}...`);
    console.log(`  └─ OK-ACCESS-TIMESTAMP: ${timestamp}\n`);

    try {
      const url = `${testEndpoint}?chains=ethereum&limit=1`;
      const response = await fetchFn(url, {
        method: 'GET',
        headers: headers,
        timeout: 5000
      });

      console.log(`📥 响应状态: ${response.status}`);
      
      const text = await response.text();
      console.log(`📊 响应体 (前 500 字):
${text.substring(0, 500)}`);

      try {
        const json = JSON.parse(text);
        console.log(`\n✅ JSON 解析成功`);
        console.log(`   ├─ code: ${json.code}`);
        console.log(`   └─ msg: ${json.msg || 'N/A'}`);
      } catch {
        console.log(`\n⚠️  非 JSON 响应`);
      }

    } catch (error) {
      console.log(`❌ 认证请求失败: ${error.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n💡 诊断建议:');
  console.log('  1. 如果所有端点都无法连接，可能是网络问题');
  console.log('  2. 如果响应是 HTML，说明 API 端点错误');
  console.log('  3. 如果返回 401，说明认证失败或凭证无效');
  console.log('  4. 如果返回 403，说明 IP 被限制或权限不足');
  console.log('  5. 检查 API Key 是否过期或已撤销\n');
}

testOKXAPI().catch(console.error);
