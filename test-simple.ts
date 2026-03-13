// 简单测试 YouTube API - 不依赖 dotenv
import * as fs from 'fs';
import * as path from 'path';

// 手动读取 .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

const YOUTUBE_API_KEY = envVars.YOUTUBE_API_KEY;

console.log('YouTube API Key:', YOUTUBE_API_KEY ? '已配置' : '未配置');
console.log('Key 前缀:', YOUTUBE_API_KEY ? YOUTUBE_API_KEY.substring(0, 10) + '...' : 'N/A');

async function test() {
  try {
    console.log('\n发送请求到 YouTube API...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', 'OpenClaw');
    url.searchParams.set('maxResults', '1');
    url.searchParams.set('key', YOUTUBE_API_KEY!);
    
    console.log('URL:', url.toString());
    
    const res = await fetch(url.toString(), { 
      signal: controller.signal,
      headers: { 'User-Agent': 'Node.js' }
    });
    clearTimeout(timeout);
    
    console.log('状态码:', res.status);
    const data = await res.json();
    
    if (data.error) {
      console.log('❌ API 错误:', JSON.stringify(data.error, null, 2));
    } else {
      console.log('✅ API 成功!');
      console.log('找到视频数:', data.items?.length || 0);
      if (data.items?.length > 0) {
        console.log('第一个视频:', data.items[0].snippet.title);
      }
    }
  } catch (error) {
    console.error('❌ 请求失败:', error instanceof Error ? error.message : error);
    console.error('\n可能的原因:');
    console.error('1. 网络连接问题 (防火墙/代理)');
    console.error('2. API Key 无效或被限制');
    console.error('3. Google API 服务器不可达');
  }
}

test();
