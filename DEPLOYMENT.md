# MusicFree API 部署指南

本指南介绍了如何部署 MusicFree API 服务，支持多种部署方式。

## 目录

- [本地开发](#本地开发)
- [Docker 部署](#docker-部署)
- [Vercel Serverless 部署](#vercel-serverless-部署)
- [Python 插件配置](#python-插件配置)

## 本地开发

### 1. 安装依赖

```bash
cd musicfree-api
npm install
```

### 2. 创建数据目录

```bash
mkdir -p data/plugins data/subscriptions
```

### 3. 复制插件文件

将现有的插件文件复制到 `data/plugins/` 目录：

```bash
cp -r /root/share/project/musicfree-astrbot/data/plugin_data/astrbot_plugin_musicfree/plugins/* data/plugins/
cp /root/share/project/musicfree-astrbot/data/plugin_data/astrbot_plugin_musicfree/subscriptions.json data/
```

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 5. 测试 API

```bash
# 健康检查
curl http://localhost:3000/api/health

# 获取插件列表
curl http://localhost:3000/api/plugins

# 搜索音乐
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "晴天"}'
```

## Docker 部署

### 1. 构建镜像

```bash
cd musicfree-api
docker build -t musicfree-api:latest .
```

### 2. 使用 docker-compose 部署

```bash
# 创建数据目录
mkdir -p data

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 3. 手动运行容器

```bash
docker run -d \
  --name musicfree-api \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e NODE_ENV=production \
  -e DATA_DIR=/app/data \
  -e CORS_ORIGIN=* \
  musicfree-api:latest
```

### 4. 数据持久化

Docker 部署时，数据目录 `data/` 会被挂载到容器中，确保插件数据持久化。

## Vercel Serverless 部署

### 1. 安装 Vercel CLI

```bash
npm i -g vercel
```

### 2. 登录 Vercel

```bash
vercel login
```

### 3. 部署

```bash
cd musicfree-api
vercel
```

按照提示完成部署。

### 4. 配置环境变量

在 Vercel 控制台中配置环境变量：

```
NODE_ENV=production
```

### 5. 访问 API

部署完成后，Vercel 会提供一个 URL，例如：
`https://musicfree-api-xxxx.vercel.app/api/health`

### 限制说明

**重要**：Vercel Serverless 部署有以下限制：

1. **无持久化存储**：函数执行完后，临时文件会被删除
2. **冷启动**：函数可能在长时间不活跃后需要重新启动
3. **执行时间限制**：默认 10 秒，可配置最大 30 秒

因此，Vercel 部署更适合：
- 演示和测试
- 轻量级使用
- 插件数据从外部存储获取

对于生产环境，建议使用：
- Docker 部署到自己的服务器
- 使用云服务（如 AWS ECS、阿里云容器服务）

## Python 插件配置

### 1. 更新 Python 插件

将 Python 插件更新为使用 API 客户端：

```bash
# 备份原文件
cp /root/share/project/musicfree-astrbot/data/plugins/astrbot_plugin_musicfree/main.py \
   /root/share/project/musicfree-astrbot/data/plugins/astrbot_plugin_musicfree/main_old.py

# 使用新版本
cp /root/share/project/musicfree-astrbot/data/plugins/astrbot_plugin_musicfree/main_v2.py \
   /root/share/project/musicfree-astrbot/data/plugins/astrbot_plugin_musicfree/main.py
```

### 2. 配置 API URL

在 AstrBot 环境中设置环境变量：

```bash
# 本地开发
export MUSICFREE_API_URL=http://localhost:3000

# Docker 部署
export MUSICFREE_API_URL=http://your-server:3000

# Vercel 部署
export MUSICFREE_API_URL=https://your-vercel-app.vercel.app
```

或在 AstrBot 配置文件中设置：

```python
os.environ['MUSICFREE_API_URL'] = 'http://your-api-server:3000'
```

### 3. 安装 Python 依赖

```bash
cd /root/share/project/musicfree-astrbot
pip install aiohttp
```

### 4. 重启 AstrBot

重启 AstrBot 以加载新配置。

## API 端点文档

### 健康检查

```
GET /api/health
```

响应：
```json
{
  "status": "ok",
  "timestamp": "2025-11-11T00:00:00.000Z",
  "plugins": 10
}
```

### 获取插件列表

```
GET /api/plugins
```

响应：
```json
{
  "success": true,
  "data": [
    {
      "name": "bilibili",
      "author": "猫头猫",
      "version": "0.2.3",
      "type": "本地插件"
    }
  ]
}
```

### 搜索音乐

```
POST /api/search
Content-Type: application/json

{
  "query": "晴天",
  "pluginName": "bilibili",  // 可选
  "page": 1,
  "type": "music"
}
```

响应：
```json
{
  "success": true,
  "data": [
    {
      "id": "BV1BZbSzZEGT",
      "platform": "bilibili",
      "title": "晴天 - 周杰伦",
      "artist": "VV音乐局",
      "duration": 270,
      "album": "BV1BZbSzZEGT",
      "artwork": "http://i0.hdslb.com/bfs/archive/...",
      "url": ""
    }
  ]
}
```

### 获取音乐音源

```
POST /api/media
Content-Type: application/json

{
  "musicItem": {
    "id": "BV1BZbSzZEGT",
    "platform": "bilibili",
    "title": "晴天"
  },
  "quality": "standard"
}
```

响应：
```json
{
  "success": true,
  "url": "https://example.com/music.mp3"
}
```

### 更新订阅

```
POST /api/subscription/update
```

响应：
```json
{
  "success": true,
  "data": {
    "success": [
      {
        "url": "https://example.com/plugins.json",
        "downloaded": 5
      }
    ],
    "failed": []
  }
}
```

### 安装插件

```
POST /api/plugin/install
Content-Type: application/json

{
  "url": "https://example.com/plugin.js"
}
```

响应：
```json
{
  "success": true,
  "message": "插件安装成功"
}
```

## 故障排除

### 1. API 服务无法启动

检查：
- 端口是否被占用
- 数据目录权限
- Node.js 版本（需要 16+）

### 2. Python 插件无法连接 API

检查：
- API 服务是否运行
- URL 是否正确
- 防火墙设置

### 3. 插件加载失败

检查：
- 插件文件是否完整
- 是否有语法错误
- 依赖是否安装

### 4. 搜索无结果

检查：
- 插件是否支持搜索
- 网络请求是否成功
- API 响应是否正常

## 性能优化

### 1. 缓存

API 服务支持简单的内存缓存，可以减少重复搜索。

### 2. 并发

默认支持并发搜索多个插件，提高搜索速度。

### 3. 超时

搜索请求有 20 秒超时，避免长时间等待。

## 监控

### 1. 健康检查

定期调用 `/api/health` 端点检查服务状态。

### 2. 日志

API 服务会输出详细的日志，便于调试。

### 3. 错误处理

所有 API 端点都有完善的错误处理机制。

## 安全

### 1. CORS

默认允许所有来源，可通过 `CORS_ORIGIN` 环境变量限制。

### 2. 限流

Vercel 部署有内置的限流机制。

### 3. 数据验证

所有输入都经过验证，防止注入攻击。

## 许可证

本项目基于 MIT 许可证开源。

---

**部署日期**：2025-11-11
**版本**：v2.0.0
