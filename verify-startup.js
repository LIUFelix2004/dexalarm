#!/usr/bin/env node

// Simple startup verification script
require('dotenv').config();

console.log('\n' + '═'.repeat(60));
console.log('🔍 系统启动验证恢复');
console.log('═'.repeat(60) + '\n');

// Check configuration
console.log('📋 环境配置检查:');
console.log(`  • Node.js 版本: ${process.version}`);
console.log(`  • 当前目录: ${process.cwd()}`);
console.log(`  • ENV 文件: ${process.env.OKX_API_KEY ? '✅ 已配置' : '❌ 未配置'}`);

if (process.env.OKX_API_KEY) {
  console.log(`    - API Key: ${process.env.OKX_API_KEY.substring(0, 8)}...${process.env.OKX_API_KEY.substring(-4)}`);
  console.log(`    - Secret: ${process.env.OKX_SECRET_KEY ? '✅' : '❌'}`);
  console.log(`    - Passphrase: ${process.env.OKX_PASSPHRASE ? '✅' : '❌'}`);
}

console.log('\n📦 依赖检查:');
try {
  require('express');
  console.log('  ✅ express');
  require('dotenv');
  console.log('  ✅ dotenv');
  require('node-fetch');
} catch (e) {
  console.log('  ❌ 缺少依赖，运行: npm install');
  process.exit(1);
}

console.log('\n🔧 服务初始化:');

// Initialize OKXService without actual API calls
const OKXService = require('./src/services/OKXService');
const okxService = new OKXService();

console.log('\n💡 启动系统的命令:');
console.log('\n  npm start\n');

console.log('📚 推荐文档:');
console.log('  • QUICKSTART.md - 快速启动指南');
console.log('  • SUMMARY.md - 改进总结');
console.log('  • REALDATA_GUIDE.md - 真实数据配置');
console.log('  • TROUBLESHOOTING.md - 故障排除\n');

console.log('═'.repeat(60) + '\n');
