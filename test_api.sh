#!/bin/bash

# 清理端口
lsof -ti:3000-3010 | xargs kill -9 2>/dev/null || true

# 启动 API 服务
PORT=3001 node src/server.js &
API_PID=$!

# 等待服务启动
sleep 5

echo "=== 测试健康检查 ==="
curl -s http://localhost:3001/api/health | python3 -m json.tool

echo -e "\n=== 测试插件列表 ==="
curl -s http://localhost:3001/api/plugins | python3 -m json.tool | head -20

echo -e "\n=== 测试搜索功能 ==="
curl -s -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "晴天"}' | python3 -m json.tool | head -30

# 清理
kill $API_PID 2>/dev/null
killall node 2>/dev/null
wait 2>/dev/null

echo -e "\n测试完成"
