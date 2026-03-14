/**
 * AI API 调用 - 通过 shell 脚本绕过 Node.js 网络问题
 * 使用临时文件传递 prompt，避免转义问题
 */

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { writeFileSync, unlinkSync } from 'fs';

interface AIResponse {
  choices?: Array<{ message: { content: string } }>;
  error?: { message: string };
}

// 调用 curl-ai.sh 脚本
export function callAI(prompt: string, maxTokens: number = 1024, retries: number = 3): string {
  const scriptPath = join(dirname(__dirname), 'scripts', 'curl-ai.sh');
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    let tempPromptFile: string | null = null;
    
    try {
      // 创建临时 prompt 文件
      tempPromptFile = `/tmp/ai-prompt-${Date.now()}-${Math.random().toString(36).substring(7)}.txt`;
      writeFileSync(tempPromptFile, prompt, 'utf-8');
      
      const command = `${scriptPath} "${tempPromptFile}" qwen3.5-plus ${maxTokens}`;
      const output = execSync(command, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        timeout: 60000,
      });
      
      const result: AIResponse = JSON.parse(output.trim());
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      return result.choices?.[0]?.message?.content || '';
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < retries) {
        const delay = 1000 * Math.pow(2, attempt - 1);
        console.log(`⚠️  API 请求失败，${delay}ms 后重试 (${attempt}/${retries})...`);
        execSync(`sleep ${delay / 1000}`);
      }
    } finally {
      // 清理临时文件
      if (tempPromptFile) {
        try { unlinkSync(tempPromptFile); } catch {}
      }
    }
  }
  
  throw lastError || new Error('API 请求失败');
}
