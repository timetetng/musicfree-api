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

### 方式一：使用 Vercel CLI（推荐）

#### 1. 安装 Vercel CLI

```bash
npm i -g vercel
```

#### 2. 登录 Vercel

```bash
vercel login
```

#### 3. 部署

```bash
cd musicfree-api
vercel
```

**部署过程**：
- 首次部署会询问一系列问题，按照以下选择：
  - **Set up and deploy?** `Y`
  - **Which scope?** 选择你的账户
  - **Link to existing project?** `N`
  - **What's your project's name?** `musicfree-api`（或自定义）
  - **In which directory is your code located?** `./`（当前目录）
  - **Want to override the settings?** `N`

#### 4. 等待部署完成

部署完成后，Vercel 会提供类似以下的 URL：
```
https://musicfree-api-xxxx.vercel.app
```

#### 5. 测试 API

访问健康检查端点：
```bash
https://musicfree-api-xxxx.vercel.app/api/health
```

应该返回：
```json
{
  "status": "ok",
  "timestamp": "2025-11-11T00:00:00.000Z",
  "platform": "vercel"
}
```

### 方式二：通过 Git 部署

#### 1. 推送代码到 Git 仓库

```bash
# 初始化 Git（如果尚未初始化）
git init
git add .
git commit -m "Initial commit"

# 推送到 GitHub/GitLab
git remote add origin https://github.com/your-username/musicfree-api.git
git push -u origin main
```

#### 2. 在 Vercel 控制台部署

1. 访问 [vercel.com](https://vercel.com)
2. 点击「New Project」
3. 选择你的 Git 仓库
4. 配置项目：
   - **Framework Preset**: Other
   - **Root Directory**: `musicfree-api`（如果代码在子目录）
   - **Build Command**: 留空
   - **Output Directory**: 留空
5. 点击「Deploy」

### 方式三：通过 GitHub 导入

#### 1. 访问 Vercel 控制台

打开 [vercel.com/dashboard](https://vercel.com/dashboard)

#### 2. 导入项目

1. 点击「Add New Project」
2. 选择「Import Git Repository」
3. 选择「Browse All Templates」或直接选择你的仓库

### 注意事项

#### 1. 重要限制

**Vercel Serverless 部署有以下限制**：

1. **无持久化存储**：
   - 函数执行完后，临时文件会被删除
   - 插件数据无法保存
   - 每次部署都会重置

2. **执行时间限制**：
   - 免费计划：10 秒
   - Pro 计划：60 秒
   - 最大可配置 30 秒（通过 `vercel.json`）

3. **冷启动**：
   - 函数长时间不活跃后，首次调用会较慢
   - 可能导致搜索响应慢

#### 2. 适用场景

Vercel 部署适合：
- ✅ **演示和测试** - 快速分享给朋友
- ✅ **轻量级使用** - 偶尔点歌
- ✅ **开发调试** - 快速验证功能
- ❌ **生产环境** - 需要频繁搜索和下载
- ❌ **重负载** - 多人同时使用

#### 3. 替代方案

对于生产环境，建议使用：
- ✅ **Docker 部署** - 到自己的服务器
- ✅ **云服务** - AWS ECS、阿里云容器服务、腾讯云
- ✅ **VPS** - 独享资源，数据持久化

### 4. 配置超时

在 `vercel.json` 中配置超时（如果需要）：

```json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

**注意**：使用 `functions` 字段时不能同时使用 `builds` 字段。

### 5. 环境变量

如需设置环境变量：

```bash
# 通过 CLI
vercel env add NODE_ENV

# 或在 Vercel 控制台
# Project Settings -> Environment Variables
```

### 6. 域名绑定

如需绑定自定义域名：

1. 在 Vercel 控制台进入项目
2. 点击「Domains」选项卡
3. 添加你的域名
4. 按照提示配置 DNS

### 7. 监控和日志

在 Vercel 控制台可以查看：
- **Functions** - 函数执行日志
- **Analytics** - 访问统计
- **Usage** - 资源使用情况

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
