/**
 * API 健康检查脚本
 */
import { analyzePlaybook } from './lib/claude';

async function test() {
  console.log('🧪 AI API 健康检查...\n');
  
  const testContent = {
    title: 'API Health Check',
    description: 'Testing Qwen 3.5 API connectivity',
  };
  
  const startTime = Date.now();
  
  try {
    const result = await analyzePlaybook(testContent);
    const duration = Date.now() - startTime;
    
    console.log('✅ API 调用成功');
    console.log(`响应时间：${duration}ms`);
    console.log('分析结果:', JSON.stringify(result, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.log('❌ API 调用失败');
    console.log(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

test();
