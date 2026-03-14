/**
 * 生产环境健康检查脚本
 * 
 * 使用方法：
 *   npx tsx scripts/health-check.ts
 *   npm run health
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { prisma } from '../lib/prisma';
import { callAI } from '../lib/http-agent';

// 加载环境变量
const envPath = resolve(__dirname, '../.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0 && !key.trim().startsWith('#')) {
      process.env[key.trim()] = valueParts.join('=').replace(/"/g, '').trim();
    }
  });
} catch {
  // 环境变量可能从进程继承
}

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  latency?: number;
}

async function runChecks() {
  console.log('🏥 生产环境健康检查\n');
  console.log('='.repeat(50));
  
  const results: CheckResult[] = [];
  const startTime = Date.now();
  
  // 检查 1: 数据库连接
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;
    
    const totalItems = await prisma.item.count();
    
    results.push({
      name: '数据库连接',
      status: 'pass',
      message: `SQLite 连接正常，${totalItems} 条内容`,
      latency: dbLatency,
    });
  } catch (error) {
    results.push({
      name: '数据库连接',
      status: 'fail',
      message: error instanceof Error ? error.message : '未知错误',
    });
  }
  
  // 检查 2: AI API 连接
  try {
    const aiStart = Date.now();
    const testResult = callAI('hi', 10, 1);
    const aiLatency = Date.now() - aiStart;
    
    results.push({
      name: 'AI API (Qwen 3.5)',
      status: 'pass',
      message: `响应正常，${aiLatency}ms`,
      latency: aiLatency,
    });
  } catch (error) {
    results.push({
      name: 'AI API (Qwen 3.5)',
      status: 'fail',
      message: error instanceof Error ? error.message : '未知错误',
    });
  }
  
  // 检查 3: 环境变量
  const hasApiKey = !!process.env.API_KEY;
  const hasApiBase = !!process.env.API_BASE_URL;
  
  if (hasApiKey && hasApiBase) {
    results.push({
      name: '环境变量',
      status: 'pass',
      message: 'API_KEY 和 API_BASE_URL 已配置',
    });
  } else {
    results.push({
      name: '环境变量',
      status: 'warn',
      message: !hasApiKey ? '缺少 API_KEY' : '缺少 API_BASE_URL',
    });
  }
  
  // 输出结果
  console.log('');
  results.forEach((check) => {
    const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️';
    const latency = check.latency ? ` (${check.latency}ms)` : '';
    console.log(`${icon} ${check.name}: ${check.message}${latency}`);
  });
  
  // 汇总
  console.log('');
  console.log('='.repeat(50));
  const totalDuration = Date.now() - startTime;
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warn = results.filter(r => r.status === 'warn').length;
  
  console.log(`总计：${passed} 通过，${warn} 警告，${failed} 失败 (${totalDuration}ms)`);
  
  if (failed > 0) {
    console.log('\n❌ 健康检查失败，请检查错误信息');
    process.exit(1);
  } else if (warn > 0) {
    console.log('\n⚠️  健康检查通过，但有警告');
    process.exit(0);
  } else {
    console.log('\n✅ 所有检查通过');
    process.exit(0);
  }
}

runChecks().catch((error) => {
  console.error('检查脚本异常:', error);
  process.exit(1);
});
