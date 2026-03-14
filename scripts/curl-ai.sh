#!/bin/bash
# AI API 调用脚本 - 绕过 Node.js 网络问题
# 使用方法：./curl-ai.sh <prompt_file> [model] [max_tokens]

API_KEY="${API_KEY:-sk-sp-42f3ed2a9c6e458591f4a4650a57a80c}"
BASE_URL="${API_BASE_URL:-https://coding.dashscope.aliyuncs.com/v1}"
MODEL="${2:-qwen3.5-plus}"
MAX_TOKENS="${3:-1024}"
PROMPT_FILE="$1"

if [ -z "$PROMPT_FILE" ] || [ ! -f "$PROMPT_FILE" ]; then
  echo '{"error": {"message": "Prompt file not provided or not found"}}'
  exit 0
fi

# 创建临时文件
TEMP_BODY=$(mktemp /tmp/curl-body.XXXXXX.json)
trap "rm -f $TEMP_BODY $PROMPT_FILE" EXIT

# 使用 Python 安全地创建 JSON
python3 << PYEOF > "$TEMP_BODY"
import json
with open("$PROMPT_FILE", 'r', encoding='utf-8') as f:
    prompt = f.read()
data = {
    "model": "$MODEL",
    "messages": [{"role": "user", "content": prompt}],
    "max_tokens": $MAX_TOKENS
}
print(json.dumps(data, ensure_ascii=False))
PYEOF

# 执行请求
curl -s -X POST "$BASE_URL/chat/completions" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "@$TEMP_BODY" \
  --connect-timeout 10 \
  --max-time 60
